from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import gate, me, processes, tiles
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title="NVC Dancefloor API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,  # wymagane, żeby cookie bramki działało cross-origin
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(gate.router, prefix="/api")
app.include_router(me.router, prefix="/api")
app.include_router(tiles.router, prefix="/api")
app.include_router(processes.router, prefix="/api")


@app.get("/")
def root() -> dict:
    # Render domyślnie odpytuje "/" jako health check przy deployu —
    # bez tego endpointu dostaje 404 i po kilku minutach oznacza
    # deploy jako "Timed Out", mimo że serwer działa poprawnie.
    return {"status": "ok", "service": "nvc-dancefloor-api"}


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}
