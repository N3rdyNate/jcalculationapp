# CLAUDE.md

Agent orientation for the Manual J HVAC Load Calculator repository.
Read this first when starting a new session.

## Purpose

This is a residential heating and cooling load calculator that accepts
a detailed house specification — optionally broken down room by room —
and returns BTU/hr heating and cooling loads with per-component and
per-room breakdowns, equipment sizing recommendations, validation
warnings, and a printable field verification checklist. It follows
simplified ACCA Manual J / ASHRAE methodology — it is NOT certified
Manual J software.

## Tech stack (short)

- **Next.js 14** App Router, TypeScript, Tailwind
- **Supabase Postgres** (via `@supabase/supabase-js`) for scenarios
- **Zod** for validation shared across form, API, and engine
- **react-hook-form** for the form
- **Vitest** for tests (122+ tests)
- Deployed to **Vercel**
- **Dark mode** via Tailwind `class` strategy + `ThemeToggle`

## Repository layout

```
src/
├── app/
│   ├── calculate/page.tsx           # main form + results workspace
│   ├── scenarios/
│   │   ├── page.tsx                 # list (with clone + error handling)
│   │   ├── [id]/page.tsx            # detail + CloneButton + PrintButton
│   │   └── compare/page.tsx         # side-by-side compare
│   └── api/
│       ├── calculate/route.ts       # run engine, no persist
│       ├── scenarios/route.ts       # list / save (limit validated)
│       ├── scenarios/[id]/route.ts  # get / delete
│       ├── scenarios/[id]/clone/route.ts  # clone a scenario
│       └── compare/route.ts         # compare by ids
├── components/
│   ├── ui/                          # Button, Input, Select, Card, Field
│   │                                #   (all support dark mode)
│   ├── form/
│   │   ├── CalculationForm.tsx      # house-level form + room list
│   │   ├── RoomEditor.tsx           # per-room walls/windows/doors editor
│   │   └── RoomList.tsx             # add/remove/reorder rooms
│   ├── results/
│   │   ├── ResultsPanel.tsx         # totals, sizing, warnings, room
│   │   │                            #   table, checklist, methodology
│   │   └── BreakdownChart.tsx       # stacked bar chart
│   ├── ThemeToggle.tsx              # dark mode toggle
│   └── PrintButton.tsx              # browser print trigger
└── lib/
    ├── calc/                        # PURE TypeScript engine (no I/O)
    │   ├── engine.ts                # calculateLoads() entry point
    │   ├── room-engine.ts           # calculateRoomLoad() per-room calcs
    │   ├── sizing.ts                # equipment sizing + rule-of-thumb
    │   ├── validation.ts            # input + result validation warnings
    │   ├── checklist.ts             # field verification checklist gen
    │   ├── schemas.ts               # Zod schemas (source of truth)
    │   ├── types.ts                 # TypeScript types (room, house, result)
    │   ├── components/              # walls, roof, windows, infiltration,
    │   │                            #   internal, foundation, ducts,
    │   │                            #   ventilation, garage, skylight
    │   ├── constants/               # climate-zones, cltd, scl, shading,
    │   │                            #   frame, altitude, roof-pitch, ducts,
    │   │                            #   occupancy, lighting, ventilation,
    │   │                            #   physical, fireplace, thermal-bridging,
    │   │                            #   attic-insulation, overhang,
    │   │                            #   zip-to-climate
    │   ├── presets/                  # window-glazing, wall-assembly,
    │   │                            #   roof-assembly, foundation,
    │   │                            #   infiltration, internal
    │   └── utils/
    │       └── zip-lookup.ts        # ZIP code → climate zone
    └── db/
        ├── client.ts                # Supabase admin client (lazy)
        └── scenarios.ts             # async CRUD functions

supabase/migrations/0001_initial.sql # Postgres DDL

src/tests/calc/                      # Vitest unit + engine tests
src/tests/fixtures/                  # ASHRAE reference house
```

## Key conventions

### 1. The engine is pure

`src/lib/calc/**` has ZERO imports from Next, React, or the DB. It can
run in any Node environment. Never import from `@/lib/db/**` into
`@/lib/calc/**`.

