from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class StatusIn(BaseModel):
    status: Literal["played", "want_to_play", "library"]


class SetStatusIn(BaseModel):
    game_id: int
    status: Literal["played", "want_to_play", "library"]


class GameStatusOut(BaseModel):
    status: Literal["played", "want_to_play", "library"] | None


class ListRefOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    kind: str


class ListItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    game_id: int
    added_at: datetime


class SystemListsOut(BaseModel):
    lists: list[ListRefOut]
