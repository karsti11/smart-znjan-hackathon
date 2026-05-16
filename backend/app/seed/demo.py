"""Idempotent demo seeder for Smart Žnjan."""
from __future__ import annotations

import random
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db.models import (
    Court,
    IrrigationZone,
    Issue,
    LightZone,
    LoyaltyEvent,
    ParkingLot,
    Reservation,
    User,
)


# Žnjan, Split — approximate coordinates
ZNJAN_LAT = 43.5044
ZNJAN_LNG = 16.4754


USERS = [
    {"id": "usr_ana", "name": "Ana Marić", "role": "citizen", "points": 640, "avatar_emoji": "🌊"},
    {"id": "usr_ivan", "name": "Ivan Kovač", "role": "citizen", "points": 120, "avatar_emoji": "⚓"},
    {"id": "usr_marko", "name": "Marko Babić", "role": "staff", "points": 0, "avatar_emoji": "🛠️"},
    {"id": "usr_vesna", "name": "Vesna Lukić", "role": "admin", "points": 0, "avatar_emoji": "🌅"},
]

PARKING_LOTS = [
    {
        "id": "park_zn1", "name": "Žnjan — Glavni parking",
        "address": "Šetalište pape Ivana Pavla II",
        "capacity": 220, "occupied": 187,
        "price_per_hour_eur": 1.50,
        "lat": ZNJAN_LAT + 0.0010, "lng": ZNJAN_LNG - 0.0020,
    },
    {
        "id": "park_zn2", "name": "Žnjan — Plato istok",
        "address": "Put Firula 11",
        "capacity": 140, "occupied": 64,
        "price_per_hour_eur": 1.20,
        "lat": ZNJAN_LAT + 0.0005, "lng": ZNJAN_LNG + 0.0030,
    },
    {
        "id": "park_zn3", "name": "Žnjan — Sportski centar",
        "address": "Mediteranskih igara 2",
        "capacity": 80, "occupied": 22,
        "price_per_hour_eur": 1.00,
        "lat": ZNJAN_LAT - 0.0008, "lng": ZNJAN_LNG + 0.0010,
    },
    {
        "id": "park_zn4", "name": "Žnjan — Plaža zapad",
        "address": "Šetalište pape Ivana Pavla II 35",
        "capacity": 60, "occupied": 60,
        "price_per_hour_eur": 1.50,
        "lat": ZNJAN_LAT + 0.0015, "lng": ZNJAN_LNG - 0.0040,
    },
]

COURTS = [
    {
        "id": "court_tenis1", "name": "Tenis Žnjan A",
        "sport": "tenis", "surface": "šljaka",
        "price_per_hour_eur": 12.0, "has_lights": True,
        "lat": ZNJAN_LAT - 0.0010, "lng": ZNJAN_LNG + 0.0020,
    },
    {
        "id": "court_basket", "name": "Košarka — otvoreni teren",
        "sport": "košarka", "surface": "beton",
        "price_per_hour_eur": 6.0, "has_lights": True,
        "lat": ZNJAN_LAT + 0.0002, "lng": ZNJAN_LNG + 0.0008,
    },
    {
        "id": "court_odbojka", "name": "Odbojka na pijesku",
        "sport": "odbojka", "surface": "pijesak",
        "price_per_hour_eur": 8.0, "has_lights": False,
        "lat": ZNJAN_LAT + 0.0020, "lng": ZNJAN_LNG - 0.0010,
    },
    {
        "id": "court_mali_nogomet", "name": "Mali nogomet — Žnjan",
        "sport": "nogomet", "surface": "umjetna trava",
        "price_per_hour_eur": 22.0, "has_lights": True,
        "lat": ZNJAN_LAT - 0.0015, "lng": ZNJAN_LNG + 0.0005,
    },
]

LIGHT_ZONES = [
    {"id": "lz_promenada", "name": "Promenada uz more", "is_on": True, "brightness": 80, "mode": "auto", "power_kw": 3.2},
    {"id": "lz_parking", "name": "Glavni parking", "is_on": True, "brightness": 90, "mode": "auto", "power_kw": 2.6},
    {"id": "lz_tereni", "name": "Sportski tereni", "is_on": False, "brightness": 100, "mode": "manual", "power_kw": 6.4},
    {"id": "lz_park", "name": "Park — sjeverni dio", "is_on": True, "brightness": 50, "mode": "auto", "power_kw": 1.4},
]

IRRIGATION_ZONES = [
    {"id": "iz_trava_sport", "name": "Travnjak — sportski tereni", "is_on": False, "soil_moisture": 38, "schedule": "04:30–05:30"},
    {"id": "iz_park", "name": "Park — sjever", "is_on": True, "soil_moisture": 64, "schedule": "05:00–06:00"},
    {"id": "iz_plato", "name": "Plato — zeleni pojas", "is_on": False, "soil_moisture": 22, "schedule": "04:00–04:45"},
]

