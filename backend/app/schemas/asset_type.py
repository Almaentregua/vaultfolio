from datetime import datetime

from pydantic import BaseModel, field_validator


class AssetTypeBase(BaseModel):
    name: str
    slug: str
    description: str | None = None
    color: str = "#6366f1"
    icon: str = "wallet"


class AssetTypeCreate(AssetTypeBase):
    @field_validator("slug")
    @classmethod
    def slug_lowercase(cls, v: str) -> str:
        return v.lower().strip()


class AssetTypeUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    color: str | None = None
    icon: str | None = None


class AssetTypeRead(AssetTypeBase):
    id: int
    created_at: datetime
    investment_count: int = 0

    model_config = {"from_attributes": True}
