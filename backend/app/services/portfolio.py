from datetime import date, datetime, timedelta
from decimal import Decimal

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.investment import Investment
from app.models.investment_record import InvestmentRecord
from app.schemas.portfolio import (
    AssetTypeBreakdown,
    CurrencyBreakdown,
    InvestmentSummary,
    PortfolioHistory,
    PortfolioHistoryPoint,
    PortfolioSummary,
)
from app.services.exchange_rate import get_rate


def _latest_record(db: Session, investment_id: int, before: datetime | None = None) -> InvestmentRecord | None:
    query = (
        select(InvestmentRecord)
        .where(InvestmentRecord.investment_id == investment_id)
        .order_by(desc(InvestmentRecord.recorded_at))
        .limit(1)
    )
    if before:
        query = query.where(InvestmentRecord.recorded_at <= before)
    return db.scalar(query)


def get_portfolio_summary(db: Session, target_currency: str) -> PortfolioSummary:
    investments = db.scalars(select(Investment).where(Investment.is_active == True)).all()

    investment_summaries: list[InvestmentSummary] = []
    total = Decimal("0")
    by_asset_type: dict[int, dict] = {}
    by_currency: dict[str, dict] = {}

    for inv in investments:
        record = _latest_record(db, inv.id)
        if not record:
            continue

        current_amount = record.amount
        rate = get_rate(db, inv.currency, target_currency)
        converted = current_amount * rate if rate is not None else Decimal("0")
        total += converted

        at_id = inv.asset_type_id
        if at_id not in by_asset_type:
            by_asset_type[at_id] = {
                "asset_type_id": at_id,
                "asset_type_name": inv.asset_type.name,
                "asset_type_color": inv.asset_type.color,
                "total_converted": Decimal("0"),
                "investment_count": 0,
            }
        by_asset_type[at_id]["total_converted"] += converted
        by_asset_type[at_id]["investment_count"] += 1

        if inv.currency not in by_currency:
            by_currency[inv.currency] = {
                "currency": inv.currency,
                "total_original": Decimal("0"),
                "total_converted": Decimal("0"),
            }
        by_currency[inv.currency]["total_original"] += current_amount
        by_currency[inv.currency]["total_converted"] += converted

        investment_summaries.append(
            InvestmentSummary(
                id=inv.id,
                name=inv.name,
                asset_type_name=inv.asset_type.name,
                asset_type_color=inv.asset_type.color,
                platform=inv.platform,
                currency=inv.currency,
                current_amount=current_amount,
                current_amount_converted=converted,
                target_currency=target_currency,
            )
        )

    def pct(value: Decimal) -> float:
        return float(value / total * 100) if total > 0 else 0.0

    at_breakdown = sorted(
        [AssetTypeBreakdown(**v, percentage=pct(v["total_converted"])) for v in by_asset_type.values()],
        key=lambda x: x.total_converted,
        reverse=True,
    )
    cur_breakdown = sorted(
        [CurrencyBreakdown(**v, percentage=pct(v["total_converted"])) for v in by_currency.values()],
        key=lambda x: x.total_converted,
        reverse=True,
    )

    return PortfolioSummary(
        target_currency=target_currency,
        total_net_worth=total,
        by_asset_type=at_breakdown,
        by_currency=cur_breakdown,
        investments=sorted(investment_summaries, key=lambda x: x.current_amount_converted, reverse=True),
    )


def get_portfolio_history(db: Session, target_currency: str, days: int = 90) -> PortfolioHistory:
    investments = db.scalars(select(Investment).where(Investment.is_active == True)).all()
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    points: list[PortfolioHistoryPoint] = []
    current = start_date

    while current <= end_date:
        cutoff = datetime.combine(current, datetime.max.time())
        daily_total = Decimal("0")

        for inv in investments:
            record = _latest_record(db, inv.id, before=cutoff)
            if record:
                rate = get_rate(db, inv.currency, target_currency, current)
                if rate:
                    daily_total += record.amount * rate

        points.append(
            PortfolioHistoryPoint(
                date=current.isoformat(),
                total_converted=daily_total,
                target_currency=target_currency,
            )
        )
        current += timedelta(days=1)

    return PortfolioHistory(target_currency=target_currency, history=points)
