# Smart Žnjan — Tehnička dokumentacija

Ovaj dokument je referencija stanja aplikacije. Cilj je da netko (uključujući tebe u novoj sesiji)
može u 10 minuta razumjeti **gdje je što i kako se mijenja**, bez čitanja koda redom.

Za upute kako pokrenuti aplikaciju lokalno pogledaj **[README.md](README.md)**.

---

## 1. Što aplikacija radi

Pilot platforma za upravljanje područjem **Žnjana u Splitu**. Tri sloja, svaki vidi različito sučelje:

| Sloj      | Tko                | Što radi                                                                       |
|-----------|--------------------|--------------------------------------------------------------------------------|
| `citizen` | Građani            | Vide slobodne parkinge i plaćaju, rezerviraju sportske terene, prijavljuju komunalne probleme s AI klasifikacijom, prate loyalty bodove i analitiku zauzetosti |
| `staff`   | Komunalna služba   | Queue prijava sortirana po prioritetu, upravljanje rasvjetom i navodnjavanjem, pregled rezervacija terena |
| `admin`   | Gradska uprava     | KPI dashboard, analitika (heatmap, top problemi), loyalty leaderboard, status sustava |

Layer se mijenja **role switcherom u headeru** (gore desno) — nema auth-a, prebacuje se klikom.

---

## 2. Tehnologijski stack

| Sloj      | Tehnologije                                                                |
|-----------|----------------------------------------------------------------------------|
| Backend   | Python 3.10+ · FastAPI · SQLAlchemy 2.x · SQLite · Pydantic · Anthropic SDK |
| Frontend  | Next.js 15 (App Router) · React 19 · TypeScript 5.6 · Tailwind 3 · lucide-react |
| AI        | Claude (`claude-opus-4-7`, override `ANTHROPIC_MODEL`), forced tool use, offline heuristike kad nema ključa |
| Portovi   | Backend 8081 · Frontend 3001 (`next.config.ts` rewriteom šalje `/api/*` na 8081) |
| Baza      | `backend/smart_znjan.db` (auto-kreira se, seedira na lifespan startupu)   |

---

## 3. Struktura direktorija

