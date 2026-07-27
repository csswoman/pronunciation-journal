# Plan 059: Separar completion, quiz y dominio en un contrato de evidencia verificable

> **Executor instructions**: Sigue este plan paso a paso. Ejecuta cada verificación y confirma el resultado esperado antes de continuar. No conviertas lectura/completion en una respuesta correcta sintética. Al terminar, actualiza la fila 059 en `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c779781b..HEAD -- lib/practice/queries.ts lib/progress/queries.ts lib/db/index.ts components/mini-lessons components/courses supabase/migrations lib/supabase/types.ts`
> Si cambió un archivo in-scope, compara los extractos con el código actual. Si el contrato ya cambió o no coincide, detente y reporta.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: none
- **Category**: bug, migration
- **Planned at**: commit `c779781b`, 2026-07-19

## Why this matters

La app hoy fabrica un `fill_blank` correcto cuando alguien termina una lección y cuenta todas las respuestas con contexto `courses` como “lecciones completadas”. Eso mezcla exposición, desempeño y dominio, infla las métricas y vuelve imposible decidir qué debe repasarse. El resultado de este plan será un contrato explícito: completion, intento de quiz y mastery son señales distintas.

## Current state

- `lib/practice/queries.ts:32-55` implementa `recordLessonComplete`; crea un answer con `slug: 'fill_blank'`, `isCorrect: true` y `timeMs: 0`, y luego marca Dexie.
- `components/mini-lessons/MiniLessonQuiz.tsx:43-65` calcula el resultado real, pero al terminar solo llama `recordLessonComplete(...)`; no persiste las respuestas evaluadas.
- `lib/progress/queries.ts:240-244` deriva `lessonsCompleted` contando filas de `answer_history` cuyo `context === 'courses'`; una PracticeSession de curso genera una fila por ejercicio.
- `lib/progress/daily-reconcile.ts:79` marca el primer `concept` ante cualquier sesión `courses` y no resuelve `study_deck`, aunque `hooks/useDailyPlan.ts` puede incluir ambos y la metadata admite `lessonSlug`.
- `lib/db/index.ts:71-77` define `CompletedCourseLesson` sin `userId`; sus helpers usan `${courseSlug}:${lessonSlug}` como clave global.
- Convención a conservar: respuestas objetivas usan `savePracticeAnswer`; sesiones usan `recordActivitySession` en `lib/progress/activity-hub.ts`; escrituras remotas pasan por el outbox.

## Target contract

- `lesson_completion`: evidencia de que el usuario terminó el contenido; no tiene accuracy ni se materializa como exercise answer.
- `quiz_attempt`: cada pregunta evaluada persiste su resultado real en `answer_history`, con `topic`, `exerciseTypeId`, `contentId` y tiempo reales.
- `quiz_passed`: estado derivado de un intento y un umbral explícito; no es equivalente a completion.
- `concept_mastery`: solo se deriva de evidencia objetiva/SRS; nunca de abrir o terminar una pantalla.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused tests | `pnpm exec vitest run lib/practice lib/progress components/mini-lessons components/courses` | all selected tests pass |
| Typecheck | `pnpm type-check` | exit 0, no TypeScript errors |
| Migration rebuild | `pnpm exec supabase db reset` | exit 0 against local Supabase only |
| RLS | `pnpm test:rls:integration` | all policies pass against local Supabase |

## Scope

**In scope**:
- A new migration for `lesson_completions` keyed by `(user_id, course_slug, lesson_slug)` with RLS.
- `lib/supabase/types.ts`, `lib/db/index.ts`, `lib/sync/*` mappings needed for completion.
- `lib/practice/queries.ts`, `lib/progress/queries.ts`, `lib/progress/fluency-scores.ts`.
- Mini-lesson and course quiz callers plus focused tests.

**Out of scope**:
- Changing SM-2 formulas.
- Redesigning course UI or gating the whole curriculum.
- Rewriting historical answers to guess completions. Only migrate evidence when the mapping is unambiguous.
- Any linked/production database write without a separate read-only preflight and explicit owner authorization.

## Git workflow

- Branch: `codex/059-learning-evidence-contract`.
- Use scoped staging; this worktree contains unrelated changes.
- Suggested commit: `fix(progress): separate lesson completion from quiz evidence`.
- Do not push or open a PR unless requested.

## Steps

### Step 1: Add the canonical completion entity

Create `lesson_completions` with user/course/lesson identity, `completed_at`, optional `source` and `updated_at`; enable RLS and add select/insert/update/delete policies scoped to `auth.uid()`. Add the Supabase type, an outbox target and an IndexedDB mirror whose primary identity includes `userId`.

