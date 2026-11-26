from pydantic import BaseModel

from app.schema.game import GameOut


class RecommendationOut(BaseModel):
    game: GameOut
    reason: str
    strategy: str