```
ai_hackathon_split/
├── README.md                 Klon-i-pokreni upute
├── DOCS.md                   Ovaj dokument
├── .gitignore / .gitattributes
├── backend/
│   ├── requirements.txt      8 paketa (FastAPI, uvicorn, pydantic, anthropic…)
│   ├── .env.example          ANTHROPIC_API_KEY / ANTHROPIC_MODEL / DATABASE_URL / CORS_ORIGINS
│   └── app/
│       ├── main.py           FastAPI app + lifespan (Base.metadata.create_all + seed_all)
│       ├── config.py         pydantic-settings (.env loader)
│       ├── api/              jedan router po domeni
│       │   ├── users.py      GET /users, GET /users/{id}
│       │   ├── parking.py    GET /parking/lots, POST /parking/sessions, POST /parking/lots/{id}/free-one
│       │   ├── courts.py     GET /courts, GET /courts/{id}/reservations, POST /courts/reservations, GET /courts/reservations/by-user/{uid}
│       │   ├── issues.py     GET /issues, GET /issues/by-user/{uid}, POST /issues, PUT /issues/{id}/status, POST /issues/{id}/reclassify
│       │   ├── loyalty.py    GET /loyalty/events/{uid}, GET /loyalty/coach/{uid}
│       │   ├── infra.py      GET/PUT /infra/lights/{?id}, GET/PUT /infra/irrigation/{?id}
│       │   ├── admin.py      GET /admin/kpis, GET /admin/stats   (analitika full detail)
│       │   ├── insights.py   GET /insights/citizen                (citizen-friendly verzija)
│       │   └── common.py     new_id(prefix) helper
│       ├── db/
│       │   ├── session.py    SQLAlchemy engine + get_db()
│       │   └── models.py     User, ParkingLot, Court, Reservation, Issue, LoyaltyEvent, LightZone, IrrigationZone
│       ├── engine/
│       │   ├── schema.py     Pydantic modeli (request/response)
│       │   └── ai.py         classify_issue() + loyalty_coach() s forced tool use + heuristic fallbacks
│       └── seed/
│           └── demo.py       Idempotentni seed (statične liste + generirana 14-dnevna povijest)
└── frontend/
    ├── next.config.ts        Rewrites /api/* -> http://127.0.0.1:8081/api/*
    ├── tailwind.config.ts    ink/teal/coral paleta, keyframes (fade-in, slide-up, pulse-glow, hero-pan, wave-slow)
    ├── app/
    │   ├── layout.tsx        RoleProvider · Header · sea-sheen fixed overlay
    │   ├── globals.css       glass / glass-hover / teal-glow utility classes + scrollbar
    │   ├── page.tsx          Citizen naslovnica (Hero video + 5 modul-kartica + KPI metrike)
    │   ├── citizen/
    │   │   ├── parking/page.tsx     Lista parkinga, plaćanje EUR ili bodovima
    │   │   ├── tereni/page.tsx      Lista terena + booking sticky panel
    │   │   ├── prijava/page.tsx     Foto upload + opis + lokacija -> AI klasifikacija
    │   │   ├── loyalty/page.tsx     Stanje + progress + AI coach + event lista
    │   │   └── zauzetost/page.tsx   Lightweight insights (heatmap-lite + court demand + problem lokacije)
    │   ├── staff/
    │   │   ├── page.tsx                  Queue prijava sortirana po priority_score
    │   │   ├── rasvjeta/page.tsx         Toggle zona + slider svjetline + KW potrošnja
    │   │   ├── navodnjavanje/page.tsx    Toggle zona + soil moisture + raspored
    │   │   └── tereni/page.tsx           Pregled svih rezervacija po terenu
    │   └── admin/
    │       ├── page.tsx           KPI dashboard + top 5 prioritetnih prijava + module summary
    │       ├── statistika/page.tsx  Full analitika (7x24 heatmap + kategorije + top lokacije)
    │       ├── loyalty/page.tsx   Leaderboard + lifetime stats + pravila bodovanja
    │       └── sustav/page.tsx    Status backend / DB / Claude / frontend
    ├── components/
    │   ├── ui.tsx                Button · Card · Badge · Input · TextArea · Select · Label · Banner · Metric · Gauge · Toggle · Skeleton · Pill
    │   ├── header.tsx            Logo (Waves) + RoleSwitcher + Nav
    │   ├── nav.tsx               CITIZEN_NAV / STAFF_NAV / ADMIN_NAV (role-based linkovi)
    │   ├── role-switcher.tsx     Dropdown s 3 grupe korisnika
    │   └── hero-video.tsx        Streamani video sa split.hr + dark overlay + fallback
    └── lib/
        ├── api.ts                fetch wrapperi (svi pod /api/v1)
        ├── types.ts              TypeScript ogledalo backend Pydantic modela
        ├── role-context.tsx      RoleProvider + useRole() (localStorage persist)
        └── utils.ts              cn() · formatEur() · formatPoints() · relativeTime()
```

---

## 4. Backend — modeli i tablice

Sve tablice su SQLAlchemy 2.x deklarativne, kreiraju se na lifespan startupu (`Base.metadata.create_all`).
Detaljne definicije u [backend/app/db/models.py](backend/app/db/models.py).

| Tablica            | Ključ      | Notable polja                                                                                 |
|--------------------|------------|-----------------------------------------------------------------------------------------------|
| `users`            | `id`       | `name`, `role` ∈ {citizen, staff, admin}, `points` (int), `avatar_emoji`                       |
| `parking_lots`     | `id`       | `name`, `address`, `capacity`, `occupied`, `price_per_hour_eur`, `lat`, `lng`                  |
| `courts`           | `id`       | `name`, `sport` ∈ {tenis, nogomet, košarka, odbojka}, `surface`, `price_per_hour_eur`, `has_lights` |
| `reservations`     | `id`       | FK → user + court, `starts_at`, `ends_at`, `paid_eur`, `paid_points`, `status`                |
| `issues`           | `id`       | FK → user, `description`, `location_hint`, `photo_data_url` (base64), AI polja, `status`, `points_awarded` |
| `loyalty_events`   | `id`       | FK → user, `kind` ∈ {report, reservation, parking, redeem}, `delta_points`, `note`            |
| `light_zones`      | `id`       | `name`, `is_on`, `brightness` (0-100), `mode` ∈ {auto, manual}, `power_kw`                    |
| `irrigation_zones` | `id`       | `name`, `is_on`, `soil_moisture` (0-100), `schedule` (npr. "04:30–05:30")                     |

