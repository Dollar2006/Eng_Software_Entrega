from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel


class NotificationActorOut(BaseModel):
    user_id: UUID
    display_name: str | None = None
    avatar: str | None = None
    gamertag: str | None = None


class NotificationReviewOut(BaseModel):
    review_id: int
    game_id: int
    game_name: str
    cover_url: str | None = None


class NotificationOut(BaseModel):
    id: int
    type: Literal["follow", "review_like"]
    read_at: datetime | None = None
    created_at: datetime
    actor: NotificationActorOut
    review: NotificationReviewOut | None = None


class UnreadCountOut(BaseModel):
    unread_count: int
