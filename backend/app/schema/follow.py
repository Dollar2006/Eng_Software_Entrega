from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class FollowStatusOut(BaseModel):
    is_following: bool


class FollowStatsOut(BaseModel):
    followers_count: int
    following_count: int


class FollowUserOut(BaseModel):
    user_id: UUID
    display_name: str | None = None
    avatar: str | None = None
    followed_at: datetime