from sqlalchemy import select

from app.database import SessionLocal
from app.models.asset_type import AssetType

DEFAULT_ASSET_TYPES = [
    {
        "name": "Fondos Mutuos",
        "slug": "fondos-mutuos",
        "color": "#6366f1",
        "icon": "trending-up",
        "description": "Fondos de inversión colectiva gestionados por administradoras",
    },
    {
        "name": "Depósitos a Plazo",
        "slug": "depositos-plazo",
        "color": "#10b981",
        "icon": "landmark",
        "description": "Depósitos a plazo fijo en instituciones bancarias",
    },
    {
        "name": "Ahorro en Dólares",
        "slug": "ahorro-dolares",
        "color": "#f59e0b",
        "icon": "dollar-sign",
        "description": "Ahorro denominado en dólares estadounidenses",
    },
    {
        "name": "Criptomonedas",
        "slug": "cripto",
        "color": "#f97316",
        "icon": "bitcoin",
        "description": "Activos digitales y criptomonedas",
    },
    {
        "name": "Acciones",
        "slug": "acciones",
        "color": "#3b82f6",
        "icon": "bar-chart-2",
        "description": "Acciones de empresas en mercados bursátiles",
    },
    {
        "name": "Bienes Raíces",
        "slug": "bienes-raices",
        "color": "#8b5cf6",
        "icon": "home",
        "description": "Inversiones en activos inmobiliarios",
    },
]


def seed_asset_types() -> None:
    db = SessionLocal()
    try:
        for data in DEFAULT_ASSET_TYPES:
            if not db.scalar(select(AssetType).where(AssetType.slug == data["slug"])):
                db.add(AssetType(**data))
        db.commit()
    finally:
        db.close()
