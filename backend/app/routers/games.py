from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.game import Game
from app.schema.game import FiltersOut, GameOut, GameDetailOut

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

@router.get("/{game_id}", response_model=GameDetailOut)
def get_game(game_id: int, db: Session = Depends(get_db)):
    game = db.get(Game, game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Jogo não encontrado")
    return game

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