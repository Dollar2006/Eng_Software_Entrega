from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    secret_key: str = "changeme"  # usado pelo JWT do seu colega
    supabase_url: str
    supabase_anon_key: str
    frontend_url: str = "http://localhost:5173"
    auth_cookie_secure: bool = False
    auth_cookie_samesite: str = "lax"

    class Config:
        env_file = ".env"


settings = Settings()