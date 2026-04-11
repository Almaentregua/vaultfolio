from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.exchange_rate import ExchangeRate
from app.schemas.exchange_rate import ExchangeRateCreate, ExchangeRateFetchRequest, ExchangeRateRead
from app.services.exchange_rate import fetch_and_store_rates

router = APIRouter(prefix="/exchange-rates", tags=["Exchange Rates"])


@router.get("/", response_model=list[ExchangeRateRead])
def list_rates(base: str | None = None, db: Session = Depends(get_db)):
    query = select(ExchangeRate).order_by(desc(ExchangeRate.date), ExchangeRate.target_currency)
    if base:
        query = query.where(ExchangeRate.base_currency == base.upper())
    return db.scalars(query).all()


@router.post("/", response_model=ExchangeRateRead, status_code=201)
def create_rate(data: ExchangeRateCreate, db: Session = Depends(get_db)):
    rate = ExchangeRate(**data.model_dump())
    db.add(rate)
    db.commit()
    db.refresh(rate)
    return rate


@router.post("/fetch")
async def fetch_rates(data: ExchangeRateFetchRequest, db: Session = Depends(get_db)):
    """Pull live rates from open.er-api.com and store them."""
    try:
        count = await fetch_and_store_rates(
            db,
            base_currency=data.base_currency.upper(),
            target_currencies=[c.upper() for c in data.target_currencies] if data.target_currencies else None,
        )
        return {"message": f"Stored {count} exchange rates", "count": count}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch rates: {exc}") from exc
