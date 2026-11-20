from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    KEITARO_URL: str
    KEITARO_API_KEY: str
    DATABASE_URL: str

    class Config:
        env_file = ".env.example"


settings = Settings()