Nema FK constrainta zbog SQLite (declared kroz ForeignKey ali SQLite ne provodi by default — namjerno za demo brzinu).

---

## 5. Seed strategija ([backend/app/seed/demo.py](backend/app/seed/demo.py))

**Sve seed funkcije su idempotentne** — pokreću se na svakom lifespan startupu i preskaču ako su podaci već tamo.

Redoslijed:

1. `_ensure_users` — 4 korisnika (Ana 640 bod, Ivan 120 bod, Marko staff, Vesna admin)
2. `_ensure_parking` — 4 parkinga (1.00–1.50 EUR/h)
3. `_ensure_courts` — 4 terena (tenis, košarka, mali nogomet, odbojka)
4. `_ensure_lights` — 4 svjetlosne zone
5. `_ensure_irrigation` — 3 zone navodnjavanja
6. `_ensure_issues` — 3 ručno postavljene prijave
7. `_ensure_loyalty` — 5 ručnih loyalty eventova
8. `_ensure_reservations` — 1 seed rezervacija (rsv_seed_1)
9. `_ensure_rich_history` — **30 prijava** razasutih po 8 lokacija kroz 14 dana s namjernim cleanliness gradijentom + **~200 parking eventova** s realnim hour-of-day krivuljama (jutarnji peak 8-10, večernji 17-20, weekend bias)
10. `_ensure_court_history` — **50 rezervacija** distribuiranih po 4 sportu (tenis 16, basket 10, odbojka 8, nogomet 16) s weekend biasom i peak-hour bazenima per sport

**Idempotent guard prefixevi:** `iss_h_`, `le_h_`, `rsv_h_`. Ako želiš re-seed s različitim parametrima, obriši `smart_znjan.db` prije pokretanja backenda.

---

## 6. REST API (sve pod `/api/v1`)

| Method | Path                                | Što radi                                                                                  |
|--------|-------------------------------------|-------------------------------------------------------------------------------------------|
| GET    | `/health`                           | `{status, ai}` — ai = je li ANTHROPIC_API_KEY postavljen                                  |
| GET    | `/users`                            | Lista svih korisnika (za RoleSwitcher)                                                    |
| GET    | `/users/{id}`                       | Jedan korisnik (refresh bodova nakon transakcije)                                         |
| GET    | `/parking/lots`                     | Lista parkinga s `occupied/capacity`                                                       |
| POST   | `/parking/sessions`                 | Plati parking ({user_id, lot_id, hours, pay_with_points}) — kreira LoyaltyEvent, ažurira `points` i `occupied` |
| POST   | `/parking/lots/{id}/free-one`       | Demo helper — simulira da je auto otišao (`occupied -= 1`)                                |
| GET    | `/courts`                           | Lista terena                                                                              |
| GET    | `/courts/{id}/reservations`         | Sve rezervacije terena                                                                    |
| POST   | `/courts/reservations`              | Rezerviraj ({user_id, court_id, starts_at, hours, pay_with_points}) — 409 ako preklapa    |
| GET    | `/courts/reservations/by-user/{uid}` | Rezervacije korisnika                                                                    |
| GET    | `/issues?status=open\|in_progress\|resolved` | Lista prijava sortirana po `priority_score`                                       |
| GET    | `/issues/by-user/{uid}`             | Korisnikove prijave                                                                       |
| POST   | `/issues`                           | Nova prijava → AI klasifikacija → spremi + dodaj bodove                                   |
| PUT    | `/issues/{id}/status`               | Staff mijenja status                                                                      |
| POST   | `/issues/{id}/reclassify`           | Staff zatraži ponovnu AI klasifikaciju                                                    |
| GET    | `/loyalty/events/{uid}`             | Sva bodovna kretanja korisnika                                                            |
| GET    | `/loyalty/coach/{uid}`              | AI sažetak + 3 preporuke (offline heuristika ako nema ključa)                             |
| GET    | `/infra/lights`                     | Lista svjetlosnih zona                                                                    |
| PUT    | `/infra/lights/{id}`                | Toggle / brightness / mode                                                                |
| GET    | `/infra/irrigation`                 | Lista zona navodnjavanja                                                                  |
| PUT    | `/infra/irrigation/{id}`            | Toggle / schedule (uključivanje povećava `soil_moisture` za demo realizam)                |
| GET    | `/admin/kpis`                       | KPI brojevi za admin dashboard                                                            |
| GET    | `/admin/stats?days=N`               | Full analitika: 7×24 parking heatmap + category distribution + top 10 problem lokacija     |
| GET    | `/insights/citizen?days=N`          | Lightweight verzija za građane: parking summary + court demand per sport + top 5 problemskih lokacija + tipovi u prirodnom jeziku |

