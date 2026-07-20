# Plan 060: Aislar por usuario todos los datos locales de aprendizaje y chat

> **Executor instructions**: Ejecuta el plan completo con pruebas de dos cuentas en el mismo navegador. No asignes datos legacy a una cuenta por conveniencia. Actualiza `plans/README.md` al terminar.
>
> **Drift check (run first)**: `git diff --stat c779781b..HEAD -- lib/db/index.ts lib/db/ai.ts lib/types.ts components/auth/AuthProvider.tsx hooks/useAIPractice.ts components/ai-coach/PronunciationView.tsx`
> Si cambió el esquema Dexie o una API ya recibe `userId`, compara cada supuesto y detente ante una incompatibilidad.

## Status

- **Priority**: P1 security
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: 059
- **Category**: security, migration
- **Planned at**: commit `c779781b`, 2026-07-19

## Why this matters

Varias tablas IndexedDB usan claves globales del dispositivo. Dos cuentas en el mismo navegador pueden compartir conversations, completions y frases de pronunciación; otro dispositivo no puede reconstruir parte del progreso. Antes de ampliar speaking, toda evidencia privada debe estar namespaced por usuario y tener una política explícita de migración.

## Current state

- `lib/types.ts:186` define `AIConversation` sin `userId`; `lib/db/ai.ts` lista, lee y borra sin filtro de cuenta.
- `lib/db/index.ts:71-76` usa `courseSlug:lessonSlug` para completion; `PronunciationMasteryRecord` usa `phrase` y `PronunciationCoachStateRecord` usa `queue|seen` como PK global.
- `components/auth/AuthProvider.tsx:53` cierra sesión en Supabase, pero no cambia namespace ni limpia vistas locales.
- `components/ai-coach/PronunciationView.tsx:64-79` carga cola/mastery sin identidad.
- Convención: los datos deben permanecer offline-first; cerrar sesión no debe destruir silenciosamente datos pendientes de sync.

## Target contract

- Toda fila local privada contiene `userId`; la clave o índice compuesto empieza por `userId`.
- Ninguna query de UI puede ejecutar sin el user id autenticado explícito.
- El cambio de cuenta invalida bindings/reactive queries antes de mostrar la nueva sesión.
- Los registros legacy se migran solo con una regla auditable; datos ambiguos quedan en cuarentena local y nunca se muestran a otra cuenta.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| DB tests | `pnpm exec vitest run lib/db hooks components/auth components/ai-coach` | all selected tests pass |
| Typecheck | `pnpm type-check` | exit 0 |
| Search | `git grep -n "db\.aiConversations\|db\.completedLessons\|db\.pronunciation" -- ':!plans/*'` | every production call passes/scopes user id |

## Scope

**In scope**: `lib/db/index.ts`, `lib/db/ai.ts`, account-owned Dexie record types and their direct hooks/components; a new Dexie schema version; auth-transition invalidation; focused tests and an architecture note under the documentation file owned by plan 064.

**Out of scope**: deleting server data on logout; storing raw audio; changing Supabase Auth; production database DDL unrelated to user-scoped mirrors; assigning ambiguous legacy records to the first future login.

## Git workflow

- Branch: `codex/060-user-scoped-local-data`.
- Scoped staging only; suggested commit `fix(storage): isolate local learning data by user`.
- Do not push without instruction.

## Steps

### Step 1: Inventory and classify every account-owned store

Create a checked test/table covering conversations, AI events/state, completions, word/practice mirrors, pronunciation queue/seen/mastery and tracking. Mark each as already scoped, must migrate or deliberately device-global (UI prefs only).

**Verify**: the inventory test fails if a declared private table lacks `userId` or a user-leading compound key.

### Step 2: Add a Dexie migration with quarantine

Add a new schema version. Migrate rows with proven ownership; copy ambiguous legacy rows into a non-rendered quarantine store or delete only after an explicit documented decision. Do not silently attach them to the active account.

**Verify**: `pnpm exec vitest run lib/db` → migration from the immediately previous schema preserves scoped rows, hides ambiguous rows and is idempotent.

### Step 3: Make identity mandatory at every boundary

Change helpers/hooks so `userId` is a required argument and all reads, writes, counts and deletes filter it. Use compound keys such as `[userId+phrase]`, `[userId+key]` and `[userId+courseSlug+lessonSlug]` rather than string concatenation without an index.

**Verify**: TypeScript reports no old call sites; two-user tests prove no conversation, completion or pronunciation state crosses accounts.

### Step 4: Handle auth transitions without data loss

On sign-out/account change, dispose live queries and clear in-memory state before rendering the next account. Attempt a bounded outbox flush for the outgoing user; if it cannot sync, keep its rows namespaced and pending rather than deleting them.

**Verify**: component test A→sign out→B shows empty/B data only, then returning to A restores A data.

### Step 5: Make remote mirrors explicit

For each store that is intended to work cross-device, define its Supabase entity/outbox/hydration owner. Remove declared outbox targets that have no migration, or add a new migration with RLS and generated types; never mark a local AI event synced based on an unrelated global flush.

**Verify**: local DB rebuild and focused sync tests pass; every outbox target exists in migrations/types or is removed.

## Test plan

- Dexie upgrade from current version with owned and ambiguous legacy fixtures.
- Same browser: account A and B create/read/delete each data type independently.
- Logout while offline preserves A pending rows but reveals none to B.
- Hydration and ack tests bind success to the exact outbox operation id.

## Done criteria

- [ ] All private IndexedDB rows and queries are user-scoped.
- [ ] Account switching cannot reveal or merge another user's chat/progress.
- [ ] Legacy ambiguity has a documented quarantine policy.
- [ ] Every declared remote target exists with RLS/types or is removed.
- [ ] Focused tests and typecheck pass; README row updated.

## STOP conditions

- Ownership of legacy data cannot be proven and product wants automatic reassignment.
- A migration would delete pending unsynced rows without an export/recovery path.
- A private store is read before auth resolution; report the caller instead of using a global fallback.
- Production DDL is required: stop after read-only preflight and obtain explicit authorization.

## Maintenance notes

New Dexie stores must declare `device-global` or `account-owned` at review time. Only presentation preferences may be device-global by default.
