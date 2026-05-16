"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Loader2, Volleyball } from "lucide-react";

import { Badge, Banner, Card, CardContent, CardHeader, CardTitle, Metric } from "@/components/ui";
import { api } from "@/lib/api";
import type { Court, Reservation, User } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function StaffTereni() {
  const [courts, setCourts] = useState<Court[] | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [reservations, setReservations] = useState<Record<string, Reservation[]>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [cs, us] = await Promise.all([api.listCourts(), api.listUsers()]);
        setCourts(cs);
        setUsers(us);
        const all = await Promise.all(
          us.filter((u) => u.role === "citizen").map((u) => api.userReservations(u.id))
        );
        const map: Record<string, Reservation[]> = {};
        for (const list of all) for (const r of list) {
          map[r.court_id] = [...(map[r.court_id] ?? []), r];
        }
        setReservations(map);
      } catch (e) {
        setError(String(e));
      }
    })();
  }, []);

  const totalReservations = Object.values(reservations).reduce((s, l) => s + l.length, 0);
  const upcoming = Object.values(reservations).flat().filter((r) => new Date(r.starts_at) > new Date()).length;

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <Badge tone="teal" className="mb-3"><Volleyball className="h-3 w-3" /> Sportski tereni · ops</Badge>
        <h1 className="text-3xl font-semibold text-ink-50 tracking-tight">Operacije sportskih terena</h1>
        <p className="text-sm text-ink-200/80 mt-1">Pregled iskoristivosti i rezervacija svih terena na Žnjanu.</p>
      </header>

      {error && <Banner tone="critical">{error}</Banner>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric label="Terena ukupno" value={courts?.length ?? 0} />
        <Metric label="Rezervacije ukupno" value={totalReservations} />
        <Metric label="Nadolazeće" value={upcoming} tone="teal" />
        <Metric label="Pod reflektorima" value={courts?.filter((c) => c.has_lights).length ?? 0} sub="večernji termini" />
      </div>

      {!courts && <div className="flex items-center gap-2 text-ink-200"><Loader2 className="h-4 w-4 animate-spin" /> Učitavam…</div>}

      <div className="grid md:grid-cols-2 gap-4">
        {courts?.map((c) => {
          const list = reservations[c.id] ?? [];
          return (
            <Card key={c.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle>{c.name}</CardTitle>
                  <div className="text-xs text-ink-200/70 mt-1">{c.sport} · {c.surface}</div>
                </div>
                <Badge tone="teal">{list.length} rez.</Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {list.length === 0 && <div className="text-sm text-ink-200/70">Nema rezervacija.</div>}
                {list.slice(0, 5).map((r) => {
                  const u = users.find((x) => x.id === r.user_id);
                  const isUpcoming = new Date(r.starts_at) > new Date();
                  return (
                    <div key={r.id} className="flex items-center gap-3 text-sm border-b border-white/[0.06] last:border-0 pb-2 last:pb-0">
                      <CalendarClock className={cn("h-4 w-4", isUpcoming ? "text-teal-300" : "text-ink-300")} />
                      <div className="flex-1">
                        <div className="text-ink-50">{u?.name ?? r.user_id}</div>
                        <div className="text-xs text-ink-200/70">{new Date(r.starts_at).toLocaleString("hr-HR")}</div>
                      </div>
                      <Badge tone={r.status === "confirmed" ? "success" : r.status === "completed" ? "neutral" : "warning"}>{r.status}</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