Sve POST/PUT rute koje mijenjaju bodove/lots/zones rade `db.commit()` na kraju i vraćaju ažurirani objekt.

---

## 7. AI integracija ([backend/app/engine/ai.py](backend/app/engine/ai.py))

Dvije Claude površine. Obje koriste **forced tool use** (Claude **mora** pozvati tool jer je `tool_choice` strict) i obje imaju **offline heuristic fallback**.

### 7.1 `classify_issue(description, location_hint, photo_data_url=None)`

- Tool: `classify_issue` sa strict JSON schema (enum kategorije, severity, prioritet 0-100, odjel, sažetak)
- Photo (ako postoji) ulazi kao base64 image content block — koristi se Claude vision
- System prompt: "Ti si asistent gradske uprave Splita za područje Žnjana…"
- **Fallback** (`_heuristic_classify`): keyword match na `_KEYWORDS` mapi → kategorija → severity iz okidača ("hitno", "danima"…) → odjel iz `dept_map`

Koristi se u `POST /issues` i `POST /issues/{id}/reclassify`.

### 7.2 `loyalty_coach(user, events)`

- Tool: `loyalty_coach` (sažetak na hrvatskom + 2-3 preporuke + sljedeća miljokaz vrijednost)
- System prompt: friendly coach, 1 EUR ≈ 100 bodova
- **Fallback** (`_heuristic_coach`): generira pozdrav s brojem aktivnosti, preporuke ovisno o stanju bodova i broju rezervacija

Koristi se u `GET /loyalty/coach/{uid}`.

### 7.3 Što ako Claude padne

Try/except oko Claude poziva → ako baci exception, ide u fallback. Print u stderr, ne crashanje.
Bez `ANTHROPIC_API_KEY` `settings.has_api_key == False` → direktno u fallback.

---

## 8. Loyalty pravila

Implementirana u [backend/app/api/issues.py](backend/app/api/issues.py) i [backend/app/api/parking.py](backend/app/api/parking.py) i [backend/app/api/courts.py](backend/app/api/courts.py).

| Akcija                              | Bodovi                              |
|-------------------------------------|-------------------------------------|
| Komunalna prijava — `low`           | +15                                 |
| Komunalna prijava — `medium`        | +30                                 |
| Komunalna prijava — `high`          | +40                                 |
| Komunalna prijava — `critical`      | +50                                 |
| Rezervacija terena (EUR plaćanje)   | +5 / 1 €                            |
| Plaćanje parkinga (EUR)             | +10 / 1 €                           |
| Trošenje bodova (parking/teren)     | 1 € = 100 bodova                    |

Konverzija u admin loyalty pregledu prikazuje pravila s podacima ([app/admin/loyalty/page.tsx](frontend/app/admin/loyalty/page.tsx)).

---

## 9. Frontend — design system

