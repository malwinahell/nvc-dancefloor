"""
Konfiguracja aplikacji — wszystkie wartości pochodzą ze zmiennych środowiskowych.
Nigdy nie commitować realnego .env do repo — patrz .env.example.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # ── Supabase ──────────────────────────────────────────────────────────
    supabase_url: str
    supabase_anon_key: str
    # JWT secret projektu Supabase (Project Settings → API → JWT Secret).
    # Używany WYŁĄCZNIE do lokalnej weryfikacji podpisu tokenów usera —
    # nie mylić z service_role key.
    supabase_jwt_secret: str

    # ── Gate (hasło wejściowe do całej aplikacji) ───────────────────────────
    gate_password: str = "kochamnvc"
    gate_jwt_secret: str
    gate_cookie_name: str = "nvc_gate"
    gate_token_ttl_days: int = 30

    # ── CORS ──────────────────────────────────────────────────────────────
    frontend_origin: str = "http://localhost:3000"

    # ── Env ──────────────────────────────────────────────────────────────
    environment: str = "development"


@lru_cache
def get_settings() -> Settings:
    # lru_cache => Settings parsowane raz, przy pierwszym imporcie.
    return Settings()
