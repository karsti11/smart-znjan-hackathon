from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db.models import LoyaltyEvent, User
from ..db.session import get_db
from ..engine.ai import loyalty_coach
from ..engine.schema import LoyaltyCoachResponse, LoyaltyEventOut, UserOut


router = APIRouter(prefix="/api/v1/loyalty", tags=["loyalty"])


@router.get("/events/{user_id}", response_model=list[LoyaltyEventOut])
def list_events(user_id: str, db: Session = Depends(get_db)) -> list[LoyaltyEvent]:
    return list(db.execute(
        select(LoyaltyEvent).where(LoyaltyEvent.user_id == user_id).order_by(LoyaltyEvent.created_at.desc())
    ).scalars())


@router.get("/coach/{user_id}", response_model=LoyaltyCoachResponse)
def coach(user_id: str, db: Session = Depends(get_db)) -> LoyaltyCoachResponse:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    events = list(db.execute(
        select(LoyaltyEvent).where(LoyaltyEvent.user_id == user_id).order_by(LoyaltyEvent.created_at.desc())
    ).scalars())
    payload = [
        {"kind": e.kind, "delta_points": e.delta_points, "note": e.note, "at": e.created_at.isoformat()}
        for e in events
    ]
    return loyalty_coach(UserOut.model_validate(user), payload)