### 9.1 Paleta (`tailwind.config.ts`)

| Token       | Hex                                  | Korištenje                                  |
|-------------|--------------------------------------|---------------------------------------------|
| `ink-50..950` | Tamno-plava paleta (Split noću)    | Bg / borders / text                          |
| `teal-300..700` | `#3fd5c6` osa                    | Akcent, glow, CTA pozadina, KPI brojevi      |
| `coral-400/500` | `#ff6b3d`                         | Upozorenja, peak indikatori, otvorene prijave |
| `sand-200/300`  | Topli akcent                      | Rezervno (trenutno minimalno korišteno)     |

### 9.2 Glass card sustav (`globals.css`)

- `.glass` — `bg-white/[0.04]` + `border-white/10` + `backdrop-blur-xl` + suptilna sjena
- `.glass-hover` — 300ms easeOutQuint transition, hover lift -2px + intenzivnija sjena + teal glow
- `.teal-glow` — naglašena teal box-shadow za "highlight" kartice (npr. AI Procjena)

### 9.3 Animacije

| Naziv          | Trajanje | Gdje                                                       |
|----------------|----------|------------------------------------------------------------|
| `fade-in`      | 260ms    | Page-level mount (sve glavne stranice)                     |
| `slide-up`     | 320ms    | Hero sekcija, AI procjena banner                           |
| `pulse-glow`   | 4s       | Header logo glow (gentle breathing, ne flicker)            |
| `hero-pan`     | 48s      | Ken Burns scale na hero videu (1.04 → 1.10, alternate)     |
| `wave-slow`    | 16s      | Bg blur balls u hero sekciji                               |
| `shimmer`      | 1.6s     | Skeleton loading                                           |

Sve poštuju `prefers-reduced-motion` (svedu se na 1ms u `globals.css`).

### 9.4 UI primitive ([components/ui.tsx](frontend/components/ui.tsx))

| Komponenta   | Varijante                                                                              |
|--------------|----------------------------------------------------------------------------------------|
| `Button`     | `variant`: primary / teal / secondary / ghost / destructive / success · `size`: sm/md/lg |
| `Card`       | `glow` prop za teal glow                                                                |
| `Badge`      | `tone`: neutral / critical / warning / info / success / ai / teal                       |
| `Input` / `TextArea` / `Select` / `Label` | dark glass input style                                              |
| `Banner`     | `tone`: info / warning / critical / success                                             |
| `Metric`     | KPI ploča s label + value + sub + tone (teal/coral/neutral)                             |
| `Gauge`      | 0-100 circular indikator, hue se mijenja (zeleno → žuto → crveno)                       |
| `Toggle`     | iOS-style switch                                                                        |
| `Pill`       | Pill button (filter chip)                                                               |
| `Skeleton`   | Shimmer placeholder                                                                     |

### 9.5 Role-based navigacija

[`components/nav.tsx`](frontend/components/nav.tsx) drži 3 liste linkova:

```ts
CITIZEN_NAV = [Naslovnica, Parking, Sportski tereni, Prijava problema, Zauzetost, Loyalty]
STAFF_NAV   = [Prijave (queue), Rasvjeta, Navodnjavanje, Sportski tereni]
ADMIN_NAV   = [Dashboard, Statistika, Loyalty pregled, Sustav]
```

`useRole().role` određuje koja se lista renderira. Switcher u headeru ([role-switcher.tsx](frontend/components/role-switcher.tsx)) sprema aktivnog korisnika u `localStorage` kao `smart-znjan-active-user`.

---

## 10. Stranice — što svaka radi

### 10.1 Citizen layer

