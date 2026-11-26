from abc import ABC, abstractmethod
from dataclasses import dataclass
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.game import Game
from app.services.recommendation.profile import PreferenceProfile


@dataclass
class Recommendation:
    game: Game
    reason: str 
    strategy: str  


class RecommendationStrategy(ABC):
    """Interface do Strategy: cada subclasse é um jeito de recomendar jogos."""

    key: str
    label: str

    @abstractmethod
    def recommend(
        self,
        db: Session,
        user_id: UUID,
        profile: PreferenceProfile,
        limit: int,
    ) -> list[Recommendation]:
        """Devolve até `limit` jogos que o usuário ainda não avaliou."""