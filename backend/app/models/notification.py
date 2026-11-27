from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base
from app.models.auth_user import auth_users  # noqa: F401


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True)
    recipient_id = Column(
        UUID(as_uuid=True),
        ForeignKey("auth.users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    actor_id = Column(
        UUID(as_uuid=True),
        ForeignKey("auth.users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type = Column(String(30), nullable=False)
    review_id = Column(
        Integer,
        ForeignKey("reviews.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    read_at = Column(DateTime(timezone=True), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
