from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.investment import Investment
from app.models.investment_record import InvestmentRecord
from app.schemas.investment import (
    InvestmentCreate,
    InvestmentRead,
    InvestmentRecordCreate,
    InvestmentRecordRead,
    InvestmentUpdate,
)

router = APIRouter(prefix="/investments", tags=["Investments"])


def _enrich(inv: Investment, db: Session) -> InvestmentRead:
    latest = db.scalar(
        select(InvestmentRecord)
        .where(InvestmentRecord.investment_id == inv.id)
        .order_by(desc(InvestmentRecord.recorded_at))
        .limit(1)
    )
    data = InvestmentRead.model_validate(inv)
    data.current_amount = latest.amount if latest else None
    data.last_recorded_at = latest.recorded_at if latest else None
    return data


@router.get("/", response_model=list[InvestmentRead])
def list_investments(active_only: bool = True, db: Session = Depends(get_db)):
    query = select(Investment)
    if active_only:
        query = query.where(Investment.is_active == True)
    return [_enrich(inv, db) for inv in db.scalars(query).all()]


@router.post("/", response_model=InvestmentRead, status_code=201)
def create_investment(data: InvestmentCreate, db: Session = Depends(get_db)):
    inv = Investment(**data.model_dump(exclude={"initial_amount", "initial_date"}))
    db.add(inv)
    db.flush()

    if data.initial_amount is not None:
        db.add(
            InvestmentRecord(
                investment_id=inv.id,
                amount=data.initial_amount,
                recorded_at=data.initial_date or datetime.utcnow(),
            )
        )

    db.commit()
    db.refresh(inv)
    return _enrich(inv, db)


@router.get("/{inv_id}", response_model=InvestmentRead)
def get_investment(inv_id: int, db: Session = Depends(get_db)):
    inv = db.get(Investment, inv_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investment not found")
    return _enrich(inv, db)


@router.patch("/{inv_id}", response_model=InvestmentRead)
def update_investment(inv_id: int, data: InvestmentUpdate, db: Session = Depends(get_db)):
    inv = db.get(Investment, inv_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investment not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(inv, field, value)
    db.commit()
    db.refresh(inv)
    return _enrich(inv, db)


@router.delete("/{inv_id}", status_code=204)
def delete_investment(inv_id: int, db: Session = Depends(get_db)):
    inv = db.get(Investment, inv_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investment not found")
    db.delete(inv)
    db.commit()


@router.get("/{inv_id}/records", response_model=list[InvestmentRecordRead])
def list_records(inv_id: int, db: Session = Depends(get_db)):
    if not db.get(Investment, inv_id):
        raise HTTPException(status_code=404, detail="Investment not found")
    return db.scalars(
        select(InvestmentRecord)
        .where(InvestmentRecord.investment_id == inv_id)
        .order_by(desc(InvestmentRecord.recorded_at))
    ).all()


@router.post("/{inv_id}/records", response_model=InvestmentRecordRead, status_code=201)
def add_record(inv_id: int, data: InvestmentRecordCreate, db: Session = Depends(get_db)):
    if not db.get(Investment, inv_id):
        raise HTTPException(status_code=404, detail="Investment not found")
    record = InvestmentRecord(investment_id=inv_id, **data.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{inv_id}/records/{record_id}", status_code=204)
def delete_record(inv_id: int, record_id: int, db: Session = Depends(get_db)):
    record = db.scalar(
        select(InvestmentRecord).where(
            InvestmentRecord.id == record_id,
            InvestmentRecord.investment_id == inv_id,
        )
    )
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(record)
    db.commit()
