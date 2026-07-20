# Plan 052: Crear almacenamiento y sincronización offline-first para Journal

## Status

- **Priority**: P1 product
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: TODO RLS-INT/T56 baseline
- **Category**: migration / architecture
- **Planned at**: commit `38c3abe5`, 2026-07-17

## Why this matters

No existe Journal aunque da nombre al producto. Antes de UI o Gemini se necesita un contrato de datos seguro, idempotente y usable offline; mezclarlo todo impediría validar pérdida de datos y RLS por separado.

## Current state

- Dexie está en v16 y `syncOutbox` soporta insert/update/upsert/delete.
- `SyncTable` no incluye `journal_entries`.
- El patrón de RLS propio está en `20260610150000_user_learning_state.sql` y `20260618120000_topic_srs.sql`.
- Supabase debe ser fuente de verdad tras reconexión; Zustand no puede guardar Journal.

## Data contract

`journal_entries`: UUID `id`, `user_id`, `entry_date`, `prompt`, `prompt_topic`, `content`, status `draft|submitted|corrected`, `corrected_content`, `feedback jsonb`, timestamps; unique `(user_id, entry_date)` para una entrada diaria v1. El ID se genera en cliente para que el mismo upsert sea idempotente offline/online.

## Scope

**In scope**: migración con RLS e índices, tipos Supabase, Dexie v17/store, `SyncTable`, `lib/journal/types.ts`, `lib/journal/queries.ts`, repositorio local y tests de outbox/RLS.

**Out of scope**: prompts/Gemini, UI, aplicar feedback a SRS, múltiples entradas por día, producción.

## Steps

1. Escribir migración completa con checks de status, ownership, unique diario, índice histórico y cuatro políticas propias. Sin grants amplios.
2. Regenerar tipos Supabase y definir tipos de dominio con parser para `feedback` desconocido/null.
3. Añadir `JournalEntryRecord` y `journalEntries` en Dexie v17: `id, userId, entryDate, status, updatedAt`.
4. Extender `SyncTable` y conflict target para `journal_entries`. Implementar transacción atómica local+enqueue con upsert por `id`; updates deben incluir `user_id` y nunca cambiar ownership.
5. Crear query layer para listar/leer remoto y reconciliar con local sin sobrescribir una versión local más nueva/pending.
6. Probar create/update offline, flush, retry, idempotencia, aislamiento por usuario y upgrade Dexie v16→v17.
7. Ejecutar auditoría estática y runner RLS únicamente en local/staging aislado.

## Verification

| Command | Expected |
|---|---|
| `pnpm check:migrations && pnpm audit:rls` | exit 0 |
| `pnpm test -- lib/journal lib/sync lib/db` | tests verdes |
| `pnpm test:rls:integration` | verde en entorno aislado |
| `pnpm type-check && pnpm lint` | exit 0 |

## Done criteria

- [ ] Un draft creado offline sobrevive recarga y queda pending.
- [ ] Al reconectar se sincroniza una vez, sin duplicado diario.
- [ ] Dos usuarios no pueden leer ni mutar entradas ajenas.
- [ ] Fallos permanentes quedan visibles en outbox y no borran el draft.
- [ ] Upgrade Dexie conserva stores anteriores.

## STOP conditions

- No hay entorno RLS aislado.
- La reconciliación requiere elegir entre dos versiones concurrentes sin una regla verificable; reportar el conflicto antes de implementar last-write-wins implícito.

## Git workflow and maintenance

- Branch: `codex/052-journal-storage`; commit: `feat(journal): add offline-first entry storage`.
- Cada nueva columna durable debe actualizar Supabase, tipos, Dexie/reconciliación y tests de upgrade en el mismo PR.
