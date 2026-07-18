# Database state & schema drift (2026-07-18)

Snapshot of how the local migration history and the **remote (production)** project
relate, what was reconciled, and the steps to finish and to keep them aligned.

Remote project ref: `enpxrijfnkcgvkyrjxod`. Local schema is defined solely by
`supabase/migrations/*.sql` (a from-scratch `supabase db reset` must reproduce prod).

## TL;DR

- **Content: healthy.** `lib/content/__tests__/content-integrity.test.ts` passes 7/7
  (mini-lesson ⇄ lesson slugs, exercise answer keys, curriculum ⇄ grammar decks).
  `exercise_types` on remote holds all 21 slugs the code registries use (ids 1‑8,
  10‑22; id 9 is a retired id referenced by nothing).
- **DB: fully reconciled.** Migration history and prod had diverged in **both
  directions**; all reconciling migrations were pushed and `supabase db diff --linked
  --schema public` now reports **"No schema changes found"**. Local and prod are in sync.

## What was already fixed and pushed to prod

| Migration | What it did | Status |
|---|---|---|
| `20260718120000_fix_text_fragments_rls_recursion` | Replaced the self-referential `text_fragments` RLS policy with a `SECURITY DEFINER` helper (`text_fragments_within_limit`). | Applied + verified |
| `20260718150000_retire_user_sound_progress_formalize_deck_cache` | Dropped legacy `user_sound_progress`, stopped `handle_new_user` seeding it, and formalized `deck_suggestions_cache` (used by `/api/gemini/deck-suggest`). | Applied + verified |
| `20260718160000_reconcile_prod_drift` | Reconciled the bidirectional drift below (recreated the enrichment/sentence-cache objects on prod; captured the out-of-band prod objects into history). | Applied + verified |
| `20260718170000_deck_cache_revoke_authenticated_writes` | Revoked `authenticated` write grants on `deck_suggestions_cache` so a fresh build matches prod (writes are service_role-only). | Applied + verified |

## Reconciled drift (fixed by the migrations above)

Found with `supabase db diff --linked --schema public`; the final run reports
**"No schema changes found"**.

### Direction A — objects the migrations create but PROD is missing

These migrations are recorded as applied on remote, yet the objects are gone
(same drift class as `user_sound_progress`). They back live features:

| Object | Impact if missing on prod |
|---|---|
| `word_enrichment_jobs` (table, indexes, trigger, 2 RLS policies) | **HIGH** — `POST /api/words` throws 500 when adding *any* word (manual, reader tap-to-save, and journal suggested words via `quickAddWord`). The word row is inserted but the response fails and enrichment never runs. |
| `claim_enrichment_jobs(int, text)` (RPC) | The `drain-enrichment` cron cannot claim jobs. |
| `sentence_transcription_cache` (table, index, trigger, 4 RLS policies) | **LOW** — `/api/gemini/transcribe-sentence` L2 cache is a no-op; it degrades gracefully (try/catch), so no crash, just more Gemini calls. |

### Direction B — objects PROD has but the migrations never created

Created out-of-band on prod, so a from-scratch local build was missing them:

| Object | Why it matters |
|---|---|
| `entries.image_url` (text) | Used by `/api/gemini/word-image`. |
| `entries.phrases` (text[]) | Used by the phrases feature. |
| `idx_answer_history_user_date`, `idx_word_bank_user` | Query performance. |
| `"Update own deck entries"` policy on `deck_entries` | Without it, users cannot update their own deck entries. |
| `consume_rate_limit(text,int,int)` body | Aligned to the live version (kept verbatim so future diffs stay clean). |

The reconciliation migration is **idempotent** (`create ... if not exists`,
`drop policy if exists` + recreate, `add column if not exists`, `create or replace`),
so it is a no-op on whichever side already holds each object and safe on both a
from-scratch build and prod.

## Steps performed (2026-07-18)

1. Reviewed `20260718160000_reconcile_prod_drift.sql`.
2. `supabase db push --dry-run` → confirmed only the pending migration.
3. `supabase db push` → applied to prod.
4. `supabase db diff --linked --schema public` → **"No schema changes found"** ✅.
   (One residual `deck_suggestions_cache` grant mismatch surfaced and was fixed by
   `20260718170000_deck_cache_revoke_authenticated_writes`.)
5. Verified on remote: `word_enrichment_jobs`, `sentence_transcription_cache`,
   `claim_enrichment_jobs` exist; `word_enrichment_jobs` has both RLS policies;
   `deck_entries` has its 4 policies (incl. "Update own deck entries").

Still recommended for the user: **smoke-test** adding a word to the word bank (or a
journal suggested word) and confirm a 200/201 — this is the flow that previously
threw 500. `lib/supabase/types.ts` already matches remote, so no type regen is needed.

## Keeping local and remote aligned (going forward)

- Never edit an already-applied migration file; add a **new** migration instead.
  Most of the drift above came from migrations being rewritten after they were applied.
- After any DDL, run `supabase db diff --linked --schema public` — a clean run is the
  invariant. Treat a non-empty diff as drift to reconcile.
- Run `get_advisors` (security) after schema changes; see
  `docs/database/rls-integration.md` for the standing advisor notes.