**Verify**: `pnpm exec supabase db reset && pnpm test:rls:integration` → local rebuild succeeds and cross-user access is rejected.

### Step 2: Replace the synthetic correct answer

Change `recordLessonComplete(userId, courseSlug, lessonSlug)` to upsert only the completion locally and into the outbox. Change incomplete to delete only that completion. Do not delete genuine quiz answers or activity sessions.

**Verify**: add a test asserting completion creates no `answer_history` item and incomplete does not remove prior quiz attempts; run `pnpm exec vitest run lib/practice` → pass.

### Step 3: Persist real quiz evidence

Have mini-lessons and course quizzes submit each graded answer through `savePracticeAnswer`, then record one activity session from those real results. Define and test the pass threshold in one pure helper. Mark content complete independently from pass; if product gating later requires a pass, derive it from the helper rather than changing the meaning of completion.

**Verify**: `pnpm exec vitest run components/mini-lessons components/courses lib/practice` → wrong, right, retry and mixed-score cases pass.

### Step 4: Derive progress from the correct entity

Make route rings, next-lesson CTA and `lessonsCompleted` read the user-scoped completion mirror. Make accuracy and SRS read only evaluated answers. Update `fluency-scores.ts` so completion can contribute only to an exposure/consistency dimension, never as a perfect answer.

**Verify**: a test with one lesson and five course answers reports `lessonsCompleted === 1`; `pnpm exec vitest run lib/progress components/courses` → pass.

### Step 5: Reconcile the exact Daily assignment

Carry a stable daily-step identity in completion/session metadata (`concept:<slug>` or `study_deck:<level>:<lesson>`). Reconcile only the matching cached step; opening or completing an unrelated course must not advance the assigned theory item.

**Verify**: a plan containing both `concept` and `study_deck` marks only the exact completed target; `pnpm exec vitest run lib/progress/__tests__/daily-reconcile.test.ts` → pass.

### Step 6: Hydrate and reconcile safely

On authenticated startup, merge remote completions into the current user's mirror without exposing another account or clobbering pending local operations. Document the legacy-record policy: assign legacy rows only when a single known user can be proven; otherwise quarantine/drop them after explicit sign-in confirmation.

**Verify**: tests cover offline complete → reload → reconnect, second-device hydration, account switch and incomplete; focused tests pass.

## Test plan

- Add migration/RLS assertions for own-row CRUD and cross-user denial.
- Add query tests for completion without fake answer, real quiz results, retry and incomplete.
- Add Dexie tests using `fake-indexeddb/auto` for two users sharing a browser.
- Add a regression test proving multiple course answers do not inflate the lesson count.

## Done criteria

- [x] No production path creates a fake correct answer for lesson completion. (`recordLessonComplete` upserts `lesson_completions` only; no synthetic `answer_history` row.)
- [x] Completion, quiz pass and mastery have separate types and stores.
- [x] Course progress is stable across reload/device and isolated by user. (`lesson_completions` keyed by `(user_id, course_slug, lesson_slug)`, RLS scoped to `auth.uid()`.)
- [x] `lessonsCompleted` counts canonical completions, not answer rows.
- [x] Daily marks only the exact concept/study-deck assignment complete.
- [x] Local migration, RLS, focused tests and typecheck pass.
- [x] No files outside scope are staged; `plans/README.md` is updated.

## Verification (2026-07-27)

- The only remaining blocker (Docker Desktop unavailable for local Supabase) was environmental, not a code gap — implementation had already been complete since 2026-07-20. Docker Desktop was resumed and the local stack (which had exited ~27h earlier) restarted cleanly.
- Ran `pnpm exec supabase db reset`: all migrations (including `20260720060020_create_lesson_completions.sql`) applied cleanly on a fresh local database.
- Ran `pnpm test:rls:integration`: passed — cross-user access correctly denied on `lesson_completions` and related tables.
- Ran `pnpm exec vitest run lib/practice lib/progress components/mini-lessons components/courses`: 293/293 passed.
- `pnpm type-check`: clean.

## STOP conditions

- Stop if production state must be inferred from ambiguous historical `answer_history` rows.
- Stop if local Supabase cannot be rebuilt; do not test RLS in production.
- Stop if a caller depends on completion being a perfect answer for unlocking; report that dependency before changing it.
- Stop if account identity is unavailable at the write boundary; do not fall back to a global key.

## Maintenance notes

Any future learning surface must declare which of the four signals it emits. Reviewers should reject code that records completion by inventing an exercise result or derives mastery from navigation state.
