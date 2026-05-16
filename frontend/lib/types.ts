// Hand-maintained mirror of backend Pydantic models.

export type Role = "citizen" | "staff" | "admin";

export interface User {
  id: string;
  name: string;
  role: Role;
  points: number;
  avatar_emoji: string;
}

export interface ParkingLot {
  id: string;
  name: string;
  address: string;
  capacity: number;
  occupied: number;
  price_per_hour_eur: number;
  lat: number;
  lng: number;
}

export interface ParkingSessionRequest {
  user_id: string;
  lot_id: string;
  hours: number;
  pay_with_points: boolean;
}

export interface ParkingSessionResponse {
  lot: ParkingLot;
  paid_eur: number;
  paid_points: number;
  points_earned: number;
  new_balance: number;
}

export interface Court {
  id: string;
  name: string;
  sport: string;
  surface: string;
  price_per_hour_eur: number;
  has_lights: boolean;
  lat: number;
  lng: number;
}

export interface Reservation {
  id: string;
  user_id: string;
  court_id: string;
  starts_at: string;
  ends_at: string;
  paid_eur: number;
  paid_points: number;
  status: string;
}

export interface ReservationRequest {
  user_id: string;
  court_id: string;
  starts_at: string;
  hours: number;
  pay_with_points: boolean;
}

export type IssueStatus = "open" | "in_progress" | "resolved";
export type IssueSeverity = "low" | "medium" | "high" | "critical";

export interface Issue {
  id: string;
  user_id: string;
  description: string;
  location_hint: string;
  photo_data_url: string | null;
  category: string;
  severity: IssueSeverity;
  priority_score: number;
  suggested_department: string;
  ai_summary: string;
  ai_grounded: boolean;
  status: IssueStatus;
  points_awarded: number;
  created_at: string;
  updated_at: string;
}

export interface IssueCreateRequest {
  user_id: string;
  description: string;
  location_hint?: string;
  photo_data_url?: string | null;
}

export interface LoyaltyEvent {
  id: string;
  user_id: string;
  kind: "report" | "reservation" | "parking" | "redeem";
  delta_points: number;
  note: string;
  created_at: string;
}

export interface LoyaltyCoach {
  user: User;
  summary: string;
  recommendations: string[];
  next_milestone_points: number;
}

export interface LightZone {
  id: string;
  name: string;
  is_on: boolean;
  brightness: number;
  mode: "auto" | "manual" | string;
  power_kw: number;
}

export interface IrrigationZone {
  id: string;
  name: string;
  is_on: boolean;
  soil_moisture: number;
  schedule: string;
}

export interface ParkingHeatmap {
  grid: number[][];        // [7][24]
  by_hour: number[];       // 24
  by_dow: number[];        // 7
  busiest_hour: number;
  busiest_dow: number;     // 0 = Monday
  max_cell: number;
  total_events: number;
}

export interface CategoryCount {
  category: string;
  count: number;
  pct: number;
}

export interface CategoryDistribution {
  total: number;
  items: CategoryCount[];
}

export interface LocationStat {
  location: string;
  count: number;
  avg_priority: number;
  severity_breakdown: { low: number; medium: number; high: number; critical: number };
  top_category: string;
  cleanliness_score: number;
}

export interface AdminStats {
  parking_heatmap: ParkingHeatmap;
  categories: CategoryDistribution;
  top_locations: { items: LocationStat[] };
  period_days: number;
}

// ── Citizen insights ─────────────────────────────────────────────────────

export interface CitizenParkingInsights {
  busiest_hour: number;
  quietest_hour: number;
  busiest_dow: number;        // 0 = Monday
  quietest_dow: number;
  density_by_hour: number[];  // 24 values, 0-100
  total_events: number;
  tip: string;
}

export interface CourtSportDemand {
  sport: string;
  sport_label: string;
  most_booked_court_id: string;
  most_booked_court_name: string;
  peak_hour: number;
  peak_dow: number;
  reservation_count: number;
  tip: string;
}

export interface CitizenProblemLocation {
  location: string;
  cleanliness_score: number;
  top_issue: string;
  note: string;
}

export interface CitizenInsights {
  parking: CitizenParkingInsights;
  courts: { items: CourtSportDemand[] };
  problem_locations: CitizenProblemLocation[];
  period_days: number;
}

export interface AdminKpis {
  total_users: number;
  citizens: number;
  open_issues: number;
  resolved_today: number;
  parking_occupancy_pct: number;
  today_court_reservations: number;
  active_lights: number;
  energy_kw: number;
  total_points_circulating: number;
}