### 2. Single source of truth for types: Zod

`schemas.ts` defines every field. `types.ts` re-derives TS types.
The form, API validation, and engine all use the same shape.

### 3. Room-by-room (v3 architecture)

When `input.rooms[]` is provided, the engine computes per-room loads
via `calculateRoomLoad()` in `room-engine.ts`. Infiltration and
internal loads are distributed proportionally by room volume / sqft.
When `rooms` is absent, the engine uses whole-house mode (legacy).

Each room has its own walls (with orientation, party-wall flag,
thermal bridging %), windows (width × height, overhang), skylights,
doors, ceiling type (flat/vaulted/cathedral), and floor type override.

### 4. Duct loss is a final multiplier

Ducts scale ALL envelope components by `(1 + lossFraction)` except
internal loads and solar gains. When `ducts.leakagePct` is provided,
it overrides the table-based estimate.

### 5. Phase 1 additions (house-level)

These inputs are optional with neutral defaults:
- **Thermal bridging**: `framingPct` + `studDepth` → `effectiveWallR()`
- **Fireplace**: type → ACH infiltration penalty
- **Skylights**: array of (area, U, SHGC, orientation)
- **ACH50 method**: blower-door or construction-quality estimate
- **Attic insulation**: material type + depth → computed R
- **Slab edge**: insulated toggle + R-value + depth
- **Overhang depth**: per-orientation solar reduction factor
- **Duct leakage %**: overrides table-based loss

### 6. Phase 3 outputs

`CalculationResult` includes:
- `equipmentSizing`: recommended tons/MBH with oversizing note
- `ruleOfThumbComparison`: flags > 25% deviation from 20 BTU/sqft
- `latentSensiblePct`: cooling split percentages
- `warnings[]`: input validation + room-level + result checks
- `fieldChecklist[]`: printable on-site verification items
- `rooms[]`: per-room heating/cooling/WWR/components

### 7. Neutral defaults keep the reference house passing

When adding any new optional field, **default it to a neutral value**
so that `src/tests/fixtures/ashrae-reference-house.ts` still produces
the same totals within 5%.

## Running things

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server at localhost:3000 |
| `npm run build` | Production build (what Vercel runs) |
| `npm test` | Run all Vitest tests once |
| `npm run test:watch` | Vitest watch mode |
| `npx tsc --noEmit` | Type-check the whole project |

**No DB is required for tests.** The calc engine is pure.

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY   ← server-only, never use in client components
```

## How to add a new dropdown (end-to-end)

1. **Constants** — `src/lib/calc/constants/<name>.ts`
2. **Types** — add to relevant interface in `types.ts`
3. **Schemas** — add Zod enum + optional field in `schemas.ts`
4. **Engine** — read the field in `engine.ts` (or `room-engine.ts`
   for room-level fields)
5. **Form** — add `<Select>` in `CalculationForm.tsx` (house-level)
   or `RoomEditor.tsx` (room-level)
6. **Default** — set neutral default in `DEFAULT_VALUES`
7. **Test** — add a test showing the new field affects output
8. **Run** — `npm test && npx tsc --noEmit && npm run build`

## Common pitfalls

- **Don't skip the Zod schema** — the API route will reject it
- **Don't put env var access at module top-level** — breaks build
- **Don't make the engine async** — it's pure and synchronous
- **Reference house test** must continue to pass within 5%
- **Room-level changes** go in `room-engine.ts`, house-level in `engine.ts`
- **New constants** must be imported in `engine.ts` or `room-engine.ts`

## Where to look when something is broken

| Symptom | Likely location |
|---|---|
| Reference house test fails | `engine.ts` or `components/*.ts` |
| Form submits but API returns 400 | `schemas.ts` — missing field |
| Build fails with "Missing Supabase env vars" | `getSupabaseAdmin()` made eager |
| Room loads don't sum to whole-house | `room-engine.ts` distribution logic |
| New dropdown doesn't affect numbers | Engine isn't reading the field |
| Dark mode colors wrong | Missing `dark:` variant in UI component |
| Print shows form/header | Missing `print-hide` class |
