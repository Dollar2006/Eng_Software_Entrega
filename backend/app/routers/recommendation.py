from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies import get_current_user_id
from app.schema.game import GameOut
from app.schema.recommendation import RecommendationOut
from app.services.recommendation import RecommendationContext, get_strategy

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("", response_model=list[RecommendationOut])
def get_recommendations(
    strategy: str = "mixed",
    limit: int = Query(8, ge=1, le=24),
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    try:
        context = RecommendationContext(get_strategy(strategy))
    except KeyError:
        raise HTTPException(status_code=400, detail="Estratégia desconhecida")

    return [
        RecommendationOut(
            game=GameOut.model_validate(rec.game),
            reason=rec.reason,
            strategy=rec.strategy,
        )
        for rec in context.recommend(db, user_id, limit)
    ]