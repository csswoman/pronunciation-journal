# Plan 012: Replace `select('*')` with explicit column lists in critical queries

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat b543c9a..HEAD -- lib/`
> If lib/ files changed since this plan was written, re-run the grep in
> Step 1 to get the current list before proceeding.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: performance
- **Planned at**: commit `b543c9a`, 2026-06-11

## Why this matters

`select('*')` fetches every column from a table including large text fields
(e.g. `content`, `notes`, JSON blobs) that the calling code never uses.
On large tables like `word_bank` or `answer_history` this inflates response
payloads and slows queries. Explicitly naming columns is also self-documenting:
it makes clear exactly what data the function needs.

`select('*', { count: 'exact', head: true })` is a count query pattern (no
rows returned) and must NOT be changed — it is correct as-is.

## Steps

### Step 1: Find all `select('*')` instances to fix

Run:
```bash
grep -rn "\.select('\*')\|\.select(\"\*\")" lib/ --include="*.ts"
```

For each match, note the file, line number, table name, and which columns the
result is actually used for in the surrounding code. Skip any match where the
third argument includes `{ count: 'exact', head: true }` or `{ head: true }`.

Read each file to identify which columns from the result are actually accessed
by the calling code. These are the only columns to include in the explicit
select.

### Step 2: Replace each `select('*')` with explicit columns

For each match found in Step 1:

1. Read the function that uses the query result.
2. List every property accessed on the result rows.
3. Replace `select('*')` with `select('col1, col2, col3')` using exactly
   those column names.

Example pattern:
```ts
// Before:
const { data } = await supabase.from('word_bank').select('*').eq('user_id', userId)
// code uses: data.id, data.word, data.srs_status, data.next_review_at

// After:
const { data } = await supabase.from('word_bank').select('id, word, srs_status, next_review_at').eq('user_id', userId)
```

**After each file change, verify**: `pnpm type-check` → exit 0

### Step 3: Full verification

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm lint:design-tokens
```

### Step 4: Confirm no remaining instances

```bash
grep -rn "\.select('\*')\|\.select(\"\*\")" lib/ --include="*.ts"
```

Expected: 0 matches outside of count queries. If count queries appear, verify
they have `{ count: 'exact', head: true }` — those are intentional and correct.

## Test plan

No new tests required. `pnpm type-check` verifies no property access on
columns that were removed from the select. If a column was omitted by mistake,
TypeScript will catch it (Supabase's generated types narrow the return type
to the selected columns).

## Done criteria

- [ ] `pnpm type-check` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0
- [ ] `grep "\.select('\*')" lib/` returns only count-query lines (or 0 matches)
- [ ] Only `lib/` files are modified

## STOP conditions

- A query uses spread/destructuring in a way that makes it impossible to
  determine which columns are used without full data-flow analysis — STOP and
  report that query; leave it with `select('*')` rather than guess.
- The Supabase generated types don't include a column name you want to add to
  the select (meaning the column was added to the DB without regenerating
  types) — STOP and report.
- `pnpm type-check` fails after a replacement because Supabase's TypeScript
  types don't support the partial column selection (some older SDK versions
  don't narrow by column list) — revert that specific change and note it.

## Maintenance notes

Any future query added to `lib/` should use explicit column lists from the
start. `select('*')` is acceptable only in count queries
(`{ count: 'exact', head: true }`).
