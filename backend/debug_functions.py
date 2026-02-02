
import os
import sys
from supabase import create_client, Client
import inspect

url = "https://bjbuonljkbknbdadgjco.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqYnVvbmxqa2JrbmJkYWRnamNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjA5MjcsImV4cCI6MjA4NTMzNjkyN30.8Ao8DBhtm1Z039TzvtCyOAbtc1M3H3s-teUBqq3F01E"

supabase: Client = create_client(url, key)

def inspect_functions():
    print("--- Inspecting Functions Client ---")
    # supabase.functions is the client
    print(f"Functions Client Type: {type(supabase.functions)}")
    print(f"Invoke Signature: {inspect.signature(supabase.functions.invoke)}")
    
if __name__ == "__main__":
    inspect_functions()
