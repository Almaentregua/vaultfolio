from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./vaultfolio.db"
    default_currency: str = "USD"
    exchange_rate_api_url: str = "https://open.er-api.com/v6/latest"

    model_config = {"env_file": ".env"}


settings = Settings()
