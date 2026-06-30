"""
Klient Supabase używany w warstwie API.

WAŻNE: nigdy nie używamy tu service_role key do zwykłego ruchu użytkownika.
Każdy request od zalogowanego usera dostaje klienta z jego własnym JWT
ustawionym na warstwie PostgREST (`postgrest.auth(token)`) — dzięki temu
`auth.uid()` w politykach RLS faktycznie zwraca tego usera, a nie supabase
service account. FastAPI jest tu cienką warstwą logiki, nie obejściem
zabezpieczeń.
"""

from functools import lru_cache

from supabase import Client, create_client

from app.core.config import get_settings


@lru_cache
def _base_client() -> Client:
    """
    Pojedynczy, długożyjący klient bazowy (anon key) — re-używany jako
    fabryka połączenia. Token usera nadpisujemy per-request przez
    .postgrest.auth(token), więc bezpiecznie współdzielić instancję.
    """
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_anon_key)


def get_user_client(access_token: str) -> Client:
    """
    Zwraca klienta Supabase z ustawionym tokenem usera — wszystkie zapytania
    przez ten klient przechodzą przez RLS tak, jakby wykonywał je sam user.
    """
    client = _base_client()
    client.postgrest.auth(access_token)
    return client
