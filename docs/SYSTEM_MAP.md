# System Map

Architecture overview for the Manual J HVAC Load Calculator.

## High-level data flow

```
┌─────────────┐        ┌────────────────┐        ┌────────────────┐
│             │        │                │        │                │
│   Browser   │◄──────►│  Next.js app   │◄──────►│   Supabase     │
│             │        │  (Vercel)      │        │   Postgres     │
│             │        │                │        │                │
└─────────────┘        └────────────────┘        └────────────────┘
      │                         │                          │
      │ submits form            │ runs engine              │ stores
      │                         │                          │ scenarios
      ▼                         ▼                          ▼
  /calculate page        calculateLoads()             scenarios table
  /scenarios page        pure TS module               calculation_history
```

## Module layers

```
┌──────────────────────────────────────────────────────────┐
│  src/app/** (pages + API routes)                         │  presentation
│  ─────────────────────────────────────                   │
│  Thin adapters between HTTP/UI and the engine.           │
│  API routes: parse body → validate → call engine → DB.   │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│  src/lib/calc/** (pure calculation engine)               │  domain
│  ─────────────────────────────────────                   │
│  Zero I/O, zero framework imports. Fully testable.       │
│  Entry: calculateLoads(input) → CalculationResult        │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│  src/lib/db/** (persistence)                             │  data
│  ─────────────────────────────────────                   │
│  Async Supabase client + scenario CRUD.                  │
│  Service-role key — SERVER ONLY.                         │
└──────────────────────────────────────────────────────────┘
```

The calc layer NEVER imports the data or presentation layers. The data
layer NEVER imports the presentation layer. This keeps the engine
trivially testable and makes it easy to add a CLI or batch runner later.

## Calculation engine file map

```
src/lib/calc/
│
├── engine.ts                    ← orchestrator, calculateLoads()
├── schemas.ts                   ← Zod schemas (shared with form + API)
├── types.ts                     ← TypeScript types (re-exported)
│
├── components/                  ← PER-COMPONENT pure functions
│   ├── walls.ts                 ← wallHeatingLoad, wallCoolingLoad, netWallArea
│   ├── roof.ts                  ← roofHeatingLoad, roofCoolingLoad
│   ├── windows.ts               ← windowHeatingConduction, windowCoolingConduction, windowSolarGain
│   ├── infiltration.ts          ← infiltrationCFM, infiltrationSensible, infiltrationLatent
│   ├── internal.ts              ← internalSensible, internalLatent, resolveLightingWatts
│   ├── foundation.ts            ← foundationHeatingLoad (slab / basement / crawl branches)
│   ├── ducts.ts                 ← ductLossMultiplier (applied as final envelope scale factor)
│   ├── ventilation.ts           ← ventilationSensible, ventilationLatent (with ERV/HRV recovery)
│   └── garage.ts                ← garagePartitionHeating, garagePartitionCooling
│
├── constants/                   ← LOOKUP TABLES and physics constants
│   ├── climate-zones.ts         ← 13 IECC zones with design temps
│   ├── cltd.ts                  ← Wall (by mass) + Roof (by color) CLTDs
│   ├── scl.ts                   ← 8-orientation Solar Cooling Load factors
│   ├── physical.ts              ← 1.08, 0.68, W→BTU/hr, occupant BTU
│   ├── shading.ts               ← Solar gain multipliers by shading type
│   ├── frame.ts                 ← Window U-value multipliers by frame material
│   ├── altitude.ts              ← Air density ratio by altitude band
│   ├── roof-pitch.ts            ← Roof surface area multiplier by pitch
│   ├── ducts.ts                 ← Duct loss fraction table (location × R)
│   ├── occupancy.ts             ← Per-person BTU by activity level
│   ├── lighting.ts              ← W/ft² by lighting technology
│   └── ventilation.ts           ← Sensible + latent recovery by vent type
│
└── presets/                     ← FORM HELPERS that auto-fill numeric fields
    ├── window-glazing.ts        ← 8 glazing options (single/double/triple, low-e, etc.)
    ├── wall-assembly.ts         ← 11 wall constructions (2x4/2x6, SIPs, ICF, masonry)
    ├── roof-assembly.ts         ← 7 roof options (R-19 through R-60)
    ├── foundation.ts            ← 9 foundations (4 slab + 3 basement + 2 crawl)
    ├── infiltration.ts          ← 5 tightness tiers (leaky → Passive House)
    └── internal.ts              ← 3 lifestyle presets
```

## Request lifecycle: "calculate loads"

1. User edits the form at `/calculate`.
2. On submit, `CalculationForm.tsx` posts JSON to `POST /api/calculate`.
3. `src/app/api/calculate/route.ts`:
   - Parses body with `calculationInputSchema.safeParse()`
   - Returns 400 + field errors if invalid
   - Calls `calculateLoads(parsed.data)` (synchronous, pure)
   - Returns the `CalculationResult` as JSON
