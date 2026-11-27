from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import String, cast
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.follow import Follow
from app.models.game import Game
from app.models.profile import Profile
from app.models.review import Review
from app.schema.feed import FeedItemOut

router = APIRouter(prefix="/feed", tags=["feed"])


def _current_user_id(user: dict[str, str]) -> UUID:
    try:
        return UUID(user["id"])
    except (KeyError, TypeError, ValueError) as error:
        raise HTTPException(status_code=401, detail="Sessão inválida") from error


@router.get("", response_model=list[FeedItemOut])
def get_feed(
    only_reviews: bool = False,
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user: dict[str, str] = Depends(get_current_user),
):
    me = _current_user_id(user)

    q = (
        db.query(
            Review,
            Follow.followed_id,
            Game.name,
            Game.cover_url,
            Profile.display_name,
            Profile.avatar,
        )
        .select_from(Review)
        # reviews.user_id é String; o cast fica do lado do follow para
        # aproveitar o índice de reviews.user_id.
        .join(Follow, cast(Follow.followed_id, String) == Review.user_id)
        .join(Game, Game.id == Review.game_id)
        .outerjoin(Profile, Profile.user_id == Follow.followed_id)
        .filter(Follow.follower_id == me)
    )
    if only_reviews:
        q = q.filter(Review.text.is_not(None))

    rows = (
        q.order_by(Review.updated_at.desc(), Review.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [
        FeedItemOut(
            review_id=review.id,
            user_id=author_id,
            # Nome do perfil; sem ele, o nome guardado na review.
            author_name=(display_name or "").strip() or review.author_name,
            author_avatar=avatar,
            game_id=review.game_id,
            game_name=game_name,
            game_cover_url=cover_url,
            rating=review.rating,
            text=review.text,
            created_at=review.created_at,
            updated_at=review.updated_at,
        )
        for review, author_id, game_name, cover_url, display_name, avatar in rows
    ]