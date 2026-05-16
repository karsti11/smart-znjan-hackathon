"use client";

import { useEffect, useState } from "react";
import { Loader2, Trophy, Users } from "lucide-react";

import { Badge, Banner, Card, CardContent, CardHeader, CardTitle, Metric } from "@/components/ui";
import { api } from "@/lib/api";
import type { LoyaltyEvent, User } from "@/lib/types";
import { cn, formatPoints } from "@/lib/utils";

export default function AdminLoyalty() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [allEvents, setAllEvents] = useState<Record<string, LoyaltyEvent[]>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const us = await api.listUsers();
        const citizens = us.filter((u) => u.role === "citizen");
        setUsers(citizens);
        const lists = await Promise.all(citizens.map((u) => api.loyaltyEvents(u.id)));
        const map: Record<string, LoyaltyEvent[]> = {};
        citizens.forEach((u, i) => { map[u.id] = lists[i]; });
        setAllEvents(map);
      } catch (e) { setError(String(e)); }
    })();
  }, []);

  const totalPoints = users?.reduce((s, u) => s + u.points, 0) ?? 0;
  const earned = Object.values(allEvents).flat().filter((e) => e.delta_points > 0).reduce((s, e) => s + e.delta_points, 0);
  const redeemed = Object.values(allEvents).flat().filter((e) => e.delta_points < 0).reduce((s, e) => s + Math.abs(e.delta_points), 0);
  const reports = Object.values(allEvents).flat().filter((e) => e.kind === "report").length;

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <Badge tone="teal" className="mb-3"><Trophy className="h-3 w-3" /> Loyalty pregled</Badge>
        <h1 className="text-3xl font-semibold text-ink-50 tracking-tight">Loyalty program — analitika</h1>
        <p className="text-sm text-ink-200/80 mt-1">Tko zarađuje, tko troši. Konfiguracija pravila dolazi u sljedećoj iteraciji.</p>
      </header>

      {error && <Banner tone="critical">{error}</Banner>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric label="Aktivnih građana" value={users?.length ?? 0} />
        <Metric label="Ukupno bodova" value={totalPoints.toLocaleString("hr-HR")} tone="teal" />
        <Metric label="Zarađeno (lifetime)" value={earned.toLocaleString("hr-HR")} />
        <Metric label="Iskorišteno" value={redeemed.toLocaleString("hr-HR")} tone="coral" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4 text-teal-300" /> Leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!users && <div className="flex items-center gap-2 text-ink-200"><Loader2 className="h-4 w-4 animate-spin" /> Učitavam…</div>}
          {users?.sort((a, b) => b.points - a.points).map((u, idx) => {
            const events = allEvents[u.id] ?? [];
            const r = events.filter((e) => e.kind === "report").length;
            const res = events.filter((e) => e.kind === "reservation").length;
            const p = events.filter((e) => e.kind === "parking").length;
            return (
              <div key={u.id} className="flex items-center gap-4 border-b border-white/[0.06] last:border-0 py-3 last:pb-0">
                <div className={cn(
                  "h-9 w-9 rounded-lg flex items-center justify-center text-sm font-semibold",
                  idx === 0 ? "bg-amber-400/20 text-amber-200 border border-amber-300/30"
                    : idx === 1 ? "bg-white/10 text-ink-50 border border-white/15"
                    : idx === 2 ? "bg-orange-500/15 text-orange-200 border border-orange-300/30"
                    : "bg-white/[0.05] text-ink-200 border border-white/10",
                )}>
                  #{idx + 1}
                </div>
                <div className="text-xl">{u.avatar_emoji}</div>
                <div className="flex-1">
                  <div className="text-sm text-ink-50 font-semibold">{u.name}</div>
                  <div className="text-xs text-ink-200/70">
                    {r} prijava · {res} rezervacija · {p} parking sesija
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-teal-300 tabular-nums">{formatPoints(u.points)}</div>
                  <div className="text-[11px] text-ink-200/60">trenutno stanje</div>
                </div>
              </div>
            );
          })}
          {users?.length === 0 && <div className="text-sm text-ink-200/70">Nema aktivnih građana.</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pravila bodovanja</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-3 text-sm text-ink-100">
          <RuleRow label="Komunalna prijava · nizak prioritet" value="+15 bodova" />
          <RuleRow label="Komunalna prijava · srednji prioritet" value="+30 bodova" />
          <RuleRow label="Komunalna prijava · visok prioritet" value="+40 bodova" />
          <RuleRow label="Komunalna prijava · kritično" value="+50 bodova" />
          <RuleRow label="Rezervacija terena" value="+5 bod. / 1 €" />
          <RuleRow label="Plaćanje parkinga" value="+10 bod. / 1 €" />
          <RuleRow label="Konverzija pri trošenju" value="100 bod. = 1 €" />
          <RuleRow label="Broj prijava (otvorenih)" value={`${reports}`} />
        </CardContent>
      </Card>
    </div>
  );
}

function RuleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2">
      <span>{label}</span>
      <span className="text-teal-300 font-semibold tabular-nums">{value}</span>
    </div>
  );
}
