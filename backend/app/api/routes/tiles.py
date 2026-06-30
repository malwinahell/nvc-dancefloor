"""
Endpointy kafelków.

Rozróżnienie kluczowe dla frontu:
- GET /tiles/library  -> "Własne kafelki" w TileSidebar: wszystko co user ma
                          w swojej bibliotece (własne + cudze publiczne, które
                          świadomie dodał). `is_owner` mówi, czy może edytować/
                          usuwać dany kafelek, czy tylko go odpiąć z biblioteki.
- GET /tiles/gallery  -> "Galeria publiczna": publiczne kafelki innych userów,
                          których user JESZCZE nie dodał do swojej biblioteki.
                          Stąd front pokazuje przycisk "Dodaj do moich".

Kafelki domyślne (DEFAULT_NVC_TILES) celowo nie przechodzą przez ten router —
żyją na stałe w kodzie frontu, nie są user-generated content.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from postgrest.exceptions import APIError

from app.api.deps import CurrentUser, get_current_user
from app.db.supabase_client import get_user_client
from app.schemas.tile import TileCreate, TileOut

router = APIRouter(prefix="/tiles", tags=["tiles"])


def _raise_for_api_error(exc: APIError) -> None:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=exc.message or "Błąd zapytania do bazy danych.",
    )


@router.get("/library", response_model=list[TileOut])
def list_library(user: CurrentUser = Depends(get_current_user)) -> list[TileOut]:
    client = get_user_client(user.access_token)
    try:
        # Nested select po relacji FK user_tile_library.tile_id -> tiles.id
        res = (
            client.table("user_tile_library")
            .select("added_at, tiles(*)")
            .eq("user_id", user.id)
            .order("added_at", desc=True)
            .execute()
        )
    except APIError as exc:
        _raise_for_api_error(exc)

    out: list[TileOut] = []
    for row in res.data:
        tile = row.get("tiles")
        if not tile:
            continue
        out.append(TileOut(**tile, is_owner=tile["owner_id"] == user.id))
    return out


@router.get("/gallery", response_model=list[TileOut])
def list_gallery(user: CurrentUser = Depends(get_current_user)) -> list[TileOut]:
    client = get_user_client(user.access_token)

    try:
        library_res = (
            client.table("user_tile_library")
            .select("tile_id")
            .eq("user_id", user.id)
            .execute()
        )
    except APIError as exc:
        _raise_for_api_error(exc)

    already_added_ids = [row["tile_id"] for row in library_res.data]

    try:
        query = client.table("tiles").select("*").eq("visibility", "public")
        if already_added_ids:
            # PostgREST `not.in.(...)` — wykluczamy to, co user już ma w bibliotece
            query = query.not_.in_("id", already_added_ids)
        res = query.order("created_at", desc=True).execute()
    except APIError as exc:
        _raise_for_api_error(exc)

    return [TileOut(**row, is_owner=row["owner_id"] == user.id) for row in res.data]


@router.post("", response_model=TileOut, status_code=status.HTTP_201_CREATED)
def create_tile(
    payload: TileCreate, user: CurrentUser = Depends(get_current_user)
) -> TileOut:
    client = get_user_client(user.access_token)
    insert_data = {**payload.model_dump(), "owner_id": user.id}

    try:
        # Trigger `on_tile_created` w bazie sam dopisze wiersz do
        # user_tile_library — nie robimy tego ręcznie tutaj.
        res = client.table("tiles").insert(insert_data).execute()
    except APIError as exc:
        _raise_for_api_error(exc)

    return TileOut(**res.data[0], is_owner=True)


@router.delete("/{tile_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tile(tile_id: str, user: CurrentUser = Depends(get_current_user)) -> None:
    client = get_user_client(user.access_token)
    try:
        # RLS (tiles_delete) i tak pilnuje owner_id = auth.uid(), ale dodajemy
        # jawny .eq tu, żeby dostać przewidywalne "0 wierszy" zamiast polegać
        # tylko na bazie przy nieautoryzowanej próbie.
        res = (
            client.table("tiles")
            .delete()
            .eq("id", tile_id)
            .eq("owner_id", user.id)
            .execute()
        )
    except APIError as exc:
        _raise_for_api_error(exc)

    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kafelek nie istnieje albo nie należy do Ciebie.",
        )


@router.post("/{tile_id}/library", status_code=status.HTTP_204_NO_CONTENT)
def add_to_library(tile_id: str, user: CurrentUser = Depends(get_current_user)) -> None:
    """
    Dodaje publiczny kafelek (cudzy lub własny) do biblioteki usera.
    RLS (library_insert) i tak zweryfikuje, że kafelek jest public lub własny —
    to jest druga linia obrony, nie jedyna.
    """
    client = get_user_client(user.access_token)
    try:
        client.table("user_tile_library").insert(
            {"user_id": user.id, "tile_id": tile_id}
        ).execute()
    except APIError as exc:
        if exc.code == "23505":  # unique_violation — już jest w bibliotece
            return
        _raise_for_api_error(exc)


@router.delete("/{tile_id}/library", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_library(
    tile_id: str, user: CurrentUser = Depends(get_current_user)
) -> None:
    """
    Odpina kafelek z biblioteki usera (referencję, nie sam obiekt tiles).
    Własnych kafelków nie da się odpiąć w ten sposób — do tego służy
    DELETE /tiles/{id}, które usuwa kafelek całkowicie. Inaczej user
    mógłby "zgubić" własny, wciąż istniejący kafelek bez możliwości
    odzyskania go z poziomu UI.
    """
    client = get_user_client(user.access_token)

    try:
        tile_res = client.table("tiles").select("owner_id").eq("id", tile_id).execute()
    except APIError as exc:
        _raise_for_api_error(exc)

    if tile_res.data and tile_res.data[0]["owner_id"] == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="To Twój własny kafelek — użyj usuwania kafelka, nie odpinania z biblioteki.",
        )

    try:
        client.table("user_tile_library").delete().eq("user_id", user.id).eq(
            "tile_id", tile_id
        ).execute()
    except APIError as exc:
        _raise_for_api_error(exc)
