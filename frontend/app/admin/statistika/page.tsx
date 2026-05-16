"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Clock,
  Loader2,
  MapPin,
  Megaphone,
  TrendingUp,
  Wallet,
} from "lucide-react";

import {
  Badge,
  Banner,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Metric,
  Pill,
} from "@/components/ui";
import { api } from "@/lib/api";
import type { AdminStats, LocationStat } from "@/lib/types";
import { cn } from "@/lib/utils";

const DOW_LABEL = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];

const CATEGORY_LABEL: Record<string, string> = {
  "smeće": "Smeće",
  "rasvjeta": "Rasvjeta",
  "vandalizam": "Vandalizam",
  "infrastruktura": "Infrastruktura",
  "zelenilo": "Zelenilo",
  "voda": "Voda",
  "parking": "Parking",
  "buka": "Buka",
  "životinje": "Životinje",
  "ostalo": "Ostalo",
};

const CATEGORY_COLOR: Record<string, string> = {
  "smeće":          "from-rose-400 to-rose-500",
  "rasvjeta":       "from-amber-400 to-amber-500",
  "vandalizam":     "from-fuchsia-400 to-fuchsia-500",
  "infrastruktura":"from-coral-400 to-coral-500",
  "zelenilo":       "from-emerald-400 to-emerald-500",
  "voda":           "from-sky-400 to-sky-500",
  "parking":        "from-indigo-400 to-indigo-500",
  "buka":           "from-violet-400 to-violet-500",
  "životinje":      "from-orange-400 to-orange-500",
  "ostalo":         "from-slate-400 to-slate-500",
};

