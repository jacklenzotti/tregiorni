# Tre Giorni — 3 Days in Italy

Interactive 3-day Italy trip planner built from `data/raw/italy.json` (103 places, deliberately messy).
Take-home project. Hard constraint: the code must be extendable **by hand, live, without AI help** —
optimize for legibility and small surface area over cleverness.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run normalize` | Regenerate `src/data/places.json` + `data/audit.md` from raw data |
| `npm run build` | Typecheck + production build (runs normalize first via prebuild) |
| `npm test` | Vitest, single run |
| `npm run lint` | ESLint (complexity ≤ 8, functions ≤ 50 lines, ≤ 80 in .tsx) |
| `npm run deploy` | Build + deploy to Cloudflare Pages |

## Architecture

- `src/domain/` — pure TypeScript, **zero React imports**. All logic lives here.
  - `normalize/` — parsers used only by `scripts/normalize.ts` (build-time).
  - `itinerary/` — the core SDK: `ops.ts` is the ONLY way an itinerary is mutated;
    `scheduleDay.ts` derives times/conflicts and never blocks an edit.
  - `planner/` — auto-fill/auto-plan; a consumer of `itinerary/ops`, never a bypass.
  - `budget/` — €-level → cost-band estimates.
- `src/components/` — presentational React; dispatches reducer actions that wrap SDK ops.
- `scripts/normalize.ts` — the ONLY writer of `src/data/places.json` and `data/audit.md`.
  Never hand-edit generated files; change the pipeline and rerun.
- `data/raw/italy.json` — source of truth, never modified.

## Conventions

- Composition over inheritance; plain data + pure functions; one deliberate class max.
- Self-documenting names, near-zero comments. Comments only for non-obvious constraints.
- Tests colocated (`foo.test.ts` beside `foo.ts`). Logic gets tests; presentational components don't.
- Every mutation returns a new object; no in-place edits of state.
- Unknown data stays unknown: represent with null/flags, surface in UI, never silently default.

## Data policy (condensed — full audit in data/audit.md)

| Raw case | Canonical handling |
| --- | --- |
| Hours strings (many formats) | Parsed to per-weekday intervals; minutes from midnight; end > start+1440 for past-midnight |
| "Evenings" / "Morning only" | Inferred 17:00–22:00 / 08:00–12:00, `source: 'inferred'`, badged |
| Hours null, type neighborhood | `openAccess` |
| Hours null, other types | `unknown`; schedulable only 10:00–18:00; badged "Hours unverified" |
| duration null | Per-type median, flagged `duration-estimated` |
| Mercato Centrale duplicate | place_031 → `aliasOf: place_030`, hidden from catalog |
| Coords > 30 km from city centroid | `coords-suspect`; listed but excluded from map + travel math |
| Tags | lowercase, `_` → `-`, deduped |
