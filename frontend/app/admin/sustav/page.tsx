"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle2, Cpu, Database, Loader2, Sparkles, Wifi } from "lucide-react";

import { Badge, Banner, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { api } from "@/lib/api";

export default function SustavPage() {
  const [health, setHealth] = useState<{ status: string; ai: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pingMs, setPingMs] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const t0 = performance.now();
        const h = await api.health();
        const t1 = performance.now();
        setHealth(h);
        setPingMs(Math.round(t1 - t0));
      } catch (e) {
        setError(String(e));
      }
    })();
  }, []);

  const checks = [
    { label: "Backend API", ok: health?.status === "ok", info: pingMs ? `${pingMs} ms` : "—", icon: Wifi },
    { label: "Baza podataka", ok: !!health, info: "SQLite · lokalno", icon: Database },
    { label: "Claude (AI)", ok: health?.ai ?? false, info: health?.ai ? "live model" : "offline fallback aktivan", icon: Sparkles },
    { label: "Frontend", ok: true, info: "Next.js 15", icon: Cpu },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <Badge tone="teal" className="mb-3"><Activity className="h-3 w-3" /> Sustav</Badge>
        <h1 className="text-3xl font-semibold text-ink-50 tracking-tight">Status sustava</h1>
        <p className="text-sm text-ink-200/80 mt-1">Operativni status servisa i integracija.</p>
      </header>

      {error && <Banner tone="critical">{error}</Banner>}
      {!health && !error && <div className="flex items-center gap-2 text-ink-200"><Loader2 className="h-4 w-4 animate-spin" /> Provjera…</div>}

      <div className="grid md:grid-cols-2 gap-4">
        {checks.map(({ label, ok, info, icon: Icon }) => (
          <Card key={label} glow={ok}>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2"><Icon className="h-4 w-4 text-teal-300" /> {label}</CardTitle>
                <div className="text-xs text-ink-200/70 mt-1">{info}</div>
              </div>
              <Badge tone={ok ? "success" : "warning"}>
                {ok ? <CheckCircle2 className="h-3 w-3" /> : null} {ok ? "OK" : "Pažnja"}
              </Badge>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>O Smart Žnjan platformi</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-ink-100">
          <p>Smart Žnjan je pilot platforma za upravljanje područjem Žnjana u Splitu. Integrira parking, sportske terene, komunalne prijave, rasvjetu i navodnjavanje u jedinstveno sučelje.</p>
          <p>Glavne AI komponente: <span className="text-teal-300">klasifikacija prijava</span> (Claude vision + tekst) i <span className="text-teal-300">loyalty coach</span> (personalizirane preporuke). Bez API ključa platforma koristi offline heuristike kako bi demo uvijek radio.</p>
          <p className="text-ink-200/70">Backend: FastAPI + SQLAlchemy + SQLite · Frontend: Next.js 15 + React 19 + Tailwind 3</p>
        </CardContent>
      </Card>
    </div>
  );
}