4. Browser receives result, `CalculatePage` sets state, `ResultsPanel`
   renders breakdown table, bar chart, and top contributors.

No database is touched for a plain calculation. Ephemeral.

## Request lifecycle: "save scenario"

1. User clicks "Save as scenario" in the results panel.
2. Modal POSTs `{ name, description, input }` to `POST /api/scenarios`.
3. `src/app/api/scenarios/route.ts`:
   - Validates with `saveScenarioSchema.safeParse()`
   - **Re-runs the engine server-side** on the validated input (never
     trust client-supplied result)
   - Calls `createScenario()` in `src/lib/db/scenarios.ts`
4. `createScenario()`:
   - Gets the memoized Supabase admin client
   - `INSERT INTO scenarios` (returns the row)
   - Fires a non-blocking `INSERT INTO calculation_history`
5. API responds 201 with the created row.
6. Browser navigates to `/scenarios` and the new row shows in the list.

## Engine orchestration order

Inside `calculateLoads(input)`:

```
1. Look up climate zone                     → dTWinter, dTSummer, humidity
2. Look up altitude band                    → densityRatio
3. Compute geometry                         → perimeter, volume, roofArea (pitch-adjusted)
4. Resolve shading + frame multipliers      → shadingFactor, frameMultiplier
5. Normalize windows to 8 orientations      → apply frame multiplier to U
6. Compute per-component loads:
      walls      roof      windows_cond    windows_solar_{N..NW}
      doors      infiltration                mech_ventilation (if any)
      internal   foundation                  garage_partition (if any)
7. Apply duct loss multiplier to envelope   → (1 + lossFraction)
      (excluded: internal, window solar)
8. Aggregate totals                          → heatingTotal, coolingTotal
9. Rank top 5 contributors for each season
10. Return CalculationResult with meta      → climate, dT, densityRatio, duct loss, ISO timestamp
```

## Database schema

Two tables, Postgres 15+ (Supabase).

```sql
scenarios
├── id             BIGSERIAL PK
├── name           TEXT
├── description    TEXT
├── input_json     JSONB         ← full CalculationInput
├── result_json    JSONB         ← full CalculationResult
├── heating_total  DOUBLE PRECISION  (denormalized)
├── cooling_total  DOUBLE PRECISION  (denormalized)
├── climate_zone   TEXT              (denormalized, indexed)
├── square_footage DOUBLE PRECISION  (denormalized)
├── created_at     TIMESTAMPTZ       (indexed DESC)
└── updated_at     TIMESTAMPTZ       (auto-updated via trigger)

calculation_history
├── id           BIGSERIAL PK
├── scenario_id  BIGINT REFERENCES scenarios(id) ON DELETE SET NULL
├── input_json   JSONB
├── result_json  JSONB
└── created_at   TIMESTAMPTZ      (indexed DESC)
```

Why JSONB blobs + denormalized summary columns: lets the engine shape
evolve without schema migrations, while still enabling fast list
queries and filtering by climate zone or creation date.

RLS is enabled (defense in depth) but has no policies. API routes use
the `service_role` key which bypasses RLS.

## Environment variables

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | Anon key (respects RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Admin key (bypasses RLS) |

The admin client lives in `src/lib/db/client.ts` and is **lazily
constructed** — `getSupabaseAdmin()` throws only at request time if
env vars are missing, so `npm run build` works without any env vars.

## Testing strategy

All tests in `src/tests/calc/**` target the pure engine — no database,
no network, no React rendering. Four categories:

1. **Per-component unit tests** (`walls.test.ts`, `roof.test.ts`, etc.)
   — hand-calculated reference values for every pure function.
2. **Reference house end-to-end** (`engine.test.ts`) — asserts the
   fully-specified ASHRAE reference house is within 5% of hand-
   calculated totals. **This is the regression guard** for every
   engine change.
3. **Invariants** (`engine.test.ts`) — monotonicity (better R → lower
   load), climate sensitivity (Miami cooling > Minneapolis),
   conservation (components sum to totals).
4. **v2 behaviors** (`engine-v2.test.ts`) — targeted tests for each
   new v2 feature (shading, frame, altitude, pitch, ducts, vent,
   garage, lighting, activity level).

Run all: `npm test`. Should complete in under 2 seconds.

## Deployment pipeline

```
local dev              git push           Vercel build + deploy
──────────             ────────           ─────────────────────
  .env.local     ───►  GitHub        ───►  Vercel runs npm run build
  Supabase              (branch)            pulls env vars from
  project                                   project settings
                                            serves at vercel.app
                                                    │
                                                    ▼
                                            Vercel Functions
                                            (API routes)
                                                    │
                                                    ▼
                                            Supabase Postgres
                                            (same project as dev
                                             or a separate prod one)
```

Migrations are applied manually via the Supabase SQL Editor. There is
no automated migration runner in the deploy pipeline.
