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
├── engine.ts                    ← orchestrator, calculateLoads() — whole-house
├── room-engine.ts               ← calculateRoomLoad() — per-room calculations
├── sizing.ts                    ← equipment sizing + rule-of-thumb comparison
├── validation.ts                ← input + result validation warnings
├── checklist.ts                 ← field verification checklist generator
├── schemas.ts                   ← Zod schemas (shared with form + API)
├── types.ts                     ← TypeScript types (room, house, result)
│
├── components/                  ← PER-COMPONENT pure functions
│   ├── walls.ts                 ← wallHeatingLoad, wallCoolingLoad, resolveWallR (thermal bridging)
│   ├── roof.ts                  ← roofHeatingLoad, roofCoolingLoad
│   ├── windows.ts               ← windowHeatingConduction, windowCoolingConduction, windowSolarGain
│   ├── infiltration.ts          ← infiltrationCFM, ach50ToNaturalAch, estimateAchFromQuality
│   ├── internal.ts              ← internalSensible, internalLatent, resolveLightingWatts
│   ├── foundation.ts            ← foundationHeatingLoad (slab / basement / crawl branches)
│   ├── ducts.ts                 ← ductLossMultiplier (with leakagePct override)
│   ├── ventilation.ts           ← ventilationSensible, ventilationLatent (with ERV/HRV recovery)
│   ├── garage.ts                ← garagePartitionHeating, garagePartitionCooling
│   └── skylight.ts              ← skylightHeatingConduction, skylightCoolingConduction, skylightSolarGain
│
├── constants/                   ← LOOKUP TABLES and physics constants
│   ├── climate-zones.ts         ← 13 IECC zones with design temps
│   ├── cltd.ts                  ← Wall (by mass) + Roof (by color) CLTDs
│   ├── scl.ts                   ← 8-orientation Solar Cooling Load factors
│   ├── physical.ts              ← 1.08, 0.68, W→BTU/hr, occupant BTU
│   ├── shading.ts               ← Solar gain multipliers by shading type
│   ├── frame.ts                 ← Window U-value multipliers by frame material
│   ├── altitude.ts              ← Air density ratio by altitude band
│   ├── roof-pitch.ts            ← Roof surface area multiplier by pitch (16 values)
│   ├── ducts.ts                 ← Duct loss fraction table (location × R)
│   ├── occupancy.ts             ← Per-person BTU by activity level (5 levels)
│   ├── lighting.ts              ← W/ft² by lighting technology (5 types)
│   ├── ventilation.ts           ← Sensible + latent recovery by vent type
│   ├── fireplace.ts             ← Fireplace type → ACH infiltration penalty
│   ├── thermal-bridging.ts      ← Framing % → effective wall R (parallel-path)
│   ├── attic-insulation.ts      ← Material type → R-per-inch (6 materials)
│   ├── overhang.ts              ← Overhang depth → solar shading factor by orientation
│   └── zip-to-climate.ts        ← ZIP code prefix → IECC climate zone
│
├── utils/
│   └── zip-lookup.ts            ← lookupClimateZoneByZip()
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
 1. Look up climate zone                    → dTWinter, dTSummer, humidity
 2. Look up altitude band                   → densityRatio
 3. Resolve attic R-value                   → from material + depth (or legacy R)
 4. Resolve wall R-value                    → apply thermal bridging if framingPct
 5. Compute geometry                        → perimeter, volume, roofArea (pitch)
 6. Resolve shading + frame + overhang      → shadingFactor, frameMultiplier, ovhFactor
 7. Normalize windows to 8 orientations     → apply frame multiplier to U
 8. Resolve infiltration ACH                → from natural/ACH50/estimate method
 9. Add fireplace ACH penalty               → totalACH = resolved + fireplace
10. Compute per-component loads:
       walls      roof      windows_cond     windows_solar_{N..NW}
       skylights  doors     infiltration     mech_ventilation
       internal   foundation                 garage_partition
11. Apply duct loss multiplier to envelope  → (1 + lossFraction) with leakagePct
       (excluded: internal, solar gains, skylights solar)
12. Aggregate totals                        → heatingTotal, coolingTotal
13. If rooms[] provided:
       For each room → calculateRoomLoad()  → per-room components + WWR + warnings
       Distribute infiltration by volume, internal by sqft
14. Compute equipment sizing                → tons, MBH, oversizing note
15. Compare to 20 BTU/sqft rule             → flag if >25% deviation
16. Run validation warnings                 → input + room + result checks
17. Generate field checklist                → blower door, ducts, insulation, windows
18. Return CalculationResult with all       → components, rooms, sizing, warnings,
                                               checklist, latent/sensible %, meta
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