| Ruta                         | Što vidi korisnik                                                                          |
|------------------------------|--------------------------------------------------------------------------------------------|
| `/`                          | Hero s video pozadinom Žnjan rendera (sa split.hr) · 4 KPI metrike · 5 modul-kartica · "Kako Smart Žnjan radi" mini-explainer |
| `/citizen/parking`           | Grid 4 parkinga · slider za sate · plaćanje EUR ili bodovima · live ažuriranje balansa |
| `/citizen/tereni`            | Filter pillovi po sportu · grid terena · sticky panel za booking (datum/sat/trajanje) · lista mojih rezervacija |
| `/citizen/prijava`           | Brzi sample reportsi · opis + lokacija + foto upload · AI procjena banner nakon slanja · lista mojih prijava |
| `/citizen/loyalty`           | Veliki broj bodova · progress bar do sljedećeg miljokaza · AI coach poruka + 3 preporuke · event log |
| `/citizen/zauzetost`         | Parking summary card (busiest/quietest + 24-bar sparkline) · 4 court demand cards · top 5 problem lokacija s tipovima |

### 10.2 Staff layer

| Ruta                          | Što vidi staff                                                                            |
|-------------------------------|-------------------------------------------------------------------------------------------|
| `/staff`                      | Queue prijava (filtrirano open/in_progress/resolved) · severity + priority ring · "Preuzmi" + "Riješi" + "Reklasificiraj" akcije |
| `/staff/rasvjeta`             | 4 svjetlosne zone · toggle on/off · slider svjetline · auto/manual mode · ukupna kW potrošnja |
| `/staff/navodnjavanje`        | 3 zone navodnjavanja · soil moisture progress · raspored zalijevanja (uređiv) · alert za suhe zone |
| `/staff/tereni`               | Pregled rezervacija po terenu · KPI metrike (ukupno, nadolazeće, pod reflektorima)        |

### 10.3 Admin layer

| Ruta                          | Što vidi admin                                                                            |
|-------------------------------|-------------------------------------------------------------------------------------------|
| `/admin`                      | 8 KPI metrika · top 5 prioritetnih prijava · sažetak po modulu                            |
| `/admin/statistika`           | **Period selector (7/14/30 dana)** · 4 summary metrike · **7×24 parking heatmap** (interactive hover) · category bars · top 10 problematičnih lokacija (sortabilno) |
| `/admin/loyalty`              | 4 lifetime metrike · ranked leaderboard građana · pravila bodovanja                       |
| `/admin/sustav`               | Status backend/DB/Claude/frontend · "O Smart Žnjan platformi" info                        |

---

## 11. Hero video ([components/hero-video.tsx](frontend/components/hero-video.tsx))

- URL: `https://split.hr/Portals/0/adam/ContentS/.../ZNJAN_RENDER_VIDEO%20(1).mp4` (~69 MB)
- **Streamano**, ne bundlanо u repo
- `autoPlay muted loop playsInline preload="metadata"`
- Slow Ken Burns scale 1.04 → 1.10 kroz 48s, alternate, ease-in-out — **bez translate** (translate3d je prije uzrokovao wobble)
- Dark gradient + teal radial overlay za čitljivost
- `onError` → silent fallback na prethodni gradient
- Attribution chip "Video: Grad Split · projekt obnove Žnjana" dolje desno
- Poštuje `prefers-reduced-motion` (motion-safe klasa)

Ako split.hr promijeni URL, ažurirajte `VIDEO_URL` konstantu u `hero-video.tsx`.

---

## 12. Gdje mijenjati uobičajene stvari

