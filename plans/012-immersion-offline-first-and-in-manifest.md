# Plan 012: El progreso de inmersión es offline-first y las lecciones de inmersión entran en el manifest

> **Instrucciones para el ejecutor**: sigue el plan paso a paso. Ejecuta cada
> comando de verificación y confirma el resultado esperado antes de pasar al
> siguiente. Si ocurre algo de "STOP conditions", detente y reporta. Al
> terminar, actualiza la fila de este plan en `plans/README.md`.
>
> **Drift check (ejecutar primero)**:
> `git diff --stat c869029c..HEAD -- lib/immersion/progress-queries.ts lib/immersion/use-immersion-progress.ts lib/sync/types.ts lib/sync/sync-manager.ts lib/learning-loop scripts/audit-learning-loop.mjs lib/db/index.ts`
> Ante discrepancia con "Current state", STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (toca el outbox y el manifest que corre en `prepush`)
- **Depends on**: none
- **Category**: correctness / architecture
- **Planned at**: commit `c869029c`, 2026-09-18

## Why this matters

`CLAUDE.md` exige que ninguna feature rompa el modo offline y que el estado
de usuario vaya "Dexie ⇄ Supabase (via lib/sync/)". `markImmersionLessonWatched`
escribe en Dexie y luego llama **directamente** al cliente Supabase; sin red,
la lección queda marcada localmente pero nunca llega al servidor, y el hook
silencia el error. Además, inmersión es el único tipo de contenido que Daily y
Repaso recomiendan y Progreso proyecta como "completado" sin estar en el
manifest de `lib/learning-loop/`: el `audit:learning-loop` de `prepush` da
"OK" porque solo audita lo que ya está listado. Este plan pone inmersión en el
outbox y en el manifest, de modo que el contrato "cada contenido declara qué
enseña" quede vigilado por la auditoría.

## Current state

### A. Escritura directa — `lib/immersion/progress-queries.ts:74-104`

```ts
export async function markImmersionLessonWatched(userId, lessonId, quizScore?) {
  const now = new Date().toISOString()
  const record: ImmersionLessonProgressRecord = { key: progressKey(userId, lessonId), userId, lessonId, watched: true, watchedAt: now, quizScore, updatedAt: now }
  await db.immersionLessonProgress.put(record)
  const { error } = await getSupabaseBrowserClient().from('immersion_lesson_progress').upsert(
    { user_id: userId, lesson_id: lessonId, watched: true, watched_at: now, quiz_score: quizScore ?? null, updated_at: now },
    { onConflict: 'user_id,lesson_id' },
  )
  if (error) throw error
}
```

`lib/immersion/use-immersion-progress.ts:19-22`: `.catch((err) => { console.error(...); markedRef.current = false })`.

### B. Patrón correcto — `lib/courses/queries.ts:50-62`

```ts
await db.transaction('rw', [db.completedLessons, db.syncOutbox], async () => {
  await markLessonComplete(user.id, courseSlug, lessonSlug)
  await enqueue(user.id, 'lesson_completions', 'upsert', {
    user_id: user.id, course_slug: courseSlug, lesson_slug: lessonSlug, completed_at: completedAt, source: 'lesson_completion', updated_at: completedAt,
  }, undefined, 'user_id,course_slug,lesson_slug')
})
```

`lib/sync/types.ts:5-22` — unión `SyncTable` (no incluye `immersion_lesson_progress`).
`lib/sync/sync-manager.ts:45-53` — `UPSERT_CONFLICT_COLUMNS` por tabla
(`lesson_completions: 'user_id,course_slug,lesson_slug'`). El comentario de
las líneas 55-75 explica qué tablas **no** deben entrar en
`TABLES_WITH_CLIENT_GENERATED_ID_IDEMPOTENCY` (las de clave de negocio, como
esta). `enqueue` se importa de `lib/sync/` (mira el import exacto en
`lib/courses/queries.ts`). Tabla Dexie: `db.immersionLessonProgress`
(`lib/db/index.ts` ~línea 706, v38).

### C. Manifest — `lib/learning-loop/types.ts:3-12`

