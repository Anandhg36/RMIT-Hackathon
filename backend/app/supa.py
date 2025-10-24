# app/supa_rest.py
import os
from typing import Any, Dict, Optional
import requests
from fastapi import HTTPException, Header

SUPABASE_URL  = os.getenv("SUPABASE_URL")           # e.g. https://xyzcompany.supabase.co
SUPABASE_ANON = os.getenv("SUPABASE_ANON_KEY")      # Project settings → API → anon public
SUPABASE_SR   = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # service_role (keep secret)

if not (SUPABASE_URL and SUPABASE_ANON and SUPABASE_SR):
    raise RuntimeError("Missing SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY in env")

def _rest(
    method: str,
    path: str,
    *,
    json: Optional[Dict[str, Any]] = None,
    params: Optional[Dict[str, Any]] = None,
    admin: bool = True,
):
    """
    Minimal REST caller for Supabase PostgREST and GoTrue.
    admin=True -> uses service role (bypasses RLS for server-side ops).
    """
    headers = {
        "apikey": SUPABASE_SR if admin else SUPABASE_ANON,
        "Authorization": f"Bearer {SUPABASE_SR if admin else SUPABASE_ANON}",
        "Content-Type": "application/json",
    }
    url = f"{SUPABASE_URL}{path}"
    try:
        r = requests.request(method, url, headers=headers, json=json, params=params, timeout=20)
    except requests.RequestException as e:
        raise HTTPException(502, f"Supabase error: {e}")
    if r.status_code >= 400:
        raise HTTPException(r.status_code, r.text)
    return r.json() if r.text else None

# ---------- Table helpers (PostgREST) ----------
def upsert(table: str, payload: Dict[str, Any], *, on_conflict: str) -> Dict[str, Any]:
    return _rest(
        "POST",
        f"/rest/v1/{table}",
        json=payload,
        params={"on_conflict": on_conflict, "return": "representation"},
        admin=True,
    )[0]

def select_one(table: str, filters: Dict[str, Any], columns: str = "*") -> Optional[Dict[str, Any]]:
    params = {**{f"{k}.eq": v for k, v in filters.items()}, "select": columns}
    rows = _rest("GET", f"/rest/v1/{table}", params=params, admin=True)
    return rows[0] if rows else None

# ---------- Auth helper (GoTrue) ----------
def validate_supabase_user(authorization: str = Header(default=None)) -> str:
    """
    Validate the user's JWT from the client and return user id.
    Client should send:  Authorization: Bearer <supabase-user-jwt>
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Missing Authorization bearer token")
    jwt = authorization.split(" ", 1)[1].strip()
    # GoTrue user endpoint – needs anon key + the user's JWT
    headers = {"apikey": SUPABASE_ANON, "Authorization": f"Bearer {jwt}"}
    url = f"{SUPABASE_URL}/auth/v1/user"
    r = requests.get(url, headers=headers, timeout=15)
    if r.status_code != 200:
        raise HTTPException(401, "Invalid Supabase token")
    return r.json()["id"]
