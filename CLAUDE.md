# CLAUDE.md

Agent orientation for the Manual J HVAC Load Calculator repository.
Read this first when starting a new session.

## Purpose

This is a residential heating and cooling load calculator that accepts
a detailed house specification and returns BTU/hr heating and cooling
loads with a per-component breakdown. It follows simplified ACCA
Manual J / ASHRAE methodology — it is NOT certified Manual J software.

## Tech stack (short)

- **Next.js 14** App Router, TypeScript, Tailwind
- **Supabase Postgres** (via `@supabase/supabase-js`) for scenarios
- **Zod** for validation shared across form, API, and engine
- **react-hook-form** for the form
- **Vitest** for tests
- Deployed to **Vercel**

## Repository layout

```
src/
├── app/
│   ├── calculate/page.tsx         # main form + results workspace
│   ├── scenarios/
│   │   ├── page.tsx               # list
│   │   ├── [id]/page.tsx          # detail (Server Component, awaits DB)
│   │   └── compare/page.tsx       # side-by-side compare
│   └── api/
│       ├── calculate/route.ts     # run engine, no persist
│       ├── scenarios/route.ts     # list / save
│       ├── scenarios/[id]/route.ts # get / delete
│       └── compare/route.ts       # compare by ids
├── components/
│   ├── ui/                        # Button, Input, Select, Card, Field
│   ├── form/CalculationForm.tsx   # ALL form dropdowns live here
│   └── results/                   # ResultsPanel, BreakdownChart
└── lib/
    ├── calc/                      # PURE TypeScript engine (no I/O)
    │   ├── engine.ts              # calculateLoads() entry point
    │   ├── schemas.ts             # Zod schemas (source of truth)
    │   ├── types.ts               # TypeScript types
    │   ├── components/            # walls, roof, windows, infiltration,
    │   │                          #   internal, foundation, ducts,
    │   │                          #   ventilation, garage
    │   ├── constants/             # climate-zones, cltd, scl, shading,
    │   │                          #   frame, altitude, roof-pitch, ducts,
    │   │                          #   occupancy, lighting, ventilation,
    │   │                          #   physical
    │   └── presets/               # window-glazing, wall-assembly,
    │                              #   roof-assembly, foundation,
    │                              #   infiltration, internal
    └── db/
        ├── client.ts              # Supabase admin client (lazy, memoized)
        └── scenarios.ts           # async CRUD functions

supabase/migrations/0001_initial.sql   # Postgres DDL (manually applied)

src/tests/calc/                    # Vitest unit + engine tests
src/tests/fixtures/                # ASHRAE reference house
```

## Key conventions

### 1. The engine is pure

`src/lib/calc/**` has ZERO imports from Next, React, or the DB. It can
run in any Node environment. This makes it trivially testable and
means the API routes are thin wrappers: parse with Zod → call
`calculateLoads()` → return result.

Never import anything from `@/lib/db/**` into `@/lib/calc/**`.

### 2. Single source of truth for types: Zod

`src/lib/calc/schemas.ts` defines every field. `src/lib/calc/types.ts`
re-derives TypeScript types from those schemas (or imports from
constants). The form, API validation, and engine all use the same
shape.

### 3. Duct loss is applied as a final multiplier

Ducts don't have their own component load. Instead, the engine scales
ALL envelope components by `(1 + lossFraction)` at the end, except for
internal loads (occupants, appliances, lighting) and window solar gain,
which don't travel through ducts.

See `engine.ts` around the `scaledComponents` block.

### 4. Windows are normalized to 8-way internally

User can input "global mode" (one U / SHGC / shading + 8-way area) or
"per-orientation mode". The engine always normalizes to 8 orientations
before iterating. See `normalizeWindows()` in `engine.ts`.

### 5. Altitude density correction

`ALTITUDE_DENSITY_RATIO` is multiplied into the `1.08` and `0.68`
infiltration and ventilation constants. The engine reads
`input.altitude` (default `sea_level`) and threads the ratio through
every air-based component.

