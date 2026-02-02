
import os
import sys
import json
from supabase import create_client, Client

# Manually set env vars
url = "https://bjbuonljkbknbdadgjco.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqYnVvbmxqa2JrbmJkYWRnamNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjA5MjcsImV4cCI6MjA4NTMzNjkyN30.8Ao8DBhtm1Z039TzvtCyOAbtc1M3H3s-teUBqq3F01E"

supabase: Client = create_client(url, key)

def test_create_case():
    print("--- Testing Create Case ---")
    
    # Simulate data sent from frontend (excluding removed fields)
    data = {
        "language": "en",
        "location": "Test Location Debug",
        "status": "active",
        "urgency_score": 0, 
        "category": "other"
    }
    
    print(f"Payload: {json.dumps(data, indent=2)}")
    
    try:
        print("Inserting into 'cases'...")
        response = supabase.table('cases').insert(data).execute()
        
        print("Success!")
        print(f"Response Data: {response.data}")
        
    except Exception as e:
        print(f"CREATE FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_create_case()
