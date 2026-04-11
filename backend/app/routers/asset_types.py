from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.asset_type import AssetType
from app.models.investment import Investment
from app.schemas.asset_type import AssetTypeCreate, AssetTypeRead, AssetTypeUpdate

router = APIRouter(prefix="/asset-types", tags=["Asset Types"])


def _with_count(at: AssetType, db: Session) -> AssetTypeRead:
    count = db.scalar(
        select(func.count()).where(
            Investment.asset_type_id == at.id,
            Investment.is_active == True,
        )
    )
    return AssetTypeRead.model_validate({**at.__dict__, "investment_count": count or 0})


@router.get("/", response_model=list[AssetTypeRead])
def list_asset_types(db: Session = Depends(get_db)):
    asset_types = db.scalars(select(AssetType)).all()
    return [_with_count(at, db) for at in asset_types]


@router.post("/", response_model=AssetTypeRead, status_code=201)
def create_asset_type(data: AssetTypeCreate, db: Session = Depends(get_db)):
    if db.scalar(select(AssetType).where(AssetType.slug == data.slug)):
        raise HTTPException(status_code=409, detail="An asset type with this slug already exists")
    at = AssetType(**data.model_dump())
    db.add(at)
    db.commit()
    db.refresh(at)
    return AssetTypeRead.model_validate({**at.__dict__, "investment_count": 0})


@router.get("/{at_id}", response_model=AssetTypeRead)
def get_asset_type(at_id: int, db: Session = Depends(get_db)):
    at = db.get(AssetType, at_id)
    if not at:
        raise HTTPException(status_code=404, detail="Asset type not found")
    return _with_count(at, db)


@router.patch("/{at_id}", response_model=AssetTypeRead)
def update_asset_type(at_id: int, data: AssetTypeUpdate, db: Session = Depends(get_db)):
    at = db.get(AssetType, at_id)
    if not at:
        raise HTTPException(status_code=404, detail="Asset type not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(at, field, value)
    db.commit()
    db.refresh(at)
    return _with_count(at, db)


@router.delete("/{at_id}", status_code=204)
def delete_asset_type(at_id: int, db: Session = Depends(get_db)):
    at = db.get(AssetType, at_id)
    if not at:
        raise HTTPException(status_code=404, detail="Asset type not found")
    has_investments = db.scalar(select(func.count()).where(Investment.asset_type_id == at_id))
    if has_investments:
        raise HTTPException(status_code=409, detail="Cannot delete an asset type that has investments")
    db.delete(at)
    db.commit()
