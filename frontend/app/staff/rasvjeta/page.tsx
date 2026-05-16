"use client";

import { useEffect, useState } from "react";
import { Lightbulb, Loader2, Zap } from "lucide-react";

import { Badge, Banner, Card, CardContent, CardHeader, CardTitle, Metric, Toggle } from "@/components/ui";
import { api } from "@/lib/api";
import type { LightZone } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function RasvjetaPage() {
  const [zones, setZones] = useState<LightZone[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setZones(await api.listLights());
    } catch (e) {
      setError(String(e));
    }
  }
  useEffect(() => { void load(); }, []);

  async function update(id: string, patch: Partial<LightZone>) {
    setBusy(id);
    try {
      const updated = await api.updateLight(id, patch);
      setZones((prev) => prev?.map((z) => (z.id === id ? updated : z)) ?? null);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  }

  const activeCount = zones?.filter((z) => z.is_on).length ?? 0;
  const totalKw = zones?.filter((z) => z.is_on).reduce((s, z) => s + z.power_kw, 0) ?? 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <Badge tone="teal" className="mb-3"><Lightbulb className="h-3 w-3" /> Javna rasvjeta</Badge>
        <h1 className="text-3xl font-semibold text-ink-50 tracking-tight">Upravljanje rasvjetom Žnjana</h1>
        <p className="text-sm text-ink-200/80 mt-1">Auto režim prati senzore svjetla. Ručno preuzmi za sigurnost ili događaje.</p>
      </header>

      {error && <Banner tone="critical">{error}</Banner>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric label="Aktivne zone" value={`${activeCount} / ${zones?.length ?? 0}`} />
        <Metric label="Potrošnja sada" value={`${totalKw.toFixed(1)} kW`} tone="coral" />
        <Metric label="Auto režim" value={zones?.filter((z) => z.mode === "auto").length ?? 0} sub="zona" />
        <Metric label="Ručno preuzeto" value={zones?.filter((z) => z.mode === "manual").length ?? 0} sub="zona" />
      </div>

      {!zones && <div className="flex items-center gap-2 text-ink-200"><Loader2 className="h-4 w-4 animate-spin" /> Učitavam…</div>}

      <div className="grid md:grid-cols-2 gap-4">
        {zones?.map((z) => (
          <Card key={z.id} glow={z.is_on}>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className={cn("h-4 w-4 transition-colors", z.is_on ? "text-amber-300" : "text-ink-300")} />
                  {z.name}
                </CardTitle>
                <div className="text-xs text-ink-200/70 mt-1">
                  <Zap className="h-3 w-3 inline mr-1" /> {z.power_kw.toFixed(1)} kW · {z.mode === "auto" ? "automatika" : "ručno"}
                </div>
              </div>
              <Toggle on={z.is_on} disabled={busy === z.id} onChange={(v) => update(z.id, { is_on: v })} />
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-ink-200 mb-2">
                  <span>Svjetlina</span>
                  <span className="tabular-nums">{z.brightness}%</span>
                </div>
                <input
                  type="range" min={0} max={100}
                  value={z.brightness}
                  disabled={busy === z.id}
                  onChange={(e) => update(z.id, { brightness: Number(e.target.value) })}
                  className="w-full accent-teal-400"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => update(z.id, { mode: z.mode === "auto" ? "manual" : "auto" })}
                  className={cn(
                    "h-8 px-3 rounded-full text-xs border transition-colors",
                    z.mode === "auto"
                      ? "bg-teal-400/15 text-teal-200 border-teal-300/30"
                      : "bg-white/[0.05] text-ink-100 border-white/10 hover:bg-white/[0.1]",
                  )}
                >
                  {z.mode === "auto" ? "Auto režim" : "Prebaci na auto"}
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
