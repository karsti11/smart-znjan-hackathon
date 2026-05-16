from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db.models import LoyaltyEvent, ParkingLot, User
from ..db.session import get_db
from ..engine.schema import (
    ParkingLotOut,
    ParkingSessionRequest,
    ParkingSessionResponse,
)
from .common import new_id


router = APIRouter(prefix="/api/v1/parking", tags=["parking"])

POINTS_PER_EUR = 10  # earned
POINTS_PER_EUR_REDEEM = 100  # spent (1 EUR == 100 bodova)


@router.get("/lots", response_model=list[ParkingLotOut])
def list_lots(db: Session = Depends(get_db)) -> list[ParkingLot]:
    return list(db.execute(select(ParkingLot).order_by(ParkingLot.name)).scalars())


@router.post("/sessions", response_model=ParkingSessionResponse)
def start_session(req: ParkingSessionRequest, db: Session = Depends(get_db)) -> ParkingSessionResponse:
    lot = db.get(ParkingLot, req.lot_id)
    if not lot:
        raise HTTPException(404, "Parking lot not found")
    user = db.get(User, req.user_id)
    if not user:
        raise HTTPException(404, "User not found")

    cost_eur = round(lot.price_per_hour_eur * req.hours, 2)
    paid_eur = 0.0
    paid_points = 0
    points_earned = 0

    if req.pay_with_points:
        cost_points = int(round(cost_eur * POINTS_PER_EUR_REDEEM))
        if user.points < cost_points:
            raise HTTPException(400, f"Nedovoljno bodova: trebate {cost_points}, imate {user.points}")
        user.points -= cost_points
        paid_points = cost_points
        db.add(LoyaltyEvent(
            id=new_id("le"), user_id=user.id, kind="redeem",
            delta_points=-cost_points, note=f"Parking {lot.name} ({req.hours:g}h)",
        ))
    else:
        paid_eur = cost_eur
        points_earned = max(1, int(round(cost_eur * POINTS_PER_EUR)))
        user.points += points_earned
        db.add(LoyaltyEvent(
            id=new_id("le"), user_id=user.id, kind="parking",
            delta_points=points_earned, note=f"Parking {lot.name} ({req.hours:g}h, {cost_eur:.2f}€)",
        ))

    if lot.occupied < lot.capacity:
        lot.occupied = min(lot.capacity, lot.occupied + 1)
    db.commit()
    db.refresh(lot)
    db.refresh(user)

    return ParkingSessionResponse(
        lot=ParkingLotOut.model_validate(lot),
        paid_eur=paid_eur,
        paid_points=paid_points,
        points_earned=points_earned,
        new_balance=user.points,
    )


@router.post("/lots/{lot_id}/free-one")
def free_one(lot_id: str, db: Session = Depends(get_db)) -> dict:
    """Demo helper — pretend a car left the lot."""
    lot = db.get(ParkingLot, lot_id)
    if not lot:
        raise HTTPException(404, "Parking lot not found")
    lot.occupied = max(0, lot.occupied - 1)
    db.commit()
    return {"id": lot.id, "occupied": lot.occupied, "free": lot.capacity - lot.occupied}
