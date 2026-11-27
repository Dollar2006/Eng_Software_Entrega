from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True)
class NotificationEvent:
    type: str
    actor_id: UUID
    recipient_id: UUID
    review_id: int | None = None


@dataclass(frozen=True)
class FollowCreated(NotificationEvent):
    type: str = "follow"


@dataclass(frozen=True)
class ReviewLiked(NotificationEvent):
    type: str = "review_like"
