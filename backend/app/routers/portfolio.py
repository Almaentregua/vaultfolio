from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.portfolio import PortfolioHistory, PortfolioSummary
from app.services.portfolio import get_portfolio_history, get_portfolio_summary

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])


@router.get("/summary", response_model=PortfolioSummary)
def portfolio_summary(
    currency: str = Query(default="USD", description="Target currency for conversion"),
    db: Session = Depends(get_db),
):
    return get_portfolio_summary(db, currency.upper())


@router.get("/history", response_model=PortfolioHistory)
def portfolio_history(
    currency: str = Query(default="USD"),
    days: int = Query(default=90, ge=7, le=365),
    db: Session = Depends(get_db),
):
    return get_portfolio_history(db, currency.upper(), days)
