from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..db.models import (
    Issue,
    LightZone,
    LoyaltyEvent,
    ParkingLot,
    Reservation,
    User,
)
from ..db.session import get_db
from ..engine.schema import AdminKpis


router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.get("/kpis", response_model=AdminKpis)
def kpis(db: Session = Depends(get_db)) -> AdminKpis:
    total_users = db.execute(select(func.count(User.id))).scalar() or 0
    citizens = db.execute(select(func.count(User.id)).where(User.role == "citizen")).scalar() or 0
    open_issues = db.execute(select(func.count(Issue.id)).where(Issue.status == "open")).scalar() or 0

    today = datetime.utcnow().date()
    start = datetime(today.year, today.month, today.day)
    resolved_today = db.execute(
        select(func.count(Issue.id)).where(Issue.status == "resolved", Issue.updated_at >= start)
    ).scalar() or 0

    capacity = db.execute(select(func.sum(ParkingLot.capacity))).scalar() or 0
    occupied = db.execute(select(func.sum(ParkingLot.occupied))).scalar() or 0
    occupancy_pct = round((occupied / capacity) * 100, 1) if capacity else 0.0

    today_court_reservations = db.execute(
        select(func.count(Reservation.id)).where(Reservation.starts_at >= start)
    ).scalar() or 0

    active_lights = db.execute(select(func.count(LightZone.id)).where(LightZone.is_on.is_(True))).scalar() or 0
    energy = db.execute(
        select(func.sum(LightZone.power_kw)).where(LightZone.is_on.is_(True))
    ).scalar() or 0.0

    total_points = db.execute(select(func.sum(User.points))).scalar() or 0

    return AdminKpis(
        total_users=int(total_users),
        citizens=int(citizens),
        open_issues=int(open_issues),
        resolved_today=int(resolved_today),
        parking_occupancy_pct=float(occupancy_pct),
        today_court_reservations=int(today_court_reservations),
        active_lights=int(active_lights),
        energy_kw=float(round(energy, 2)),
        total_points_circulating=int(total_points),
    )
