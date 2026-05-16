"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CircleParking,
  Clock,
  Loader2,
  MapPin,
  Sparkles,
  Volleyball,
} from "lucide-react";

import {
  Badge,
  Banner,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Pill,
} from "@/components/ui";
import { api } from "@/lib/api";
import type { CitizenInsights, CourtSportDemand } from "@/lib/types";
import { cn } from "@/lib/utils";

const DOW_LABEL = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];

const CATEGORY_LABEL: Record<string, string> = {
  "smeće": "smeće",
  "rasvjeta": "rasvjeta",
  "vandalizam": "vandalizam",
  "infrastruktura": "infrastruktura",
  "zelenilo": "zelenilo",
  "voda": "voda",
  "parking": "parking",
  "buka": "buka",
  "životinje": "životinje",
};

const SPORT_EMOJI: Record<string, string> = {
  tenis: "🎾",
  košarka: "🏀",
  nogomet: "⚽",
  odbojka: "🏐",
};

export default function ZauzetostPage() {
  const [data, setData] = useState<CitizenInsights | null>(null);
  const [days, setDays] = useState(14);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(d: number) {
    setLoading(true);
    setError(null);
    try {
      setData(await api.citizenInsights(d));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(days); }, [days]);

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <Badge tone="teal" className="mb-3"><Activity className="h-3 w-3" /> Zauzetost & uvidi</Badge>
          <h1 className="text-3xl font-semibold text-ink-50 tracking-tight">Kad ići na Žnjan</h1>
          <p className="text-sm text-ink-200/80 mt-1 max-w-2xl">
            Kratki uvid kad su parkinzi puni, koji su sportski tereni najtraženiji
            i koje lokacije najčešće zovu po popravak.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-ink-200/70 mr-1">Period:</span>
          {[7, 14, 30].map((d) => (
            <Pill key={d} active={days === d} onClick={() => setDays(d)}>{d} dana</Pill>
          ))}
        </div>
      </header>

      {error && <Banner tone="critical">{error}</Banner>}
      {(!data || loading) && (
        <div className="flex items-center gap-2 text-ink-200">
          <Loader2 className="h-4 w-4 animate-spin" /> Učitavam…
        </div>
      )}

      {data && (
        <>
          <ParkingCard insights={data.parking} />

          <div>
            <h2 className="text-xl font-semibold text-ink-50 mb-3 flex items-center gap-2">
              <Volleyball className="h-5 w-5 text-teal-300" /> Sportski tereni — kad su najtraženiji
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {data.courts.items.map((c) => <CourtCard key={c.sport} demand={c} />)}
              {data.courts.items.length === 0 && (
                <Card><CardContent className="text-sm text-ink-200/70">Još nema dovoljno podataka o rezervacijama.</CardContent></Card>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-ink-50 mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-teal-300" /> Lokacije koje najčešće zovu po popravak
            </h2>
            <Card>
              <CardContent className="space-y-3">
                {data.problem_locations.length === 0 && (
                  <div className="text-sm text-ink-200/70 py-4 text-center">
                    Trenutno nema posebno problematičnih lokacija — Žnjan diše punim plućima. 🌊
                  </div>
                )}
                {data.problem_locations.map((p, i) => (
                  <ProblemLocationRow key={p.location} loc={p} rank={i + 1} />
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

/* ───────────────────────────── Parking */

function ParkingCard({ insights }: { insights: CitizenInsights["parking"] }) {
  const peakBusy = insights.density_by_hour[insights.busiest_hour];
  return (
    <Card glow>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleParking className="h-4 w-4 text-teal-300" /> Parking — kad su gužve
        </CardTitle>
        <div className="text-xs text-ink-200/70 mt-1">
          {insights.total_events} plaćenih sesija u zadnjih {insights.density_by_hour.length === 24 ? "14" : ""} dana
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* tip banner */}
        <div className="rounded-xl bg-teal-400/10 border border-teal-300/20 px-4 py-3 text-sm text-teal-100 flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-teal-300 mt-0.5 flex-shrink-0" />
          <span>{insights.tip}</span>
        </div>

        {/* two big metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/[0.04] border border-white/10 p-4">
            <div className="text-[11px] uppercase tracking-wider text-coral-400/90 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Najjača špica
            </div>
            <div className="text-2xl font-semibold text-ink-50 mt-1 tabular-nums">
              {DOW_LABEL[insights.busiest_dow]} · {String(insights.busiest_hour).padStart(2, "0")}:00
            </div>
            <div className="text-xs text-ink-200/70 mt-1">tada izbjegavaj</div>
          </div>
          <div className="rounded-xl bg-white/[0.04] border border-white/10 p-4">
            <div className="text-[11px] uppercase tracking-wider text-teal-300/90 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Najmirnije
            </div>
            <div className="text-2xl font-semibold text-ink-50 mt-1 tabular-nums">
              {DOW_LABEL[insights.quietest_dow]} · {String(insights.quietest_hour).padStart(2, "0")}:00
            </div>
            <div className="text-xs text-ink-200/70 mt-1">brzo parkiraš</div>
          </div>
        </div>

        {/* hour-of-day sparkline (24 bars) */}
        <div>
          <div className="text-[11px] uppercase tracking-wider text-ink-200/70 mb-2">
            Gužva po satu (prosjek)
          </div>
          <div className="flex items-end gap-[2px] h-20">
            {insights.density_by_hour.map((d, h) => {
              const isPeak = h === insights.busiest_hour;
              return (
                <div
                  key={h}
                  className="flex-1 flex flex-col items-center gap-1"
                  title={`${String(h).padStart(2, "0")}:00 — ${d}% relativno`}
                >
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className={cn(
                        "w-full rounded-t-sm transition-all duration-700",
                        isPeak
                          ? "bg-gradient-to-t from-coral-500 to-coral-400 shadow-[0_0_12px_-2px_rgba(255,107,61,0.5)]"
                          : "bg-gradient-to-t from-teal-500/40 to-teal-400/60",
                      )}
                      style={{ height: `${Math.max(4, d)}%` }}
                    />
                  </div>
                  <div className={cn(
                    "text-[9px] tabular-nums",
                    isPeak ? "text-coral-400 font-semibold" : "text-ink-200/50",
                  )}>
                    {h % 3 === 0 ? String(h).padStart(2, "0") : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ───────────────────────────── Court demand */

function CourtCard({ demand }: { demand: CourtSportDemand }) {
  const emoji = SPORT_EMOJI[demand.sport] ?? "🏟️";
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-400/20 to-ink-700/40 border border-teal-400/20 flex items-center justify-center text-xl">
            {emoji}
          </div>
          <div>
            <CardTitle>{demand.sport_label}</CardTitle>
            <div className="text-xs text-ink-200/70 mt-0.5">
              {demand.reservation_count} rezervacija
            </div>
          </div>
        </div>
        <Badge tone="teal">
          <CalendarClock className="h-3 w-3" /> {DOW_LABEL[demand.peak_dow]} · {String(demand.peak_hour).padStart(2, "0")}h
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-ink-200/70">Najpopularniji teren</div>
          <div className="text-sm text-ink-50 mt-0.5">{demand.most_booked_court_name}</div>
        </div>
        <div className="rounded-xl bg-teal-400/10 border border-teal-300/20 px-3 py-2 text-xs text-teal-100 flex items-start gap-2">
          <Sparkles className="h-3.5 w-3.5 text-teal-300 mt-0.5 flex-shrink-0" />
          <span>{demand.tip}</span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ───────────────────────────── Problem location row */

function ProblemLocationRow({ loc, rank }: { loc: CitizenInsights["problem_locations"][number]; rank: number }) {
  const tone =
    loc.cleanliness_score >= 60 ? "warning"
      : loc.cleanliness_score >= 30 ? "warning"
      : "critical";
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 hover:bg-white/[0.05] transition-colors">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center text-xs font-semibold tabular-nums text-teal-300 flex-shrink-0">
          #{rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <div className="text-sm text-ink-50 truncate" title={loc.location}>{loc.location}</div>
            <Badge tone="neutral" className="capitalize">{CATEGORY_LABEL[loc.top_issue] ?? loc.top_issue}</Badge>
          </div>
          <div className="text-xs text-ink-200/80">{loc.note}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <Badge tone={tone}>{loc.cleanliness_score}/100</Badge>
        </div>
      </div>
    </div>
  );
}