```ts
export type LearningSurface = 'course_path' | 'grammar_deck' | 'mini_lesson' | 'essential_words' | 'chunks' | 'sound_lab' | 'pronunciation_path' | 'oral_mission' | 'tracking'
```
`lib/learning-loop/content-manifest.ts:226-237` (`buildLearningContentManifest`)
concatena `courseEntries()`, `grammarDeckEntries()`, `await miniLessonEntries()`, ...
`content-manifest.ts:292-301` (`summarizeLearningContentManifest`) tiene la
lista de superficies literal. `validateLearningContentManifest` (239-290) y
`lib/learning-loop/evidence-exits.ts:22-37` iteran solo `entries`.
`scripts/audit-learning-loop.mjs` construye el manifest y lo valida.
Tests: `lib/learning-loop/__tests__/content-manifest.test.ts`, `evidence-exits.test.ts`, `domain-contracts.test.ts`.

Lecciones de inmersión: `lib/immersion/queries.ts:60` `fetchImmersionLessons()` (Supabase, servidor/cliente),
tipos en `lib/immersion/types.ts`; cada lección tiene `id`, `slug`, `level`, y un
tema canónico (`lib/immersion/canonical-topic.ts`, `topic-matcher.ts`). Progreso:
`lib/progress/domain-queries.ts:91-94` cuenta `completed` con `quiz_score >= 70`.

## Commands you will need

| Propósito | Comando | Esperado |
|---|---|---|
| Typecheck | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Tests | `pnpm vitest run lib/immersion lib/sync lib/learning-loop` | all pass |
| Loop audit | `pnpm audit:learning-loop` | `OK (..., 0 issues)` con `immersion: N` |
| Hard rules | `pnpm audit:hard-rules` | exit 0 |

## Scope

**In scope**:
- `lib/immersion/progress-queries.ts`, `lib/immersion/use-immersion-progress.ts`, nuevo `lib/immersion/__tests__/progress-queries.test.ts`
- `lib/sync/types.ts`, `lib/sync/sync-manager.ts` (solo añadir la tabla y su conflict target), tests de sync si existen (`lib/sync/__tests__/`)
- `lib/learning-loop/types.ts`, `content-manifest.ts`, tests de `lib/learning-loop/__tests__/`
- `lib/immersion/queries.ts` solo si hace falta un lector puro del catálogo para el manifest (prefiere leer el JSON/caché estático si existe; ver STOP)

**Out of scope**:
- Convertir el quiz de inmersión en `PracticeAnswer`/`recordActivitySession` (evidencia real): es un cambio de producto (LOOP-01 completo) y se deja como follow-up documentado.
- `lib/practice/daily-plan/review-plan.ts` (pasos link-only de inmersión).
- Migraciones SQL (la tabla `immersion_lesson_progress` ya existe con RLS; verifica con `grep -n immersion_lesson_progress supabase/migrations/*.sql`).

## Git workflow

- Rama: `advisor/012-immersion-offline-manifest` desde `dev`.
- Commits: `fix(immersion): route lesson progress through the sync outbox`, `feat(learning-loop): declare immersion lessons in the content manifest`.

## Steps

### Step 1: Outbox

1. En `lib/sync/types.ts` añade `| 'immersion_lesson_progress'` a `SyncTable`.
2. En `lib/sync/sync-manager.ts` añade `immersion_lesson_progress: 'user_id,lesson_id'` a `UPSERT_CONFLICT_COLUMNS`. **No** la añadas a `TABLES_WITH_CLIENT_GENERATED_ID_IDEMPOTENCY`.
3. Si `lib/sync/` tiene un test que enumera tablas permitidas (busca `SyncTable` en `lib/sync/__tests__/`), actualízalo.

**Verify**: `pnpm vitest run lib/sync` → all pass.

### Step 2: `markImmersionLessonWatched` escribe Dexie + outbox en una transacción

Sustituye el cuerpo por:

```ts
await db.transaction('rw', [db.immersionLessonProgress, db.syncOutbox], async () => {
  await db.immersionLessonProgress.put(record)
  await enqueue(userId, 'immersion_lesson_progress', 'upsert', {
    user_id: userId, lesson_id: lessonId, watched: true, watched_at: now, quiz_score: quizScore ?? null, updated_at: now,
  }, undefined, 'user_id,lesson_id')
})
```
Elimina el import de `getSupabaseBrowserClient` si `hydrateImmersionProgress`
es el único otro uso (ese sí es una lectura legítima; consérvala).
En `use-immersion-progress.ts` conserva el `catch` pero ahora solo fallará
por errores de Dexie; deja el `console.error`.

Crea `lib/immersion/__tests__/progress-queries.test.ts` (patrón de mocks de
Dexie/outbox: busca un test existente que mockee `enqueue`, p. ej. en
`lib/courses/__tests__/queries.test.ts`): asegura que tras la llamada
`enqueue` se invocó con tabla `immersion_lesson_progress`, op `upsert` y
conflict `user_id,lesson_id`, y que no se llamó a Supabase.

