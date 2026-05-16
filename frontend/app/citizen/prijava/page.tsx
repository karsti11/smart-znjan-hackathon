"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Loader2,
  MapPin,
  Megaphone,
  Send,
  Sparkles,
  Star,
  Trash2,
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
  TextArea,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useRole } from "@/lib/role-context";
import type { Issue, IssueSeverity } from "@/lib/types";
import { cn, relativeTime } from "@/lib/utils";


const SEVERITY_TONE: Record<IssueSeverity, "neutral" | "info" | "warning" | "critical"> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  critical: "critical",
};

const SEVERITY_LABEL: Record<IssueSeverity, string> = {
  low: "Niski prioritet",
  medium: "Srednji prioritet",
  high: "Visoki prioritet",
  critical: "Kritično",
};

const SAMPLE_REPORTS = [
  {
    label: "Smeće kod plaže",
    desc: "Prepuni kontejneri kod izlaza za plažu, smeće se prelijeva oko klupa već dva dana.",
    where: "Šetalište pape Ivana Pavla II, kod kioska",
  },
  {
    label: "Razbijena lampa",
    desc: "Tri lampe ne rade duž promenade, večeras je bilo skroz mračno od stepenica do parkinga.",
    where: "Promenada, sredina",
  },
  {
    label: "Pukla vodovodna cijev",
    desc: "Voda izbija iz pločnika pored košarkaškog terena, opasno i klizavo.",
    where: "Sportski centar Žnjan",
  },
];

export default function PrijavaPage() {
  const { user, refresh } = useRole();
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<Issue | null>(null);
  const [mine, setMine] = useState<Issue[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadMine() {
    if (!user) return;
    try {
      setMine(await api.userIssues(user.id));
    } catch { /* ignore */ }
  }

  useEffect(() => { void loadMine(); }, [user?.id]); // eslint-disable-line

  function onFile(file: File | null) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Slika je prevelika (max 5 MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function submit() {
    if (!user || !description.trim()) {
      setError("Opišite što ste primijetili.");
      return;
    }
    setBusy(true);
    setError(null);
    setLast(null);
    try {
      const created = await api.createIssue({
        user_id: user.id,
        description: description.trim(),
        location_hint: location.trim(),
        photo_data_url: photo,
      });
      setLast(created);
      await loadMine();
      await refresh();
      setDescription("");
      setLocation("");
      setPhoto(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <Badge tone="ai" className="mb-3"><Sparkles className="h-3 w-3" /> AI klasifikacija</Badge>
        <h1 className="text-3xl font-semibold text-ink-50 tracking-tight">Prijavi problem na Žnjanu</h1>
        <p className="text-sm text-ink-200/80 mt-1 max-w-2xl">
          Slikaj ili opiši — <span className="text-teal-300">Claude</span> automatski klasificira,
          procjenjuje prioritet i šalje na pravi gradski odjel. Svaka prijava donosi bodove.
        </p>
      </header>

      {error && <Banner tone="critical">{error}</Banner>}

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Nova prijava</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-ink-200/70 mb-1.5 block">
                Brzi izbori za demo
              </label>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_REPORTS.map((s) => (
                  <Pill key={s.label} onClick={() => { setDescription(s.desc); setLocation(s.where); }}>
                    {s.label}
                  </Pill>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-ink-200/70 mb-1.5 block">Opis</label>
              <TextArea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Što ste vidjeli? Što treba popraviti?"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-ink-200/70 mb-1.5 block">
                <MapPin className="h-3 w-3 inline mr-1" /> Lokacija (orijentir)
              </label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Npr. Šetalište, kod stepenica za plažu"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-ink-200/70 mb-1.5 block">
                <Camera className="h-3 w-3 inline mr-1" /> Fotografija (opcionalno)
              </label>
              {photo ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="preview" className="rounded-xl border border-white/10 max-h-72 object-cover w-full" />
                  <button
                    type="button"
                    onClick={() => { setPhoto(null); if (fileRef.current) fileRef.current.value = ""; }}
                    className="absolute top-2 right-2 h-8 w-8 rounded-lg bg-ink-900/80 border border-white/15 text-ink-100 hover:text-rose-300 flex items-center justify-center"
                    aria-label="Ukloni sliku"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="block cursor-pointer rounded-xl border border-dashed border-white/15 hover:border-teal-300/40 bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-8 text-center">
                  <Camera className="h-6 w-6 mx-auto text-teal-300/80 mb-2" />
                  <div className="text-sm text-ink-100">Klikni za upload ili snimi</div>
                  <div className="text-xs text-ink-200/60 mt-1">JPG / PNG · do 5 MB · poslat će se Claudeu na vision analizu</div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-ink-200/70">
                <Star className="h-3 w-3 inline text-teal-300 mr-1" />
                Bodovi se dodjeljuju po procijenjenoj ozbiljnosti (15–50 bodova).
              </div>
              <Button onClick={submit} disabled={busy} size="lg">
                {busy
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Claude analizira…</>
                  : <><Send className="h-4 w-4" /> Pošalji prijavu</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {last && (
            <Card glow className="animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-teal-300" /> AI procjena
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge tone={SEVERITY_TONE[last.severity]}>{SEVERITY_LABEL[last.severity]}</Badge>
                  <Badge tone="teal">{last.category}</Badge>
                  <Badge tone="info">prioritet {last.priority_score}/100</Badge>
                  {last.ai_grounded && <Badge tone="ai">Claude</Badge>}
                </div>
                <div className="text-sm text-ink-100">{last.ai_summary}</div>
                <div className="text-xs text-ink-200/70">
                  Usmjereno na: <span className="text-ink-50">{last.suggested_department}</span>
                </div>
                <div className="rounded-xl bg-teal-400/10 border border-teal-400/20 px-3 py-2 text-sm text-teal-100">
                  +{last.points_awarded} bodova dodano na tvoj račun
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Tvoje prijave</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {mine.length === 0 && <div className="text-sm text-ink-200/70">Još nema prijava.</div>}
              {mine.map((i) => (
                <div key={i.id} className="border-b border-white/[0.06] last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge tone={SEVERITY_TONE[i.severity]}>{i.severity}</Badge>
                    <Badge tone="neutral">{i.category}</Badge>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full border",
                      i.status === "resolved" ? "border-emerald-300/30 text-emerald-200 bg-emerald-400/10"
                        : i.status === "in_progress" ? "border-amber-300/30 text-amber-200 bg-amber-400/10"
                        : "border-white/15 text-ink-100 bg-white/[0.05]",
                    )}>{i.status}</span>
                    <span className="text-[11px] text-ink-200/60 ml-auto">{relativeTime(i.created_at)}</span>
                  </div>
                  <div className="text-sm text-ink-100 line-clamp-2">{i.description}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
