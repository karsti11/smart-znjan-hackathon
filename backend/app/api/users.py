from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db.models import User
from ..db.session import get_db
from ..engine.schema import UserOut


router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)) -> list[User]:
    return list(db.execute(select(User).order_by(User.role)).scalars())


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: str, db: Session = Depends(get_db)) -> User:
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(404, "User not found")
    return u
