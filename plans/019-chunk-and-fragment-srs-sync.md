# Plan 019: El SRS de chunks y de frases del sistema sobrevive a un cambio de dispositivo

> **Instrucciones para el ejecutor**: sigue el plan paso a paso. Ejecuta cada
> comando de verificación y confirma el resultado esperado antes de pasar al
> siguiente. Si ocurre algo de "STOP conditions", detente y reporta. Al
> terminar, actualiza la fila de este plan en `plans/README.md`.
>
> **Drift check (ejecutar primero)**:
> `git diff --stat c869029c..HEAD -- lib/chunk-of-day/srs.ts lib/practice/fragment-srs.ts lib/db/index.ts lib/sync lib/practice/queries.ts supabase/migrations`
> Ante discrepancia con "Current state", STOP.

## Status

- **Priority**: P3
- **Effort**: L
- **Risk**: MED (migración SQL + outbox + reconciliación)
- **Depends on**: none
- **Category**: architecture
- **Planned at**: commit `c869029c`, 2026-09-18

## Why this matters

Los chunks son "la unidad comunicativa principal" del producto
(`docs/architecture/chunk-first-learning.md`), pero todo su estado de
repetición espaciada vive solo en Dexie: `upsertChunkSrs` y
`upsertFragmentSrs` terminan en `saveSRSData` → `db.srsData.put`, sin
outbox. Otro dispositivo, o limpiar datos del sitio, resetea a cero todos
los chunks mientras `answer_history` sigue diciendo que se practicaron;
Daily y Repaso los reintroducen como nuevos. El estado de usuario debe ir
"Dexie ⇄ Supabase (via lib/sync/)" según `CLAUDE.md`.

## Current state

- `lib/chunk-of-day/srs.ts:20-55` (`upsertChunkSrs`) calcula FSRS y llama `saveSRSData({...}, userId)`.
- `lib/practice/fragment-srs.ts` (`upsertFragmentSrs`) igual.
- `lib/db/index.ts:~811` `saveSRSData` = `db.srsData.put({ ...data, userId })`. Tabla `srsData` con índice `[userId+wordId]`; ids `chunk:<id>` / `fragment:<id>`.
- `lib/practice/queries.ts:180-186`: ramas `text_fragments` → `upsertFragmentSrs`, `chunks` → `upsertChunkSrs`; la rama `word_bank` sí usa `enqueueWordBankSRSUpdate` (outbox + RPC `apply_word_bank_rating_event`, ver `lib/sync/types.ts` `SyncRpc`).
- Outbox: `lib/sync/types.ts` (`SyncTable`, `SyncRpc`), `lib/sync/sync-manager.ts` (`UPSERT_CONFLICT_COLUMNS`). Patrón de hidratación remota → Dexie: `lib/ai-practice/queries.ts:47-63` (`hydrateFromRemote`, gana el `updatedAt` más reciente) y `lib/immersion/progress-queries.ts:hydrateImmersionProgress`.
- Migraciones con RLS por usuario de referencia: `supabase/migrations/20260718211317_create_tracked_items.sql`.
- `AuthProvider.tsx:hydrateCEFR` es donde se hidratan los espejos locales al iniciar sesión.

## Commands you will need

| Propósito | Comando | Esperado |
|---|---|---|
| Migraciones | `pnpm check:migrations && pnpm audit:rls` | exit 0 |
| Tests | `pnpm vitest run lib/chunk-of-day lib/practice lib/sync lib/db` | all pass |
| Typecheck / lint | `pnpm type-check && pnpm lint` | exit 0 |

## Scope

**In scope**: nueva migración `supabase/migrations/<ts>_create_content_srs.sql` (tabla `content_srs` con `user_id, content_id text, namespace text check in ('chunks','text_fragments'), stability, difficulty, state, interval, repetitions, next_review_at, last_review_at, updated_at`, PK `(user_id, namespace, content_id)`, RLS `auth.uid() = user_id`); `lib/sync/types.ts`, `sync-manager.ts`; `lib/chunk-of-day/srs.ts`, `lib/practice/fragment-srs.ts` (enqueue tras `saveSRSData`, en una transacción `db.transaction('rw', [db.srsData, db.syncOutbox], …)`); nuevo `lib/practice/content-srs-queries.ts` con `hydrateContentSrs(userId)`; `AuthProvider.tsx` (una línea de hidratación); tests; `docs/architecture/srs.md` (una sección).

**Out of scope**: `word_bank` SRS, cambiar el algoritmo FSRS, Essential Words.

## Git workflow

- Rama: `advisor/019-content-srs-sync` desde `dev`. Commits: `feat(db): add content_srs table for chunk and fragment scheduling`, `feat(sync): mirror chunk/fragment SRS through the outbox`.

## Steps

### Step 1: Migración + RLS

Crea la tabla y sus políticas (SELECT/INSERT/UPDATE/DELETE propias) siguiendo `create_tracked_items.sql`. Índice en `(user_id, next_review_at)`.

**Verify**: `pnpm check:migrations && pnpm audit:rls` → exit 0.

### Step 2: Outbox

Añade `'content_srs'` a `SyncTable` y `content_srs: 'user_id,namespace,content_id'` a `UPSERT_CONFLICT_COLUMNS`. En `upsertChunkSrs`/`upsertFragmentSrs` envuelve `saveSRSData` + `enqueue(userId, 'content_srs', 'upsert', row, undefined, 'user_id,namespace,content_id')` en una transacción. Tests: tras la llamada, `enqueue` recibido con la fila (patrón: `lib/immersion/__tests__/progress-queries.test.ts` del plan 012 o el test de `enqueueWordBankSRSUpdate`).

**Verify**: `pnpm vitest run lib/chunk-of-day lib/practice lib/sync` → all pass.

### Step 3: Hidratación al iniciar sesión

`hydrateContentSrs(userId)`: lee `content_srs` del usuario y hace `bulkPut` en `db.srsData` solo cuando `updated_at` remoto > `lastReview` local (misma regla que `hydrateFromRemote`). Llama desde `hydrateCEFR` junto a `hydrateImmersionProgress`.

**Verify**: `pnpm vitest run lib/practice` (test de la regla "gana el más reciente") → all pass. `pnpm type-check && pnpm lint` → exit 0.

### Step 4: Documentar

En `docs/architecture/srs.md` añade la tabla y la regla de reconciliación.

## Done criteria

- [ ] `pnpm check:migrations && pnpm audit:rls` exit 0
- [ ] Tests listados pasan
- [ ] `grep -n "enqueue(" lib/chunk-of-day/srs.ts lib/practice/fragment-srs.ts` → ≥2
- [ ] `git status` sin archivos fuera de scope
- [ ] Fila actualizada en `plans/README.md`

## STOP conditions

- Los extractos no coinciden.
- `db.srsData` no guarda `userId` en todas las filas antiguas (mira el índice `[userId+wordId]` y si hay migración Dexie previa): reporta antes de hidratar.
- El sync-manager no soporta un conflict target de 3 columnas (revisa `UPSERT_CONFLICT_COLUMNS` y su uso): reporta.

## Maintenance notes

- La reconciliación es "gana el más reciente"; no fusiona dos calendarios divergentes. Documentado como limitación aceptada.
