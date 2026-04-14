from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.investment import Investment
from app.models.platform import Platform
from app.schemas.platform import PlatformCreate, PlatformRead, PlatformUpdate

router = APIRouter(prefix="/platforms", tags=["Plataformas"])


def _with_count(p: Platform, db: Session) -> PlatformRead:
    count = db.scalar(
        select(func.count()).where(
            Investment.platform_id == p.id,
            Investment.is_active == True,
        )
    )
    return PlatformRead.model_validate({**p.__dict__, "investment_count": count or 0})


@router.get("/", response_model=list[PlatformRead])
def list_platforms(db: Session = Depends(get_db)):
    platforms = db.scalars(select(Platform).order_by(Platform.name)).all()
    return [_with_count(p, db) for p in platforms]


@router.post("/", response_model=PlatformRead, status_code=201)
def create_platform(data: PlatformCreate, db: Session = Depends(get_db)):
    if db.scalar(select(Platform).where(Platform.name == data.name)):
        raise HTTPException(status_code=409, detail="Ya existe una plataforma con ese nombre")
    p = Platform(**data.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return PlatformRead.model_validate({**p.__dict__, "investment_count": 0})


@router.get("/{platform_id}", response_model=PlatformRead)
def get_platform(platform_id: int, db: Session = Depends(get_db)):
    p = db.get(Platform, platform_id)
    if not p:
        raise HTTPException(status_code=404, detail="Plataforma no encontrada")
    return _with_count(p, db)


@router.patch("/{platform_id}", response_model=PlatformRead)
def update_platform(platform_id: int, data: PlatformUpdate, db: Session = Depends(get_db)):
    p = db.get(Platform, platform_id)
    if not p:
        raise HTTPException(status_code=404, detail="Plataforma no encontrada")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(p, field, value)
    db.commit()
    db.refresh(p)
    return _with_count(p, db)


@router.delete("/{platform_id}", status_code=204)
def delete_platform(platform_id: int, db: Session = Depends(get_db)):
    p = db.get(Platform, platform_id)
    if not p:
        raise HTTPException(status_code=404, detail="Plataforma no encontrada")
    has_investments = db.scalar(
        select(func.count()).where(Investment.platform_id == platform_id)
    )
    if has_investments:
        raise HTTPException(
            status_code=409,
            detail="No se puede eliminar una plataforma con inversiones asociadas",
        )
    db.delete(p)
    db.commit()
