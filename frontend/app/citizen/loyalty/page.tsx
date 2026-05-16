"use client";

import { useEffect, useState } from "react";
import {
  Coins,
  Loader2,
  Megaphone,
  Sparkles,
  Trophy,
  Volleyball,
  Wallet,
} from "lucide-react";

import { Badge, Banner, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { api } from "@/lib/api";
import { useRole } from "@/lib/role-context";
import type { LoyaltyCoach, LoyaltyEvent } from "@/lib/types";
import { cn, formatPoints, relativeTime } from "@/lib/utils";

const KIND_META: Record<LoyaltyEvent["kind"], { label: string; icon: React.ComponentType<{ className?: string }>; tone: "success" | "teal" | "info" | "neutral" }> = {
  report:      { label: "Komunalna prijava", icon: Megaphone, tone: "success" },
  reservation: { label: "Rezervacija terena", icon: Volleyball, tone: "teal" },
  parking:     { label: "Parking",            icon: Wallet,    tone: "info" },
  redeem:      { label: "Iskorišteno",        icon: Coins,     tone: "neutral" },
};

export default function LoyaltyPage() {
  const { user } = useRole();
  const [coach, setCoach] = useState<LoyaltyCoach | null>(null);
  const [events, setEvents] = useState<LoyaltyEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const [c, e] = await Promise.all([
        api.loyaltyCoach(user.id),
        api.loyaltyEvents(user.id),
      ]);
      setCoach(c);
      setEvents(e);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { void loadAll(); }, [user?.id]); // eslint-disable-line

  if (!user) return null;

  const pct = coach ? Math.min(100, Math.round((user.points / coach.next_milestone_points) * 100)) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <Badge tone="teal" className="mb-3"><Trophy className="h-3 w-3" /> Loyalty</Badge>
          <h1 className="text-3xl font-semibold text-ink-50 tracking-tight">Tvoj Žnjan loyalty</h1>
          <p className="text-sm text-ink-200/80 mt-1">Bodovi za svaku komunalnu akciju — vrati ih kroz parking i sportske terene.</p>
        </div>
        <Button variant="secondary" onClick={loadAll} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-teal-300" />}
          Osvježi coach
        </Button>
      </header>

      {error && <Banner tone="critical">{error}</Banner>}

      <Card glow className="relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-teal-400/15 blur-3xl" />
        <CardContent className="relative space-y-5">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-200/70">Stanje</div>
              <div className="text-5xl font-semibold text-teal-300 tabular-nums">{user.points}</div>
              <div className="text-sm text-ink-200/80 mt-1">{formatPoints(user.points)} dostupno</div>
            </div>
            {coach && (
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wider text-ink-200/70">Sljedeća razina</div>
                <div className="text-xl font-semibold text-ink-50 tabular-nums">{coach.next_milestone_points}</div>
                <div className="text-xs text-ink-200/70">Još {coach.next_milestone_points - user.points} bodova</div>
              </div>
            )}
          </div>

          {coach && (
            <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-teal-300 transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}

          {coach && (
            <div className="space-y-3 pt-2">
              <div className="text-sm text-ink-100 leading-relaxed">
                <Sparkles className="h-4 w-4 text-teal-300 inline -mt-0.5 mr-1" /> {coach.summary}
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                {coach.recommendations.map((r, i) => (
                  <div key={i} className="rounded-xl bg-white/[0.04] border border-white/10 p-3 text-sm text-ink-100">
                    <Badge tone="teal" className="mb-2">Preporuka {i + 1}</Badge>
                    <div>{r}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Aktivnost</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {events.length === 0 && (
            <div className="text-sm text-ink-200/70">Još nema aktivnosti — započnite s jednom prijavom.</div>
          )}
          {events.map((e) => {
            const meta = KIND_META[e.kind] ?? KIND_META.redeem;
            const Icon = meta.icon;
            const positive = e.delta_points > 0;
            return (
              <div key={e.id} className="flex items-center gap-3 border-b border-white/[0.06] last:border-0 py-2">
                <div className={cn(
                  "h-9 w-9 rounded-lg flex items-center justify-center border",
                  positive ? "bg-teal-400/10 border-teal-300/30" : "bg-white/[0.04] border-white/10",
                )}>
                  <Icon className={cn("h-4 w-4", positive ? "text-teal-300" : "text-ink-200")} />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-ink-50">{meta.label}</div>
                  <div className="text-xs text-ink-200/70">{e.note}</div>
                </div>
                <div className="text-right">
                  <div className={cn("text-sm font-semibold tabular-nums", positive ? "text-teal-300" : "text-coral-400")}>
                    {positive ? "+" : ""}{e.delta_points}
                  </div>
                  <div className="text-[11px] text-ink-200/60">{relativeTime(e.created_at)}</div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
