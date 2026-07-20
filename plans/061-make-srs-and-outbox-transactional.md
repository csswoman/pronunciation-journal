# Plan 061: Hacer SRS offline, idempotente y honesto sobre su sincronización

> **Executor instructions**: Conserva los invariantes SM-2 existentes y prueba concurrencia real con Dexie. No muestres “sincronizado” a partir de un flush vacío o parcial. Actualiza la fila 061 al terminar.
>
> **Drift check (run first)**: `git diff --stat c779781b..HEAD -- lib/practice/queries.ts lib/word-bank/srs-queries.ts lib/practice/topic-srs-queries.ts lib/sync components/practice/session lib/tracking/queries.ts supabase/migrations`
> Si el outbox o las RPC SRS cambiaron, detente y vuelve a derivar el diseño con sus tests actuales.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: 059, 060
- **Category**: bug, migration
- **Planned at**: commit `c779781b`, 2026-07-19

## Why this matters

La app registra respuestas offline, pero las actualizaciones SRS leen estado remoto antes de encolar estados absolutos. Sin red se pierde el update; con respuestas concurrentes varias operaciones pueden leer la misma base y sobrescribirse. Además, la UI puede decir “Progreso guardado” aunque el lote esté pendiente o haya fallado permanentemente.

## Current state

- `lib/practice/queries.ts:131-145` encola `answer_history` y después llama updates separados de word/topic SRS.
- `lib/word-bank/srs-queries.ts:227` y `lib/practice/topic-srs-queries.ts:18` leen Supabase para calcular el siguiente estado; no es realmente offline.
- `lib/sync/sync-manager.ts:184` procesa el lote en paralelo; conflictos iniciales pueden producir `23505`, clasificado como permanente.
- `lib/sync/init-sync-listeners.ts:5` solo escucha `online`: no hay drain al arrancar ni timer de `nextRetryAt`.
- `components/practice/session/useSessionState.ts:112-120` termina en `saved` tras cualquier resolución de `flushOutbox`; `SessionSummary.tsx:120` lo presenta como “Progreso guardado”.
- `lib/tracking/queries.ts:45-67` encola deletes sin id en payload y la hidratación puede reinsertar filas borradas.

## Target contract

- Una respuesta evaluada produce eventos inmutables e idempotentes: answer + ratings SRS con una misma operation/session identity.
- El estado SRS se reduce serialmente por `(userId, entityType, entityId)`; dos ratings no se colapsan en uno.
- Estado visible: `saved_local`, `sync_pending`, `synced`, `sync_failed`; cada ack corresponde a ids concretos.
- El outbox drena al autenticar/arrancar, al volver online y al llegar `nextRetryAt`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Sync tests | `pnpm exec vitest run lib/sync lib/word-bank lib/practice components/practice/session` | all selected tests pass |
| Typecheck | `pnpm type-check` | exit 0 |
| Local DB | `pnpm exec supabase db reset` | exit 0 locally |
| RLS | `pnpm test:rls:integration` | pass locally |

## Scope

**In scope**: immutable SRS event schema/RPC, local transaction/enqueue contract, sync serialization/retry scheduler/result types, session save status, tracking tombstones/hydration, tests and generated Supabase types.

**Out of scope**: tuning SM-2 constants; changing UI layout; background service workers; production migration execution; replaying ambiguous historical ratings.

## Git workflow

- Branch: `codex/061-transactional-srs-outbox`.
- Suggested commits: migration/RPC, client enqueue/reducer, sync UI/tests. Stage exact paths only.
- Do not push or apply linked migrations without explicit instruction.

## Steps

### Step 1: Characterize invariants and races

Before refactoring, add tests for two ratings to the same new topic, two ratings to the same existing word, offline enqueue, retry after reload, duplicate idempotency key and a permanent error. Assert final review count and schedule, not implementation calls.

**Verify**: new race tests reproduce at least one current lost/conflicting update; existing scheduler invariant tests remain green.

### Step 2: Introduce immutable rating events

Add a migration for a rating event ledger (or equivalent RPC input) with unique idempotency key, user/entity identity, grade, occurred-at and evaluator metadata. Apply each event transactionally in Postgres and update the materialized SRS row under a per-entity lock/upsert. Mirror the event in Dexie so enqueue needs no network read.

**Verify**: local SQL tests submit the same event twice (one effect) and two different events concurrently (two effects).

### Step 3: Enqueue answer and ratings atomically locally

In one Dexie transaction, write/enqueue the answer, word rating and topic rating with related operation ids. If a surface has no valid target identity, persist the answer and report “no SRS target”; never guess a row.

