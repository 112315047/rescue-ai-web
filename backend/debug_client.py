
import os
import sys

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

try:
    from config.supabase_client import supabase
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"Initialization Error: {e}")
    sys.exit(1)

def test_client():
    print("--- Testing Configured Supabase Client ---")
    if supabase is None:
        print("Supabase client is None (Env vars missing?)")
        return

    try:
        # Simple select
        print("Attempting to select from 'cases'...")
        response = supabase.table('cases').select('count', count='exact').limit(1).execute()
        print("Success!")
        print(f"Response: {response}")
    except Exception as e:
        print(f"Client Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_client()
