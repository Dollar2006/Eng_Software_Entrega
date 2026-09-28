from pydantic import BaseModel, ConfigDict

class GameOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    cover_url: str | None = None
    genres: list[str]
    platforms: list[str]