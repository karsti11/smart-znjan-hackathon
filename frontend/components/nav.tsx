"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  CircleParking,
  Lightbulb,
  LayoutDashboard,
  Megaphone,
  Sparkles,
  Trophy,
  Trees,
  Volleyball,
} from "lucide-react";
import { useRole } from "@/lib/role-context";
import { cn } from "@/lib/utils";

const CITIZEN_NAV = [
  { href: "/", label: "Naslovnica", icon: LayoutDashboard },
  { href: "/citizen/parking", label: "Parking", icon: CircleParking },
  { href: "/citizen/tereni", label: "Sportski tereni", icon: Volleyball },
  { href: "/citizen/prijava", label: "Prijava problema", icon: Megaphone },
  { href: "/citizen/zauzetost", label: "Zauzetost", icon: Activity },
  { href: "/citizen/loyalty", label: "Loyalty", icon: Trophy },
];

const STAFF_NAV = [
  { href: "/staff", label: "Prijave (queue)", icon: Megaphone },
  { href: "/staff/rasvjeta", label: "Rasvjeta", icon: Lightbulb },
  { href: "/staff/navodnjavanje", label: "Navodnjavanje", icon: Trees },
  { href: "/staff/tereni", label: "Sportski tereni", icon: Volleyball },
];

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/statistika", label: "Statistika", icon: BarChart3 },
  { href: "/admin/loyalty", label: "Loyalty pregled", icon: Trophy },
  { href: "/admin/sustav", label: "Sustav", icon: Sparkles },
];

export function Nav() {
  const { role } = useRole();
  const pathname = usePathname();
  const items = role === "admin" ? ADMIN_NAV : role === "staff" ? STAFF_NAV : CITIZEN_NAV;

  return (
    <nav className="flex items-center gap-1 overflow-x-auto pb-1">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "group flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium whitespace-nowrap",
              "transition-all duration-200",
              active
                ? "bg-teal-400/10 text-teal-200 ring-1 ring-teal-400/30 shadow-[0_0_18px_-6px_rgba(63,213,198,0.5)]"
                : "text-ink-200 hover:text-ink-50 hover:bg-white/[0.05]",
            )}
          >
            <Icon className={cn("h-4 w-4", active ? "text-teal-300" : "text-ink-200 group-hover:text-teal-300")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
