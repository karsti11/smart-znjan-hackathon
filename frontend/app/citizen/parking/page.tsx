"use client";

import { useEffect, useState } from "react";
import { CircleParking, Coins, Loader2, MapPin } from "lucide-react";

import { Badge, Banner, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";
import { api } from "@/lib/api";
import { useRole } from "@/lib/role-context";
import type { ParkingLot, ParkingSessionResponse } from "@/lib/types";
import { cn, formatEur, formatPoints } from "@/lib/utils";

export default function ParkingPage() {
  const { user, refresh } = useRole();
  const [lots, setLots] = useState<ParkingLot[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hours, setHours] = useState(2);
  const [selected, setSelected] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ParkingSessionResponse | null>(null);

  async function load() {
    try {
      const data = await api.listLots();
      setLots(data);
      if (!selected && data[0]) setSelected(data[0].id);
    } catch (e) {
      setError(String(e));
    }
  }

  useEffect(() => { void load(); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  async function startSession(lotId: string, payWithPoints: boolean) {
    if (!user) return;
    setPendingId(lotId + (payWithPoints ? ":p" : ":e"));
    setError(null);
    try {
      const res = await api.startParking({
        user_id: user.id, lot_id: lotId, hours, pay_with_points: payWithPoints,
      });
      setConfirm(res);
      await load();
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <Badge tone="teal" className="mb-3"><CircleParking className="h-3 w-3" /> Žnjan parking</Badge>
          <h1 className="text-3xl font-semibold text-ink-50 tracking-tight">Slobodna parking mjesta</h1>
          <p className="text-sm text-ink-200/80 mt-1">
            Plati klasično ili iskoristi <span className="text-teal-300">loyalty bodove</span> (1 €&nbsp;=&nbsp;100&nbsp;bodova).
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-ink-200/70 mb-1.5 block">Trajanje (h)</label>
            <Input
              type="number" min={0.5} max={24} step={0.5}
              value={hours}
              onChange={(e) => setHours(Math.max(0.5, Number(e.target.value) || 1))}
              className="w-28"
            />
          </div>
          {user && (
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-ink-200/70">Tvoji bodovi</div>
              <div className="text-lg font-semibold text-teal-300 tabular-nums">{formatPoints(user.points)}</div>
            </div>
          )}
        </div>
      </header>

      {error && <Banner tone="critical">{error}</Banner>}
      {confirm && (
        <Banner tone="success">
          <div className="font-semibold">Parkirano · {confirm.lot.name}</div>
          {confirm.paid_eur > 0
            ? <>Naplaćeno {formatEur(confirm.paid_eur)} — dobili ste <strong>{confirm.points_earned}</strong> bodova.</>
            : <>Iskorišteno <strong>{confirm.paid_points}</strong> bodova.</>}
          {" · "}Novo stanje: <strong>{formatPoints(confirm.new_balance)}</strong>
        </Banner>
      )}

      {!lots && <div className="flex items-center gap-2 text-ink-200"><Loader2 className="h-4 w-4 animate-spin" /> Učitavam parkinge…</div>}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {lots?.map((lot) => {
          const free = lot.capacity - lot.occupied;
          const pct = Math.round((lot.occupied / lot.capacity) * 100);
          const tone = free === 0 ? "critical" : free < lot.capacity * 0.2 ? "warning" : "success";
          const eurCost = (lot.price_per_hour_eur * hours).toFixed(2);
          const ptsCost = Math.round(lot.price_per_hour_eur * hours * 100);
          return (
            <Card
              key={lot.id}
              onClick={() => setSelected(lot.id)}
              className={cn(
                "cursor-pointer",
                selected === lot.id && "ring-1 ring-teal-400/40 shadow-glow",
              )}
            >
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="flex-1">
                  <CardTitle>{lot.name}</CardTitle>
                  <div className="flex items-center gap-1 text-xs text-ink-200/70 mt-1">
                    <MapPin className="h-3 w-3" /> {lot.address}
                  </div>
                </div>
                <Badge tone={tone === "critical" ? "critical" : tone === "warning" ? "warning" : "teal"}>
                  {free === 0 ? "popunjen" : `${free} slob.`}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs text-ink-200 mb-1.5">
                    <span>{lot.occupied} / {lot.capacity}</span>
                    <span>{pct}% zauzeto</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-700",
                        tone === "critical" ? "bg-rose-400" : tone === "warning" ? "bg-amber-300" : "bg-teal-400",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="primary"
                    disabled={free === 0 || !user || pendingId !== null}
                    onClick={(e) => { e.stopPropagation(); void startSession(lot.id, false); }}
                  >
                    {pendingId === lot.id + ":e" ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Plati {formatEur(+eurCost)}</>}
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={free === 0 || !user || pendingId !== null || (user?.points ?? 0) < ptsCost}
                    onClick={(e) => { e.stopPropagation(); void startSession(lot.id, true); }}
                    title={user && user.points < ptsCost ? `Trebate ${ptsCost} bodova` : undefined}
                  >
                    {pendingId === lot.id + ":p"
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <><Coins className="h-3.5 w-3.5 text-teal-300" /> {ptsCost} bod.</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