| Što želiš                                       | Edit                                                                                |
|-------------------------------------------------|-------------------------------------------------------------------------------------|
| Dodati novi parking ili promijeniti cijenu      | [backend/app/seed/demo.py](backend/app/seed/demo.py) `PARKING_LOTS`                  |
| Dodati novi sportski teren                      | [backend/app/seed/demo.py](backend/app/seed/demo.py) `COURTS` + `_COURT_HISTORY`     |
| Promijeniti loyalty pravila                     | `SEVERITY_POINTS` u [issues.py](backend/app/api/issues.py); `POINTS_PER_EUR` u [parking.py](backend/app/api/parking.py) i [courts.py](backend/app/api/courts.py) |
| Dodati novi sloj / role                         | `Role` u [schema.py](backend/app/engine/schema.py) + nav lista u [nav.tsx](frontend/components/nav.tsx) + role-switcher logika |
| Dodati novu kategoriju prijava                  | `IssueCategory` enum u [schema.py](backend/app/engine/schema.py); `_KEYWORDS` i `dept_map` u [ai.py](backend/app/engine/ai.py); `CATEGORY_LABEL` u stats/insights stranicama |
| Promijeniti AI system prompt / tool             | [backend/app/engine/ai.py](backend/app/engine/ai.py) — `CLASSIFY_TOOL` / `COACH_TOOL` ili `_call_claude` |
| Dodati novu rutu                                | Novi router u [backend/app/api/](backend/app/api) + uključi u [main.py](backend/app/main.py) + novi `api.xxx()` u [frontend/lib/api.ts](frontend/lib/api.ts) |
| Dodati novu stranicu                            | `frontend/app/{layer}/{ime}/page.tsx` + link u [nav.tsx](frontend/components/nav.tsx) |
| Promijeniti boju ili paletu                     | [frontend/tailwind.config.ts](frontend/tailwind.config.ts) `colors` (ink/teal/coral) + `keyframes` po potrebi |
| Promijeniti hero video                          | `VIDEO_URL` u [hero-video.tsx](frontend/components/hero-video.tsx)                  |
| Mijenjati seed podatke za heatmap               | `_ensure_rich_history` (parking events i issues) u [seed/demo.py](backend/app/seed/demo.py) |

---

## 13. Gotchas — što se već dogodilo

### 13.1 SQLite DB invalidacija nakon sheme promjene

Seeder je idempotentan po ID prefixu (`iss_h_`, `le_h_`, `rsv_h_`). Ako mijenjate koje stupce dodajete ili izbacujete stare entitete (npr. izbrisali smo padel terene), **obrišite `backend/smart_znjan.db`** prije sljedećeg pokretanja:

```powershell
Remove-Item backend\smart_znjan.db -ErrorAction SilentlyContinue
```

Inače stari redovi (s referencama na izbrisane padel courts) ostaju, a guard sprečava reseed.

### 13.2 Port konflikti

Backend 8081, frontend 3001. Ako nešto drugo drži port, pošalji:

```powershell
$p = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select -Expand OwningProcess -Unique
Stop-Process -Id $p -Force
```

### 13.3 npm install pada na node-gyp (Windows)

Treba [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) s "Desktop development with C++" workloadom.

### 13.4 CORS errori u browseru

Backend već dopušta `http://localhost:3001` i `http://127.0.0.1:3001` (vidi `.env.example`). Ako mijenjaš port, ažuriraj `CORS_ORIGINS` u `.env` i pokreni backend ponovo.

### 13.5 PowerShell + Git Bash quoting

Multi-line commit poruke s navodnicima padaju u oba shella. Najsigurnije: napiši poruku u temp datoteku pa `git commit -F .git/COMMIT_MSG.tmp`.

### 13.6 Animacijski sukobi (lekcija)

Dvije CSS animacije na istom elementu koje ciljaju **isti property** (npr. dvije animacije na `transform`) → wobble. Ako trebaš animirati više property-ja simultano, koristi **jednu animaciju** s sažetim keyframovima ili animiraj različite (npr. opacity transition + transform animation odvojeno).

`will-change` je sila za promijene koje **AKO znaš** dolaze. Ne stavljaj na svaki element — promovira ga u zaseban layer i može uzrokovati subpixel rendering issues.

`pulse-glow` od 0 → high amplitude izgleda kao strobe, ne kao breathing. Drži ga u uskom rasponu (npr. 0.18 → 0.30).

---

## 14. Što još NIJE napravljeno

Sve ovo ima jasan put naprijed ali nije implementirano:

