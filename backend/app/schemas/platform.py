from datetime import datetime

from pydantic import BaseModel


class PlatformBase(BaseModel):
    name: str
    description: str | None = None


class PlatformCreate(PlatformBase):
    pass


class PlatformUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class PlatformRead(PlatformBase):
    id: int
    created_at: datetime
    investment_count: int = 0

    model_config = {"from_attributes": True}