export default function StatistikaPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [days, setDays] = useState(14);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(d: number) {
    setLoading(true);
    setError(null);
    try {
      setStats(await api.stats(d));
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
          <Badge tone="teal" className="mb-3"><BarChart3 className="h-3 w-3" /> Analitika</Badge>
          <h1 className="text-3xl font-semibold text-ink-50 tracking-tight">Statistika područja Žnjana</h1>
          <p className="text-sm text-ink-200/80 mt-1">
            Parking po satu i danu, kategorije prijava, najproblematičnije lokacije.
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
      {(!stats || loading) && (
        <div className="flex items-center gap-2 text-ink-200">
          <Loader2 className="h-4 w-4 animate-spin" /> Učitavam analitiku…
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Metric
              label="Parking sesija"
              value={stats.parking_heatmap.total_events}
              sub={`u zadnjih ${stats.period_days} dana`}
            />
            <Metric
              label="Najprometniji sat"
              value={`${String(stats.parking_heatmap.busiest_hour).padStart(2, "0")}:00`}
              sub={`vrh tjedna: ${DOW_LABEL[stats.parking_heatmap.busiest_dow]}`}
              tone="teal"
            />
            <Metric
              label="Prijave ukupno"
              value={stats.categories.total}
              sub={`${stats.categories.items.length} kategorija`}
            />
            <Metric
              label="Problematičnih lokacija"
              value={stats.top_locations.items.length}
              sub="s ≥ 1 prijavom"
              tone="coral"
            />
          </div>

          <ParkingHeatmapCard stats={stats} />

          <div className="grid lg:grid-cols-5 gap-5">
            <div className="lg:col-span-2">
              <CategoryBars stats={stats} />
            </div>
            <div className="lg:col-span-3">
              <TopLocationsCard items={stats.top_locations.items} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ────────────────────────────────── Parking heatmap */

function ParkingHeatmapCard({ stats }: { stats: AdminStats }) {
  const h = stats.parking_heatmap;
  const max = Math.max(1, h.max_cell);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-teal-300" /> Parking — zauzetost po satu i danu
        </CardTitle>
        <div className="text-xs text-ink-200/70 mt-1">
          Broj plaćenih parking sesija — agregirano kroz {h.total_events} eventova. Svjetlije = manje, intenzivni teal = puno.
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* hour header */}
            <div className="flex pl-12">
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="w-7 text-[10px] text-ink-200/60 tabular-nums text-center">
                  {h % 3 === 0 ? String(h).padStart(2, "0") : ""}
                </div>
              ))}
            </div>
            {/* rows */}
            {h.grid.map((row, dow) => (
              <div key={dow} className="flex items-center mt-1">
                <div className="w-12 text-xs text-ink-200 pr-2 text-right">{DOW_LABEL[dow]}</div>
                {row.map((c, hr) => {
                  const intensity = c / max; // 0..1
                  const alpha = c === 0 ? 0.04 : 0.15 + intensity * 0.85;
                  const isPeak = c === max && c > 0;
                  return (
                    <div
                      key={hr}
                      className={cn(
                        "w-7 h-7 rounded-md border border-white/[0.05] transition-transform hover:scale-110 cursor-default",
                        isPeak && "ring-1 ring-teal-300/60",
                      )}
                      title={`${DOW_LABEL[dow]} ${String(hr).padStart(2, "0")}:00 — ${c} sesija`}
                      style={{
                        background: `rgba(63, 213, 198, ${alpha})`,
                      }}
                    />
                  );
                })}
                <div className="ml-3 text-[11px] text-ink-200/70 tabular-nums w-10">
                  {h.by_dow[dow]}
                </div>
              </div>
            ))}
            {/* hour totals row */}
            <div className="flex pl-12 mt-3 pt-2 border-t border-white/[0.06]">
              {h.by_hour.map((v, hr) => {
                const peak = hr === h.busiest_hour;
                return (
                  <div
                    key={hr}
                    className={cn(
                      "w-7 text-[10px] text-center tabular-nums",
                      peak ? "text-teal-300 font-semibold" : "text-ink-200/60",
                    )}
                  >
                    {v || ""}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs text-ink-200/70">
            <Wallet className="h-3.5 w-3.5 text-teal-300" />
            <span>Vrh: <span className="text-teal-300 font-semibold">
              {DOW_LABEL[h.busiest_dow]} u {String(h.busiest_hour).padStart(2, "0")}:00
            </span> ({h.max_cell} sesija u tom satu)</span>
          </div>
          <Legend max={max} />
        </div>
      </CardContent>
    </Card>
  );
}

function Legend({ max }: { max: number }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-ink-200/70">
      <span>0</span>
      <div className="flex">
        {[0.06, 0.2, 0.4, 0.6, 0.8, 1].map((a, i) => (
          <div
            key={i}
            className="w-5 h-3 border border-white/[0.06]"
            style={{ background: `rgba(63, 213, 198, ${a})` }}
          />
        ))}
      </div>
      <span>{max}</span>
    </div>
  );
}

/* ────────────────────────────────── Category bars */

function CategoryBars({ stats }: { stats: AdminStats }) {
  const items = stats.categories.items;
  const maxPct = Math.max(...items.map((i) => i.pct), 1);
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-teal-300" /> Distribucija kategorija prijava
        </CardTitle>
        <div className="text-xs text-ink-200/70 mt-1">{stats.categories.total} prijava ukupno</div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && (
          <div className="text-sm text-ink-200/70">Nema prijava u odabranom periodu.</div>
        )}
        {items.map((it) => {
          const gradient = CATEGORY_COLOR[it.category] ?? "from-slate-400 to-slate-500";
          const widthPct = (it.pct / maxPct) * 100;
          return (
            <div key={it.category}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-sm text-ink-50">
                  {CATEGORY_LABEL[it.category] ?? it.category}
                </div>
                <div className="text-xs text-ink-200/70 tabular-nums">
                  <span className="text-ink-100 font-semibold">{it.count}</span> · {it.pct}%
                </div>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={cn("h-full bg-gradient-to-r transition-all duration-700", gradient)}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────── Top problematic locations */

function TopLocationsCard({ items }: { items: LocationStat[] }) {
  const [sortBy, setSortBy] = useState<"count" | "cleanliness">("count");

  const sorted = useMemo(() => {
    return [...items].sort((a, b) =>
      sortBy === "count"
        ? b.count - a.count || a.cleanliness_score - b.cleanliness_score
        : a.cleanliness_score - b.cleanliness_score || b.count - a.count,
    );
  }, [items, sortBy]);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-teal-300" /> Top problematične lokacije
            </CardTitle>
            <div className="text-xs text-ink-200/70 mt-1">
              Sortirano po {sortBy === "count" ? "broju prijava" : "lošoj čistoći"}.
              Cleanliness 100 = najčišće.
            </div>
          </div>
          <div className="flex gap-2">
            <Pill active={sortBy === "count"} onClick={() => setSortBy("count")}>broj prijava</Pill>
            <Pill active={sortBy === "cleanliness"} onClick={() => setSortBy("cleanliness")}>najprljavije</Pill>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.length === 0 && (
          <div className="text-sm text-ink-200/70">Nema prijava s definiranom lokacijom u ovom periodu.</div>
        )}
        {sorted.map((loc, idx) => (
          <LocationRow key={loc.location} loc={loc} rank={idx + 1} />
        ))}
      </CardContent>
    </Card>
  );
}

function LocationRow({ loc, rank }: { loc: LocationStat; rank: number }) {
  const tone =
    loc.cleanliness_score >= 75 ? "success"
      : loc.cleanliness_score >= 45 ? "warning"
      : "critical";
  const sb = loc.severity_breakdown;
  const total = sb.low + sb.medium + sb.high + sb.critical || 1;

  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 hover:bg-white/[0.05] transition-colors">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-8 w-8 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center text-xs font-semibold tabular-nums text-teal-300">
          #{rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-ink-50 truncate" title={loc.location}>{loc.location}</div>
          <div className="text-[11px] text-ink-200/70 mt-0.5">
            {loc.count} prijava · prioritet ∅ {loc.avg_priority} · pretežno {CATEGORY_LABEL[loc.top_category] ?? loc.top_category}
          </div>
        </div>
        <div className="text-right">
          <Badge tone={tone === "critical" ? "critical" : tone === "warning" ? "warning" : "success"}>
            <TrendingUp className="h-3 w-3" /> {loc.cleanliness_score}/100
          </Badge>
        </div>
      </div>
      {/* severity stack bar */}
      <div className="flex h-1.5 rounded-full overflow-hidden bg-white/[0.04]">
        {sb.low > 0      && <div className="bg-slate-400" style={{ width: `${(sb.low / total) * 100}%` }} title={`low: ${sb.low}`} />}
        {sb.medium > 0   && <div className="bg-sky-400"   style={{ width: `${(sb.medium / total) * 100}%` }} title={`medium: ${sb.medium}`} />}
        {sb.high > 0     && <div className="bg-amber-400" style={{ width: `${(sb.high / total) * 100}%` }} title={`high: ${sb.high}`} />}
        {sb.critical > 0 && <div className="bg-rose-400"  style={{ width: `${(sb.critical / total) * 100}%` }} title={`critical: ${sb.critical}`} />}
      </div>
    </div>
  );
}
