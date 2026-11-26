from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies import get_current_user, get_current_user_optional
from app.models.game import Game
from app.models.profile import Profile
from app.models.review import Review
from app.models.review_like import ReviewLike
from app.schema.game import GameOut, MyReviewOut

router = APIRouter(prefix="/users", tags=["reviews"])


def _profile_by_gamertag(db: Session, gamertag: str) -> Profile:
    profile = (
        db.query(Profile)
        .filter(func.lower(Profile.gamertag) == gamertag.lower())
        .first()
    )
    if profile is None or not profile.gamertag:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return profile


@router.get("/me/reviews", response_model=list[MyReviewOut])
def list_my_reviews(
    limit: int = Query(12, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user: dict[str, str] = Depends(get_current_user),
):
    likes_count = (
        select(func.count(ReviewLike.user_id))
        .where(ReviewLike.review_id == Review.id)
        .correlate(Review)
        .scalar_subquery()
        .label("likes_count")
    )
    liked_by_me = (
        select(func.count(ReviewLike.user_id) > 0)
        .where(ReviewLike.review_id == Review.id, ReviewLike.user_id == user["id"])
        .correlate(Review)
        .scalar_subquery()
        .label("liked_by_me")
    )
    rows = (
        db.query(Review, Game, likes_count, liked_by_me)
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
            likes_count=int(count or 0),
            liked_by_me=bool(liked),
            created_at=review.created_at,
            updated_at=review.updated_at,
        )
        for review, game, count, liked in rows
    ]


@router.get("/{gamertag}/reviews", response_model=list[MyReviewOut])
def list_user_reviews(
    gamertag: str,
    limit: int = Query(12, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user: dict[str, str] | None = Depends(get_current_user_optional),
):
    profile = _profile_by_gamertag(db, gamertag)
    likes_count = (
        select(func.count(ReviewLike.user_id))
        .where(ReviewLike.review_id == Review.id)
        .correlate(Review)
        .scalar_subquery()
        .label("likes_count")
    )
    liked_by_me = (
        select(func.count(ReviewLike.user_id) > 0)
        .where(ReviewLike.review_id == Review.id, ReviewLike.user_id == (user["id"] if user else None))
        .correlate(Review)
        .scalar_subquery()
        .label("liked_by_me")
    )
    rows = (
        db.query(Review, Game, likes_count, liked_by_me)
        .join(Game, Game.id == Review.game_id)
        .filter(Review.user_id == str(profile.user_id), Review.text.is_not(None))
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
            likes_count=int(count or 0),
            liked_by_me=bool(liked),
            created_at=review.created_at,
            updated_at=review.updated_at,
        )
        for review, game, count, liked in rows
    ]