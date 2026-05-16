"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────── Button */

type BtnVariant = "primary" | "secondary" | "ghost" | "destructive" | "success" | "teal";
type BtnSize = "sm" | "md" | "lg";

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium " +
  "transition-all duration-200 ease-out " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 " +
  "disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]";

const BTN_VARIANT: Record<BtnVariant, string> = {
  primary:     "bg-teal-500 text-ink-950 hover:bg-teal-400 shadow-[0_0_24px_-6px_rgba(63,213,198,0.6)]",
  teal:        "bg-gradient-to-br from-teal-400 to-teal-600 text-ink-950 hover:from-teal-300 hover:to-teal-500 shadow-glow",
  secondary:   "bg-white/[0.06] text-ink-50 border border-white/10 hover:bg-white/[0.10] hover:border-white/20",
  ghost:       "text-ink-100 hover:bg-white/[0.06]",
  destructive: "bg-rose-500/90 text-white hover:bg-rose-500",
  success:     "bg-emerald-500/90 text-ink-950 hover:bg-emerald-400",
};

const BTN_SIZE: Record<BtnSize, string> = {
  sm: "h-8  px-3.5 text-xs",
  md: "h-10 px-5   text-sm",
  lg: "h-12 px-7   text-base",
};

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize }
>(function Button({ className, variant = "primary", size = "md", ...rest }, ref) {
  return (
    <button
      ref={ref}
      className={cn(BTN_BASE, BTN_VARIANT[variant], BTN_SIZE[size], className)}
      {...rest}
    />
  );
});

/* ──────────────────────────────────────────────────────────── Card */

export function Card({ className, glow, ...rest }: React.HTMLAttributes<HTMLDivElement> & { glow?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl glass glass-hover animate-fade-in",
        glow && "teal-glow",
        className,
      )}
      {...rest}
    />
  );
}

export function CardHeader({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 border-b border-white/[0.06]", className)} {...rest} />;
}
export function CardTitle({ className, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-base font-semibold text-ink-50 tracking-tight", className)} {...rest} />;
}
export function CardDescription({ className, ...rest }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-ink-200/80 mt-0.5", className)} {...rest} />;
}
export function CardContent({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...rest} />;
}
export function CardFooter({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 border-t border-white/[0.06]", className)} {...rest} />;
}

/* ──────────────────────────────────────────────────────────── Badge */

type BadgeTone = "neutral" | "critical" | "warning" | "info" | "success" | "ai" | "teal";

const BADGE_TONE: Record<BadgeTone, string> = {
  neutral:  "bg-white/[0.06] text-ink-100 border-white/10",
  critical: "bg-rose-500/15 text-rose-200 border-rose-400/30",
  warning:  "bg-amber-400/15 text-amber-200 border-amber-300/30",
  info:     "bg-sky-400/15 text-sky-200 border-sky-300/30",
  success:  "bg-emerald-400/15 text-emerald-200 border-emerald-300/30",
  ai:       "bg-violet-400/15 text-violet-200 border-violet-300/30",
  teal:     "bg-teal-400/15 text-teal-200 border-teal-300/30",
};

export function Badge({ tone = "neutral", className, ...rest }: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        BADGE_TONE[tone],
        className,
      )}
      {...rest}
    />
  );
}

/* ──────────────────────────────────────────────────────────── Inputs */

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "block w-full h-11 rounded-xl bg-white/[0.04] border border-white/10 px-4 text-sm text-ink-50 placeholder:text-ink-300/60",
          "focus:outline-none focus:ring-2 focus:ring-teal-400/60 focus:border-teal-400/40",
          "transition-colors disabled:opacity-50",
          className,
        )}
        {...rest}
      />
    );
  },
);

export const TextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextArea({ className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "block w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-ink-50 placeholder:text-ink-300/60",
          "focus:outline-none focus:ring-2 focus:ring-teal-400/60 focus:border-teal-400/40 resize-y min-h-[88px]",
          className,
        )}
        {...rest}
      />
    );
  },
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          "block w-full h-11 rounded-xl bg-white/[0.04] border border-white/10 px-3 text-sm text-ink-50",
          "focus:outline-none focus:ring-2 focus:ring-teal-400/60 focus:border-teal-400/40",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
    );
  },
);

export function Label({ className, ...rest }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-[11px] font-medium uppercase tracking-wider text-ink-200/70 mb-1.5 block", className)} {...rest} />;
}

/* ──────────────────────────────────────────────────────────── Banner */

export function Banner({
  tone = "info", children, className,
}: { tone?: "info" | "warning" | "critical" | "success"; children: React.ReactNode; className?: string }) {
  const toneCls = {
    info:     "bg-sky-500/10 border-sky-400/30 text-sky-100",
    warning:  "bg-amber-500/10 border-amber-400/30 text-amber-100",
    critical: "bg-rose-500/10 border-rose-400/30 text-rose-100",
    success:  "bg-emerald-500/10 border-emerald-400/30 text-emerald-100",
  }[tone];
  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm leading-relaxed backdrop-blur", toneCls, className)}>
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── Metric */

export function Metric({
  label, value, sub, tone = "teal",
}: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "teal" | "coral" | "neutral" }) {
  const valueCls = tone === "teal" ? "text-teal-300" : tone === "coral" ? "text-coral-400" : "text-ink-50";
  return (
    <div className="rounded-2xl glass p-4">
      <div className="text-[11px] uppercase tracking-wider text-ink-200/70">{label}</div>
      <div className={cn("mt-2 text-2xl font-semibold tabular-nums tracking-tight", valueCls)}>{value}</div>
      {sub && <div className="text-xs text-ink-200/60 mt-1">{sub}</div>}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── Gauge */

export function Gauge({
  value, label, max = 100,
}: { value: number; label?: string; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const hue = pct < 40 ? 160 : pct < 80 ? 60 : 0; // green → yellow → red
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-14 w-14 rounded-full flex items-center justify-center">
        <svg className="absolute inset-0" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15"
            fill="none"
            stroke={`hsl(${hue} 70% 55%)`}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 94.25} 94.25`}
            transform="rotate(-90 18 18)"
            style={{ transition: "stroke-dasharray 700ms cubic-bezier(0.4,0,0.2,1)" }}
          />
        </svg>
        <span className="text-xs font-semibold tabular-nums text-ink-50">{Math.round(pct)}%</span>
      </div>
      {label && <span className="text-sm text-ink-100">{label}</span>}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── Toggle */

export function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300",
        on ? "bg-teal-500/80 shadow-[0_0_18px_-2px_rgba(63,213,198,0.55)]" : "bg-white/[0.08]",
        disabled && "opacity-40 cursor-not-allowed",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-ink-50 shadow-md transition-transform duration-300",
          on ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

/* ──────────────────────────────────────────────────────────── Skeleton */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("rounded-xl shimmer", className)} />;
}

/* ──────────────────────────────────────────────────────────── Pill (clickable tab) */

export function Pill({
  active, onClick, children,
}: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3.5 h-8 rounded-full text-xs font-medium transition-all duration-200",
        active
          ? "bg-teal-400/15 text-teal-200 border border-teal-300/30 shadow-[0_0_18px_-6px_rgba(63,213,198,0.5)]"
          : "bg-white/[0.04] text-ink-200 border border-white/10 hover:bg-white/[0.08]",
      )}
    >
      {children}
    </button>
  );
}
