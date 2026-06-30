from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

Visibility = Literal["private", "public"]

DEFAULT_CANVAS: dict[str, Any] = {
    "nodes": [],
    "edges": [],
    "viewport": {"x": 0, "y": 0, "zoom": 1},
}


class ProcessCreate(BaseModel):
    title: str = Field(default="Nowy proces", min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=300)
    visibility: Visibility = "private"
    canvas_data: dict[str, Any] = Field(default_factory=lambda: dict(DEFAULT_CANVAS))


class ProcessUpdate(BaseModel):
    """
    Wszystkie pola opcjonalne — front wysyła tylko to, co faktycznie się
    zmieniło (np. autosave samego canvas_data bez dotykania title/visibility).
    """

    title: str | None = Field(default=None, min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=300)
    visibility: Visibility | None = None
    canvas_data: dict[str, Any] | None = None


class ProcessListItem(BaseModel):
    """Lekka reprezentacja do list — bez canvas_data, żeby nie ciągnąć JSONB-a niepotrzebnie."""

    id: str
    owner_id: str
    title: str
    description: str | None = None
    visibility: Visibility
    forked_from_id: str | None = None
    created_at: datetime
    updated_at: datetime
    is_owner: bool = False


class ProcessDetail(ProcessListItem):
    canvas_data: dict[str, Any]
