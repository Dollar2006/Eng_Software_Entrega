from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    secret_key: str = "changeme"  # usado pelo JWT do seu colega

    class Config:
        env_file = ".env"


settings = Settings()