
from rest_framework import viewsets, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from datetime import datetime
from config.supabase_client import supabase

class CaseViewSet(viewsets.ViewSet):
    # Standard CRUD using Supabase Client
    
    def list(self, request):
        # Fetch cases sorted by urgency (desc)
        try:
            response = supabase.table('cases').select('*').order('urgency_score', desc=True).execute()
            return Response(response.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def create(self, request):
        try:
            data = request.data.copy() # Make a mutable copy
            
            # Remove fields not in the 'cases' table schema to avoid errors
            # Based on previous api.ts comments, lat/long are not in DB.
            data.pop('latitude', None)
            data.pop('longitude', None)
            data.pop('messages', None) # If frontend sends messages list
            
            # Basic validation/cleanup could go here
            response = supabase.table('cases').insert(data).execute()
            return Response(response.data[0] if response.data else {}, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"Error creating case: {e}") # Debug print
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        try:
            response = supabase.table('cases').select('*').eq('id', pk).execute()
            if not response.data:
                return Response({'error': 'Not Found'}, status=status.HTTP_404_NOT_FOUND)
            return Response(response.data[0])
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['patch'])
    def resolve(self, request, pk=None):
        try:
            supabase.table('cases').update({'status': 'resolved'}).eq('id', pk).execute()
            return Response({'status': 'resolved'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='messages')
    def add_message(self, request, pk=None):
        content = request.data.get('content')
        location = request.data.get('location')
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        
        if not content:
            return Response({'error': 'Content required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 1. Insert User Message
            user_msg_data = {
                'case_id': pk,
                'sender': 'user',
                'content': content
            }
            user_res = supabase.table('messages').insert(user_msg_data).execute()
            
            # 2. Invoke AI Edge Function (Triage)
            # Fetch history is handled by the Edge Function normally, but we can pass current context
            # Actually, to use the 'triage' function correctly, we should invoke it exactly as api.ts did.
            
            # Retrieve basic case info and history? The Edge Function does it.
            # We just need to invoke it.
            
            # Fetch history to pass context if needed, but 'triage' function fetches history itself if passed conversationHistory?
            # Let's peek at triage/index.ts. It fetches conversationHistory IF passed, otherwise it might rely on DB?
            # It relies on 'conversationHistory' param or fetches?
            # 'triage/index.ts' lines 51-53 use 'conversationHistory'. 
            # It does NOT fetch history itself?
            # Wait, line 96: if conversationHistory...
            # The code I saw earlier (Step 600) does NOT seem to fetch history from DB inside the function?
            # Wait, line 51: const conversationContext = conversationHistory...
            # Ah, the frontend was passing it.
            # So Django MUST fetch history.
            
            # Fetch last 10 messages
            hist_res = supabase.table('messages').select('sender,content').eq('case_id', pk).order('created_at', desc=True).limit(6).execute()
            history_raw = hist_res.data if hist_res.data else []
            
            # Format for Edge Function (role: user/assistant)
            history = [
                {
                    "role": "user" if m['sender'] == 'user' else "assistant", 
                    "content": m['content']
                }
                for m in reversed(history_raw)
                if m['content'] != content # Exclude current if race condition
            ]

            payload = {
                "caseId": pk,
                "message": content,
                "language": "en", # default or fetch case language
                "location": location,
                "conversationHistory": history,
                "coords": {"lat": latitude, "lng": longitude} if latitude and longitude else None
            }
            
            # Invoke Edge Function via requests to control timeout
            import requests
            import os
            
            invoke_url = f"{os.environ.get('SUPABASE_URL')}/functions/v1/triage"
            headers = {
                "Authorization": f"Bearer {os.environ.get('SUPABASE_KEY')}",
                "Content-Type": "application/json"
            }
            
            # Use a long timeout (60s) for AI processing
            resp = requests.post(invoke_url, headers=headers, json=payload, timeout=60)
            
            if resp.status_code != 200:
                 return Response({'error': f"Edge Function Error: {resp.text}"}, status=resp.status_code)

            return Response(resp.json())

        except Exception as e:
             import traceback
             print("ERROR in add_message:")
             traceback.print_exc()
             return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TranscribeView(views.APIView):
    def post(self, request):
        audio_file = request.FILES.get('audio')
        language = request.data.get('language', 'en')
        
        if not audio_file:
             return Response({'error': 'No audio'}, status=status.HTTP_400_BAD_REQUEST)
             
        try:
            # Prepare Payload for Edge Function 'transcribe'
            # Note: Edge Function expects FormData.
            # supabase.functions.invoke usually takes JSON body.
            # sending FormData via supabase-py invoke is tricky.
            # It might be easier to use 'requests' to call the Function URL directly if we have the anon key.
            
            # Let's try to read file bytes
            file_bytes = audio_file.read()
            
            # Actually, standard supabase-py invoke might not support multipart/form-data easily.
            # But we can fallback to 'httpx' or 'requests' using the URL and Key from settings.
            
            import requests
            from django.conf import settings
            import os
            
            invoke_url = f"{os.environ.get('SUPABASE_URL')}/functions/v1/transcribe"
            headers = {
                "Authorization": f"Bearer {os.environ.get('SUPABASE_KEY')}",
                # Content-Type not set so requests sets boundary
            }
            
            files = {
                'audio': (audio_file.name or 'audio.webm', file_bytes, audio_file.content_type),
            }
            data = {'language': language}
            
            resp = requests.post(invoke_url, headers=headers, files=files, data=data)
            
            if resp.status_code != 200:
                return Response({'error': 'Transcription failed', 'details': resp.text}, status=resp.status_code)
                
            return Response(resp.json())
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
