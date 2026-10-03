from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import Uuid, cast, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.game import Game
from app.models.profile import Profile  # ajuste ao arquivo real do model
from app.models.review import Review
from app.schema.game import (
    FiltersOut,
    GameDetailOut,
    GameOut,
    RatingIn,
    RatingOut,
    ReviewIn,
    ReviewOut,
)

router = APIRouter(prefix="/games", tags=["games"])


def _distinct_values(db: Session, column) -> list[str]:
    value = func.unnest(column).label("value")
    return list(db.scalars(select(value).distinct().order_by(value)))


def _ensure_game_exists(db: Session, game_id: int) -> None:
    if db.get(Game, game_id) is None:
        raise HTTPException(status_code=404, detail="Jogo não encontrado")


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


# ---- REQ-07: nota de 1 a 5 estrelas ----


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
    if review is None:
        return {"rating": None, "text": None}
    return {"rating": review.rating, "text": review.text}


@router.put("/{game_id}/rating", response_model=RatingOut)
def rate_game(
    game_id: int,
    body: RatingIn,
    db: Session = Depends(get_db),
    user: dict[str, str] = Depends(get_current_user),
):
    _ensure_game_exists(db, game_id)

    stmt = insert(Review).values(
        user_id=user["id"], game_id=game_id, rating=body.rating
    )
    # Só a nota muda: se o usuário já tinha escrito uma review, o texto fica.
    stmt = stmt.on_conflict_do_update(
        constraint="uq_reviews_user_game",
        set_={"rating": body.rating, "updated_at": func.now()},
    )
    db.execute(stmt)
    db.commit()
    return {"rating": body.rating}


# ---- REQ-08: review escrita ----


@router.get("/{game_id}/reviews", response_model=list[ReviewOut])
def list_reviews(
    game_id: int,
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    _ensure_game_exists(db, game_id)

    # Outer join: quem nunca preencheu o perfil continua aparecendo.
    rows = (
        db.query(Review, Profile.display_name, Profile.avatar)
        .outerjoin(Profile, Profile.user_id == cast(Review.user_id, Uuid))
        .filter(Review.game_id == game_id, Review.text.is_not(None))
        .order_by(Review.updated_at.desc(), Review.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    reviews = []
    for review, display_name, avatar in rows:
        item = ReviewOut.model_validate(review)
        # Nome de exibição do perfil; sem ele, o nome guardado na review.
        item.author_name = (display_name or "").strip() or review.author_name
        item.author_avatar = avatar
        reviews.append(item)
    return reviews


@router.put("/{game_id}/review", response_model=ReviewOut)
def write_review(
    game_id: int,
    body: ReviewIn,
    db: Session = Depends(get_db),
    user: dict[str, str] = Depends(get_current_user),
):
    _ensure_game_exists(db, game_id)

    # Mesma identidade que a tela de perfil usa: a parte antes do @ do e-mail.
    author_name = user["email"].split("@")[0]

    stmt = insert(Review).values(
        user_id=user["id"],
        game_id=game_id,
        rating=body.rating,
        text=body.text,
        author_name=author_name,
    )
    stmt = stmt.on_conflict_do_update(
        constraint="uq_reviews_user_game",
        set_={
            "rating": body.rating,
            "text": body.text,
            "author_name": author_name,
            "updated_at": func.now(),
        },
    )
    db.execute(stmt)
    db.commit()

    return (
        db.query(Review)
        .filter(Review.game_id == game_id, Review.user_id == user["id"])
        .one()
    )


@router.delete("/{game_id}/review", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    game_id: int,
    db: Session = Depends(get_db),
    user: dict[str, str] = Depends(get_current_user),
):
    # Só apaga a linha do próprio usuário (nota e texto deste jogo).
    review = (
        db.query(Review)
        .filter(Review.game_id == game_id, Review.user_id == user["id"])
        .first()
    )
    if review is None:
        raise HTTPException(status_code=404, detail="Review não encontrada")

    db.delete(review)
    db.commit()