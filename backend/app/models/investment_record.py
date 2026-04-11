from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.investment import Investment


class InvestmentRecord(Base):
    """A point-in-time snapshot of an investment's value in its original currency."""

    __tablename__ = "investment_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    investment_id: Mapped[int] = mapped_column(ForeignKey("investments.id"), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(precision=20, scale=6), nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    note: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    investment: Mapped["Investment"] = relationship(back_populates="records")
