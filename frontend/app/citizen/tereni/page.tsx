"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Coins, Loader2, Sun, Volleyball } from "lucide-react";

import {
  Badge,
  Banner,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Pill,
  Select,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useRole } from "@/lib/role-context";
import type { Court, Reservation } from "@/lib/types";
import { cn, formatEur, formatPoints } from "@/lib/utils";


const SPORT_LABEL: Record<string, string> = {
  padel: "Padel",
  tenis: "Tenis",
  košarka: "Košarka",
  nogomet: "Mali nogomet",
  odbojka: "Odbojka",
};

function defaultStartIso() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 2);
  return d.toISOString().slice(0, 16); // for <input type=datetime-local>
}

export default function TereniPage() {
  const { user, refresh } = useRole();
  const [courts, setCourts] = useState<Court[] | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState<string>(defaultStartIso());
  const [hours, setHours] = useState<number>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Reservation | null>(null);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);

  async function loadCourts() {
    try {
      const data = await api.listCourts();
      setCourts(data);
      if (!selected) setSelected(data[0]?.id ?? null);
    } catch (e) {
      setError(String(e));
    }
  }

  async function loadMy() {
    if (!user) return;
    try {
      const data = await api.userReservations(user.id);
      setMyReservations(data);
    } catch { /* ignore */ }
  }

  useEffect(() => { void loadCourts(); }, []); // eslint-disable-line
  useEffect(() => { void loadMy(); }, [user?.id]); // eslint-disable-line

  const filtered = useMemo(() => {
    if (!courts) return [];
    return filter === "all" ? courts : courts.filter((c) => c.sport === filter);
  }, [courts, filter]);

  const sports = useMemo(() => {
    const set = new Set(courts?.map((c) => c.sport) ?? []);
    return Array.from(set);
  }, [courts]);

  const selectedCourt = courts?.find((c) => c.id === selected) ?? null;
  const eurCost = selectedCourt ? (selectedCourt.price_per_hour_eur * hours).toFixed(2) : "0";
  const ptsCost = selectedCourt ? Math.round(selectedCourt.price_per_hour_eur * hours * 100) : 0;

  async function reserve(payWithPoints: boolean) {
    if (!user || !selectedCourt) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.reserve({
        user_id: user.id,
        court_id: selectedCourt.id,
        starts_at: new Date(startsAt).toISOString(),
        hours,
        pay_with_points: payWithPoints,
      });
      setSuccess(res);
      await loadMy();
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <Badge tone="teal" className="mb-3"><Volleyball className="h-3 w-3" /> Sportski tereni</Badge>
          <h1 className="text-3xl font-semibold text-ink-50 tracking-tight">Rezerviraj svoj termin</h1>
          <p className="text-sm text-ink-200/80 mt-1">
            Padel, tenis, košarka, mali nogomet, odbojka — sve u srcu Žnjana.
          </p>
        </div>
        {user && (
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wider text-ink-200/70">Tvoji bodovi</div>
            <div className="text-lg font-semibold text-teal-300 tabular-nums">{formatPoints(user.points)}</div>
          </div>
        )}
      </header>

      <div className="flex flex-wrap gap-2">
        <Pill active={filter === "all"} onClick={() => setFilter("all")}>Svi</Pill>
        {sports.map((s) => (
          <Pill key={s} active={filter === s} onClick={() => setFilter(s)}>{SPORT_LABEL[s] ?? s}</Pill>
        ))}
      </div>

      {error && <Banner tone="critical">{error}</Banner>}
      {success && (
        <Banner tone="success">
          Rezervirano · <strong>{courts?.find((c) => c.id === success.court_id)?.name}</strong> ·
          {" "}{new Date(success.starts_at).toLocaleString("hr-HR")} – {new Date(success.ends_at).toLocaleTimeString("hr-HR")}
          {success.paid_eur > 0 ? <> · plaćeno {formatEur(success.paid_eur)}</>
            : <> · {success.paid_points} bodova</>}
        </Banner>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 grid md:grid-cols-2 gap-4">
          {filtered.map((c) => {
            const active = c.id === selected;
            return (
              <Card key={c.id} onClick={() => setSelected(c.id)}
                className={cn("cursor-pointer", active && "ring-1 ring-teal-400/40 shadow-glow")}>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle>{c.name}</CardTitle>
                    <div className="text-xs text-ink-200/70 mt-1">{SPORT_LABEL[c.sport] ?? c.sport} · {c.surface}</div>
                  </div>
                  <Badge tone="teal">{formatEur(c.price_per_hour_eur)}/h</Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 text-xs text-ink-200/80">
                    {c.has_lights && <span className="inline-flex items-center gap-1"><Sun className="h-3 w-3 text-amber-300" /> reflektori</span>}
                    <span>≈ {Math.round(c.price_per_hour_eur * 100)} bodova / h</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="lg:sticky lg:top-4 self-start">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-teal-300" /> Termin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-ink-200/70 mb-1.5 block">Teren</label>
                <Select value={selected ?? ""} onChange={(e) => setSelected(e.target.value)}>
                  {courts?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-ink-200/70 mb-1.5 block">Početak</label>
                  <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-ink-200/70 mb-1.5 block">Trajanje (h)</label>
                  <Input type="number" min={0.5} max={8} step={0.5} value={hours} onChange={(e) => setHours(Math.max(0.5, Number(e.target.value) || 1))} />
                </div>
              </div>

              <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3 text-sm text-ink-100">
                <div className="flex justify-between"><span>Cijena:</span><span className="font-semibold">{formatEur(+eurCost)}</span></div>
                <div className="flex justify-between text-ink-200/70"><span>ili u bodovima:</span><span>{ptsCost}</span></div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => void reserve(false)} disabled={busy || !user || !selectedCourt}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Plati novcem</>}
                </Button>
                <Button variant="secondary" onClick={() => void reserve(true)} disabled={busy || !user || !selectedCourt || (user?.points ?? 0) < ptsCost}>
                  <Coins className="h-3.5 w-3.5 text-teal-300" /> {ptsCost} bod.
                </Button>
              </div>
            </CardContent>
          </Card>

          {myReservations.length > 0 && (
            <Card className="mt-4">
              <CardHeader><CardTitle>Tvoje rezervacije</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {myReservations.slice(0, 5).map((r) => {
                  const c = courts?.find((x) => x.id === r.court_id);
                  return (
                    <div key={r.id} className="text-sm flex items-center justify-between border-b border-white/[0.06] last:border-0 pb-2 last:pb-0">
                      <div>
                        <div className="text-ink-50">{c?.name ?? r.court_id}</div>
                        <div className="text-xs text-ink-200/70">{new Date(r.starts_at).toLocaleString("hr-HR")}</div>
                      </div>
                      <Badge tone={r.status === "confirmed" ? "success" : "neutral"}>{r.status}</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
