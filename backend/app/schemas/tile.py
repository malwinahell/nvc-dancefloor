from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

Visibility = Literal["private", "public"]


class TileCreate(BaseModel):
    label: str = Field(min_length=1, max_length=60)
    description: str | None = Field(default=None, max_length=200)
    color: str = Field(min_length=4, max_length=9)  # np. "#D8B4FE"
    icon: str = Field(default="", max_length=8)  # emoji albo "" = brak ikony
    nvc_type: str = Field(default="custom", max_length=40)
    visibility: Visibility = "private"


class TileOut(BaseModel):
    id: str
    owner_id: str
    label: str
    description: str | None = None
    color: str
    icon: str
    nvc_type: str
    visibility: Visibility
    created_at: datetime
    is_owner: bool = False
