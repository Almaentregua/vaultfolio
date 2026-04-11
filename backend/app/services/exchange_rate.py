from datetime import date
from decimal import Decimal

import httpx
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.config import settings
from app.models.exchange_rate import ExchangeRate


def get_rate(
    db: Session,
    from_currency: str,
    to_currency: str,
    on_date: date | None = None,
) -> Decimal | None:
    """Return the most recent exchange rate on or before on_date.

    Resolution order:
    1. Direct pair (from → to)
    2. Inverse pair (to → from, inverted)
    3. Via USD as a bridge currency
    """
    if from_currency == to_currency:
        return Decimal("1")

    target_date = on_date or date.today()

    def _lookup(base: str, target: str) -> Decimal | None:
        return db.scalar(
            select(ExchangeRate.rate)
            .where(
                ExchangeRate.base_currency == base,
                ExchangeRate.target_currency == target,
                ExchangeRate.date <= target_date,
            )
            .order_by(desc(ExchangeRate.date))
            .limit(1)
        )

    if rate := _lookup(from_currency, to_currency):
        return rate

    if inverse := _lookup(to_currency, from_currency):
        return Decimal("1") / inverse

    # Bridge via USD
    if from_currency != "USD" and to_currency != "USD":
        from_usd = get_rate(db, from_currency, "USD", on_date)
        usd_to = get_rate(db, "USD", to_currency, on_date)
        if from_usd and usd_to:
            return from_usd * usd_to

    return None


async def fetch_and_store_rates(
    db: Session,
    base_currency: str = "USD",
    target_currencies: list[str] | None = None,
) -> int:
    """Fetch live rates from open.er-api.com and upsert them into the database."""
    url = f"{settings.exchange_rate_api_url}/{base_currency}"
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=10.0)
        response.raise_for_status()
        data = response.json()

    rates_data: dict[str, float] = data.get("rates", {})
    today = date.today()
    stored = 0

    for target, rate_value in rates_data.items():
        if target_currencies and target not in target_currencies:
            continue

        existing = db.scalar(
            select(ExchangeRate).where(
                ExchangeRate.base_currency == base_currency,
                ExchangeRate.target_currency == target,
                ExchangeRate.date == today,
            )
        )
        if existing:
            existing.rate = Decimal(str(rate_value))
        else:
            db.add(
                ExchangeRate(
                    base_currency=base_currency,
                    target_currency=target,
                    rate=Decimal(str(rate_value)),
                    date=today,
                )
            )
        stored += 1

    db.commit()
    return stored
