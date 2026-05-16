from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .session import Base


def _utcnow() -> datetime:
    return datetime.utcnow()


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    role: Mapped[str] = mapped_column(String(16))  # citizen | staff | admin
    points: Mapped[int] = mapped_column(Integer, default=0)
    avatar_emoji: Mapped[str] = mapped_column(String(8), default="🙂")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)


class ParkingLot(Base):
    __tablename__ = "parking_lots"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    address: Mapped[str] = mapped_column(String(256))
    capacity: Mapped[int] = mapped_column(Integer)
    occupied: Mapped[int] = mapped_column(Integer, default=0)
    price_per_hour_eur: Mapped[float] = mapped_column(Float, default=1.50)
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)


class Court(Base):
    __tablename__ = "courts"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    sport: Mapped[str] = mapped_column(String(32))  # tenis | nogomet | košarka | odbojka
    surface: Mapped[str] = mapped_column(String(32))
    price_per_hour_eur: Mapped[float] = mapped_column(Float)
    has_lights: Mapped[bool] = mapped_column(Boolean, default=True)
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)

    reservations: Mapped[list["Reservation"]] = relationship(back_populates="court")


class Reservation(Base):
    __tablename__ = "reservations"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    court_id: Mapped[str] = mapped_column(ForeignKey("courts.id"))
    starts_at: Mapped[datetime] = mapped_column(DateTime)
    ends_at: Mapped[datetime] = mapped_column(DateTime)
    paid_eur: Mapped[float] = mapped_column(Float, default=0.0)
    paid_points: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(16), default="confirmed")  # confirmed | cancelled | completed
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)

    court: Mapped[Court] = relationship(back_populates="reservations")


class Issue(Base):
    __tablename__ = "issues"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    description: Mapped[str] = mapped_column(String(1024))
    location_hint: Mapped[str] = mapped_column(String(256))
    photo_data_url: Mapped[str | None] = mapped_column(String, nullable=True)
    # AI-classified fields
    category: Mapped[str] = mapped_column(String(32), default="ostalo")
    severity: Mapped[str] = mapped_column(String(16), default="medium")  # low | medium | high | critical
    priority_score: Mapped[int] = mapped_column(Integer, default=50)
    suggested_department: Mapped[str] = mapped_column(String(64), default="Komunalno redarstvo")
    ai_summary: Mapped[str] = mapped_column(String(1024), default="")
    ai_grounded: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(16), default="open")  # open | in_progress | resolved
    points_awarded: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, onupdate=_utcnow)


class LoyaltyEvent(Base):
    __tablename__ = "loyalty_events"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    kind: Mapped[str] = mapped_column(String(32))  # report | reservation | parking | redeem
    delta_points: Mapped[int] = mapped_column(Integer)
    note: Mapped[str] = mapped_column(String(256), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)


class LightZone(Base):
    __tablename__ = "light_zones"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    is_on: Mapped[bool] = mapped_column(Boolean, default=False)
    brightness: Mapped[int] = mapped_column(Integer, default=70)  # 0-100
    mode: Mapped[str] = mapped_column(String(16), default="auto")  # auto | manual
    power_kw: Mapped[float] = mapped_column(Float, default=2.4)
    last_changed: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)


class IrrigationZone(Base):
    __tablename__ = "irrigation_zones"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    is_on: Mapped[bool] = mapped_column(Boolean, default=False)
    soil_moisture: Mapped[int] = mapped_column(Integer, default=42)  # 0-100
    schedule: Mapped[str] = mapped_column(String(64), default="04:30–05:30")
    last_changed: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)
