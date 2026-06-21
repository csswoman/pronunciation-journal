# Plan 029: Remove remaining over-broad Supabase projections

> **Executor instructions**: Execute the inventory first; never guess columns.
> Update `plans/README.md` when complete.
>
> **Drift check (run first)**:
> `git diff --stat 4c35b5e..HEAD -- app/api/lexicon/[id]/route.ts lib/decks/queries.ts lib/sounds/queries.ts`

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `4c35b5e`, 2026-06-21

## Why this matters

Most query modules already use explicit projections, but several live paths
still fetch complete rows or joined `entries(*)`. This transfers fields the
caller does not use and makes payload growth invisible when schemas evolve.
The historical plan 012 is stale because its inventory predates current query
refactors; this plan replaces it with the confirmed 2026-06-21 locations.

## Current state

Confirmed broad projections:

- `app/api/lexicon/[id]/route.ts:61-65` — `word_bank.select("*")`.
- `lib/decks/queries.ts:30-35` — complete deck rows.
- `lib/decks/queries.ts:130-145` — `entries(*)` for study cards.
- `lib/decks/queries.ts:239-244` — `entries(*)` for manage drawer.
- `lib/decks/queries.ts:274-281` — `deck_entries.select("*")` though only two
  keys are returned.
- `lib/sounds/queries.ts:21-28` — complete contrast-progress rows.

Intentional count queries such as
`.select("*", { count: "exact", head: true })` must remain unchanged.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Inventory | PowerShell `Select-String` command below | only intentional counts |
| Typecheck | `pnpm type-check` | exit 0 |
| Tests | `pnpm test` | all pass |

Inventory command:

```powershell
Get-ChildItem app,lib -Recurse -File -Include *.ts,*.tsx |
  Select-String -Pattern '\.select\(["'']\*["'']|entries\(\*\)'
```

## Scope

**In scope**:

- `app/api/lexicon/[id]/route.ts`
- `lib/decks/queries.ts`
- `lib/sounds/queries.ts`
- Existing tests for these modules/routes
- `docs/architecture/performance.md`

**Out of scope**:

- Count/head projections
- Schema changes
- API response shape changes
- Query pagination

## Git workflow

- Branch: `codex/029-narrow-query-projections`
- Commit: `perf(data): narrow Supabase query projections`

## Steps

### Step 1: Trace actual field consumption

For each broad query, identify every field read by its immediate caller and
downstream typed component. Write the list in test names or a local checklist.
If a full table type is returned only for convenience, introduce a narrower
domain result type rather than preserving over-fetching.

**Verify**: no query is changed before consumption is documented.

### Step 2: Replace broad projections

Use explicit column strings. For joins, replace `entries(*)` with
`entries(id, word, ...required columns)`. Preserve output mapping and public
function contracts when callers genuinely require the full domain shape.

Do not change:

```ts
select("*", { count: "exact", head: true })
```

**Verify**: `pnpm type-check` exits 0 after each file.

### Step 3: Add regression tests

Route/query tests should assert the selected projection string through the
existing Supabase mocks and verify returned shapes. Add tests only where the
module currently lacks a projection assertion.

### Step 4: Full gate and inventory

Run the inventory command. Expected remaining matches:

- count/head queries only;
- zero `entries(*)` joins.

Then run all project verification commands and update the performance
documentation's query conventions.

## Test plan

- Lexicon route still returns all fields consumed by its client.
- Deck list, study, and manage flows preserve their expected row shapes.
- Sound mastery ranking receives all required progress fields.
- Count queries remain counts and return no rows.

## Done criteria

- [ ] No production `entries(*)` remains.
- [ ] Plain `select("*")` remains only where a documented full-row contract is
      unavoidable; ideally zero.
- [ ] Count/head queries are unchanged.
- [ ] Typecheck, lint, tests, and build pass.

## STOP conditions

- A caller dynamically spreads or persists a full row, making required fields
  impossible to determine safely.
- Generated Supabase types do not contain a required deployed column.
- Narrowing would change an external API response contract.

## Maintenance notes

New queries should use explicit projections. Full-row reads require an inline
comment naming the contract that needs every column.
