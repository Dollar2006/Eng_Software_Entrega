from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

REVIEW_MIN_LENGTH = 10
REVIEW_MAX_LENGTH = 2000

ReviewText = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        min_length=REVIEW_MIN_LENGTH,
        max_length=REVIEW_MAX_LENGTH,
    ),
]


class GameOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    cover_url: str | None = None
    genres: list[str]
    platforms: list[str]


class FiltersOut(BaseModel):
    genres: list[str]
    platforms: list[str]


class GameDetailOut(GameOut):
    description: str | None = None
    rating_avg: float | None = None
    rating_count: int = 0


class RatingIn(BaseModel):
    rating: int = Field(ge=1, le=5)


class RatingOut(BaseModel):
    rating: int | None
    # Texto da review do usuário (null se ele só deu nota).
    text: str | None = None


class ReviewIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    text: ReviewText


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    author_name: str | None = None
    # Foto do perfil do autor (a mesma do /users/me/profile); null = sem foto.
    author_avatar: str | None = None
    rating: int
    text: str
    created_at: datetime
    updated_at: datetime


class MyReviewOut(BaseModel):
    """Review do usuário logado, com o jogo junto (aba Reviews do perfil)."""

    game: GameOut
    rating: int
    text: str
    created_at: datetime
    updated_at: datetime