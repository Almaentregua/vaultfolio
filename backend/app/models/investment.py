from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.asset_type import AssetType
    from app.models.investment_record import InvestmentRecord
    from app.models.platform import Platform


class Investment(Base):
    __tablename__ = "investments"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    asset_type_id: Mapped[int] = mapped_column(ForeignKey("asset_types.id"), nullable=False)
    platform_id: Mapped[int | None] = mapped_column(ForeignKey("platforms.id"), nullable=True)
    currency: Mapped[str] = mapped_column(String(10), nullable=False)
    notes: Mapped[str | None] = mapped_column(String(1000))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    asset_type: Mapped["AssetType"] = relationship(back_populates="investments")
    platform: Mapped["Platform | None"] = relationship(back_populates="investments")
    records: Mapped[list["InvestmentRecord"]] = relationship(
        back_populates="investment",
        order_by="InvestmentRecord.recorded_at",
        cascade="all, delete-orphan",
    )
