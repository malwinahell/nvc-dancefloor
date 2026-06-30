"""
Endpointy procesów (zapisanych układów na kanwasie).

Rozróżnienie dla frontu:
- GET /processes/mine    -> "Moje procesy" w panelu/drawerze: wszystko co user
                             ma jako właściciel, prywatne i publiczne.
- GET /processes/public  -> "Procesy publiczne": cudze publiczne procesy do
                             przeglądania (własne publiczne user widzi już
                             w /mine, więc tu je pomijamy — bez duplikatów).
- GET /processes/{id}    -> pełny szczegół z canvas_data, do otwarcia na
                             kanwasie. RLS pilnuje że dostępne tylko gdy
                             public albo własne.
- PUT /processes/{id}    -> zapis (autosave) — działa WYŁĄCZNIE na własnych
                             procesach (RLS), niezależnie od visibility.
                             Edycja cudzego publicznego procesu nie istnieje
                             jako operacja — od tego jest fork.
- POST /processes/{id}/fork
                          -> "Zapisz jako mój proces": tworzy nową, prywatną
                             kopię należącą do bieżącego usera, z
                             forked_from_id wskazującym na oryginał. Oryginał
                             nigdy nie jest modyfikowany przez tę operację.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from postgrest.exceptions import APIError

from app.api.deps import CurrentUser, get_current_user
from app.db.supabase_client import get_user_client
from app.schemas.process import (
    ProcessCreate,
    ProcessDetail,
    ProcessListItem,
    ProcessUpdate,
)

router = APIRouter(prefix="/processes", tags=["processes"])

# Kolumny do listowania — bez canvas_data (może być spore JSONB, niepotrzebne w liście)
_LIST_COLUMNS = (
    "id, owner_id, title, description, visibility, "
    "forked_from_id, created_at, updated_at"
)


def _raise_for_api_error(exc: APIError) -> None:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=exc.message or "Błąd zapytania do bazy danych.",
    )


@router.get("/mine", response_model=list[ProcessListItem])
def list_mine(user: CurrentUser = Depends(get_current_user)) -> list[ProcessListItem]:
    client = get_user_client(user.access_token)
    try:
        res = (
            client.table("processes")
            .select(_LIST_COLUMNS)
            .eq("owner_id", user.id)
            .order("updated_at", desc=True)
            .execute()
        )
    except APIError as exc:
        _raise_for_api_error(exc)

    return [ProcessListItem(**row, is_owner=True) for row in res.data]


@router.get("/public", response_model=list[ProcessListItem])
def list_public(user: CurrentUser = Depends(get_current_user)) -> list[ProcessListItem]:
    client = get_user_client(user.access_token)
    try:
        res = (
            client.table("processes")
            .select(_LIST_COLUMNS)
            .eq("visibility", "public")
            .neq("owner_id", user.id)  # własne publiczne są już w /mine
            .order("updated_at", desc=True)
            .execute()
        )
    except APIError as exc:
        _raise_for_api_error(exc)

    return [ProcessListItem(**row, is_owner=False) for row in res.data]


@router.get("/{process_id}", response_model=ProcessDetail)
def get_process(
    process_id: str, user: CurrentUser = Depends(get_current_user)
) -> ProcessDetail:
    client = get_user_client(user.access_token)
    try:
        # RLS (processes_select) ogranicza wynik do public lub własnych —
        # brak wiersza w odpowiedzi oznacza "nie istnieje albo brak dostępu",
        # co celowo nie zdradza różnicy (nie ujawniamy istnienia prywatnych
        # cudzych procesów).
        res = client.table("processes").select("*").eq("id", process_id).execute()
    except APIError as exc:
        _raise_for_api_error(exc)

    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proces nie istnieje albo nie masz do niego dostępu.",
        )

    row = res.data[0]
    return ProcessDetail(**row, is_owner=row["owner_id"] == user.id)


@router.post("", response_model=ProcessDetail, status_code=status.HTTP_201_CREATED)
def create_process(
    payload: ProcessCreate, user: CurrentUser = Depends(get_current_user)
) -> ProcessDetail:
    client = get_user_client(user.access_token)
    insert_data = {**payload.model_dump(), "owner_id": user.id}

    try:
        res = client.table("processes").insert(insert_data).execute()
    except APIError as exc:
        _raise_for_api_error(exc)

    return ProcessDetail(**res.data[0], is_owner=True)


@router.put("/{process_id}", response_model=ProcessDetail)
def update_process(
    process_id: str,
    payload: ProcessUpdate,
    user: CurrentUser = Depends(get_current_user),
) -> ProcessDetail:
    client = get_user_client(user.access_token)
    update_data = payload.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Brak danych do zaktualizowania.",
        )

    try:
        # RLS (processes_update) i tak ogranicza do owner_id = auth.uid();
        # jawny .eq tutaj daje przewidywalne "0 wierszy" zamiast polegać
        # wyłącznie na bazie przy nieautoryzowanej próbie edycji.
        res = (
            client.table("processes")
            .update(update_data)
            .eq("id", process_id)
            .eq("owner_id", user.id)
            .execute()
        )
    except APIError as exc:
        _raise_for_api_error(exc)

    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proces nie istnieje albo nie należy do Ciebie.",
        )

    return ProcessDetail(**res.data[0], is_owner=True)


@router.delete("/{process_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_process(
    process_id: str, user: CurrentUser = Depends(get_current_user)
) -> None:
    client = get_user_client(user.access_token)
    try:
        res = (
            client.table("processes")
            .delete()
            .eq("id", process_id)
            .eq("owner_id", user.id)
            .execute()
        )
    except APIError as exc:
        _raise_for_api_error(exc)

    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proces nie istnieje albo nie należy do Ciebie.",
        )


@router.post(
    "/{process_id}/fork",
    response_model=ProcessDetail,
    status_code=status.HTTP_201_CREATED,
)
def fork_process(
    process_id: str, user: CurrentUser = Depends(get_current_user)
) -> ProcessDetail:
    """
    "Zapisz jako mój proces" — tworzy nową, prywatną kopię należącą do
    bieżącego usera. Oryginał (nawet jeśli to cudzy publiczny proces) nie
    jest w żaden sposób modyfikowany — to zwykły INSERT nowego wiersza.
    """
    client = get_user_client(user.access_token)

    try:
        # RLS (processes_select) pozwoli odczytać tylko gdy public lub własny
        source_res = (
            client.table("processes").select("*").eq("id", process_id).execute()
        )
    except APIError as exc:
        _raise_for_api_error(exc)

    if not source_res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proces nie istnieje albo nie masz do niego dostępu.",
        )

    source = source_res.data[0]
    fork_data = {
        "owner_id": user.id,
        "title": f"{source['title']} (kopia)",
        "description": source.get("description"),
        "visibility": "private",
        "forked_from_id": source["id"],
        "canvas_data": source["canvas_data"],
    }

    try:
        res = client.table("processes").insert(fork_data).execute()
    except APIError as exc:
        _raise_for_api_error(exc)

    return ProcessDetail(**res.data[0], is_owner=True)
