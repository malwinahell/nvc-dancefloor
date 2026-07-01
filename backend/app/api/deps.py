"""
Współdzielone dependency injections dla routerów.

get_current_user:
    Czyta `Authorization: Bearer <token>` wystawiony przez Supabase Auth
    (front loguje się bezpośrednio przez supabase-js, FastAPI tylko
    weryfikuje podpis tokena lokalnie — bez dodatkowego round-tripu do
    Supabase). Zwraca CurrentUser z user_id, email i samym tokenem, żeby
    routy mogły zbudować klienta scoped do tego usera (patrz
    db/supabase_client.py).

Bramka hasłem (gate) NIE jest weryfikowana po stronie FastAPI — front i
backend mogą siedzieć na różnych domenach, więc cookie ustawiane przez
backend nie byłoby widoczne dla middleware Next.js. Gate jest w całości
zaimplementowany w Next.js (Route Handler + middleware), patrz frontend.
"""

from dataclasses import dataclass

import jwt
from fastapi import Header, HTTPException, status

from app.core.config import get_settings


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
