# Baseline Fase 0 — 2026-08-06

## Suite

- `pnpm test`: 404 ficheros, 2.497 tests; 401 ficheros y 2.494 tests pasan, 3 tests fallan por timeout de 5 s.
- Fallos observados en esta ejecución:
  - `components/auth/__tests__/AuthPanel.test.tsx` — `AuthPanel > shows a friendly message instead of provider login details`.
  - `components/journal/__tests__/JournalSupportRail.test.tsx` — `JournalSupportRail vocabulary resolution > shows learner translation and example for owned seeds while keeping scaffold data for the rest`.
  - `lib/essential-words/__tests__/dataset.test.ts` — `Core 1000 dataset > has no unreviewed content issues`.
- Las caracterizaciones de Fase 0 (`attempt-grade.characterization.test.ts` y `queue.characterization.test.ts`) pasan.
- En una ejecución completa anterior, después de Task 0.1, también falló `components/journal/__tests__/SuggestedWords.test.tsx` por una expectativa de `aria-pressed`. No se modificó esa superficie; el resultado no se reprodujo en esta medición.

## Type-check y lint

- `pnpm type-check`: limpio.
- `pnpm lint`: 0 errores y 6 warnings:
  - `components/home/LevelProgressBreakdown.tsx:24` — `_fallbackRatio` no usado.
  - `lib/ai-practice/missions/registry.ts:314` — fichero de 319 líneas, máximo 300.
  - `lib/ai-practice/tools/registry.ts:333` — fichero de 323 líneas, máximo 300.
  - `lib/journal/daily-step.ts:10` — `_dayOfYear` no usado.
  - `lib/practice/session-summary-view.ts:113` — `_options` no usado.
  - `scripts/essential-words/generate-chunks.mjs:340` — fichero de 312 líneas, máximo 300.

## Cadena de escritura actual de Essential Words

1. Las cards construyen `AttemptOutcome` en `lib/essential-words/attempt-grade.ts`.
2. `attemptGrade` produce `Grade`; `gradeToLegacyQuality` lo convierte a `quality: number` para el hook existente.
3. `useEssentialWordsSession.submitGrade(quality)` en `hooks/useEssentialWordsSession.ts:335` decide cuándo persistir un acierto.
4. `gradeEssentialWord(word, quality, extras, userId)` en `lib/essential-words/grade.ts:56` lee y programa el estado SRS.
5. `saveSRSData(...)` en `lib/db/index.ts:582` escribe directamente en Dexie `srsData`. La tabla `srsData` no está en `SyncTable`, por lo que este camino no crea una entrada de outbox ni sincroniza esa fila con Supabase.
6. `savePracticeAnswer(...)` en `lib/practice/queries.ts:105` encola `answer_history` mediante `enqueue(..., 'answer_history', 'upsert', ...)` dentro de `syncOutbox`; el sync manager lo envía a Supabase. `gradeEssentialWord` trata este logging como best-effort. Cuando hay `extras.accuracy`, además escribe `attempts`, `dailyProgress` y `userStats` directamente en Dexie.

## Sincronización

- Dexie está en la versión **30** (`lib/db/index.ts:506`). Las tablas del modelo de habilidades entran en la versión 31.
- `lib/sync/types.ts:5` ya registra `answer_history` y otras tablas actuales, pero no `srsData`; Fase 2 debe añadir `learning_items`, `attempt_logs` y `srs_review_events`.
- No se encontró infraestructura de feature flags específica para este modelo en `lib`, `hooks` o `app`; la crea la Fase 2.

## Invariantes ya cubiertas por la suite existente

### Grading

- `lib/essential-words/__tests__/attempt-grade.test.ts`
- `lib/essential-words/__tests__/attempt-grade.characterization.test.ts`
- `lib/essential-words/__tests__/grade.test.ts`
- `lib/essential-words/__tests__/graduation-grade.test.ts`

### Cola, cuota y recuperación

- `lib/essential-words/__tests__/queue.test.ts`
- `lib/essential-words/__tests__/queue.characterization.test.ts`
- `lib/essential-words/__tests__/daily-quota.test.ts`
- `lib/essential-words/__tests__/prepare-srs.test.ts`
- `lib/essential-words/__tests__/pending-lapses.test.ts`
- `lib/essential-words/__tests__/relapse.test.ts`
- `lib/essential-words/__tests__/session-loader.test.ts`
- `lib/essential-words/__tests__/essential-due.test.ts`
