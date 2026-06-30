"""
Gate — "soft lock" przed całą aplikacją, niezależny od właściwego logowania.

Działanie:
1. Użytkownik wpisuje hasło (kochamnvc) na ekranie /gate.
2. Front wysyła je do POST /api/gate/verify.
3. Jeśli zgadza się z GATE_PASSWORD — wystawiamy podpisany JWT w httpOnly
   cookie, ważny GATE_TOKEN_TTL_DAYS dni. Cookie NIE zawiera danych usera —
   to tylko dowód "ktoś przeszedł przez bramkę", zupełnie osobny od
   Supabase Auth (logowanie/rejestracja).
4. Middleware w Next.js sprawdza obecność i ważność tego cookie zanim
   przepuści ruch do /login, /register, /app/*.

Hasło NIE jest hashowane — to świadomy wybór, bo to jeden, współdzielony
sekret typu "klucz do drzwi", a nie hasło per-user. Trzymane tylko w env.
"""

from datetime import datetime, timedelta, timezone

import jwt

from app.core.config import get_settings

GATE_CLAIM = "gate_ok"


def verify_gate_password(password: str) -> bool:
    settings = get_settings()
    return password == settings.gate_password


def issue_gate_token() -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        GATE_CLAIM: True,
        "iat": now,
        "exp": now + timedelta(days=settings.gate_token_ttl_days),
    }
    return jwt.encode(payload, settings.gate_jwt_secret, algorithm="HS256")


def verify_gate_token(token: str | None) -> bool:
    if not token:
        return False
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.gate_jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        return False
    return bool(payload.get(GATE_CLAIM))
