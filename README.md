# Smart Žnjan

Pametno upravljanje područjem Žnjana u Splitu — parking, sportski tereni,
komunalne prijave, loyalty program, javna rasvjeta i navodnjavanje.

3 sloja (citizen / staff / admin), Next.js 15 + FastAPI + Claude.

## Preduvjeti

- **Python 3.10+** (preporučeno 3.12)
- **Node.js 18+** s npm
- (Opcionalno) `ANTHROPIC_API_KEY` — bez njega aplikacija radi s offline heuristikom

## Pokretanje (klon-i-radi)

Trebaš **dva terminala**: jedan za backend (port 8081), jedan za frontend (port 3001).
Backend mora biti up prije nego otvoriš stranice — frontend mu rewrita `/api/*`.

### 0. Kloniraj repo

```powershell
git clone https://github.com/karsti11/smart-znjan-hackathon.git
cd smart-znjan-hackathon
```

### Terminal 1 — Backend (FastAPI, port 8081)

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate            # Windows (PowerShell/cmd)
# source .venv/bin/activate        # macOS / Linux

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8081
```

Pričekaj liniju `Uvicorn running on http://127.0.0.1:8081`. SQLite baza i demo
podaci (korisnici, parkinzi, tereni, prijave) kreiraju se automatski pri prvom
pokretanju (`smart_znjan.db` u `backend/`).

**Opcionalno — za stvarni Claude** (umjesto offline heuristike):

```powershell
copy .env.example .env            # Windows
# cp .env.example .env             # macOS / Linux
# zatim u .env upiši ANTHROPIC_API_KEY=sk-ant-...
```

Bez ključa app **i dalje radi** — koristi keyword heuristike za klasifikaciju prijava i coach poruke.

### Terminal 2 — Frontend (Next.js, port 3001)

```powershell
cd frontend
npm install
npm run dev
```

Pričekaj `Local: http://localhost:3001`, pa otvori taj URL u browseru.

### Provjera da sve radi

- http://localhost:8081/api/v1/health → `{"status":"ok","ai":false}` (ili `true` s API key)
- http://localhost:8081/docs → Swagger UI s 20+ ruta
- http://localhost:3001 → naslovnica s karticama modula

## Što ako ne radi

| Problem | Rješenje |
|---|---|
| `python` ne radi (macOS/Linux) | Koristi `python3` i `python3 -m venv .venv` |
| `ModuleNotFoundError: fastapi` u uvicornu | Aktiviraj venv prije pokretanja: `.venv\Scripts\activate` |
| `Port 8081 already in use` | Drugi backend već radi: `Get-Process python \| Stop-Process` ili promijeni `--port 8082` (+ update `frontend/next.config.ts`) |
| `Port 3001 already in use` | `Get-Process node \| Stop-Process` ili `npx next dev -p 3002` |
| Naslovnica prazna, console: `Failed to fetch /api/v1/...` | Backend nije pokrenut ili je na pogrešnom portu — provjeri Terminal 1 |
| `npm install` puca na `node-gyp` (Windows) | Instaliraj [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (workload "Desktop development with C++") |
| CORS error u browseru | Frontend mora biti na 3001 — to je već dozvoljeno u `backend/.env.example` (`CORS_ORIGINS`) |

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
