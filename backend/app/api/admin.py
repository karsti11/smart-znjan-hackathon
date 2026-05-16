from __future__ import annotations

from collections import Counter, defaultdict
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
from ..engine.schema import (
    AdminKpis,
    AdminStats,
    CategoryCount,
    CategoryDistribution,
    LocationStat,
    ParkingHeatmap,
    TopLocations,
)


SEVERITY_PRIORITY = {"low": 25, "medium": 50, "high": 75, "critical": 95}


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


@router.get("/stats", response_model=AdminStats)
def stats(days: int = 14, db: Session = Depends(get_db)) -> AdminStats:
    """Analytics for the admin /statistika dashboard."""
    since = datetime.utcnow() - timedelta(days=days)

    # ── Parking heatmap (7 dow × 24 hour grid)
    parking_events = list(db.execute(
        select(LoyaltyEvent.created_at).where(
            LoyaltyEvent.kind == "parking",
            LoyaltyEvent.created_at >= since,
        )
    ).scalars())

    grid = [[0 for _ in range(24)] for _ in range(7)]
    for ts in parking_events:
        grid[ts.weekday()][ts.hour] += 1

    by_hour = [sum(grid[d][h] for d in range(7)) for h in range(24)]
    by_dow = [sum(grid[d]) for d in range(7)]
    busiest_hour = max(range(24), key=lambda h: by_hour[h]) if by_hour else 0
    busiest_dow = max(range(7), key=lambda d: by_dow[d]) if by_dow else 0
    max_cell = max((c for row in grid for c in row), default=0)

    heatmap = ParkingHeatmap(
        grid=grid,
        by_hour=by_hour,
        by_dow=by_dow,
        busiest_hour=busiest_hour,
        busiest_dow=busiest_dow,
        max_cell=max_cell,
        total_events=len(parking_events),
    )

    # ── Category distribution
    cat_rows = db.execute(
        select(Issue.category, func.count(Issue.id))
        .where(Issue.created_at >= since)
        .group_by(Issue.category)
        .order_by(func.count(Issue.id).desc())
    ).all()
    total_cat = sum(c for _, c in cat_rows)
    cat_items = [
        CategoryCount(category=cat, count=int(c), pct=round(100 * c / total_cat, 1) if total_cat else 0.0)
        for cat, c in cat_rows
    ]
    categories = CategoryDistribution(total=int(total_cat), items=cat_items)

    # ── Top problematic locations (grouped by location_hint)
    issues = list(db.execute(
        select(Issue).where(Issue.created_at >= since, Issue.location_hint != "")
    ).scalars())

    bucket: dict[str, list[Issue]] = defaultdict(list)
    for it in issues:
        bucket[it.location_hint].append(it)

    stats_items: list[LocationStat] = []
    for loc, items in bucket.items():
        sev_counts: Counter[str] = Counter(it.severity for it in items)
        breakdown = {s: int(sev_counts.get(s, 0)) for s in ("low", "medium", "high", "critical")}
        avg_prio = sum(it.priority_score for it in items) / len(items)
        top_cat = Counter(it.category for it in items).most_common(1)[0][0]
        # cleanliness_score: lower is dirtier; weight critical/high higher
        weighted = sum(
            breakdown["low"] * 1
            + breakdown["medium"] * 2
            + breakdown["high"] * 4
            + breakdown["critical"] * 6
            for _ in [0]
        )
        # cap so 30+ weighted points = score 0; 0 weighted points = score 100
        cleanliness = max(0, 100 - int(round(weighted * 100 / 30)))
        stats_items.append(LocationStat(
            location=loc,
            count=len(items),
            avg_priority=round(avg_prio, 1),
            severity_breakdown=breakdown,
            top_category=top_cat,
            cleanliness_score=cleanliness,
        ))

    # sort: most problems first, then highest avg priority
    stats_items.sort(key=lambda s: (-s.count, -s.avg_priority))
    top_locations = TopLocations(items=stats_items[:10])

    return AdminStats(
        parking_heatmap=heatmap,
        categories=categories,
        top_locations=top_locations,
        period_days=days,
    )
