from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class FeedItemOut(BaseModel):
    review_id: int
    user_id: UUID
    author_name: str | None = None
    author_avatar: str | None = None
    game_id: int
    game_name: str
    game_cover_url: str | None = None
    rating: int
    text: str | None = None
    created_at: datetime
    updated_at: datetime