SAMPLE_ISSUES = [
    {
        "id": "iss_001", "user_id": "usr_ana",
        "description": "Prepuni kontejneri kod izlaza za plažu, smeće se prelijeva oko klupa već dva dana.",
        "location_hint": "Šetalište pape Ivana Pavla II, kod kioska",
        "category": "smeće", "severity": "high", "priority_score": 78,
        "suggested_department": "Čistoća d.o.o. Split",
        "ai_summary": "Prepuni kontejneri kod plaže — potrebno hitno pražnjenje.",
        "ai_grounded": True, "status": "open", "points_awarded": 30,
    },
    {
        "id": "iss_002", "user_id": "usr_ivan",
        "description": "Tri lampe ne rade duž promenade, večeras je bilo skroz mračno od stepenica do parkinga.",
        "location_hint": "Promenada, sredina",
        "category": "rasvjeta", "severity": "medium", "priority_score": 60,
        "suggested_department": "Javna rasvjeta — Grad Split",
        "ai_summary": "Tri ulične lampe ne rade na promenadi — rizik za pješake.",
        "ai_grounded": True, "status": "in_progress", "points_awarded": 30,
    },
    {
        "id": "iss_003", "user_id": "usr_ana",
        "description": "Razbijena staklena boca pored pješčanog terena za odbojku, opasno za djecu.",
        "location_hint": "Odbojka na pijesku",
        "category": "smeće", "severity": "critical", "priority_score": 95,
        "suggested_department": "Čistoća d.o.o. Split",
        "ai_summary": "Razbijeno staklo blizu dječje zone — hitna intervencija.",
        "ai_grounded": True, "status": "resolved", "points_awarded": 50,
    },
]


def _ensure_users(db: Session) -> None:
    for u in USERS:
        if not db.get(User, u["id"]):
            db.add(User(**u))


def _ensure_parking(db: Session) -> None:
    for p in PARKING_LOTS:
        if not db.get(ParkingLot, p["id"]):
            db.add(ParkingLot(**p))


def _ensure_courts(db: Session) -> None:
    for c in COURTS:
        if not db.get(Court, c["id"]):
            db.add(Court(**c))


def _ensure_lights(db: Session) -> None:
    for z in LIGHT_ZONES:
        if not db.get(LightZone, z["id"]):
            db.add(LightZone(**z))


def _ensure_irrigation(db: Session) -> None:
    for z in IRRIGATION_ZONES:
        if not db.get(IrrigationZone, z["id"]):
            db.add(IrrigationZone(**z))


def _ensure_issues(db: Session) -> None:
    for it in SAMPLE_ISSUES:
        if not db.get(Issue, it["id"]):
            db.add(Issue(**it))


def _ensure_loyalty(db: Session) -> None:
    if db.execute(select(LoyaltyEvent).limit(1)).first():
        return
    now = datetime.utcnow()
    events = [
        ("le_001", "usr_ana", "report", 30, "Prijava: prepuni kontejneri", now - timedelta(days=4)),
        ("le_002", "usr_ana", "report", 50, "Prijava: razbijeno staklo (kritično)", now - timedelta(days=2)),
        ("le_003", "usr_ana", "reservation", 60, "Tenis Žnjan A, 60 min", now - timedelta(days=1)),
        ("le_004", "usr_ana", "parking", 15, "Žnjan plato istok, 2 sata", now - timedelta(hours=6)),
        ("le_005", "usr_ivan", "report", 30, "Prijava: rasvjeta promenada", now - timedelta(days=1)),
    ]
    for eid, uid, kind, delta, note, ts in events:
        db.add(LoyaltyEvent(id=eid, user_id=uid, kind=kind, delta_points=delta, note=note, created_at=ts))


def _ensure_reservations(db: Session) -> None:
    if db.execute(select(Reservation).limit(1)).first():
        return
    now = datetime.utcnow()
    db.add(Reservation(
        id="rsv_seed_1", user_id="usr_ana", court_id="court_tenis1",
        starts_at=now - timedelta(days=1, hours=2), ends_at=now - timedelta(days=1, hours=1),
        paid_eur=12.0, paid_points=0, status="completed",
    ))


# ── Rich history for analytics (parking heatmap, top locations, categories) ──

