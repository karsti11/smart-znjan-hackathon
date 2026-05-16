"""Citizen-facing insights — lighter shape than admin /stats, with plain tips."""
from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db.models import Court, Issue, LoyaltyEvent, Reservation
from ..db.session import get_db
from ..engine.schema import (
    CitizenCourtsInsights,
    CitizenInsights,
    CitizenParkingInsights,
    CitizenProblemLocation,
    CourtSportDemand,
)


router = APIRouter(prefix="/api/v1/insights", tags=["insights"])


DOW_LABEL = ["pon", "uto", "sri", "čet", "pet", "sub", "ned"]

SPORT_LABEL = {
    "padel": "Padel",
    "tenis": "Tenis",
    "košarka": "Košarka",
    "nogomet": "Mali nogomet",
    "odbojka": "Odbojka",
}

PROBLEM_NOTE = {
    "smeće":          "Tu često intervenira ekipa za čišćenje — javite ako vidite nereagiranu prijavu.",
    "rasvjeta":       "Popravak ulične rasvjete u tijeku.",
    "vandalizam":     "Pojačan nadzor i postupna obnova.",
    "infrastruktura": "Radovi na popravcima — moguće privremene neugodnosti.",
    "voda":           "Vodovod ovdje često intervenira na curenjima.",
    "zelenilo":       "Hortikultura redovito održava ovo područje.",
    "parking":        "Komunalno redarstvo pojačano kontrolira ovaj parking.",
    "buka":           "Pojačana kontrola noćne buke.",
    "životinje":      "Veterinarska služba je upoznata sa situacijom.",
    "ostalo":         "Aktivno radimo na poboljšanjima ovog područja.",
}


def _parking_tip(busiest_dow: int, busiest_hour: int, quietest_dow: int, quietest_hour: int) -> str:
    return (
        f"Najveće gužve: {DOW_LABEL[busiest_dow]} u {busiest_hour:02d}:00. "
        f"Najmirnije: {DOW_LABEL[quietest_dow]} oko {quietest_hour:02d}:00."
    )


def _court_tip(peak_hour: int) -> str:
    if peak_hour >= 17:
        return "Najjača potražnja navečer. Jutarnji slot (8–11h) obično je slobodan."
    if peak_hour < 12:
        return "Najtraženiji su jutarnji termini — popodne ima više slobodnih slotova."
    return "Popodne je špica. Pokušaj ranije ujutro ili kasnije navečer."


@router.get("/citizen", response_model=CitizenInsights)
def citizen_insights(days: int = 14, db: Session = Depends(get_db)) -> CitizenInsights:
    since = datetime.utcnow() - timedelta(days=days)

    # ── Parking
    parking_ts = list(db.execute(
        select(LoyaltyEvent.created_at).where(
            LoyaltyEvent.kind == "parking",
            LoyaltyEvent.created_at >= since,
        )
    ).scalars())

    by_hour = [0] * 24
    by_dow = [0] * 7
    for ts in parking_ts:
        by_hour[ts.hour] += 1
        by_dow[ts.weekday()] += 1

    if any(by_hour):
        busiest_hour = max(range(24), key=lambda h: by_hour[h])
        quietest_hour = min(
            (h for h in range(6, 23)),  # ignore deep-night dead hours
            key=lambda h: by_hour[h],
            default=4,
        )
        busiest_dow = max(range(7), key=lambda d: by_dow[d])
        quietest_dow = min(range(7), key=lambda d: by_dow[d])
    else:
        busiest_hour = quietest_hour = busiest_dow = quietest_dow = 0

    max_h = max(by_hour) or 1
    density = [int(round(c / max_h * 100)) for c in by_hour]

    parking = CitizenParkingInsights(
        busiest_hour=busiest_hour,
        quietest_hour=quietest_hour,
        busiest_dow=busiest_dow,
        quietest_dow=quietest_dow,
        density_by_hour=density,
        total_events=len(parking_ts),
        tip=_parking_tip(busiest_dow, busiest_hour, quietest_dow, quietest_hour),
    )

    # ── Courts (grouped by sport)
    reservations = list(db.execute(
        select(Reservation).where(Reservation.starts_at >= since)
    ).scalars())

    # preload court metadata
    court_map: dict[str, Court] = {
        c.id: c for c in db.execute(select(Court)).scalars()
    }

    by_sport: dict[str, list[Reservation]] = defaultdict(list)
    for r in reservations:
        court = court_map.get(r.court_id)
        if not court:
            continue
        by_sport[court.sport].append(r)

    court_items: list[CourtSportDemand] = []
    for sport, lst in by_sport.items():
        court_counter = Counter(r.court_id for r in lst)
        top_court_id, _ = court_counter.most_common(1)[0]
        top_court = court_map[top_court_id]
        peak_hour = Counter(r.starts_at.hour for r in lst).most_common(1)[0][0]
        peak_dow = Counter(r.starts_at.weekday() for r in lst).most_common(1)[0][0]
        court_items.append(CourtSportDemand(
            sport=sport,
            sport_label=SPORT_LABEL.get(sport, sport),
            most_booked_court_id=top_court_id,
            most_booked_court_name=top_court.name,
            peak_hour=peak_hour,
            peak_dow=peak_dow,
            reservation_count=len(lst),
            tip=_court_tip(peak_hour),
        ))
    court_items.sort(key=lambda x: -x.reservation_count)
    courts = CitizenCourtsInsights(items=court_items)

    # ── Problem locations (citizen view: only meaningfully problematic ones)
    issues = list(db.execute(
        select(Issue).where(Issue.created_at >= since, Issue.location_hint != "")
    ).scalars())

    bucket: dict[str, list[Issue]] = defaultdict(list)
    for it in issues:
        bucket[it.location_hint].append(it)

    problem_locs: list[CitizenProblemLocation] = []
    for loc, items in bucket.items():
        sev_counts = Counter(it.severity for it in items)
        weighted = (
            sev_counts.get("low", 0) * 1
            + sev_counts.get("medium", 0) * 2
            + sev_counts.get("high", 0) * 4
            + sev_counts.get("critical", 0) * 6
        )
        cleanliness = max(0, 100 - int(round(weighted * 100 / 30)))
        top_cat = Counter(it.category for it in items).most_common(1)[0][0]
        if cleanliness < 75:  # only surface actually-problematic locations
            problem_locs.append(CitizenProblemLocation(
                location=loc,
                cleanliness_score=cleanliness,
                top_issue=top_cat,
                note=PROBLEM_NOTE.get(top_cat, PROBLEM_NOTE["ostalo"]),
            ))
    problem_locs.sort(key=lambda p: p.cleanliness_score)
    problem_locs = problem_locs[:5]

    return CitizenInsights(
        parking=parking,
        courts=courts,
        problem_locations=problem_locs,
        period_days=days,
    )
