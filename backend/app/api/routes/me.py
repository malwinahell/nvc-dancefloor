from fastapi import APIRouter, Depends

from app.api.deps import CurrentUser, get_current_user

router = APIRouter(prefix="/me", tags=["me"])


@router.get("")
def read_me(user: CurrentUser = Depends(get_current_user)) -> dict:
    """
    Zwraca tożsamość zalogowanego usera odczytaną z tokena Supabase.
    Służy głównie do weryfikacji że Authorization header + JWT secret
    są poprawnie skonfigurowane — realna logika domenowa wjedzie w
    routes/tiles.py i routes/processes.py w kolejnym kroku.
    """
    return {"id": user.id, "email": user.email}
