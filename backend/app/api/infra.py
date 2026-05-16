from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db.models import IrrigationZone, LightZone
from ..db.session import get_db
from ..engine.schema import (
    IrrigationZoneOut,
    IrrigationZoneUpdate,
    LightZoneOut,
    LightZoneUpdate,
)


router = APIRouter(prefix="/api/v1/infra", tags=["infra"])


# ── Lighting ────────────────────────────────────────────────────────────────

@router.get("/lights", response_model=list[LightZoneOut])
def list_lights(db: Session = Depends(get_db)) -> list[LightZone]:
    return list(db.execute(select(LightZone).order_by(LightZone.name)).scalars())


@router.put("/lights/{zone_id}", response_model=LightZoneOut)
def update_light(zone_id: str, body: LightZoneUpdate, db: Session = Depends(get_db)) -> LightZone:
    z = db.get(LightZone, zone_id)
    if not z:
        raise HTTPException(404, "Light zone not found")
    if body.is_on is not None:
        z.is_on = body.is_on
    if body.brightness is not None:
        z.brightness = body.brightness
    if body.mode is not None:
        z.mode = body.mode
    z.last_changed = datetime.utcnow()
    db.commit()
    db.refresh(z)
    return z


# ── Irrigation ──────────────────────────────────────────────────────────────

@router.get("/irrigation", response_model=list[IrrigationZoneOut])
def list_irrigation(db: Session = Depends(get_db)) -> list[IrrigationZone]:
    return list(db.execute(select(IrrigationZone).order_by(IrrigationZone.name)).scalars())


@router.put("/irrigation/{zone_id}", response_model=IrrigationZoneOut)
def update_irrigation(zone_id: str, body: IrrigationZoneUpdate, db: Session = Depends(get_db)) -> IrrigationZone:
    z = db.get(IrrigationZone, zone_id)
    if not z:
        raise HTTPException(404, "Irrigation zone not found")
    if body.is_on is not None:
        z.is_on = body.is_on
        if body.is_on:
            # turning on slightly raises moisture for demo realism
            z.soil_moisture = min(100, z.soil_moisture + 10)
    if body.schedule is not None:
        z.schedule = body.schedule
    z.last_changed = datetime.utcnow()
    db.commit()
    db.refresh(z)
    return z
