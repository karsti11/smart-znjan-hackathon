"use client";

import Link from "next/link";
import { Waves } from "lucide-react";
import { RoleSwitcher } from "./role-switcher";
import { Nav } from "./nav";

export function Header() {
  return (
    <header className="relative z-10 border-b border-white/[0.06] bg-ink-950/50 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-teal-400 to-ink-700 flex items-center justify-center shadow-glow">
            <Waves className="h-5 w-5 text-ink-950" />
            <span className="absolute inset-0 rounded-xl animate-pulse-glow" />
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold text-ink-50 tracking-tight">
              Smart <span className="text-teal-300">Žnjan</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-200/70">
              Grad Split · pilot
            </div>
          </div>
        </Link>

        <RoleSwitcher />
      </div>
      <div className="mx-auto max-w-7xl px-6 pb-3">
        <Nav />
      </div>
    </header>
  );
}
