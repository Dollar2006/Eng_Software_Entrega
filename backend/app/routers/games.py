from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.game import Game
from app.models.review import Review
from app.schema.game import FiltersOut, GameDetailOut, GameOut, RatingIn, RatingOut

router = APIRouter(prefix="/games", tags=["games"])


def _distinct_values(db: Session, column) -> list[str]:
    value = func.unnest(column).label("value")
    return list(db.scalars(select(value).distinct().order_by(value)))


@router.get("/filters", response_model=FiltersOut)
def get_filters(db: Session = Depends(get_db)):
    return {
        "genres": _distinct_values(db, Game.genres),
        "platforms": _distinct_values(db, Game.platforms),
    }


@router.get("", response_model=list[GameOut])
def search_games(
    name: str | None = None,
    genre: str | None = None,
    platform: str | None = None,
    limit: int = Query(20, le=50),
    offset: int = 0,
    db: Session = Depends(get_db),
):
    q = db.query(Game)
    if name:
        q = q.filter(Game.name.ilike(f"%{name}%"))
    if genre:
        q = q.filter(Game.genres.contains([genre.lower()]))
    if platform:
        q = q.filter(Game.platforms.contains([platform.lower()]))
    return q.order_by(Game.name).offset(offset).limit(limit).all()


@router.get("/{game_id}", response_model=GameDetailOut)
def get_game(game_id: int, db: Session = Depends(get_db)):
    game = db.get(Game, game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Jogo não encontrado")

    avg, count = (
        db.query(func.avg(Review.rating), func.count(Review.id))
        .filter(Review.game_id == game_id)
        .one()
    )
    detail = GameDetailOut.model_validate(game)
    detail.rating_avg = round(float(avg), 1) if avg is not None else None
    detail.rating_count = count
    return detail


@router.get("/{game_id}/rating/me", response_model=RatingOut)
def get_my_rating(
    game_id: int,
    db: Session = Depends(get_db),
    user: dict[str, str] = Depends(get_current_user),
):
    review = (
        db.query(Review)
        .filter(Review.game_id == game_id, Review.user_id == user["id"])
        .first()
    )
    return {"rating": review.rating if review else None}


@router.put("/{game_id}/rating", response_model=RatingOut)
def rate_game(
    game_id: int,
    body: RatingIn,
    db: Session = Depends(get_db),
    user: dict[str, str] = Depends(get_current_user),
):
    if db.get(Game, game_id) is None:
        raise HTTPException(status_code=404, detail="Jogo não encontrado")

    stmt = insert(Review).values(
        user_id=user["id"], game_id=game_id, rating=body.rating
    )
    stmt = stmt.on_conflict_do_update(
        constraint="uq_reviews_user_game",
        set_={"rating": body.rating, "updated_at": func.now()},
    )
    db.execute(stmt)
    db.commit()
    return {"rating": body.rating}