from uuid import UUID

from sqlalchemy.orm import Session

from app.services.recommendation.base import Recommendation, RecommendationStrategy
from app.services.recommendation.profile import PreferenceProfile
from app.services.recommendation.strategies import (
    CompositeStrategy,
    FavoriteGenreStrategy,
    FollowingStrategy,
    SimilarUsersStrategy,
    TopRatedStrategy,
)

_following = FollowingStrategy()
_similar = SimilarUsersStrategy()
_genre = FavoriteGenreStrategy()
_top = TopRatedStrategy()

_STRATEGIES: dict[str, RecommendationStrategy] = {
    s.key: s
    for s in (
        _following,
        _similar,
        _genre,
        _top,
        CompositeStrategy([_following, _similar, _genre, _top]),
    )
}


def get_strategy(key: str) -> RecommendationStrategy:
    """Levanta KeyError se a chave não existir."""
    return _STRATEGIES[key]


class RecommendationContext:

    def __init__(self, strategy: RecommendationStrategy):
        self._strategy = strategy

    def set_strategy(self, strategy: RecommendationStrategy) -> None:
        self._strategy = strategy

    def recommend(self, db: Session, user_id: UUID, limit: int = 8) -> list[Recommendation]:
        profile = PreferenceProfile.build(db, user_id)
        return self._strategy.recommend(db, user_id, profile, limit)