**Verify**: `pnpm vitest run lib/immersion` → all pass.
**Verify**: `grep -n "getSupabaseBrowserClient().from('immersion_lesson_progress').upsert" lib/immersion/progress-queries.ts` → 0.

### Step 3: Inmersión en el manifest

1. Añade `'immersion'` a `LearningSurface` y a la lista literal de
   `summarizeLearningContentManifest`.
2. Implementa `immersionEntries()` en `content-manifest.ts` siguiendo la forma
   de `miniLessonEntries()` (es `async`; mira cómo obtiene su catálogo y qué
   campos rellena: `surface`, `id`, `signal`, `targets`, `evidence`, etc.).
   Para cada lección: `id: immersion:<slug>`, `signal: 'completion'` (ver
   `LearningSignal` en `types.ts`; usa el literal que corresponda a
   "completion/cobertura", no a evidencia), y como target el topic canónico
   de la lección si `canonical-topic.ts` lo resuelve; si no, marca la entrada
   como exposición no evaluable usando el mismo mecanismo de allowlist que
   ya usa el manifest para excepciones autorales (busca `allowlist` en
   `content-manifest.ts` y en `docs/architecture/integrated-learning-loop.md`
   "Las excepciones autorales continúan visibles como exposición no evaluable").
3. Añade `...await immersionEntries()` a `buildLearningContentManifest`.
4. Actualiza `content-manifest.test.ts` (conteo por superficie) y
   `domain-contracts.test.ts` si enumera superficies.

**Verify**: `pnpm vitest run lib/learning-loop` → all pass.
**Verify**: `pnpm audit:learning-loop` → imprime `immersion: <N>` con N > 0 y `0 issues`.

### Step 4: Cierre

**Verify**: `pnpm type-check`, `pnpm lint`, `pnpm audit:hard-rules` → exit 0.

## Test plan

- `progress-queries.test.ts` (nuevo): outbox, no Supabase.
- Tests de `lib/sync` y `lib/learning-loop` actualizados.
- Integración opcional (si el entorno tiene credenciales): `pnpm test:learning-loop:integration`.

## Done criteria

- [ ] `pnpm type-check`, `pnpm lint`, `pnpm audit:hard-rules` exit 0
- [ ] `pnpm vitest run lib/immersion lib/sync lib/learning-loop` all pass
- [ ] `pnpm audit:learning-loop` muestra `immersion:` con conteo > 0 y `0 issues`
- [ ] `grep -n "'immersion_lesson_progress'" lib/sync/types.ts` → 1
- [ ] `git status` sin archivos fuera de scope
- [ ] Fila actualizada en `plans/README.md`

## STOP conditions

- Los extractos no coinciden.
- El catálogo de inmersión solo es accesible con una llamada a Supabase en
  tiempo de auditoría (`scripts/audit-learning-loop.mjs` corre en `prepush`
  sin red garantizada): reporta; la alternativa (exportar un índice estático
  a `public/` en `prebuild`, como hace `content-index:generate`) es un
  cambio de tooling que debe aprobar el propietario.
- `db.transaction` falla porque `syncOutbox` no está declarada en la misma
  versión de esquema que `immersionLessonProgress`: reporta antes de tocar
  `lib/db/index.ts`.

## Maintenance notes

- Follow-up (LOOP-01 completo): hacer que el quiz de inmersión escriba
  `PracticeAnswer` por pregunta y una `activity_session`, y dejar
  `quiz_score` como marcador de cobertura. Hasta entonces, "completada" en
  Progreso significa "quiz ≥ 70 registrado", no evidencia auditable; el
  copy de `ImmersionProgressCard` debería decir "vistas/con quiz", no
  "completadas". Revisar en ese follow-up.
- Follow-up (LOOP-14): hacer que el audit falle cuando exista un directorio
  bajo `app/(authenticated)/practice/*` sin `LearningSurface` ni allowlist
  (decks, games, word-rain, word-search, reader, journal hoy no están).
- Revisor: comprobar que `hydrateImmersionProgress` sigue siendo la única
  lectura remota y que no se duplican filas en `syncOutbox` al marcar dos
  veces (el `markedRef` del hook lo evita en UI; `enqueue` debe deduplicar
  por conflict target si el sync-manager lo soporta).
