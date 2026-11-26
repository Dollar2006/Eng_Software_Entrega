import re

from pydantic import BaseModel, ConfigDict, Field, field_validator

GAMERTAG_RE = re.compile(r"^[a-zA-Z0-9_.]{3,30}$")
RESERVED_GAMERTAGS = {"me"}


class ProfileUpdate(BaseModel):
    gamertag: str | None = Field(default=None, max_length=30)
    display_name: str = Field(max_length=50)
    bio: str = Field(max_length=280)
    avatar: str | None = None

    @field_validator("gamertag", "display_name", "bio", mode="before")
    @classmethod
    def strip_whitespace(cls, value: str | None) -> str | None:
        # Espelha o .trim() do front: corta antes de contar caracteres.
        return value.strip() if isinstance(value, str) else value

    @field_validator("gamertag")
    @classmethod
    def validate_gamertag(cls, value: str | None) -> str | None:
        if value is None or value == "":
            return None
        if value.lower() in RESERVED_GAMERTAGS:
            raise ValueError("Essa gamertag não está disponível.")
        if not GAMERTAG_RE.fullmatch(value):
            raise ValueError(
                "A gamertag deve ter 3-30 caracteres: letras, números, _ ou ."
            )
        return value

    @field_validator("display_name")
    @classmethod
    def check_display_name(cls, value: str) -> str:
        # Vazio e valido: sem nome, o perfil mostra a parte antes do @ do e-mail.
        if len(value) == 1:
            raise ValueError("O nome precisa ter pelo menos 2 caracteres.")
        return value


class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    gamertag: str | None = None
    display_name: str | None = None
    bio: str | None = None
    avatar: str | None = None


class PublicProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    gamertag: str
    display_name: str | None = None
    bio: str | None = None
    avatar: str | None = None