| Što                              | Što bi to značilo                                                                       |
|----------------------------------|-----------------------------------------------------------------------------------------|
| **HITL feedback loop**           | Staff inline mijenja AI klasifikaciju, ispravak se sprema kao "expert correction" i injectira u sljedeći Claude system prompt. Citizen 👍/👎 svoju AI procjenu. |
| **Iterative learning**           | Akumulirati staff overrides per kategoriji, surfacati ih u stat dashboardu kao "AI accuracy" KPI. |
| **Real auth (e-Građani / NIAS)** | Trenutno samo role switcher                                                              |
| **File upload pravi**            | Trenutno foto se konvertira u base64 string i zapisuje u SQLite kao text. Za produkciju → S3/Azure Blob. |
| **Pravi geo-koordinati**         | Lat/lng su seed-ani ali nigdje se ne renderiraju na mapi. Mapbox/Leaflet bi otvorio parking-na-mapi UI. |
| **WebSocket live update**        | Sada se osvježava na user akciju; live updates kad netko plati parking bi dali "smart city" osjećaj. |
| **Email/SMS notifikacije**       | Kad staff riješi prijavu građanin bi trebao biti obaviješten.                            |
| **Statistika trendova**          | Trenutno gleda zadnji period — dodati week-over-week usporedbu i delta indikatore.       |
| **OpenAPI → TS types generator** | `lib/types.ts` je ručno održavan. `openapi-typescript` riješio bi sync.                 |
| **Alembic migracije**            | Trenutno `Base.metadata.create_all`. Čim shema krene mijenjati u produkciji, treba.     |

---

## 15. Demo flow za 5 minuta

1. **Otvori http://localhost:3001 kao Ana Marić** (citizen) — vidi hero video Žnjana, klikni "Prijavi problem"
2. **Klikni "Smeće kod plaže"** brzi sample → opcionalno upload sliku → "Pošalji"
3. **Vidi AI procjenu** (kategorija, severity, priority, odjel) + bodovi dodani
4. **Klikni "Loyalty" u nav-u** — vidi novo stanje + AI coach poruka
5. **Klikni "Zauzetost"** — vidi parking heatmap-lite + court demand + problem lokacije
6. **Role switcher → Marko Babić** (staff) — queue prijava sortirana po prioritetu, klik "Preuzmi" pa "Riješi"
7. **Staff → Rasvjeta** — toggle zone, slider svjetline, vidi kW
8. **Role switcher → Vesna Lukić** (admin) — KPI dashboard
9. **Admin → Statistika** — full 7×24 heatmap, kategorije, top problem lokacije

---

## 16. Git workflow

Repo: https://github.com/karsti11/smart-znjan-hackathon (public, main branch)

Tipičan ciklus:
```powershell
cd E:\ML_Python\Programi\ai_hackathon_split
git status
git add .
git commit -m "feat: opis"
git push
```

Za multi-line commit poruke (zbog quoting bugova u oba shella):
```powershell
# upiši poruku u .git/COMMIT_MSG.tmp pa
git commit -F .git/COMMIT_MSG.tmp
```

---

## 17. Brza Q&A

**Q: Mogu li mijenjati paletu boja?**
A: Da, [`tailwind.config.ts`](frontend/tailwind.config.ts) `colors`. Sve komponente koriste utility klase (`bg-teal-400`, `text-ink-50`), pa promjena hex vrijednosti propagira se kroz cijelu app.

**Q: Kako dodati novu kategoriju komunalnih prijava?**
A: 3 mjesta — `IssueCategory` enum u schema.py, `_KEYWORDS` + `dept_map` u ai.py, `CATEGORY_LABEL` mapi u svim citizen/admin stranicama. Detaljnije u tabeli §12.

**Q: Što ako ANTHROPIC_API_KEY ne postavim?**
A: Sve radi — heuristic fallback klasificira po keyword matchu, coach generira generičke preporuke. Razlika: prijave neće imati `ai_grounded: true` badge i coach poruke su manje pametne.

**Q: Mogu li skinuti video?**
A: Da, ali je 69 MB. Stavi u `frontend/public/znjan.mp4`, pa ažuriraj `VIDEO_URL` u hero-video.tsx u `"/znjan.mp4"`. Bundle će narasti.

**Q: Hoće li ovo skalirati na cijeli Split?**
A: Ne s SQLite. Za to treba migrirati na Postgres, dodati Alembic, auth (e-Građani), maps, push notifikacije, observabilnost. Trenutno je pilot na razini Žnjana.
