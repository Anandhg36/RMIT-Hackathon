import os, requests
from fastapi import Depends, Header, HTTPException

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")  # can also reuse service key

def current_user_id(authorization: str = Header("")) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing bearer token")
    access_token = authorization.split()[1]
    # Validate token with Supabase
    r = requests.get(
        f"{SUPABASE_URL}/auth/v1/user",
        headers={
            "apikey": SUPABASE_ANON_KEY or os.environ["SUPABASE_SERVICE_ROLE_KEY"],
            "Authorization": f"Bearer {access_token}",
        },
        timeout=15,
    )
    if r.status_code != 200:
        raise HTTPException(401, "Invalid Supabase token")
    return r.json()["id"]  # auth.users UUID
