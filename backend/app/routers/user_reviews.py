from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.game import Game
from app.models.review import Review
from app.schema.game import GameOut, MyReviewOut

router = APIRouter(prefix="/users/me/reviews", tags=["reviews"])


@router.get("", response_model=list[MyReviewOut])
def list_my_reviews(
    limit: int = Query(12, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user: dict[str, str] = Depends(get_current_user),
):
    rows = (
        db.query(Review, Game)
        .join(Game, Game.id == Review.game_id)
        .filter(Review.user_id == user["id"], Review.text.is_not(None))
        .order_by(Review.updated_at.desc(), Review.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [
        MyReviewOut(
            game=GameOut.model_validate(game),
            rating=review.rating,
            text=review.text,
            created_at=review.created_at,
            updated_at=review.updated_at,
        )
        for review, game in rows
    ]