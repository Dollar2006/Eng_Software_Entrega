from fastapi import APIRouter
from app.routers import games

api_router = APIRouter()
api_router.include_router(games.router)