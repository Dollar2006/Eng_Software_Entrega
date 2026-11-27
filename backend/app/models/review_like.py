from sqlalchemy import Column, DateTime, ForeignKey, Integer, PrimaryKeyConstraint, func
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base
from app.models.auth_user import auth_users  # noqa: F401


class ReviewLike(Base):
    __tablename__ = "review_likes"
    __table_args__ = (PrimaryKeyConstraint("user_id", "review_id", name="pk_review_likes"),)

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("auth.users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    review_id = Column(
        Integer,
        ForeignKey("reviews.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
