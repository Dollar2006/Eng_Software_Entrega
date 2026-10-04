from fastapi import APIRouter
from app.routers import auth, games, lists, profile

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(games.router)
api_router.include_router(lists.router)
api_router.include_router(profile.router)