### 6. Neutral defaults keep the reference house passing

When adding any new optional field, **default it to a neutral value**
(1.0 multiplier, 'none', false, etc.) so that
`src/tests/fixtures/ashrae-reference-house.ts` still produces the same
totals. The `engine.test.ts` reference test asserts within 5% of hand-
calculated totals and must continue to pass.

## Running things

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server at localhost:3000 |
| `npm run build` | Production build (what Vercel runs) |
| `npm test` | Run all Vitest tests once |
| `npm run test:watch` | Vitest watch mode |
| `npx tsc --noEmit` | Type-check the whole project |

**No DB is required for tests.** The calc engine is pure. If you add
DB tests later, mock `getSupabaseAdmin()`.

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY   ← server-only, never use in client components
```

In dev: `.env.local` (gitignored). In prod: Vercel project settings.

The Supabase admin client is lazy — it only throws when first called at
request time, NOT at module load. This means `npm run build` works
without any env vars set.

## How to add a new dropdown (end-to-end)

Let's say you want to add "Window screen type: none / solar screen".

1. **Constants** — `src/lib/calc/constants/screen.ts`:
   ```ts
   export type ScreenType = 'none' | 'solar';
   export const SCREEN_FACTOR: Record<ScreenType, number> = {
     none: 1.0,
     solar: 0.7,
   };
   ```

2. **Types** — `src/lib/calc/types.ts`:
   Add `screen?: ScreenType` to `WindowsInput`.

3. **Schemas** — `src/lib/calc/schemas.ts`:
   Add `screenSchema = z.enum(['none', 'solar'])` and include it as an
   optional field in `windowsGlobalSchema` and `windowsPerOrientationSchema`.

4. **Engine** — `src/lib/calc/engine.ts`:
   Look up `SCREEN_FACTOR[input.windows.screen ?? 'none']` and multiply
   it into the window solar gain contribution, similar to `shadingFactor`.

5. **Form** — `src/components/form/CalculationForm.tsx`:
   Add a `<Field label="Screen">` with a `<Select>` inside the Windows
   `<Card>`, binding through the `Controller` for `windows`.

6. **Default** — `DEFAULT_VALUES` in the same file:
   Set `screen: 'none'` so the reference house test still passes.

7. **Test** — `src/tests/calc/engine-v2.test.ts`:
   Add a test that `solar screen` reduces cooling total vs `none`.

8. **Run** — `npm test && npx tsc --noEmit && npm run build`.

## Common pitfalls

- **Don't import `better-sqlite3`** — it was removed in v2. Use
  `getSupabaseAdmin()` from `@/lib/db/client`.
- **Don't skip the Zod schema** when adding a field — the form won't
  submit because `safeParse` in the API route will reject it.
- **Don't put env var access at module top-level** in the DB client —
  it breaks `npm run build`. The current `getSupabaseAdmin()` is lazy.
- **Don't make the engine async** — it's pure and synchronous by
  design, which makes tests fast and readable.
- **When adding a new foundation type**, update the `FoundationType`
  union in `presets/foundation.ts`, the `foundation.ts` component's
  switch statement, the Zod enum in `schemas.ts`, and the `<Select>`
  in the form.
- **Reference house test** (`src/tests/calc/engine.test.ts`) will fail
  if you change default behavior. If it does, either the change is
  wrong or the reference totals need updating — check which.

## Where to look when something is broken

| Symptom | Likely location |
|---|---|
| Reference house test fails | `engine.ts` or a `components/*.ts` file |
| Form submits but API returns 400 | `schemas.ts` — missing field or bounds mismatch |
| Build fails with "Missing Supabase env vars" | Someone made `getSupabaseAdmin()` eager; keep it lazy |
| Types don't match between form and API | `types.ts` drifted from `schemas.ts` |
| New dropdown doesn't affect numbers | Engine isn't reading the new field |
