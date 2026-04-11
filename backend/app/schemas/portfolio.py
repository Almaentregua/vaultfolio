from decimal import Decimal

from pydantic import BaseModel


class InvestmentSummary(BaseModel):
    id: int
    name: str
    asset_type_name: str
    asset_type_color: str
    platform: str | None
    currency: str
    current_amount: Decimal
    current_amount_converted: Decimal
    target_currency: str


class AssetTypeBreakdown(BaseModel):
    asset_type_id: int
    asset_type_name: str
    asset_type_color: str
    total_converted: Decimal
    percentage: float
    investment_count: int


class CurrencyBreakdown(BaseModel):
    currency: str
    total_original: Decimal
    total_converted: Decimal
    percentage: float


class PortfolioSummary(BaseModel):
    target_currency: str
    total_net_worth: Decimal
    by_asset_type: list[AssetTypeBreakdown]
    by_currency: list[CurrencyBreakdown]
    investments: list[InvestmentSummary]


class PortfolioHistoryPoint(BaseModel):
    date: str
    total_converted: Decimal
    target_currency: str


class PortfolioHistory(BaseModel):
    target_currency: str
    history: list[PortfolioHistoryPoint]
