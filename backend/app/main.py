from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import admin, courts, infra, issues, loyalty, parking, users
from .config import settings
from .db.session import Base, SessionLocal, engine
from .seed.demo import seed_all


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_all(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Smart Žnjan API",
    description="Upravljanje područjem Žnjana — parking, sportski tereni, prijave, loyalty, rasvjeta, navodnjavanje.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(parking.router)
app.include_router(courts.router)
app.include_router(issues.router)
app.include_router(loyalty.router)
app.include_router(infra.router)
app.include_router(admin.router)


@app.get("/")
def root() -> dict:
    return {"name": "Smart Žnjan API", "version": "0.1.0", "docs": "/docs"}


@app.get("/api/v1/health")
def health() -> dict:
    return {"status": "ok", "ai": settings.has_api_key}
