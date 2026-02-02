
import os
import sys
from supabase import create_client, Client

# Manually set env vars for the test since we are outside Django
url = "https://bjbuonljkbknbdadgjco.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqYnVvbmxqa2JrbmJkYWRnamNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjA5MjcsImV4cCI6MjA4NTMzNjkyN30.8Ao8DBhtm1Z039TzvtCyOAbtc1M3H3s-teUBqq3F01E"

supabase: Client = create_client(url, key)

def test_invoke():
    print("Invoking triage function...")
    
    payload = {
        "caseId": "test-case-id", 
        "message": "I need help",
        "language": "en",
        "conversationHistory": []
    }
    
    try:
        # Intentionally passing a dummy caseId, might fail inside function logic but should return SOMETHING
        func_res = supabase.functions.invoke("triage", invoke_options={'body': payload})
        
        print(f"Type of func_res: {type(func_res)}")
        if hasattr(func_res, 'data'):
            print(f"Type of func_res.data: {type(func_res.data)}")
            print(f"func_res.data: {func_res.data}")
            
        if hasattr(func_res, 'error'):
             print(f"func_res.error: {func_res.error}")
             
        # Try to verify if it is bytes
        if hasattr(func_res, 'data') and isinstance(func_res.data, bytes):
             print("Data is bytes, decoding...")
             print(func_res.data.decode('utf-8'))
             
    except Exception as e:
        print(f"Invocation failed: {e}")

if __name__ == "__main__":
    test_invoke()
