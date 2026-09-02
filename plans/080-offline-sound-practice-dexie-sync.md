# Plan 080: Llevar `/practice/sounds` a Dexie y cerrar la brecha offline

> **Executor instructions**: Sigue este plan paso a paso. Corre cada comando de verificación y confirma la salida esperada antes de pasar al siguiente paso. Si ocurre algo de la sección "STOP conditions", detén la ejecución y reporta — no improvises. Al terminar, actualiza la fila de estado para este plan en `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a63525d0..HEAD -- CLAUDE.md lib/db/index.ts lib/phoneme-practice/queries.ts lib/sync/sync-manager.ts`
> Si alguno de los archivos en scope cambió desde que se escribió este plan, compara los extractos de "Current state" contra el código vivo antes de proceder.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: architecture, offline-first
- **Planned at**: commit `a63525d0`, 2026-09-02

## Why this matters

`CLAUDE.md:L31` documenta una excepción dura:
> `- **Exception — /practice/sounds is online-only (temporary):** this flow uses Supabase directly (user_contrast_progress, answer_history) with no Dexie layer...`

Aunque las escrituras (`saveAnswers`, `updateContrastProgress`) ya encolan en el Outbox (`lib/phoneme-practice/queries.ts:232, 305`), las lecturas (`getAllSounds`, `getAllContrastProgress`, `getSessionDatasets`) consultan directamente a Supabase mediante `supabase().from(...)`. Cuando el usuario intenta practicar fonemas sin conexión a internet, estas llamadas fallan arrojando excepciones no capturadas y bloqueando la práctica. Este plan agrega las tablas locales en Dexie para `sounds` y `user_contrast_progress` y adapta el query layer con estrategia cache-first / read-through offline.

## Current state

- `CLAUDE.md:30-31`: Excepción documentada que permite a `/practice/sounds` saltarse la regla Dexie⇄Supabase.
- `lib/phoneme-practice/queries.ts:46-53`:
  ```ts
  export async function getAllSounds(): Promise<Sound[]> {
    const { data, error } = await supabase()
      .from('sounds')
      .select('id, ipa, example, category, type, difficulty')
      .order('id')
    if (error) throw error
    return canonicalizeSoundRows(data as Sound[])
  }
  ```
- `lib/phoneme-practice/queries.ts:253-262`:
  `getAllContrastProgress` consulta directamente a Supabase sin respaldo local en Dexie.
- `lib/db/index.ts`: Ya define el esquema de Dexie con versionado, pero no indexa `sounds` ni `user_contrast_progress` para lecturas offline.

## Commands you will need

| Purpose   | Command                                 | Expected on success |
|-----------|-----------------------------------------|---------------------|
| Typecheck | `pnpm type-check`                       | exit 0, no errors   |
| Tests     | `pnpm test -- phoneme-practice`         | all pass            |
| Tests     | `pnpm test -- sync-manager`             | all pass            |
| Lint      | `pnpm lint`                             | exit 0              |
| Hard rules| `pnpm audit:hard-rules`                 | exit 0              |

## Scope

**In scope**:
- `lib/db/index.ts` (esquema Dexie: registrar tablas locales `cached_sounds` y `cached_contrast_progress`)
- `lib/phoneme-practice/queries.ts` (lecturas con fallback local en IndexedDB si Supabase está offline)
- `lib/sync/sync-manager.ts` (reconciliación de outbox hacia `cached_contrast_progress`)
- `CLAUDE.md` (retirar la excepción de `/practice/sounds` una vez completado)

**Out of scope**:
- No cambiar el algoritmo SRS de contrastes en `lib/phoneme-practice/sr.ts`.
- No modificar el esquema de Supabase remoto (las tablas remotas ya existen).

## Steps

### Step 1: Añadir tablas locales en Dexie (`lib/db/index.ts`)
- Incrementar la versión de la base de datos Dexie.
- Declarar dos nuevas tablas locales:
  - `cached_sounds: 'id, ipa, category'`
  - `cached_contrast_progress: 'contrast_id, user_id, next_review, mastery_pct'`

### Step 2: Implementar lectura con fallback offline en `lib/phoneme-practice/queries.ts`
- Modificar `getAllSounds()`:
  - Si hay conexión: obtener de Supabase y refrescar `db.cached_sounds.bulkPut(...)`.
  - Si falla la red o está offline: leer de `db.cached_sounds.toArray()`.
- Modificar `getAllContrastProgress(userId)`:
  - Si hay conexión: obtener de Supabase y almacenar localmente.
  - Si falla la red: consultar `db.cached_contrast_progress.where('user_id').equals(userId).toArray()`.
- Modificar `getContrastProgress(userId, contrastId)` para resolver desde la cache local si no hay red.

### Step 3: Actualizar `updateContrastProgress` para reflejo optimista local
- Al invocar `updateContrastProgress()`, además de hacer `enqueue(...)` en el outbox, actualizar inmediatamente `db.cached_contrast_progress.put(...)` para que el estado de dominio sea coherente de inmediato en el cliente.

### Step 4: Retirar la excepción en `CLAUDE.md`
- Eliminar la viñeta de excepción en la línea 31 de `CLAUDE.md`, declarando que `/practice/sounds` ahora cumple plenamente con el contrato offline-first.

### Step 5: Verificación
- Escribir test unitario en `lib/phoneme-practice/__tests__/offline-queries.test.ts` simulando fallo de red y verificando que `getAllSounds()` y `getAllContrastProgress()` resuelven con datos de Dexie.
- Correr `pnpm test -- phoneme-practice`.
- Correr `pnpm audit:hard-rules` y `pnpm type-check`.

## STOP conditions
- Si el incremento de versión de Dexie causa inconsistencias con migraciones de datos de sesiones previas en tests locales, asegurarse de usar `.upgrade()` sin alterar las stores existentes.
