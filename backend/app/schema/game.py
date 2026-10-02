from pydantic import BaseModel, ConfigDict, Field

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