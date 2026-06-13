# Plan 014: Route all component Supabase calls through lib/*/queries.ts

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat b543c9a..HEAD -- components/vocabulary/decks/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" section against the live code before proceeding; treat a
> mismatch as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: MED
- **Depends on**: plans/001-ci-gate-on-failures.md
- **Category**: tech-debt
- **Planned at**: commit `b543c9a`, 2026-06-11

## Why this matters

CLAUDE.md mandates "All Supabase access → lib/*/queries.ts. No direct fetches
from UI." Five component files in the vocabulary/decks domain bypass this layer
by calling `getSupabaseBrowserClient()` and issuing raw Supabase queries inline.
This breaks offline mode (Dexie is never consulted), prevents unit-testing the
mutation logic without a live Supabase connection, and scatters SQL-level
concerns across UI files.

`components/auth/AuthProvider.tsx` also uses `getSupabaseBrowserClient` but
exclusively for auth session management (`signOut`, `onAuthStateChange`) —
this is auth infrastructure, not a data query, and is **out of scope**.

## Current state

### Files with direct Supabase calls (all in `components/vocabulary/decks/`)

| File | Tables touched | Operations |
|---|---|---|
| `AddToExistingDeckModal.tsx` | `word_bank_decks` | upsert |
| `CreateDeckFromWordsModal.tsx` | `decks`, `word_bank_decks` | insert deck + links |
| `CreateDeckModal.tsx` | `decks` | insert |
| `EditDeckModal.tsx` | `decks` | update |
| `ManageDrawer.tsx` | `deck_entries`, `entries` | select, upsert, insert, delete (multiple) |

All five import:
```ts
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
```

### Existing query file: `lib/decks/queries.ts`

Already exports: `getUserDecks`, `getDeckCardsWithProgress`,
`hasWordBankEntries`, `deleteDeck`, `upsertCardProgress`.

The pattern used (exemplar):
```ts
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export async function getUserDecks(userId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("decks")
    .select("id, name, color, icon, description")
    .eq("user_id", userId);
  if (error) throw error;
  return data ?? [];
}
```

Components call it: `const decks = await getUserDecks(userId)` — no supabase import needed.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Type-check | `pnpm type-check` | exit 0, no errors |
| Lint | `pnpm lint` | exit 0 |
| Tests | `pnpm test` | all pass |
| Done check | `grep -r "getSupabaseBrowserClient" components/vocabulary/` | 0 matches |

## Scope

**In scope** (the only files you should modify):
- `lib/decks/queries.ts` — add new query/mutation functions
- `components/vocabulary/decks/AddToExistingDeckModal.tsx`
- `components/vocabulary/decks/CreateDeckFromWordsModal.tsx`
- `components/vocabulary/decks/CreateDeckModal.tsx`
- `components/vocabulary/decks/EditDeckModal.tsx`
- `components/vocabulary/decks/ManageDrawer.tsx`

**Out of scope** (do NOT touch):
- `components/auth/AuthProvider.tsx` — auth lifecycle, intentionally correct
- Any `app/` server components
- Any other `lib/` files
- No behavior changes: pure structural extraction

## Git workflow

- Branch: `advisor/014-decks-supabase-to-queries`
- Commit: `refactor(decks): move Supabase calls from components into lib/decks/queries`
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Read all five component files

Before writing any code, read each of the five component files fully to
understand exactly what Supabase operations they perform and what the result
is used for. The plan provides guidance but the live code is authoritative.

### Step 2: Add mutation functions to `lib/decks/queries.ts`

Extract the following functions from the component logic into `lib/decks/queries.ts`.
Follow the existing style (get client, run query, throw on error, return data).

Functions to add (adjust parameter types and return types to match actual usage):

- **`addWordsToDeck(wordIds: string[], deckId: string): Promise<void>`**
  From `AddToExistingDeckModal.tsx` — upserts `word_bank_decks` rows.

- **`createDeck(params: { name: string; description?: string | null; color: string; icon: string; userId: string }): Promise<{ id: string }>`**
  From `CreateDeckModal.tsx` — inserts a new deck, returns the created row.

- **`updateDeck(deckId: string, params: { name: string; description?: string | null; color: string; icon: string }): Promise<void>`**
  From `EditDeckModal.tsx` — updates deck metadata.

- **`createDeckWithWords(deckParams: { name: string; description?: string | null; color: string; icon: string; userId: string }, wordIds: string[]): Promise<{ id: string }>`**
  From `CreateDeckFromWordsModal.tsx` — creates deck then links words.

- **`getDeckEntries(deckId: string): Promise<Array<{ entry_id: string; entries: unknown }>>`**
  From `ManageDrawer.tsx` — reads entries for a deck.

- **`upsertEntryAndLink(params: { word: string; userId: string; deckId: string; phrases?: string[] | null; meanings: string[] }): Promise<void>`**
  From `ManageDrawer.tsx` — upserts an entry and links it to the deck.

- **`removeDeckEntry(deckId: string, entryId: string): Promise<void>`**
  From `ManageDrawer.tsx`.

- **`removeDeckEntries(deckId: string, entryIds: string[]): Promise<void>`**
  From `ManageDrawer.tsx`.

- **`updateEntryMeanings(entryId: string, meanings: string[], phrases: string[]): Promise<void>`**
  From `ManageDrawer.tsx`.

Use the exact column names and query structure from the component code. Do not
change semantics — this is a pure extraction.

**Verify after each addition**: `pnpm type-check` → exit 0

### Step 3: Update components one by one

For each component file:
1. Replace the inline Supabase call with the corresponding function from `lib/decks/queries`.
2. Add the import from `@/lib/decks/queries`.
3. Remove the `import { getSupabaseBrowserClient }` line (only if it is no
   longer used after the replacement — `ManageDrawer` may use it for reads as
   well, check carefully).

After each component: `pnpm type-check` → exit 0

### Step 4: Final sweep

```bash
grep -r "getSupabaseBrowserClient" components/vocabulary/
```
Expected: 0 matches.

Then run the full suite:

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm lint:design-tokens
```

## Test plan

No new tests required. This is a pure structural extraction with no logic
change. If existing tests exist for these components, they must still pass.

## Done criteria

- [ ] `pnpm type-check` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0
- [ ] `grep -r "getSupabaseBrowserClient" components/vocabulary/` returns 0 matches
- [ ] Only the 6 in-scope files are modified (`git diff --name-only HEAD`)

## STOP conditions

- The inline Supabase code in any component doesn't match what you'd expect
  from the file names and table names listed above — read carefully before
  extracting and note discrepancies.
- A type error arises that requires changing `lib/supabase/types.ts`
  (auto-generated) — that file must not be hand-edited; STOP and report.
- The fix requires touching any file outside the in-scope list — STOP.

## Maintenance notes

- All future vocabulary/deck mutations must go into `lib/decks/queries.ts`
  from day one — the component must never import `getSupabaseBrowserClient`.
- `AuthProvider.tsx` is intentionally excluded — its Supabase usage is auth
  lifecycle management.
- A future plan (#12 in the audit) will tighten `select('*')` in some of the
  newly extracted functions — that is the right time to do it.
