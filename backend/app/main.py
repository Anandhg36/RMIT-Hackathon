from pathlib import Path
from dotenv import load_dotenv
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

import os, requests
from typing import Any, Dict, Optional
from urllib.parse import urljoin
from fastapi import FastAPI, Depends, HTTPException, Body, Query, Header
from fastapi.middleware.cors import CORSMiddleware

from app.crypto import encrypt, decrypt
from app.supa import upsert, select_one, validate_supabase_user

CANVAS_BASE = os.getenv("CANVAS_BASE", "https://rmit.instructure.com/api/v1/")

app = FastAPI(title="RMIT One (Supabase-REST + Canvas)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4300", "http://localhost:4200"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

@app.get("/health")
def health(): return {"ok": True}

# ---- auth dependency (via Supabase Auth HTTP) ----
def current_user_id(authorization: str = Header("")) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing bearer token")
    access = authorization.split()[1]
    try:
        return validate_supabase_user(access)
    except Exception as e:
        raise HTTPException(401, f"Auth failed: {e}")

# ---------- Store Canvas token (encrypted) ----------
@app.post("/secrets/canvas")
def save_canvas_token(token: str = Body(..., embed=True), user_id: str = Depends(current_user_id)):
    enc = encrypt(token)
    try:
        upsert("user_secrets", {"user_id": user_id, "canvas_token_enc": enc}, on_conflict="user_id")
        return {"ok": True}
    except Exception as e:
        raise HTTPException(500, f"Supabase upsert error: {e}")

# ---------- Helper to read decrypted token ----------
def get_user_canvas_token(user_id: str) -> str:
    row = select_one("user_secrets", "canvas_token_enc", user_id=user_id)
    if not row:
        raise HTTPException(400, "Canvas token not set for this user")
    return decrypt(row["canvas_token_enc"])

def call_canvas(user_id: str, path: str, params: Optional[Dict[str, Any]] = None):
    token = get_user_canvas_token(user_id)
    url = urljoin(CANVAS_BASE, path.lstrip("/"))
    try:
        r = requests.get(url, headers={"Authorization": f"Bearer {token}"}, params=params, timeout=25)
        if r.status_code >= 400:
            raise HTTPException(r.status_code, r.text)
        return r.json()
    except requests.RequestException as e:
        raise HTTPException(502, f"Canvas error: {e}")

# ---------- Canvas proxies (per-user) ----------
@app.get("/canvas/me")
def me(user_id: str = Depends(current_user_id)):
    return call_canvas(user_id, "/users/self")

@app.get("/canvas/courses")
def courses(user_id: str = Depends(current_user_id)):
    return call_canvas(user_id, "/courses", params={"enrollment_state": "active"})

@app.get("/canvas/planner")
def planner(user_id: str = Depends(current_user_id),
            start_date: Optional[str] = Query(None),
            end_date: Optional[str]   = Query(None)):
    params = {}
    if start_date: params["start_date"] = start_date
    if end_date:   params["end_date"]   = end_date
    return call_canvas(user_id, "/planner/items", params=params)

@app.get("/canvas/grades")
def grades(user_id: str = Depends(current_user_id)):
    return call_canvas(user_id, "/users/self/enrollments")

@app.get("/canvas/courses/{course_id}/assignments")
def assignments(course_id: int, user_id: str = Depends(current_user_id), with_submissions: bool = True):
    params = {"include[]": "submission"} if with_submissions else None
    return call_canvas(user_id, f"/courses/{course_id}/assignments", params=params)
