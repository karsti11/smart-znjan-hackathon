"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  CircleParking,
  Megaphone,
  Sparkles,
  Trophy,
  Volleyball,
  Waves,
} from "lucide-react";

import { Badge, Card, CardContent, Metric } from "@/components/ui";
import { api } from "@/lib/api";
import { useRole } from "@/lib/role-context";
import type { AdminKpis } from "@/lib/types";
import { formatPoints } from "@/lib/utils";

export default function Home() {
  const { user, role } = useRole();
  const [kpis, setKpis] = useState<AdminKpis | null>(null);
  const [aiReady, setAiReady] = useState<boolean | null>(null);

  useEffect(() => {
    api.kpis().then(setKpis).catch(() => {});
    api.health().then((h) => setAiReady(h.ai)).catch(() => setAiReady(false));
  }, []);

  // Staff/admin land on their own dashboards
  if (role === "staff") return <RedirectHint href="/staff" label="Otvori queue prijava" />;
  if (role === "admin") return <RedirectHint href="/admin" label="Otvori admin dashboard" />;

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl glass p-10 animate-slide-up">
        <div className="absolute -top-24 -right-32 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl animate-wave-slow" />
        <div className="absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-coral-500/10 blur-3xl animate-wave-slow" />

        <Badge tone="teal" className="mb-4">
          <Sparkles className="h-3 w-3" /> AI hackathon · {aiReady ? "Claude online" : "offline fallback"}
        </Badge>

        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-ink-50 text-balance max-w-2xl">
          Pametan Žnjan koji <span className="text-teal-300">diše s gradom</span>.
        </h1>
        <p className="mt-4 text-ink-200 max-w-xl text-balance">
          Parking u stvarnom vremenu, rezervacija sportskih terena, prijava komunalnih problema
          uz AI klasifikaciju i loyalty bodovi koji vraćaju vrijednost građanima.
        </p>

        {user && (
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-white/[0.05] border border-white/10">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-400/30 to-ink-700 flex items-center justify-center text-lg">
                {user.avatar_emoji}
              </div>
              <div>
                <div className="text-sm text-ink-50">Dobrodošli, {user.name.split(" ")[0]}</div>
                <div className="text-xs text-teal-300">{formatPoints(user.points)} dostupno</div>
              </div>
            </div>
            <Link
              href="/citizen/prijava"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-teal-500 text-ink-950 font-medium hover:bg-teal-400 transition-all shadow-glow"
            >
              <Megaphone className="h-4 w-4" /> Prijavi problem
            </Link>
            <Link
              href="/citizen/loyalty"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-white/[0.05] border border-white/10 text-ink-100 hover:bg-white/[0.08] transition-all"
            >
              <Trophy className="h-4 w-4" /> Loyalty coach <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric
          label="Slobodna parking mjesta"
          value={kpis ? Math.round((100 - kpis.parking_occupancy_pct) * 5) : "—"}
          sub="Procjena u realnom vremenu"
        />
        <Metric label="Otvorene prijave" value={kpis?.open_issues ?? "—"} tone="coral" />
        <Metric label="Rezervacije danas" value={kpis?.today_court_reservations ?? "—"} />
        <Metric label="Bodovi u opticaju" value={kpis ? formatPoints(kpis.total_points_circulating) : "—"} />
      </section>

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        <ModuleCard
          href="/citizen/parking"
          icon={CircleParking}
          title="Parking"
          desc="Vidi slobodna mjesta i plati satima ili bodovima."
        />
        <ModuleCard
          href="/citizen/tereni"
          icon={Volleyball}
          title="Sportski tereni"
          desc="Rezerviraj padel, tenis, košarku, mali nogomet."
        />
        <ModuleCard
          href="/citizen/prijava"
          icon={Megaphone}
          title="Komunalne prijave"
          desc="Slikaj problem — Claude ga automatski klasificira i usmjerava."
          highlight
        />
        <ModuleCard
          href="/citizen/loyalty"
          icon={Trophy}
          title="Loyalty"
          desc="Zaradi bodove i iskoristi ih za parking i terene."
        />
        <ModuleCard
          href="/citizen/zauzetost"
          icon={Activity}
          title="Zauzetost & uvidi"
          desc="Kad su parkinzi puni, koji su tereni najtraženiji, gdje najčešće zovu po popravak."
        />
        <Card className="md:col-span-2">
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Waves className="h-4 w-4 text-teal-300" />
              <h3 className="text-base font-semibold text-ink-50">Kako Smart Žnjan radi</h3>
            </div>
            <ol className="text-sm text-ink-200/90 space-y-2 list-decimal list-inside">
              <li>Građani prijavljuju probleme — <span className="text-teal-300">Claude</span> ih kategorizira i usmjerava na pravi odjel.</li>
              <li>Komunalna služba vidi prioritiziranu queue i upravlja rasvjetom, navodnjavanjem i terenima.</li>
              <li>Svaka aktivnost donosi bodove koje gradjani troše na parking ili terene.</li>
              <li>Gradska uprava prati KPI-eve u stvarnom vremenu i optimizira potrošnju energije.</li>
            </ol>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function ModuleCard({
  href, icon: Icon, title, desc, highlight,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  highlight?: boolean;
}) {
  return (
    <Link href={href} className="block">
      <Card glow={highlight} className="h-full">
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-teal-400/20 to-ink-700/40 border border-teal-400/20 flex items-center justify-center">
              <Icon className="h-5 w-5 text-teal-300" />
            </div>
            {highlight && <Badge tone="ai"><Sparkles className="h-3 w-3" /> AI</Badge>}
          </div>
          <div>
            <div className="text-base font-semibold text-ink-50">{title}</div>
            <p className="text-sm text-ink-200/80 mt-1">{desc}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-teal-300/90">
            Otvori <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function RedirectHint({ href, label }: { href: string; label: string }) {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <Card className="p-10 text-center">
        <CardContent className="space-y-4">
          <Badge tone="teal">Drugačiji role</Badge>
          <h2 className="text-2xl font-semibold text-ink-50">Naslovnica je rezervirana za građane.</h2>
          <Link
            href={href}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-teal-500 text-ink-950 font-medium hover:bg-teal-400 transition-all"
          >
            {label} <ArrowRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
