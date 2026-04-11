from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class ExchangeRateBase(BaseModel):
    base_currency: str
    target_currency: str
    rate: Decimal
    date: date


class ExchangeRateCreate(ExchangeRateBase):
    pass


class ExchangeRateRead(ExchangeRateBase):
    id: int

    model_config = {"from_attributes": True}


class ExchangeRateFetchRequest(BaseModel):
    base_currency: str = "USD"
    target_currencies: list[str] | None = None
