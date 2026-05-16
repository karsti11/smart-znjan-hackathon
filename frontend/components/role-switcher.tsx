"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ShieldCheck, User2, Wrench } from "lucide-react";
import { useRole } from "@/lib/role-context";
import { cn, formatPoints } from "@/lib/utils";
import type { Role } from "@/lib/types";

const ROLE_LABEL: Record<Role, string> = {
  citizen: "Građanin",
  staff: "Komunalna služba",
  admin: "Gradska uprava",
};
const ROLE_ICON: Record<Role, React.ComponentType<{ className?: string }>> = {
  citizen: User2,
  staff: Wrench,
  admin: ShieldCheck,
};

export function RoleSwitcher() {
  const { user, allUsers, switchTo } = useRole();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) return null;
  const Icon = ROLE_ICON[user.role];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-3 h-11 pl-2 pr-3 rounded-xl glass glass-hover",
          "text-sm text-ink-50 transition-all",
        )}
      >
        <span className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-400/30 to-ink-700/60 flex items-center justify-center text-base">
          {user.avatar_emoji}
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span className="font-semibold">{user.name}</span>
          <span className="text-[10px] uppercase tracking-wider text-teal-300 flex items-center gap-1">
            <Icon className="h-3 w-3" /> {ROLE_LABEL[user.role]}
          </span>
        </span>
        <ChevronDown className={cn("h-4 w-4 text-ink-200 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-[52px] z-50 w-[280px] glass rounded-2xl p-2 animate-slide-up shadow-card">
          <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-ink-200/70">
            Pregledaj kao
          </div>
          {(["citizen", "staff", "admin"] as Role[]).map((r) => (
            <div key={r} className="mb-1 last:mb-0">
              <div className="px-3 py-1 text-[10px] text-teal-300/80 uppercase tracking-wider">
                {ROLE_LABEL[r]}
              </div>
              {allUsers.filter((u) => u.role === r).map((u) => {
                const active = u.id === user.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => { switchTo(u.id); setOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left",
                      "transition-colors hover:bg-white/[0.06]",
                      active && "bg-teal-400/10 ring-1 ring-teal-400/30",
                    )}
                  >
                    <span className="h-7 w-7 rounded-md bg-white/[0.05] flex items-center justify-center">
                      {u.avatar_emoji}
                    </span>
                    <span className="flex-1">
                      <div className="text-sm text-ink-50">{u.name}</div>
                      {u.role === "citizen" && (
                        <div className="text-[11px] text-ink-200/70">{formatPoints(u.points)}</div>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