**Verify**: simulate a crash between writes; after reload the transaction contains all operations or none.

### Step 4: Serialize by entity while retaining safe parallelism

Change the flusher so unrelated entities can run concurrently but operations for the same entity preserve order. Treat unique conflicts as idempotent success only when the idempotency key matches; do not globally reclassify `23505`.

**Verify**: sync tests show ordered same-entity execution and concurrent different-entity execution without duplicate application.

### Step 5: Add durable drain scheduling and exact acknowledgements

Drain after auth restoration, on `online`, and at the earliest retry time. Reuse the existing same-tab flush promise and coordinate tabs. Return per-operation outcomes; `recordActivitySession`, AI event pruning and session UI must consume those exact outcomes.

**Verify**: pending-at-start, timed retry, multi-tab and partial-batch tests pass; no busy loop occurs offline.

### Step 6: Expose truthful save state and recovery

Keep a local-success state distinct from confirmed remote sync. Never overwrite an earlier answer enqueue error with session success. Offer retry for failed recoverable entries and clear wording for local-only state.

**Verify**: component tests cover offline local save, remote ack, transient retry and permanent failure; “Progreso sincronizado” appears only after exact ack.

### Step 7: Make Tracking deletion merge-safe

Store a tombstone/id in delete payload or derive it reliably from `matchKey`. Protect pending/syncing/failed local operations during hydration and reconcile absent remote rows transactionally after a complete snapshot.

**Verify**: delete offline → reload/hydrate → reconnect never resurrects the item; focused tracking tests pass.

## Test plan

- Model Dexie tests after existing `lib/sync/__tests__` suites with `fake-indexeddb/auto`.
- Cover duplicate idempotency keys, ordered same-entity ratings, concurrent different entities, reload, offline startup, timed retry, partial ack and permanent failure.
- Cover UI states independently: local saved, pending sync, confirmed sync and recoverable/terminal failure.
- Verification: `pnpm exec vitest run lib/sync lib/word-bank lib/practice lib/tracking components/practice/session` → all pass.

## Done criteria

- [x] SRS enqueue performs no remote read.
- [x] Two distinct ratings always produce two ordered scheduler transitions.
- [x] Duplicate operation ids apply exactly once.
- [x] Startup, reconnect and retry-time drains are tested.
- [x] UI distinguishes local, pending, synced and failed.
- [x] Tracking deletes cannot resurrect during hydration.
- [x] Local migration/RLS, focused tests and typecheck pass.

## Completion notes (steps 6-7, 2026-07-20)

- Step 6: `progressSaveStatus` now has `saved_local` (local write ok, flush left
  pending/failed/skipped work) vs `synced` (flush pass confirmed everything),
  derived from `SyncFlushResult.failed`/`skipped`. An `error` from the answer
  enqueue is sticky — later flush outcomes can no longer silently overwrite it
  with a success state. Added a manual "Reintentar ahora" action
  (`handleRetrySync`) on `saved_local`/`error`, alongside the existing
  automatic drain-on-reconnect from step 5.
- Step 7: `hydrateTrackedItems` previously only protected `pending` rows, and
  only by matching `payload.id` — which deletes never populate (they only set
  `matchKey.id`), so pending deletes were never actually protected. Fixed to
  derive the row id from `matchKey.id` first, protect any row with a
  `pending`/`syncing`/`failed` outbox entry, and reconcile local rows absent
  from a complete remote snapshot (no pagination on the query) inside one
  transaction.
- Executed at reduced rigor per user instruction: direct implementation with
  tests, one combined quality review for both steps, no live DB pass (no SQL
  touched). Review flagged the missing manual retry action, which was then
  added — see the review agent's report for full findings (no other
  outstanding issues).
- Verification: `pnpm exec vitest run lib/sync lib/word-bank lib/practice
  lib/tracking components/practice/session` (277 passed; 5 pre-existing
  failures in `daily-plan.test.ts`, unrelated to this plan — different step
  count from an unrelated in-progress change) and `pnpm type-check` (clean).

## STOP conditions

- A change would weaken existing minimum interval/ease invariants.
- The design cannot atomically identify an answer and its SRS events.
- A linked/production migration is requested without fresh dry-run and explicit authorization.
- A full remote snapshot cannot be distinguished from a partial page; do not reconcile absences from partial data.

## Maintenance notes

Every future derived projection must be rebuildable from immutable evidence or clearly labeled disposable. Reviewers should scrutinize idempotency, ordering and exact acknowledgement more than happy-path latency.
