from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.game import Game
from app.schema.game import GameOut

router = APIRouter(prefix="/games", tags=["games"])

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