# Locations with deliberate cleanliness gradient — Promenada and main parking
# generate the most reports (worst score); Sportski centar is mid; Plaža zapad
# and Plato are cleanest. This produces a meaningful "top problematic locations" chart.
_HISTORY_LOCATIONS = [
    ("Šetalište pape Ivana Pavla II, kod kioska",  ["smeće", "smeće", "smeće", "smeće", "vandalizam", "rasvjeta", "infrastruktura"]),
    ("Promenada, sredina",                          ["rasvjeta", "rasvjeta", "rasvjeta", "smeće", "smeće", "vandalizam"]),
    ("Glavni parking — sjeverni ulaz",              ["smeće", "smeće", "parking", "parking", "rasvjeta"]),
    ("Sportski centar Žnjan",                       ["voda", "voda", "infrastruktura", "smeće"]),
    ("Odbojka na pijesku",                          ["smeće", "smeće", "životinje"]),
    ("Park — sjeverni dio",                         ["zelenilo", "zelenilo", "smeće"]),
    ("Plaža zapad",                                 ["smeće"]),
    ("Plato istok",                                 ["buka"]),
]

_DEPT_BY_CAT = {
    "smeće":         "Čistoća d.o.o. Split",
    "rasvjeta":      "Javna rasvjeta — Grad Split",
    "vandalizam":    "Komunalno redarstvo",
    "infrastruktura":"Komunalno gospodarstvo",
    "zelenilo":      "Parkovi i nasadi d.o.o.",
    "voda":          "Vodovod i kanalizacija d.o.o.",
    "parking":       "Split parking d.o.o.",
    "buka":          "Komunalno redarstvo",
    "životinje":     "Veterinarska stanica",
    "ostalo":        "Komunalno redarstvo",
}

_SEVERITY_BY_CAT = {
    "smeće":          [("medium", 55), ("medium", 60), ("high", 75), ("low", 25)],
    "rasvjeta":       [("medium", 50), ("medium", 55), ("high", 70)],
    "vandalizam":     [("high", 75), ("medium", 60)],
    "infrastruktura": [("high", 70), ("critical", 90)],
    "zelenilo":       [("low", 25), ("medium", 45)],
    "voda":           [("critical", 92), ("high", 80)],
    "parking":        [("medium", 50), ("low", 30)],
    "buka":           [("low", 30), ("medium", 45)],
    "životinje":      [("medium", 55)],
}

_DESC_BY_CAT = {
    "smeće":          "Prepuni kontejneri / razbacano smeće, treba intervencija ekipe za čišćenje.",
    "rasvjeta":       "Ulična lampa ne radi, mračno je u večernjim satima.",
    "vandalizam":     "Šarani su zidovi i klupe, nepoznati počinitelji.",
    "infrastruktura":"Oštećen pločnik / oprema, opasno za korisnike.",
    "zelenilo":       "Suho granje i nepokošena trava — potrebno održavanje.",
    "voda":           "Curi voda iz kanalizacije ili razvodne mreže.",
    "parking":        "Nepropisno parkiranje zauzima više mjesta.",
    "buka":           "Glasna glazba u kasnim satima, smetnja stanarima.",
    "životinje":      "Galebovi rasturaju vreće sa smećem.",
}


