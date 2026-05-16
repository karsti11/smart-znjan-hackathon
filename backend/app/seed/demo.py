"""Idempotent demo seeder for Smart Žnjan."""
from __future__ import annotations

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
        "price_per_hour_eur": 1.80,
        "lat": ZNJAN_LAT + 0.0015, "lng": ZNJAN_LNG - 0.0040,
    },
]

COURTS = [
    {
        "id": "court_padel1", "name": "Padel Žnjan 1",
        "sport": "padel", "surface": "umjetna trava",
        "price_per_hour_eur": 16.0, "has_lights": True,
        "lat": ZNJAN_LAT - 0.0005, "lng": ZNJAN_LNG + 0.0015,
    },
    {
        "id": "court_padel2", "name": "Padel Žnjan 2",
        "sport": "padel", "surface": "umjetna trava",
        "price_per_hour_eur": 16.0, "has_lights": True,
        "lat": ZNJAN_LAT - 0.0005, "lng": ZNJAN_LNG + 0.0018,
    },
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
        ("le_003", "usr_ana", "reservation", 80, "Padel Žnjan 1, 60 min", now - timedelta(days=1)),
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
        id="rsv_seed_1", user_id="usr_ana", court_id="court_padel1",
        starts_at=now - timedelta(days=1, hours=2), ends_at=now - timedelta(days=1, hours=1),
        paid_eur=16.0, paid_points=0, status="completed",
    ))


def seed_all(db: Session) -> None:
    _ensure_users(db)
    _ensure_parking(db)
    _ensure_courts(db)
    _ensure_lights(db)
    _ensure_irrigation(db)
    _ensure_issues(db)
    _ensure_loyalty(db)
    _ensure_reservations(db)
    db.commit()
