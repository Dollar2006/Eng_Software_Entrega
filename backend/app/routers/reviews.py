from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.review import Review
from app.models.review_like import ReviewLike

router = APIRouter(prefix="/reviews", tags=["reviews"])


class ReviewLikeOut(BaseModel):
    liked: bool
    likes_count: int


def _likes_count(db: Session, review_id: int) -> int:
    return (
        db.query(func.count(ReviewLike.user_id))
        .filter(ReviewLike.review_id == review_id)
        .scalar()
        or 0
    )


def _ensure_review_exists(db: Session, review_id: int) -> None:
    if db.get(Review, review_id) is None:
        raise HTTPException(status_code=404, detail="Review não encontrada")


@router.post("/{review_id}/like", response_model=ReviewLikeOut)
def like_review(
    review_id: int,
    db: Session = Depends(get_db),
    user: dict[str, str] = Depends(get_current_user),
):
    _ensure_review_exists(db, review_id)
    stmt = (
        insert(ReviewLike)
        .values(user_id=user["id"], review_id=review_id)
        .on_conflict_do_nothing(constraint="pk_review_likes")
    )
    db.execute(stmt)
    db.commit()
    return {"liked": True, "likes_count": _likes_count(db, review_id)}


@router.delete("/{review_id}/like", response_model=ReviewLikeOut)
def unlike_review(
    review_id: int,
    db: Session = Depends(get_db),
    user: dict[str, str] = Depends(get_current_user),
):
    _ensure_review_exists(db, review_id)
    (
        db.query(ReviewLike)
        .filter(ReviewLike.review_id == review_id, ReviewLike.user_id == user["id"])
        .delete(synchronize_session=False)
    )
    db.commit()
    return {"liked": False, "likes_count": _likes_count(db, review_id)}
