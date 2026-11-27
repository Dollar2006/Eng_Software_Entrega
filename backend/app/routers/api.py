from fastapi import APIRouter
from app.routers import (
    account,
    auth,
    feed,
    follows,
    games,
    lists,
    profile,
    recommendation,
    review_likes,
    user_reviews,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(account.router)
api_router.include_router(user_reviews.router)
api_router.include_router(games.router)
api_router.include_router(review_likes.router)
api_router.include_router(feed.router)
api_router.include_router(follows.router)
api_router.include_router(lists.router)
api_router.include_router(profile.router)
api_router.include_router(recommendation.router)
