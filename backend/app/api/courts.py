from __future__ import annotations

from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db.models import Court, LoyaltyEvent, Reservation, User
from ..db.session import get_db
from ..engine.schema import (
    CourtOut,
    ReservationOut,
    ReservationRequest,
)
from .common import new_id

router = APIRouter(prefix="/api/v1/courts", tags=["courts"])

POINTS_PER_EUR = 5
POINTS_PER_EUR_REDEEM = 100


@router.get("", response_model=list[CourtOut])
def list_courts(db: Session = Depends(get_db)) -> list[Court]:
    return list(db.execute(select(Court).order_by(Court.sport, Court.name)).scalars())


@router.get("/{court_id}/reservations", response_model=list[ReservationOut])
def court_reservations(court_id: str, db: Session = Depends(get_db)) -> list[Reservation]:
    if not db.get(Court, court_id):
        raise HTTPException(404, "Court not found")
    return list(db.execute(
        select(Reservation).where(Reservation.court_id == court_id).order_by(Reservation.starts_at.desc())
    ).scalars())


@router.post("/reservations", response_model=ReservationOut)
def reserve(req: ReservationRequest, db: Session = Depends(get_db)) -> Reservation:
    court = db.get(Court, req.court_id)
    if not court:
        raise HTTPException(404, "Court not found")
    user = db.get(User, req.user_id)
    if not user:
        raise HTTPException(404, "User not found")

    starts = req.starts_at
    ends = starts + timedelta(hours=req.hours)

    overlapping = db.execute(
        select(Reservation).where(
            Reservation.court_id == req.court_id,
            Reservation.status == "confirmed",
            Reservation.starts_at < ends,
            Reservation.ends_at > starts,
        )
    ).first()
    if overlapping:
        raise HTTPException(409, "Termin se preklapa s postojećom rezervacijom.")

    cost_eur = round(court.price_per_hour_eur * req.hours, 2)
    paid_eur = 0.0
    paid_points = 0

    if req.pay_with_points:
        cost_points = int(round(cost_eur * POINTS_PER_EUR_REDEEM))
        if user.points < cost_points:
            raise HTTPException(400, f"Nedovoljno bodova: trebate {cost_points}, imate {user.points}")
        user.points -= cost_points
        paid_points = cost_points
        db.add(LoyaltyEvent(
            id=new_id("le"), user_id=user.id, kind="redeem",
            delta_points=-cost_points, note=f"Rezervacija {court.name} ({req.hours:g}h)",
        ))
    else:
        paid_eur = cost_eur
        points_earned = max(1, int(round(cost_eur * POINTS_PER_EUR)))
        user.points += points_earned
        db.add(LoyaltyEvent(
            id=new_id("le"), user_id=user.id, kind="reservation",
            delta_points=points_earned, note=f"Rezervacija {court.name} ({req.hours:g}h)",
        ))

    rsv = Reservation(
        id=new_id("rsv"),
        user_id=user.id, court_id=court.id,
        starts_at=starts, ends_at=ends,
        paid_eur=paid_eur, paid_points=paid_points,
        status="confirmed",
    )
    db.add(rsv)
    db.commit()
    db.refresh(rsv)
    return rsv


@router.get("/reservations/by-user/{user_id}", response_model=list[ReservationOut])
def user_reservations(user_id: str, db: Session = Depends(get_db)) -> list[Reservation]:
    return list(db.execute(
        select(Reservation).where(Reservation.user_id == user_id).order_by(Reservation.starts_at.desc())
    ).scalars())
