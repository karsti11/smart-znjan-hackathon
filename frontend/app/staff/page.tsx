"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Megaphone,
  PencilLine,
  RefreshCw,
  Save,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";

import {
  Badge,
  Banner,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Pill,
  Select,
} from "@/components/ui";
import { api } from "@/lib/api";
import type { Issue, IssueSeverity, IssueStatus } from "@/lib/types";
import { cn, relativeTime } from "@/lib/utils";

const SEVERITY_TONE: Record<IssueSeverity, "neutral" | "info" | "warning" | "critical"> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  critical: "critical",
};

const STATUS_LABEL: Record<IssueStatus, string> = {
  open: "Otvorene",
  in_progress: "U radu",
  resolved: "Riješeno",
};

const ISSUE_CATEGORIES = [
  "smeće", "rasvjeta", "vandalizam", "infrastruktura", "zelenilo",
  "voda", "parking", "buka", "životinje", "ostalo",
] as const;

const SEVERITY_OPTIONS: IssueSeverity[] = ["low", "medium", "high", "critical"];

const STATUS_ICON: Record<IssueStatus, React.ComponentType<{ className?: string }>> = {
  open: Megaphone,
  in_progress: Wrench,
  resolved: CheckCircle2,
};

type OverrideDraft = { category: string; severity: IssueSeverity; note: string };

