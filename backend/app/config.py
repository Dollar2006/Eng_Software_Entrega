from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    secret_key: str = "changeme"  # usado pelo JWT do seu colega
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str | None = None
    frontend_url: str = "http://localhost:5173"
    auth_cookie_secure: bool = False
    auth_cookie_samesite: Literal["lax", "strict", "none"] = "lax"

    @model_validator(mode="after")
    def _validate_auth_cookie(self) -> "Settings":
        if self.auth_cookie_samesite == "none" and not self.auth_cookie_secure:
            raise ValueError(
                "AUTH_COOKIE_SAMESITE=none exige AUTH_COOKIE_SECURE=true: "
                "o navegador rejeita SameSite=None sem HTTPS."
            )
        return self

    class Config:
        env_file = ".env"


settings = Settings()