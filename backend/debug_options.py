
import os
import sys
from supabase.lib.client_options import ClientOptions
import inspect

def inspect_options():
    print("--- Inspecting ClientOptions ---")
    sig = inspect.signature(ClientOptions.__init__)
    print(f"Signature: {sig}")
    
    # Also print dir to see attributes
    print(f"Attributes: {dir(ClientOptions)}")

if __name__ == "__main__":
    inspect_options()
