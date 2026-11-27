from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.review import Review
from app.models.review_like import ReviewLike
from app.schema.game import ReviewLikeOut

router = APIRouter(prefix="/reviews", tags=["review likes"])


@router.post(
    "/{review_id}/like",
    response_model=ReviewLikeOut,
)
def like_review(
    review_id: int,
    db: Session = Depends(get_db),
    user: dict[str, str] = Depends(get_current_user),
):
    review = db.get(Review, review_id)
    if review is None:
        raise HTTPException(status_code=404, detail="Review não encontrada")
    if review.user_id == user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não pode curtir sua própria review",
        )

    inserted_review_id = db.scalar(
        insert(ReviewLike)
        .values(review_id=review_id, user_id=user["id"])
        .on_conflict_do_nothing(index_elements=["review_id", "user_id"])
        .returning(ReviewLike.review_id)
    )
    if inserted_review_id is not None:
        db.execute(
            update(Review)
            .where(Review.id == review_id)
            .values(likes=Review.likes + 1)
        )

    db.commit()
    db.refresh(review)
    return ReviewLikeOut(
        review_id=review.id,
        likes=review.likes,
        liked_by_me=True,
    )


@router.delete(
    "/{review_id}/like",
    response_model=ReviewLikeOut,
)
def unlike_review(
    review_id: int,
    db: Session = Depends(get_db),
    user: dict[str, str] = Depends(get_current_user),
):
    review = db.get(Review, review_id)
    if review is None:
        raise HTTPException(status_code=404, detail="Review não encontrada")

    deleted_review_id = db.execute(
        delete(ReviewLike)
        .where(
            ReviewLike.review_id == review_id,
            ReviewLike.user_id == user["id"],
        )
        .returning(ReviewLike.review_id)
    ).scalar()
    if deleted_review_id is not None:
        db.execute(
            update(Review)
            .where(Review.id == review_id)
            .values(likes=Review.likes - 1)
        )

    db.commit()
    db.refresh(review)
    return ReviewLikeOut(
        review_id=review.id,
        likes=review.likes,
        liked_by_me=False,
    )
