from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schema.profile import GAMERTAG_RE, RESERVED_GAMERTAGS


class AuthCredentials(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class RegisterCredentials(AuthCredentials):
    gamertag: str | None = Field(default=None, max_length=30)

    @field_validator("gamertag", mode="before")
    @classmethod
    def strip_gamertag(cls, value: str | None) -> str | None:
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


class UserResponse(BaseModel):
    id: str
    email: EmailStr


class AuthResponse(BaseModel):
    user: UserResponse
    email_confirmation_required: bool = False