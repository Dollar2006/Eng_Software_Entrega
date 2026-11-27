from collections import defaultdict
from dataclasses import dataclass, field
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.game import Game
from app.models.review import Review

NEUTRAL_RATING = 3  
LIKED_MIN = 4 


@dataclass
class PreferenceProfile:
    """Preferências do usuário, calculadas a partir de gêneros e notas."""

    genre_scores: dict[str, float] = field(default_factory=dict)
    rated_game_ids: set[int] = field(default_factory=set)

    def top_genres(self, n: int = 3) -> list[str]:
        positive = [(g, s) for g, s in self.genre_scores.items() if s > 0]
        positive.sort(key=lambda item: (-item[1], item[0]))
        return [g for g, _ in positive[:n]]

    @classmethod
    def build(cls, db: Session, user_id: UUID) -> "PreferenceProfile":
        # reviews.user_id é String (id do Supabase), não UUID.
        rows = (
            db.query(Review.game_id, Review.rating, Game.genres)
            .join(Game, Game.id == Review.game_id)
            .filter(Review.user_id == str(user_id))
            .all()
        )
        scores: dict[str, float] = defaultdict(float)
        for _, rating, genres in rows:
            for genre in genres or []:
                scores[genre] += rating - NEUTRAL_RATING
        return cls(dict(scores), {game_id for game_id, _, _ in rows})