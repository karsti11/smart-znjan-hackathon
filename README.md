# Smart Žnjan

Pametno upravljanje područjem Žnjana u Splitu — parking, sportski tereni,
komunalne prijave, loyalty program, javna rasvjeta i navodnjavanje.

3 sloja (citizen / staff / admin), Next.js 15 + FastAPI + Claude.

## Preduvjeti

- **Python 3.10+** (preporučeno 3.12)
- **Node.js 18+** s npm
- (Opcionalno) `ANTHROPIC_API_KEY` — bez njega aplikacija radi s offline heuristikom

## Brzi start

### Backend (FastAPI, port 8081)

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate           # Windows (PowerShell/cmd)
# source .venv/bin/activate       # macOS / Linux

pip install -r requirements.txt

# (opcionalno) za stvarni Claude:
copy .env.example .env           # Windows
# cp .env.example .env            # macOS / Linux
# zatim u .env upiši ANTHROPIC_API_KEY=sk-...

uvicorn app.main:app --reload --port 8081
```

Bez `ANTHROPIC_API_KEY` aplikacija koristi offline heuristike — demo radi.

### Frontend (Next.js, port 3001)

```powershell
cd frontend
npm install
npm run dev
```

Otvori `http://localhost:3001`. Backend mora biti pokrenut paralelno na portu 8081
(Next.js rewrita `/api/*` → `http://127.0.0.1:8081/api/*`, vidi `next.config.ts`).

## Demo flow (5 min)

1. **Naslovnica** (kao Ana Marić, građanka) — kartice modula, KPI traka.
2. **Prijava problema** — klik na "Smeće kod plaže", opcionalno upload slike,
   pošalji. Claude vraća kategoriju, ozbiljnost, prioritet i odjel.
3. **Loyalty** — vidi novo bodovno stanje + AI coach poruku.
4. **Parking** — plati 2 sata bodovima, vidi balans odmah ažuriran.
5. **Role switcher → Staff** — queue prijava sortiran po prioritetu, jedan klik = "Preuzmi" / "Riješi".
6. **Staff → Rasvjeta** — toggle zone, slider svjetline, vidi potrošnju kW.
7. **Role switcher → Admin** — KPI dashboard, top prioritetne prijave, leaderboard.

## Arhitektura

```
ai_hackathon_split/
├── backend/                      FastAPI · SQLAlchemy · SQLite · Anthropic SDK
│   ├── app/
│   │   ├── main.py               app + lifespan (seed_all)
│   │   ├── config.py             pydantic-settings (.env)
│   │   ├── api/                  users · parking · courts · issues · loyalty · infra · admin
│   │   ├── db/                   session · models
│   │   ├── engine/               schema · ai (classify_issue + loyalty_coach)
│   │   └── seed/demo.py          idempotent demo data
│   ├── requirements.txt
│   └── .env.example
└── frontend/                     Next.js 15 · React 19 · Tailwind 3 · TS
    ├── app/
    │   ├── layout.tsx            RoleProvider · Header · sea-sheen
    │   ├── page.tsx              citizen naslovnica (redirect za staff/admin)
    │   ├── citizen/{parking,tereni,prijava,loyalty}/page.tsx
    │   ├── staff/{(queue),rasvjeta,navodnjavanje,tereni}/page.tsx
    │   └── admin/{(dashboard),loyalty,sustav}/page.tsx
    ├── components/               ui · header · nav · role-switcher
    └── lib/                      api · types · utils · role-context
```

## AI integracija

Dvije Claude površine, obje s offline fallbackom (heuristika) tako da demo
radi bez API ključa.

- **`classify_issue`** (forced tool use): foto + tekst → `category`,
  `severity`, `priority_score`, `suggested_department`, `summary`.
- **`loyalty_coach`** (forced tool use): user + loyalty events → `summary`,
  `recommendations`, `next_milestone_points`.

Model: `claude-opus-4-7` (override preko `ANTHROPIC_MODEL`).

## Vizualni jezik

Mediteranski dark glassmorphism:

- Pozadina: `radial-gradient` (teal + ink-blue + coral nakon),
  `linear-gradient(180deg, #04122a, #02091a)`.
- Kartice: `bg-white/[0.04]` + `backdrop-blur-xl` + `border-white/10`.
- Akcenti: `teal-400/300` (`#3fd5c6` / `#7ce2d7`) s glow sjenom.
- Tipografija: SF / Inter, `text-balance` za naslove.
- Animacije: `fade-in`, `slide-up`, `pulse-glow`, `wave-slow` — sve cubic-bezier(0.4,0,0.2,1).
- Reduced-motion respected.
