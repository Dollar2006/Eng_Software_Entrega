from fastapi import APIRouter
from app.routers import auth, games, lists, profile, user_reviews

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(user_reviews.router)
api_router.include_router(games.router)
api_router.include_router(lists.router)
api_router.include_router(profile.router)
