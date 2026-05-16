import type {
  AdminKpis,
  AdminStats,
  CitizenInsights,
  Court,
  Issue,
  IssueCreateRequest,
  IssueStatus,
  IrrigationZone,
  LightZone,
  LoyaltyCoach,
  LoyaltyEvent,
  ParkingLot,
  ParkingSessionRequest,
  ParkingSessionResponse,
  Reservation,
  ReservationRequest,
  User,
} from "./types";

const BASE = "/api/v1";

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init, headers: {
    "Content-Type": "application/json",
    ...(init?.headers ?? {}),
  } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => jsonFetch<{ status: string; ai: boolean }>(`${BASE}/health`),

  // users
  listUsers: () => jsonFetch<User[]>(`${BASE}/users`),
  getUser: (id: string) => jsonFetch<User>(`${BASE}/users/${id}`),

  // parking
  listLots: () => jsonFetch<ParkingLot[]>(`${BASE}/parking/lots`),
  startParking: (req: ParkingSessionRequest) =>
    jsonFetch<ParkingSessionResponse>(`${BASE}/parking/sessions`, {
      method: "POST",
      body: JSON.stringify(req),
    }),
  freeOne: (lotId: string) =>
    jsonFetch<{ id: string; occupied: number; free: number }>(
      `${BASE}/parking/lots/${lotId}/free-one`,
      { method: "POST" },
    ),

  // courts
  listCourts: () => jsonFetch<Court[]>(`${BASE}/courts`),
  reserve: (req: ReservationRequest) =>
    jsonFetch<Reservation>(`${BASE}/courts/reservations`, {
      method: "POST",
      body: JSON.stringify(req),
    }),
  userReservations: (uid: string) =>
    jsonFetch<Reservation[]>(`${BASE}/courts/reservations/by-user/${uid}`),

  // issues
  listIssues: (status?: IssueStatus) =>
    jsonFetch<Issue[]>(`${BASE}/issues${status ? `?status=${status}` : ""}`),
  userIssues: (uid: string) => jsonFetch<Issue[]>(`${BASE}/issues/by-user/${uid}`),
  createIssue: (req: IssueCreateRequest) =>
    jsonFetch<Issue>(`${BASE}/issues`, { method: "POST", body: JSON.stringify(req) }),
  updateIssueStatus: (id: string, status: IssueStatus) =>
    jsonFetch<Issue>(`${BASE}/issues/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
  reclassify: (id: string) =>
    jsonFetch<Issue>(`${BASE}/issues/${id}/reclassify`, { method: "POST" }),

  // loyalty
  loyaltyEvents: (uid: string) => jsonFetch<LoyaltyEvent[]>(`${BASE}/loyalty/events/${uid}`),
  loyaltyCoach: (uid: string) => jsonFetch<LoyaltyCoach>(`${BASE}/loyalty/coach/${uid}`),

  // infra
  listLights: () => jsonFetch<LightZone[]>(`${BASE}/infra/lights`),
  updateLight: (id: string, body: Partial<LightZone>) =>
    jsonFetch<LightZone>(`${BASE}/infra/lights/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  listIrrigation: () => jsonFetch<IrrigationZone[]>(`${BASE}/infra/irrigation`),
  updateIrrigation: (id: string, body: Partial<IrrigationZone>) =>
    jsonFetch<IrrigationZone>(`${BASE}/infra/irrigation/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  // admin
  kpis: () => jsonFetch<AdminKpis>(`${BASE}/admin/kpis`),
  stats: (days = 14) => jsonFetch<AdminStats>(`${BASE}/admin/stats?days=${days}`),

  // citizen-facing insights (lighter, with plain-language tips)
  citizenInsights: (days = 14) => jsonFetch<CitizenInsights>(`${BASE}/insights/citizen?days=${days}`),
};