def _ensure_rich_history(db: Session) -> None:
    """Seed ~40 issues spread across 14 days and ~200 parking-time loyalty events.

    Idempotent: keyed off the deterministic id prefix `iss_h_` / `le_h_`.
    Re-running adds nothing if already present.
    """
    if db.execute(select(Issue).where(Issue.id.like("iss_h_%"))).first():
        return

    rng = random.Random(42)
    now = datetime.utcnow()
    citizen_ids = ["usr_ana", "usr_ivan"]

    # ── 40 issues distributed across the gradient + last 14 days
    n_issues = 0
    for days_back in range(14):
        for loc, cat_pool in _HISTORY_LOCATIONS:
            # high-volume locations show up more often
            if rng.random() < (0.18 + 0.05 * (len(cat_pool) / 7)):
                cat = rng.choice(cat_pool)
                sev, prio = rng.choice(_SEVERITY_BY_CAT[cat])
                created = now - timedelta(
                    days=days_back,
                    hours=rng.randint(6, 22),
                    minutes=rng.randint(0, 59),
                )
                # 60% of issues older than 3 days are resolved
                status = "open"
                if days_back >= 3 and rng.random() < 0.65:
                    status = "resolved"
                elif days_back >= 1 and rng.random() < 0.20:
                    status = "in_progress"
                uid = rng.choice(citizen_ids)
                points = {"low": 15, "medium": 30, "high": 40, "critical": 50}[sev]
                db.add(Issue(
                    id=f"iss_h_{n_issues:03d}",
                    user_id=uid,
                    description=_DESC_BY_CAT[cat] + f" Lokacija: {loc}.",
                    location_hint=loc,
                    photo_data_url=None,
                    category=cat,
                    severity=sev,
                    priority_score=prio,
                    suggested_department=_DEPT_BY_CAT[cat],
                    ai_summary=f"Prijava ({cat}) na lokaciji '{loc}'.",
                    ai_grounded=True,
                    status=status,
                    points_awarded=points,
                    created_at=created,
                    updated_at=created if status == "open" else created + timedelta(hours=rng.randint(2, 36)),
                ))
                n_issues += 1

    # ── parking events with realistic time-of-day distribution
    # Morning peak 8-10, evening peak 17-20, day-of-week effect (weekends busier)
    hour_weights = [
        0.2, 0.1, 0.1, 0.1, 0.1, 0.3,  # 0-5
        0.6, 1.4, 2.6, 2.4, 1.8, 1.4,  # 6-11
        1.6, 1.4, 1.2, 1.4, 1.8, 2.6,  # 12-17
        3.0, 2.8, 2.2, 1.6, 0.9, 0.5,  # 18-23
    ]
    dow_weights = [1.0, 1.0, 1.0, 1.1, 1.4, 1.8, 1.6]  # Mon..Sun
    lot_ids = ["park_zn1", "park_zn2", "park_zn3", "park_zn4"]
    # busier lots: zn1 (Glavni) and zn4 (Plaža)
    lot_weights = [3.0, 1.8, 1.2, 2.4]

    n = 0
    for days_back in range(14):
        d = now - timedelta(days=days_back)
        dow = d.weekday()
        target = int(round(14 * dow_weights[dow]))
        for _ in range(target):
            # sample hour
            h = rng.choices(range(24), weights=hour_weights, k=1)[0]
            minute = rng.randint(0, 59)
            lot = rng.choices(lot_ids, weights=lot_weights, k=1)[0]
            uid = rng.choice(citizen_ids)
            hours = rng.choice([1, 1, 2, 2, 2, 3, 4])
            cost_eur = round(1.5 * hours, 2)  # approximate
            ts = (now - timedelta(days=days_back)).replace(hour=h, minute=minute, second=0, microsecond=0)
            db.add(LoyaltyEvent(
                id=f"le_h_{n:04d}",
                user_id=uid,
                kind="parking",
                delta_points=max(1, int(round(cost_eur * 10))),
                note=f"Parking {lot} ({hours}h, {cost_eur:.2f}€)",
                created_at=ts,
            ))
            n += 1


# Court reservation history — feeds the citizen "kad su tereni najtraženiji" view.
# Per-court popularity weights + peak-hour pool produce realistic demand curves.
_COURT_HISTORY = {
    "court_tenis1":       (16, [10, 11, 17, 17, 18, 18, 19, 19, 20]),
    "court_basket":       (10, [16, 17, 18, 19, 19, 20]),
    "court_odbojka":      (8,  [10, 11, 17, 18, 19]),
    "court_mali_nogomet": (16, [18, 19, 20, 20, 21]),
}


def _ensure_court_history(db: Session) -> None:
    if db.execute(select(Reservation).where(Reservation.id.like("rsv_h_%"))).first():
        return
    rng = random.Random(43)
    now = datetime.utcnow()
    n = 0
    for court_id, (count, peak_pool) in _COURT_HISTORY.items():
        court = db.get(Court, court_id)
        if not court:
            continue
        # weekend bias for sport rentals
        dow_weights = [1.0, 1.0, 1.0, 1.2, 1.6, 2.0, 1.7]
        for _ in range(count):
            dow = rng.choices(range(7), weights=dow_weights, k=1)[0]
            # snap to a day in the last 14 that has this dow
            base = now - timedelta(days=rng.randint(0, 13))
            while base.weekday() != dow:
                base -= timedelta(days=1)
                if (now - base).days > 20:
                    break
            h = rng.choice(peak_pool)
            uid = rng.choice(["usr_ana", "usr_ivan"])
            hours = rng.choice([1, 1, 1, 1, 2])
            starts = base.replace(hour=h, minute=0, second=0, microsecond=0)
            ends = starts + timedelta(hours=hours)
            db.add(Reservation(
                id=f"rsv_h_{n:03d}",
                user_id=uid,
                court_id=court_id,
                starts_at=starts,
                ends_at=ends,
                paid_eur=round(court.price_per_hour_eur * hours, 2),
                paid_points=0,
                status="completed" if starts < now else "confirmed",
            ))
            n += 1


def seed_all(db: Session) -> None:
    _ensure_users(db)
    _ensure_parking(db)
    _ensure_courts(db)
    _ensure_lights(db)
    _ensure_irrigation(db)
    _ensure_issues(db)
    _ensure_loyalty(db)
    _ensure_reservations(db)
    _ensure_rich_history(db)
    _ensure_court_history(db)
    db.commit()
