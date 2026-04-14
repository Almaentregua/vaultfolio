from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.schemas.asset_type import AssetTypeRead
from app.schemas.platform import PlatformRead


class InvestmentRecordBase(BaseModel):
    amount: Decimal
    recorded_at: datetime
    note: str | None = None


class InvestmentRecordCreate(InvestmentRecordBase):
    pass


class InvestmentRecordRead(InvestmentRecordBase):
    id: int
    investment_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class InvestmentBase(BaseModel):
    name: str
    asset_type_id: int
    platform_id: int | None = None
    currency: str
    notes: str | None = None
    is_active: bool = True


class InvestmentCreate(InvestmentBase):
    initial_amount: Decimal | None = None
    initial_date: datetime | None = None


class InvestmentUpdate(BaseModel):
    name: str | None = None
    asset_type_id: int | None = None
    platform_id: int | None = None
    currency: str | None = None
    notes: str | None = None
    is_active: bool | None = None


class InvestmentRead(InvestmentBase):
    id: int
    created_at: datetime
    updated_at: datetime
    asset_type: AssetTypeRead
    platform: PlatformRead | None = None
    current_amount: Decimal | None = None
    last_recorded_at: datetime | None = None

    model_config = {"from_attributes": True}
