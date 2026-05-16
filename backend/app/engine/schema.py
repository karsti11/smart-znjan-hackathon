from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


Role = Literal["citizen", "staff", "admin"]
IssueStatus = Literal["open", "in_progress", "resolved"]
IssueSeverity = Literal["low", "medium", "high", "critical"]
IssueCategory = Literal[
    "smeće",
    "rasvjeta",
    "vandalizam",
    "infrastruktura",
    "zelenilo",
    "voda",
    "parking",
    "buka",
    "životinje",
    "ostalo",
]


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    role: Role
    points: int
    avatar_emoji: str


class ParkingLotOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    address: str
    capacity: int
    occupied: int
    price_per_hour_eur: float
    lat: float
    lng: float

    @property
    def free(self) -> int:
        return max(0, self.capacity - self.occupied)


class ParkingSessionRequest(BaseModel):
    user_id: str
    lot_id: str
    hours: float = Field(gt=0, le=24)
    pay_with_points: bool = False


class ParkingSessionResponse(BaseModel):
    lot: ParkingLotOut
    paid_eur: float
    paid_points: int
    points_earned: int
    new_balance: int


class CourtOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    sport: str
    surface: str
    price_per_hour_eur: float
    has_lights: bool
    lat: float
    lng: float


class ReservationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    court_id: str
    starts_at: datetime
    ends_at: datetime
    paid_eur: float
    paid_points: int
    status: str


class ReservationRequest(BaseModel):
    user_id: str
    court_id: str
    starts_at: datetime
    hours: float = Field(gt=0, le=8)
    pay_with_points: bool = False


class IssueClassification(BaseModel):
    """What Claude returns when classifying a citizen report."""
    category: IssueCategory
    severity: IssueSeverity
    priority_score: int = Field(ge=0, le=100)
    suggested_department: str
    summary: str
    ai_grounded: bool = True


class IssueOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    description: str
    location_hint: str
    photo_data_url: str | None
    category: str
    severity: str
    priority_score: int
    suggested_department: str
    ai_summary: str
    ai_grounded: bool
    status: IssueStatus
    points_awarded: int
    created_at: datetime
    updated_at: datetime


class IssueCreateRequest(BaseModel):
    user_id: str
    description: str
    location_hint: str = ""
    photo_data_url: str | None = None


class IssueStatusUpdate(BaseModel):
    status: IssueStatus


class IssueOverrideRequest(BaseModel):
    """Staff override of an AI classification. Becomes a training example."""
    category: IssueCategory
    severity: IssueSeverity
    note: str = ""


class LoyaltyEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    kind: str
    delta_points: int
    note: str
    created_at: datetime


class LoyaltyCoachResponse(BaseModel):
    user: UserOut
    summary: str
    recommendations: list[str]
    next_milestone_points: int


class LightZoneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    is_on: bool
    brightness: int
    mode: str
    power_kw: float


class LightZoneUpdate(BaseModel):
    is_on: bool | None = None
    brightness: int | None = Field(default=None, ge=0, le=100)
    mode: str | None = None


class IrrigationZoneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    is_on: bool
    soil_moisture: int
    schedule: str


class IrrigationZoneUpdate(BaseModel):
    is_on: bool | None = None
    schedule: str | None = None


class AdminKpis(BaseModel):
    total_users: int
    citizens: int
    open_issues: int
    resolved_today: int
    parking_occupancy_pct: float
    today_court_reservations: int
    active_lights: int
    energy_kw: float
    total_points_circulating: int


# ── Analytics ────────────────────────────────────────────────────────────────


class ParkingHeatmap(BaseModel):
    """7×24 grid of parking-event counts (rows: Mon..Sun, cols: 00..23h)."""
    grid: list[list[int]]
    by_hour: list[int]          # 24 totals
    by_dow: list[int]           # 7 totals
    busiest_hour: int
    busiest_dow: int            # 0=Mon
    max_cell: int
    total_events: int


class CategoryCount(BaseModel):
    category: str
    count: int
    pct: float


class CategoryDistribution(BaseModel):
    total: int
    items: list[CategoryCount]


class LocationStat(BaseModel):
    location: str
    count: int
    avg_priority: float
    severity_breakdown: dict[str, int]   # {low: n, medium: n, high: n, critical: n}
    top_category: str
    cleanliness_score: int               # 0-100, 100 = best


class TopLocations(BaseModel):
    items: list[LocationStat]


class AdminStats(BaseModel):
    parking_heatmap: ParkingHeatmap
    categories: CategoryDistribution
    top_locations: TopLocations
    period_days: int


# ── Citizen insights (lighter, plain-language framing) ──────────────────────


class CitizenParkingInsights(BaseModel):
    busiest_hour: int
    quietest_hour: int
    busiest_dow: int           # 0 = Monday
    quietest_dow: int
    density_by_hour: list[int]  # 24, normalized 0-100
    total_events: int
    tip: str


class CourtSportDemand(BaseModel):
    sport: str
    sport_label: str
    most_booked_court_id: str
    most_booked_court_name: str
    peak_hour: int
    peak_dow: int
    reservation_count: int
    tip: str


class CitizenCourtsInsights(BaseModel):
    items: list[CourtSportDemand]


class CitizenProblemLocation(BaseModel):
    location: str
    cleanliness_score: int
    top_issue: str
    note: str


class CitizenInsights(BaseModel):
    parking: CitizenParkingInsights
    courts: CitizenCourtsInsights
    problem_locations: list[CitizenProblemLocation]
    period_days: int
