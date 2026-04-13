"""
Endpoints de exportación de datos en formato CSV.

Todos los archivos se generan con codificación UTF-8 + BOM para compatibilidad
con Microsoft Excel en Windows (que requiere el BOM para interpretar correctamente
caracteres con tilde y ñ).
"""

import csv
import io
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.exchange_rate import ExchangeRate
from app.models.investment import Investment
from app.models.investment_record import InvestmentRecord
from app.services.portfolio import get_portfolio_summary

router = APIRouter(prefix="/exports", tags=["Exportaciones"])

_TIMESTAMP = lambda: datetime.now().strftime("%Y%m%d")  # noqa: E731


def _csv_response(rows: list[dict], filename: str) -> StreamingResponse:
    """Construye una StreamingResponse con contenido CSV.

    Usa UTF-8 con BOM (utf-8-sig) para que Excel en Windows reconozca
    automáticamente la codificación sin necesidad de pasos extra.
    Si no hay filas, retorna un archivo vacío con solo los encabezados
    (o vacío si rows es una lista vacía sin estructura).
    """
    output = io.StringIO()
    if rows:
        writer = csv.DictWriter(output, fieldnames=rows[0].keys(), lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)

    # utf-8-sig agrega el BOM automáticamente al inicio
    content_bytes = output.getvalue().encode("utf-8-sig")

    return StreamingResponse(
        iter([content_bytes]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Type": "text/csv; charset=utf-8",
        },
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.get(
    "/investments.csv",
    summary="Exportar inversiones",
    description="Descarga todas las inversiones (activas e inactivas) con su valor actual.",
)
def export_investments(db: Session = Depends(get_db)) -> StreamingResponse:
    investments = db.scalars(select(Investment)).all()

    rows = []
    for inv in investments:
        latest = db.scalar(
            select(InvestmentRecord)
            .where(InvestmentRecord.investment_id == inv.id)
            .order_by(desc(InvestmentRecord.recorded_at))
            .limit(1)
        )
        rows.append(
            {
                "id": inv.id,
                "nombre": inv.name,
                "tipo_activo": inv.asset_type.name,
                "plataforma": inv.platform or "",
                "moneda": inv.currency,
                "monto_actual": str(latest.amount) if latest else "",
                "ultima_actualizacion": latest.recorded_at.isoformat() if latest else "",
                "estado": "activa" if inv.is_active else "inactiva",
                "notas": inv.notes or "",
                "fecha_creacion": inv.created_at.isoformat(),
            }
        )

    return _csv_response(rows, f"inversiones_{_TIMESTAMP()}.csv")


@router.get(
    "/records.csv",
    summary="Exportar historial de valores",
    description=(
        "Descarga el historial completo de registros de valor. "
        "Se puede filtrar por inversión con el parámetro `investment_id`."
    ),
)
def export_records(
    investment_id: int | None = Query(
        default=None, description="ID de inversión para filtrar (opcional)"
    ),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    query = select(InvestmentRecord).order_by(
        InvestmentRecord.investment_id,
        desc(InvestmentRecord.recorded_at),
    )
    if investment_id is not None:
        query = query.where(InvestmentRecord.investment_id == investment_id)

    records = db.scalars(query).all()

    rows = [
        {
            "id": rec.id,
            "inversion_id": rec.investment_id,
            "nombre_inversion": rec.investment.name,
            "moneda": rec.investment.currency,
            "monto": str(rec.amount),
            "fecha_registro": rec.recorded_at.isoformat(),
            "nota": rec.note or "",
        }
        for rec in records
    ]

    suffix = f"_{investment_id}" if investment_id is not None else ""
    return _csv_response(rows, f"registros{suffix}_{_TIMESTAMP()}.csv")


@router.get(
    "/portfolio.csv",
    summary="Exportar resumen del portfolio",
    description=(
        "Descarga el resumen del portfolio convertido a la moneda indicada, "
        "equivalente a lo que muestra el Dashboard."
    ),
)
def export_portfolio(
    currency: str = Query(default="USD", description="Moneda destino para la conversión"),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    currency = currency.upper()
    summary = get_portfolio_summary(db, currency)

    rows = []
    for inv in summary.investments:
        pct = (
            float(inv.current_amount_converted) / float(summary.total_net_worth) * 100
            if summary.total_net_worth
            else 0.0
        )
        rows.append(
            {
                "nombre": inv.name,
                "tipo_activo": inv.asset_type_name,
                "plataforma": inv.platform or "",
                "moneda_original": inv.currency,
                "monto_original": str(inv.current_amount),
                "monto_convertido": str(inv.current_amount_converted),
                "moneda_destino": currency,
                "porcentaje": f"{pct:.2f}",
            }
        )

    return _csv_response(rows, f"portfolio_{currency}_{_TIMESTAMP()}.csv")


@router.get(
    "/exchange-rates.csv",
    summary="Exportar tipos de cambio",
    description="Descarga los tipos de cambio almacenados. Se puede filtrar por moneda base.",
)
def export_exchange_rates(
    base: str | None = Query(default=None, description="Filtrar por moneda base (ej: USD)"),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    query = select(ExchangeRate).order_by(
        desc(ExchangeRate.date),
        ExchangeRate.base_currency,
        ExchangeRate.target_currency,
    )
    if base is not None:
        query = query.where(ExchangeRate.base_currency == base.upper())

    rates = db.scalars(query).all()

    rows = [
        {
            "moneda_base": r.base_currency,
            "moneda_destino": r.target_currency,
            "tasa": str(r.rate),
            "fecha": r.date.isoformat(),
        }
        for r in rates
    ]

    suffix = f"_{base.upper()}" if base else ""
    return _csv_response(rows, f"tipos_de_cambio{suffix}_{_TIMESTAMP()}.csv")
