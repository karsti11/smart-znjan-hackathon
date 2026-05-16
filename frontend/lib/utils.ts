import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEur(amount: number): string {
  return new Intl.NumberFormat("hr-HR", { style: "currency", currency: "EUR" }).format(amount);
}

export function formatPoints(p: number): string {
  return `${new Intl.NumberFormat("hr-HR").format(p)} bod.`;
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "upravo";
  if (m < 60) return `prije ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `prije ${h} h`;
  const d = Math.floor(h / 24);
  return `prije ${d} d`;
}
