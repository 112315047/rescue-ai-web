
import os
from supabase import create_client, Client, ClientOptions

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

# Initialize the client if keys are present
if url and key:
    # Reverting timeout options as they caused TypeError with installed version
    supabase: Client = create_client(url, key)
else:
    supabase = None

if not supabase:
    print("WARNING: Supabase URL or Key missing in environment variables.")
