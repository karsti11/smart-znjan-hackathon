"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleParking,
  Lightbulb,
  Loader2,
  Megaphone,
  ShieldCheck,
  Trophy,
  Users,
  Volleyball,
  Zap,
} from "lucide-react";

import { Badge, Banner, Card, CardContent, CardHeader, CardTitle, Metric } from "@/components/ui";
import { api } from "@/lib/api";
import type { AdminKpis, Issue } from "@/lib/types";

export default function AdminDashboard() {
  const [kpis, setKpis] = useState<AdminKpis | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [aiReady, setAiReady] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [k, i, h] = await Promise.all([api.kpis(), api.listIssues(), api.health()]);
      setKpis(k); setIssues(i); setAiReady(h.ai);
    } catch (e) {
      setError(String(e));
    }
  }

  useEffect(() => { void load(); }, []);

  const topPriority = [...issues].sort((a, b) => b.priority_score - a.priority_score).slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <Badge tone="teal" className="mb-3"><ShieldCheck className="h-3 w-3" /> Gradska uprava</Badge>
          <h1 className="text-3xl font-semibold text-ink-50 tracking-tight">Smart Žnjan · Dashboard</h1>
          <p className="text-sm text-ink-200/80 mt-1">KPI-evi u realnom vremenu. Praćenje sustava, prijava i energije.</p>
        </div>
        <Badge tone={aiReady ? "success" : "warning"}>
          {aiReady ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
          {aiReady ? "Claude online" : "Offline fallback"}
        </Badge>
      </header>

      {error && <Banner tone="critical">{error}</Banner>}
      {!kpis && <div className="flex items-center gap-2 text-ink-200"><Loader2 className="h-4 w-4 animate-spin" /> Učitavam KPI-eve…</div>}

      {kpis && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Metric label="Korisnika ukupno" value={kpis.total_users} sub={`${kpis.citizens} građana`} />
            <Metric label="Otvorene prijave" value={kpis.open_issues} tone="coral" />
            <Metric label="Riješeno danas" value={kpis.resolved_today} tone="teal" />
            <Metric label="Parking zauzetost" value={`${kpis.parking_occupancy_pct}%`} tone={kpis.parking_occupancy_pct > 80 ? "coral" : "teal"} />
            <Metric label="Rezervacije danas" value={kpis.today_court_reservations} />
            <Metric label="Aktivne lampe" value={kpis.active_lights} sub="javna rasvjeta" />
            <Metric label="Energija sada" value={`${kpis.energy_kw.toFixed(1)} kW`} tone="coral" />
            <Metric label="Bodovi u opticaju" value={kpis.total_points_circulating.toLocaleString("hr-HR")} tone="teal" />
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-teal-300" /> Top 5 prioritetnih prijava
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topPriority.map((i) => (
                  <div key={i.id} className="flex items-center gap-3 border-b border-white/[0.06] last:border-0 pb-3 last:pb-0">
                    <div className="h-10 w-10 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-sm font-semibold tabular-nums text-teal-300">
                      {i.priority_score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge tone={i.severity === "critical" ? "critical" : i.severity === "high" ? "warning" : "info"}>{i.severity}</Badge>
                        <Badge tone="neutral">{i.category}</Badge>
                        <span className="text-[10px] text-ink-200/70 ml-auto">{i.suggested_department}</span>
                      </div>
                      <div className="text-sm text-ink-50 truncate">{i.ai_summary || i.description}</div>
                    </div>
                  </div>
                ))}
                {topPriority.length === 0 && <div className="text-sm text-ink-200/70">Nema otvorenih prijava 🌅</div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-teal-300" /> Pregled modula
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <ModuleRow icon={CircleParking} label="Parking" value={`${kpis.parking_occupancy_pct}% zauzeto`} />
                <ModuleRow icon={Volleyball} label="Sportski tereni" value={`${kpis.today_court_reservations} rez. danas`} />
                <ModuleRow icon={Megaphone} label="Prijave" value={`${kpis.open_issues} otvorenih`} />
                <ModuleRow icon={Lightbulb} label="Rasvjeta" value={`${kpis.active_lights} zona aktivno`} />
                <ModuleRow icon={Zap} label="Energija" value={`${kpis.energy_kw.toFixed(1)} kW`} />
                <ModuleRow icon={Trophy} label="Loyalty" value={`${kpis.total_points_circulating.toLocaleString("hr-HR")} bod.`} />
                <ModuleRow icon={Users} label="Građani" value={`${kpis.citizens}`} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function ModuleRow({
  icon: Icon, label, value,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex items-center gap-2.5 text-ink-100">
        <Icon className="h-4 w-4 text-teal-300" />
        <span>{label}</span>
      </div>
      <span className="text-ink-200/80 tabular-nums">{value}</span>
    </div>
  );
}
