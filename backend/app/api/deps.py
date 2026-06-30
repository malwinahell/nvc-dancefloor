"""
Współdzielone dependency injections dla routerów.

get_current_user:
    Czyta `Authorization: Bearer <token>` wystawiony przez Supabase Auth
    (front loguje się bezpośrednio przez supabase-js, FastAPI tylko
    weryfikuje podpis tokena lokalnie — bez dodatkowego round-tripu do
    Supabase). Zwraca CurrentUser z user_id, email i samym tokenem, żeby
    routy mogły zbudować klienta scoped do tego usera (patrz
    db/supabase_client.py).

require_gate:
    Sprawdza httpOnly cookie wystawione po przejściu przez ekran hasła.
    Niezależne od logowania — patrz core/gate.py.
"""

from dataclasses import dataclass

import jwt
from fastapi import Header, HTTPException, Request, status

from app.core.config import get_settings
from app.core.gate import verify_gate_token


@dataclass
class CurrentUser:
    id: str
    email: str | None
    access_token: str


def get_current_user(
    authorization: str | None = Header(default=None),
) -> CurrentUser:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Brak tokena uwierzytelniającego.",
        )

    token = authorization.split(" ", 1)[1].strip()
    settings = get_settings()

    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowy lub wygasły token.",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token nie zawiera identyfikatora użytkownika.",
        )

    return CurrentUser(
        id=user_id,
        email=payload.get("email"),
        access_token=token,
    )


def require_gate(request: Request) -> None:
    """
    Dependency do podpięcia pod routery, które mają być dostępne dopiero
    po przejściu bramki hasłem (w praktyce: wszystkie poza /gate/verify
    i /auth/*, bo logowanie/rejestracja też powinny być za bramką zgodnie
    z wymaganiem — bramka jest PRZED rejestracją).
    """
    settings = get_settings()
    token = request.cookies.get(settings.gate_cookie_name)
    if not verify_gate_token(token):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Dostęp zablokowany bramką wejściową.",
        )
