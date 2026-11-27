from fastapi import APIRouter
from app.routers import auth, games, lists, notifications, profile, reviews, user_reviews, account, follows, users, feed, recommendation

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(account.router)
api_router.include_router(user_reviews.router)
api_router.include_router(reviews.router)
api_router.include_router(games.router)
api_router.include_router(feed.router)
api_router.include_router(follows.router)
api_router.include_router(notifications.router)
api_router.include_router(lists.router)
api_router.include_router(lists.public_router)
api_router.include_router(profile.router)
api_router.include_router(users.router)
api_router.include_router(recommendation.router)
