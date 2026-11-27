from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Index, func
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base
from app.models.auth_user import auth_users  # noqa: F401


class Follow(Base):
    __tablename__ = "follows"
    __table_args__ = (
        CheckConstraint("follower_id <> followed_id", name="ck_follows_no_self"),
        Index("ix_follows_followed_id", "followed_id"),
    )

    follower_id = Column(
        UUID(as_uuid=True),
        ForeignKey("auth.users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    followed_id = Column(
        UUID(as_uuid=True),
        ForeignKey("auth.users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )