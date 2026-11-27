from dataclasses import dataclass, field
from uuid import UUID


@dataclass(frozen=True)
class NotificationEvent:
    actor_id: UUID
    recipient_id: UUID
    type: str
    review_id: int | None = None


@dataclass(frozen=True)
class FollowCreated(NotificationEvent):
    type: str = field(default="follow", init=False)


@dataclass(frozen=True)
class ReviewLiked(NotificationEvent):
    type: str = field(default="review_like", init=False)
