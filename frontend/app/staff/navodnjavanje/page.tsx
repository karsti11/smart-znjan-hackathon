"use client";

import { useEffect, useState } from "react";
import { Clock, Droplets, Loader2, Trees } from "lucide-react";

import { Badge, Banner, Card, CardContent, CardHeader, CardTitle, Input, Metric, Toggle } from "@/components/ui";
import { api } from "@/lib/api";
import type { IrrigationZone } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function NavodnjavanjePage() {
  const [zones, setZones] = useState<IrrigationZone[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try { setZones(await api.listIrrigation()); }
    catch (e) { setError(String(e)); }
  }
  useEffect(() => { void load(); }, []);

  async function update(id: string, patch: Partial<IrrigationZone>) {
    setBusy(id);
    try {
      const updated = await api.updateIrrigation(id, patch);
      setZones((prev) => prev?.map((z) => (z.id === id ? updated : z)) ?? null);
    } catch (e) { setError(String(e)); }
    finally { setBusy(null); }
  }

  const active = zones?.filter((z) => z.is_on).length ?? 0;
  const avgMoisture = zones?.length
    ? Math.round(zones.reduce((s, z) => s + z.soil_moisture, 0) / zones.length) : 0;
  const dryZones = zones?.filter((z) => z.soil_moisture < 30).length ?? 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <Badge tone="teal" className="mb-3"><Trees className="h-3 w-3" /> Navodnjavanje</Badge>
        <h1 className="text-3xl font-semibold text-ink-50 tracking-tight">Sustav navodnjavanja</h1>
        <p className="text-sm text-ink-200/80 mt-1">Pratite vlažnost tla i upravljajte rasporedima zalijevanja.</p>
      </header>

      {error && <Banner tone="critical">{error}</Banner>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric label="Aktivne zone" value={`${active} / ${zones?.length ?? 0}`} />
        <Metric label="Prosječna vlažnost" value={`${avgMoisture}%`} tone={avgMoisture < 40 ? "coral" : "teal"} />
        <Metric label="Suhe zone (<30%)" value={dryZones} tone="coral" />
        <Metric label="Status" value={dryZones > 0 ? "Upozorenje" : "OK"} sub={dryZones > 0 ? "uključite zalijevanje" : "sve u redu"} />
      </div>

      {!zones && <div className="flex items-center gap-2 text-ink-200"><Loader2 className="h-4 w-4 animate-spin" /> Učitavam…</div>}

      <div className="grid md:grid-cols-2 gap-4">
        {zones?.map((z) => {
          const moistureTone = z.soil_moisture < 30 ? "critical" : z.soil_moisture < 55 ? "warning" : "success";
          return (
            <Card key={z.id} glow={z.is_on}>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Droplets className={cn("h-4 w-4", z.is_on ? "text-sky-300" : "text-ink-300")} /> {z.name}
                  </CardTitle>
                  <div className="text-xs text-ink-200/70 mt-1">
                    <Clock className="h-3 w-3 inline mr-1" /> raspored: {z.schedule}
                  </div>
                </div>
                <Toggle on={z.is_on} disabled={busy === z.id} onChange={(v) => update(z.id, { is_on: v })} />
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-ink-200 mb-1.5">
                    <span>Vlažnost tla</span>
                    <Badge tone={moistureTone === "critical" ? "critical" : moistureTone === "warning" ? "warning" : "success"}>
                      {z.soil_moisture}%
                    </Badge>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-700",
                        moistureTone === "critical" ? "bg-rose-400"
                          : moistureTone === "warning" ? "bg-amber-300" : "bg-sky-400",
                      )}
                      style={{ width: `${z.soil_moisture}%` }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-ink-200/70 mb-1.5 block">Raspored zalijevanja</label>
                  <Input
                    value={z.schedule}
                    onChange={(e) => setZones((prev) => prev?.map((x) => x.id === z.id ? { ...x, schedule: e.target.value } : x) ?? null)}
                    onBlur={(e) => void update(z.id, { schedule: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
