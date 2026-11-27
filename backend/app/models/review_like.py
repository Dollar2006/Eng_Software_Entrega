from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func

from app.db.database import Base


class ReviewLike(Base):
    __tablename__ = "review_likes"

    review_id = Column(
        Integer, ForeignKey("reviews.id", ondelete="CASCADE"), primary_key=True
    )
    user_id = Column(String, primary_key=True, index=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
