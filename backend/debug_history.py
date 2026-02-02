
import os
import sys
import json
from supabase import create_client, Client

# Manually set env vars
url = "https://bjbuonljkbknbdadgjco.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqYnVvbmxqa2JrbmJkYWRnamNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjA5MjcsImV4cCI6MjA4NTMzNjkyN30.8Ao8DBhtm1Z039TzvtCyOAbtc1M3H3s-teUBqq3F01E"

supabase: Client = create_client(url, key)

def debug_history():
    print("--- Debugging History ---")
    
    # 1. Get latest case
    cases = supabase.table('cases').select('*').order('created_at', desc=True).limit(1).execute()
    if not cases.data:
        print("No cases found.")
        return
        
    case_id = cases.data[0]['id']
    print(f"Latest Case ID: {case_id}")
    
    # 2. Fetch messages
    print("Fetching messages...")
    hist_res = supabase.table('messages').select('sender,content').eq('case_id', case_id).order('created_at', desc=True).limit(6).execute()
    history_raw = hist_res.data if hist_res.data else []
    print(f"Raw History from DB: {json.dumps(history_raw, indent=2)}")
    
    # 3. Format history
    content = "TEST_MESSAGE_CONTENT" # Simulate new message
    history = [
        {
            "role": "user" if m['sender'] == 'user' else "assistant", 
            "content": m['content']
        }
        for m in reversed(history_raw)
        # if m['content'] != content # ignoring specific content check for debug
    ]
    print(f"Formatted History: {json.dumps(history, indent=2)}")
    
    # 4. Invoke Triage
    payload = {
        "caseId": case_id,
        "message": "i am all alone and i am getting tensed",
        "language": "en",
        "location": None,
        "conversationHistory": history,
        "coords": None
    }
    
    print("Invoking triage with history...")
    try:
        func_res = supabase.functions.invoke("triage", invoke_options={'body': payload})
        
        if isinstance(func_res, bytes):
            print("Response is bytes. Decoding...")
            decoded = json.loads(func_res.decode('utf-8'))
            print("Decoded Response:", decoded)
        elif hasattr(func_res, 'data'):
             print("Response data:", func_res.data)
        else:
             print("Raw Response:", func_res)
             
    except Exception as e:
        print(f"INVOKE FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_history()
