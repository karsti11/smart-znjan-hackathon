"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CircleParking,
  Megaphone,
  Sparkles,
  Trophy,
  Volleyball,
} from "lucide-react";

import { Badge, Card, CardContent } from "@/components/ui";
import { api } from "@/lib/api";
import { useRole } from "@/lib/role-context";
import { formatPoints } from "@/lib/utils";

export default function Home() {
  const { user, role } = useRole();
  const [aiReady, setAiReady] = useState<boolean | null>(null);

  useEffect(() => {
    api.health().then((h) => setAiReady(h.ai)).catch(() => setAiReady(false));
  }, []);

  // Staff/admin land on their own dashboards
  if (role === "staff") return <RedirectHint href="/staff" label="Otvori queue prijava" />;
  if (role === "admin") return <RedirectHint href="/admin" label="Otvori admin dashboard" />;

  return (
    <div className="space-y-10">
      <section className="relative animate-slide-up py-6">
        <Badge tone="teal" className="mb-4">
          <Sparkles className="h-3 w-3" /> AI hackathon · {aiReady ? "Claude online" : "offline fallback"}
        </Badge>

        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white text-balance max-w-2xl drop-shadow-[0_2px_24px_rgba(0,0,0,0.85)]">
          Pametni Žnjan koji <span className="text-teal-400">diše s gradom</span>.
        </h1>
        <p className="mt-4 text-white/90 max-w-xl text-balance drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
          Parking u stvarnom vremenu, rezervacija sportskih terena, prijava komunalnih problema
          uz AI klasifikaciju i loyalty bodovi koji vraćaju vrijednost građanima.
        </p>

        {user && (
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-white/[0.08] border border-white/15 backdrop-blur-md">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-coral-400/50 to-ink-700 flex items-center justify-center text-lg">
                {user.avatar_emoji}
              </div>
              <div>
                <div className="text-sm text-sand-200">Dobrodošli, {user.name.split(" ")[0]}</div>
                <div className="text-xs text-coral-400">{formatPoints(user.points)} dostupno</div>
              </div>
            </div>
            <Link
              href="/citizen/prijava"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-coral-500 text-ink-950 font-medium hover:bg-coral-400 transition-all shadow-glow"
            >
              <Megaphone className="h-4 w-4" /> Prijavi problem
            </Link>
            <Link
              href="/citizen/loyalty"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-white/[0.08] border border-white/15 backdrop-blur-md text-sand-200 hover:bg-white/[0.14] transition-all"
            >
              <Trophy className="h-4 w-4" /> Loyalty coach <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

      <section className="grid md:grid-cols-3 gap-5">
        <ModuleCard
          href="/citizen/prijava"
          icon={Megaphone}
          title="Komunalne prijave"
          desc="Slikaj problem — Claude ga automatski klasificira i usmjerava."
          highlight
        />
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
          desc="Rezerviraj tenis, košarku, mali nogomet, odbojku."
        />
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
