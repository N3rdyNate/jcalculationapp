# Manual J HVAC Load Calculator

A residential heating and cooling load calculator following simplified
ACCA Manual J / ASHRAE methods. Full-stack Next.js 14 application with
Supabase for persistence, deployable to Vercel.

## What it does

Takes a detailed house description — optionally with per-room
breakdowns — including climate zone, dimensions, envelope (walls, roof,
foundation, thermal bridging), windows (with overhang shading),
skylights, infiltration (natural ACH, blower-door ACH50, or
construction quality estimate), ducts (with leakage %), ventilation,
internal loads, fireplace, and garage, and returns:

- Winter heating load in BTU/hr
- Summer cooling load in BTU/hr (sensible + latent split with %)
- Per-component breakdown of where the load comes from
- **Room-by-room** heating and cooling load table (when rooms defined)
- Ranked top contributors for heating and cooling
- **Equipment sizing** recommendation (tons/MBH) with oversizing note
- **20 BTU/sqft rule-of-thumb** comparison flag
- **Validation warnings** (unusual loads, high ACH, duct leakage, WWR)
- **Printable field verification checklist** (blower door target, duct
  blaster target, insulation depths, window verification, thermal
  imaging priorities)
- Save, clone, compare, and print scenarios
- **Dark mode** toggle

The calculation engine is accurate to within ~5% of full Manual J 8th
Edition for typical residential cases. It is NOT a substitute for
certified Manual J software — see the Methodology panel in the results
UI for specific simplifications.

## Tech stack

| Layer | Tool |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Forms | react-hook-form + @hookform/resolvers/zod |
| Validation | Zod (shared across form / API / engine) |
| Charts | Recharts |
| Database | Supabase Postgres (via @supabase/supabase-js) |
| Tests | Vitest |
| Hosting | Vercel |

## Local development

### Prerequisites

- Node.js 20+
- A Supabase project (free tier works)

### 1. Clone and install

```bash
git clone <repo-url>
cd jcalculationapp
npm install
```

### 2. Set up Supabase

1. Create a new project at [app.supabase.com](https://app.supabase.com).
2. Open the **SQL Editor** in the project dashboard.
3. Paste the contents of
   [`supabase/migrations/0001_initial.sql`](./supabase/migrations/0001_initial.sql)
   and click **Run**. This creates the `scenarios` and
   `calculation_history` tables.
4. Go to **Project Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key (click "Reveal")

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values from step 2:

```bash
cp .env.example .env.local
```

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Never commit `.env.local`.** It is gitignored.

### 4. Run the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). The app redirects
to `/calculate`.

### 5. Run tests

```bash
npm test          # one-shot
npm run test:watch # watch mode
```

All tests target the pure calculation engine — no database or network
is required.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new). Vercel
   autodetects Next.js.
3. Add the three environment variables from `.env.example` in
   **Project Settings → Environment Variables**. Make sure
   `SUPABASE_SERVICE_ROLE_KEY` does **not** have a `NEXT_PUBLIC_`
   prefix — this keeps it server-only.
4. Click **Deploy**. Vercel runs `npm run build` and serves the app.
5. After deploy, smoke-test by opening the deployed URL, filling in the
   form, and saving a scenario.

### Running migrations in production

Supabase has no automatic migration runner tied to Vercel deploys.
When you change the schema, apply the new migration by:

- Pasting the SQL into the Supabase **SQL Editor** (easiest), or
- Using the Supabase CLI: `supabase db push` after linking the project

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build (used by Vercel) |
| `npm run start` | Start production server after build |
| `npm run lint` | Next.js lint |
| `npm test` | Run Vitest tests once |
| `npm run test:watch` | Vitest in watch mode |

## Project structure

See [`docs/SYSTEM_MAP.md`](./docs/SYSTEM_MAP.md) for a full architecture
overview. Short version:

```
src/
├── app/                 # Next.js App Router pages + API routes
├── components/
│   ├── ui/              # Button, Input, Select, Card, Field (dark mode)
│   ├── form/            # CalculationForm, RoomEditor, RoomList
│   ├── results/         # ResultsPanel (sizing, warnings, room table,
│   │                    #   checklist, references), BreakdownChart
│   ├── ThemeToggle.tsx  # Dark mode toggle
│   └── PrintButton.tsx  # Browser print
└── lib/
    ├── calc/            # Pure TypeScript calculation engine
    │   ├── engine.ts    # calculateLoads() — whole-house entry point
    │   ├── room-engine.ts # calculateRoomLoad() — per-room calcs
    │   ├── sizing.ts    # Equipment sizing + rule-of-thumb
    │   ├── validation.ts # Input + result warnings
    │   ├── checklist.ts # Field verification checklist generator
    │   ├── components/  # walls, roof, windows, infiltration, skylight…
    │   ├── constants/   # climate-zones, fireplace, thermal-bridging,
    │   │                #   attic-insulation, overhang, zip-to-climate…
    │   └── presets/     # Glazing, wall, roof, foundation presets
    └── db/              # Supabase client + scenario CRUD
supabase/
└── migrations/          # Postgres DDL
```

## Adding a new dropdown

See [`CLAUDE.md`](./CLAUDE.md) for the end-to-end recipe.

## License

Private project. Not for redistribution.
