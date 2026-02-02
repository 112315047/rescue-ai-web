
import os
import psycopg2
from urllib.parse import urlparse

# URL from .env (Direct Connection)
# Direct connection usually requires port 5432 and the db hostname
# Pooler connection uses port 6543
# Let's try both if possible, but here we test the direct one first as it's required for migrations

# Replacing the pooler URL with the assumed direct URL based on user data
# Pooler: aws-0-eu-west-1.pooler.supabase.com:6543
# Direct: db.bjbuonljkbknbdadgjco.supabase.co:5432 (or just bjbuonljkbknbdadgjco.supabase.co)

# Helper to print status
def test_connection(url, name):
    print(f"\n--- Testing {name} Connection ---")
    print(f"URL: {url}")
    try:
        conn = psycopg2.connect(url, connect_timeout=10)
        print("SUCCESS: Connected!")
        cur = conn.cursor()
        cur.execute("SELECT version();")
        print(f"Version: {cur.fetchone()[0]}")
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"FAILURE: {e}")
        return False

if __name__ == "__main__":
    # 1. Test existing ENV URL (likely pooler)
    env_url = "postgres://postgres.bjbuonljkbknbdadgjco:Chaithanya3%40@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
    test_connection(env_url, "Pooler (from .env)")

    # 2. Test Direct URL (Standard Supabase)
    # Host is project_ref.supabase.co
    direct_url = "postgres://postgres:Chaithanya3%40@bjbuonljkbknbdadgjco.supabase.co:5432/postgres"
    test_connection(direct_url, "Direct (Standard)")

    # 3. Test IPv4 Specific (if IPv6 is blocking)
    # Sometimes db.project.supabase.co resolves poorly.
