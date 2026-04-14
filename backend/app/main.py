from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.models import AssetType, ExchangeRate, Investment, InvestmentRecord, Platform  # noqa: F401
from app.routers import asset_types, exchange_rates, exports, investments, platforms, portfolio
from app.seeds import seed_asset_types, seed_platforms


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_asset_types()
    seed_platforms()
    yield


app = FastAPI(
    title="Vaultfolio API",
    version="0.1.0",
    description="Personal investment portfolio tracker",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(asset_types.router)
app.include_router(platforms.router)
app.include_router(investments.router)
app.include_router(portfolio.router)
app.include_router(exchange_rates.router)
app.include_router(exports.router)


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