export default function StaffQueue() {
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [filter, setFilter] = useState<IssueStatus | "all">("open");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<OverrideDraft>({ category: "ostalo", severity: "medium", note: "" });
  const [flash, setFlash] = useState<string | null>(null);

  async function load() {
    try {
      const data = await api.listIssues();
      setIssues(data);
    } catch (e) {
      setError(String(e));
    }
  }

  useEffect(() => { void load(); }, []);

  const counts = useMemo(() => {
    const c = { open: 0, in_progress: 0, resolved: 0, all: 0 };
    (issues ?? []).forEach((i) => { c[i.status]++; c.all++; });
    return c;
  }, [issues]);

  const filtered = useMemo(() => {
    if (!issues) return [];
    return filter === "all" ? issues : issues.filter((i) => i.status === filter);
  }, [issues, filter]);

  async function transition(id: string, status: IssueStatus) {
    setBusy(id + status);
    try {
      await api.updateIssueStatus(id, status);
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  }

  async function reclassify(id: string) {
    setBusy(id + "rc");
    try {
      await api.reclassify(id);
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  }

  function startEdit(i: Issue) {
    setEditing(i.id);
    setDraft({ category: i.category, severity: i.severity, note: "" });
  }

  async function saveOverride(id: string) {
    setBusy(id + "ov");
    try {
      await api.overrideIssue(id, draft);
      setEditing(null);
      setFlash(id);
      setTimeout(() => setFlash((curr) => (curr === id ? null : curr)), 2500);
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <Badge tone="ai" className="mb-3"><Sparkles className="h-3 w-3" /> AI triage</Badge>
          <h1 className="text-3xl font-semibold text-ink-50 tracking-tight">Komunalne prijave — queue</h1>
          <p className="text-sm text-ink-200/80 mt-1">Sortirano po prioritetu (AI score). Klikni za prijelaz stanja.</p>
        </div>
        <Button variant="secondary" onClick={load}><RefreshCw className="h-4 w-4" /> Osvježi</Button>
      </header>

      {error && <Banner tone="critical">{error}</Banner>}

      <div className="flex flex-wrap gap-2">
        {(["open", "in_progress", "resolved", "all"] as const).map((s) => {
          const c = s === "all" ? counts.all : counts[s];
          const label = s === "all" ? "Sve" : STATUS_LABEL[s];
          return (
            <Pill key={s} active={filter === s} onClick={() => setFilter(s)}>
              {label} <span className="ml-1.5 text-ink-200/70">·</span> <span className="tabular-nums">{c}</span>
            </Pill>
          );
        })}
      </div>

      {!issues && <div className="flex items-center gap-2 text-ink-200"><Loader2 className="h-4 w-4 animate-spin" /> Učitavam queue…</div>}

      <div className="grid lg:grid-cols-2 gap-4">
        {filtered.map((i) => {
          const StatusIcon = STATUS_ICON[i.status];
          return (
            <Card key={i.id} className={cn("animate-fade-in", flash === i.id && "ring-2 ring-teal-400/60 shadow-glow")}>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 flex-wrap">
                    <Badge tone={SEVERITY_TONE[i.severity]}>{i.severity}</Badge>
                    <Badge tone="teal">{i.category}</Badge>
                    <span className="text-xs font-normal text-ink-200/70">prioritet {i.priority_score}/100</span>
                    {i.ai_grounded && <Badge tone="ai">Claude</Badge>}
                  </CardTitle>
                  <div className="flex items-center gap-3 text-xs text-ink-200/70 mt-2">
                    {i.location_hint && (<span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {i.location_hint}</span>)}
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {relativeTime(i.created_at)}</span>
                  </div>
                </div>
                <PriorityRing score={i.priority_score} />
              </CardHeader>
              <CardContent className="space-y-3">
                {i.photo_data_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={i.photo_data_url} alt="" className="rounded-xl border border-white/10 max-h-44 w-full object-cover" />
                )}
                <p className="text-sm text-ink-100">{i.description}</p>
                <div className="rounded-xl bg-violet-400/10 border border-violet-300/20 px-3 py-2 text-xs text-violet-100">
                  <strong className="text-violet-200">AI sažetak:</strong> {i.ai_summary}<br />
                  <span className="text-ink-200/80">Usmjereno: {i.suggested_department}</span>
                </div>
                {editing === i.id && (
                  <div className="rounded-xl border border-teal-300/30 bg-teal-400/[0.05] p-3 space-y-3 animate-slide-up">
                    <div className="flex items-center gap-2 text-xs text-teal-200">
                      <PencilLine className="h-3.5 w-3.5" /> Ispravak AI klasifikacije — bit će ubačen kao primjer u sljedeću Claude analizu.
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-ink-200/70 mb-1 block">Kategorija</label>
                        <Select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                          {ISSUE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </Select>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-ink-200/70 mb-1 block">Ozbiljnost</label>
                        <Select value={draft.severity} onChange={(e) => setDraft({ ...draft, severity: e.target.value as IssueSeverity })}>
                          {SEVERITY_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-ink-200/70 mb-1 block">Napomena za AI (opcionalno)</label>
                      <Input
                        value={draft.note}
                        onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                        placeholder="Npr. 'curenje vode iz kontejnera = obično je puknuta cijev ispod, ne smeće.'"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                        <X className="h-3.5 w-3.5" /> Odustani
                      </Button>
                      <Button size="sm" disabled={busy === i.id + "ov"} onClick={() => saveOverride(i.id)}>
                        {busy === i.id + "ov" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        Spremi ispravak
                      </Button>
                    </div>
                  </div>
                )}

                {flash === i.id && (
                  <div className="text-xs text-teal-200 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Ispravak spremljen — AI će ga koristiti u sljedećoj klasifikaciji.
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-2 flex-wrap">
                  <div className="flex items-center gap-2 text-xs text-ink-200/70">
                    <StatusIcon className="h-3.5 w-3.5" /> {STATUS_LABEL[i.status]}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {editing !== i.id && (
                      <Button size="sm" variant="ghost" onClick={() => startEdit(i)}>
                        <PencilLine className="h-3.5 w-3.5 text-teal-300" /> Ispravi AI
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" disabled={busy === i.id + "rc"} onClick={() => reclassify(i.id)}>
                      {busy === i.id + "rc" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-teal-300" />}
                      Reklasificiraj
                    </Button>
                    {i.status === "open" && (
                      <Button size="sm" variant="secondary" disabled={busy === i.id + "in_progress"} onClick={() => transition(i.id, "in_progress")}>
                        <Wrench className="h-3.5 w-3.5" /> Preuzmi
                      </Button>
                    )}
                    {i.status !== "resolved" && (
                      <Button size="sm" disabled={busy === i.id + "resolved"} onClick={() => transition(i.id, "resolved")}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Riješi
                      </Button>
                    )}
                    {i.status === "resolved" && (
                      <Badge tone="success" className="px-3 py-1"><CheckCircle2 className="h-3 w-3" /> Završeno</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && issues && (
        <Card><CardContent className="text-center text-ink-200/70 py-10">Nema prijava u ovom filteru.</CardContent></Card>
      )}
    </div>
  );
}

function PriorityRing({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const hue = pct < 40 ? 160 : pct < 75 ? 45 : 0;
  return (
    <div className="relative h-12 w-12 flex items-center justify-center">
      <svg className="absolute inset-0" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
        <circle
          cx="18" cy="18" r="15"
          fill="none"
          stroke={`hsl(${hue} 70% 55%)`}
          strokeWidth="3" strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 94.25} 94.25`}
          transform="rotate(-90 18 18)"
          style={{ transition: "stroke-dasharray 700ms cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <span className="text-[11px] font-semibold tabular-nums text-ink-50">{pct}</span>
    </div>
  );
}
