from collections import defaultdict
from uuid import UUID

from sqlalchemy import String, cast, func, select
from sqlalchemy.orm import Session, aliased

from app.models.follow import Follow
from app.models.game import Game
from app.models.review import Review
from app.services.recommendation.base import Recommendation, RecommendationStrategy
from app.services.recommendation.profile import LIKED_MIN, PreferenceProfile

MIN_RATINGS = 1  
MIN_SHARED = 2  
MAX_NEIGHBORS = 50


def _not_rated(query, rated_ids: set[int], column=Game.id):
    return query.filter(~column.in_(list(rated_ids))) if rated_ids else query


def _rating_stats():
    return (
        select(
            Review.game_id.label("game_id"),
            func.avg(Review.rating).label("avg"),
            func.count(Review.id).label("n"),
        )
        .group_by(Review.game_id)
        .subquery()
    )


class FavoriteGenreStrategy(RecommendationStrategy):
    key = "favorite_genre"
    label = "Seus gêneros favoritos"

    def recommend(self, db: Session, user_id: UUID, profile: PreferenceProfile, limit: int):
        top = profile.top_genres()
        if not top:
            return []

        stats = _rating_stats()
        query = (
            db.query(Game)
            .outerjoin(stats, stats.c.game_id == Game.id)
            .filter(Game.genres.overlap(top))
        )
        games = (
            _not_rated(query, profile.rated_game_ids)
            .order_by(
                stats.c.avg.desc().nullslast(),
                stats.c.n.desc().nullslast(),
                Game.name,
            )
            .limit(limit)
            .all()
        )
        return [
            Recommendation(
                game,
                f"Porque você gosta de {next(g for g in top if g in game.genres)}",
                self.key,
            )
            for game in games
        ]


class TopRatedStrategy(RecommendationStrategy):
    """Ranking geral da comunidade. Serve de fallback para quem não tem histórico."""

    key = "top_rated"
    label = "Mais bem avaliados"

    def recommend(self, db: Session, user_id: UUID, profile: PreferenceProfile, limit: int):
        stats = _rating_stats()
        query = (
            db.query(Game, stats.c.avg)
            .join(stats, stats.c.game_id == Game.id)
            .filter(stats.c.n >= MIN_RATINGS)
        )
        rows = (
            _not_rated(query, profile.rated_game_ids)
            .order_by(stats.c.avg.desc(), stats.c.n.desc(), Game.name)
            .limit(limit)
            .all()
        )
        return [
            Recommendation(
                game,
                f"Bem avaliado pela comunidade ({float(avg):.1f} de 5)",
                self.key,
            )
            for game, avg in rows
        ]


class FollowingStrategy(RecommendationStrategy):
    key = "following"
    label = "Quem você segue"

    def recommend(self, db: Session, user_id: UUID, profile: PreferenceProfile, limit: int):
        fans = func.count(Review.id)
        query = (
            db.query(Game, fans.label("fans"))
            .join(Review, Review.game_id == Game.id)
            .join(Follow, cast(Follow.followed_id, String) == Review.user_id)
            .filter(Follow.follower_id == user_id, Review.rating >= LIKED_MIN)
        )
        rows = (
            _not_rated(query, profile.rated_game_ids)
            .group_by(Game.id)
            .order_by(fans.desc(), func.avg(Review.rating).desc(), Game.name)
            .limit(limit)
            .all()
        )
        return [
            Recommendation(
                game,
                "1 pessoa que você segue gostou"
                if n == 1
                else f"{n} pessoas que você segue gostaram",
                self.key,
            )
            for game, n in rows
        ]


class SimilarUsersStrategy(RecommendationStrategy):

    key = "similar_users"
    label = "Gosto parecido com o seu"

    def recommend(self, db: Session, user_id: UUID, profile: PreferenceProfile, limit: int):
        me = str(user_id)
        mine, other = aliased(Review), aliased(Review)

        shared = func.count()
        neighbors = (
            db.query(other.user_id, shared.label("shared"))
            .select_from(other)
            .join(mine, mine.game_id == other.game_id)
            .filter(
                mine.user_id == me,
                other.user_id != me,
                func.abs(mine.rating - other.rating) <= 1,
            )
            .group_by(other.user_id)
            .having(shared >= MIN_SHARED)
            .order_by(shared.desc())
            .limit(MAX_NEIGHBORS)
            .all()
        )
        if not neighbors:
            return []
        weights = {uid: n for uid, n in neighbors}

        query = db.query(Review.game_id, Review.user_id).filter(
            Review.user_id.in_(list(weights)), Review.rating >= LIKED_MIN
        )
        scores: dict[int, int] = defaultdict(int)
        for game_id, uid in _not_rated(query, profile.rated_game_ids, Review.game_id):
            scores[game_id] += weights[uid]

        top_ids = [
            gid for gid, _ in sorted(scores.items(), key=lambda kv: (-kv[1], kv[0]))[:limit]
        ]
        if not top_ids:
            return []
        games = {g.id: g for g in db.query(Game).filter(Game.id.in_(top_ids)).all()}
        return [
            Recommendation(games[gid], "Quem tem gosto parecido com o seu curtiu", self.key)
            for gid in top_ids
            if gid in games
        ]


class CompositeStrategy(RecommendationStrategy):
    """Tenta as estratégias em ordem de prioridade e completa a lista sem repetir jogos."""

    key = "mixed"
    label = "Para você"

    def __init__(self, strategies: list[RecommendationStrategy]):
        self._strategies = strategies

    def recommend(self, db: Session, user_id: UUID, profile: PreferenceProfile, limit: int):
        result: list[Recommendation] = []
        seen = set(profile.rated_game_ids)
        for strategy in self._strategies:
            if len(result) >= limit:
                break
            for rec in strategy.recommend(db, user_id, profile, limit):
                if rec.game.id in seen:
                    continue
                seen.add(rec.game.id)
                result.append(rec)
                if len(result) >= limit:
                    break
        return result