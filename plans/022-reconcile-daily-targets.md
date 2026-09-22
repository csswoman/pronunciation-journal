# Plan 022: Reconciliar el plan diario por objetivos practicados

> **Ejecutor**: lee `CLAUDE.md`, `ENGINEERING_STANDARDS.md` y este plan completo. Actualiza solo la fila 022 del índice. No conviertas exposición, intentos omitidos ni similitud textual en práctica equivalente.
>
> **Drift check inicial**: `git diff --stat eb4cb5d3..HEAD -- lib/progress/daily-reconcile.ts lib/progress/__tests__/daily-reconcile.test.ts lib/progress/activity-hub.ts lib/practice/types.ts`.

## Estado

- Prioridad: P1. Esfuerzo: M. Riesgo: HIGH. Categoría: bug/arquitectura.
- Depende de: 021, para que la agregación conceptual sea fiable. Planificado en `eb4cb5d3` (2026-09-22).

## Por qué

El plan se genera con targets y ejercicios precisos, pero `reconcileDailySteps` solo conoce algunos `kind`. Además, tres respuestas cualquiera de Essential Words resuelven `word_review` aunque no sean las palabras asignadas. Esto causa pasos falsamente resueltos y prácticas equivalentes sin reconocer.

## Estado actual y patrón

- `lib/progress/daily-reconcile.ts:50-58`: ignora Daily/resultado vacío; Essential Words resuelve `word_review` por cantidad global.
- `lib/progress/daily-reconcile.ts:68-77`: compara `contentId` solo para `word_review`, `context_practice`, `sentence_builder` y `connected_speech`.
- `lib/progress/daily-reconcile.ts:80-99`: cursos usa `dailyTargetId`/`lessonSlug` para `concept`/`study_deck`.
- `lib/practice/types.ts:191-209`: incluye `chunk_intro`, `chunk_review`, `grammar_focus`, `false_friends`, `reader`, `mission`, `ed_cluster_drill` e `immersion_lesson`.
- `lib/progress/activity-hub.ts:159-176` carga el plan cacheado y llama al reconciliador. `lib/ai-practice/missions/persistence.ts` ya usa `explicitReconciledStepIds` para misiones; preserva esa ruta exacta.
- Exemplar: `lib/progress/__tests__/daily-reconcile.test.ts`, que prueba equivalencia por IDs.

## Alcance

Modificar `lib/progress/daily-reconcile.ts`, sus tests y, si es imprescindible para pasar una identidad canónica ya disponible, `lib/progress/activity-hub.ts` y su test. Fila 022 del índice. Fuera de alcance: reescribir el generador Daily, alterar el SRS, sincronizar Focus/drills/inmersión (planes 023–025), resolver `word_intro` por abrir tarjetas o hacer que cualquier actividad de vocabulario equivalga a `word_review`.

## Flujo Git

Si el operador pide rama, usa `codex/022-reconcile-daily-targets` desde `dev`. No hagas commit, push ni PR sin instrucción explícita. Preserva cambios ajenos y comprueba `git status --short` antes de editar.

## Pasos y verificación

1. Añade pruebas de falsos positivos: tres palabras Essential Words ajenas al `word_review`, resultados `skipped/unscored/evaluator_failed`, mismo texto con `sourceRef` diferente, un sonido distinto y sesión vacía. Todos deben devolver `[]`. **Verifica**: `node_modules/.bin/vitest.cmd run lib/progress/__tests__/daily-reconcile.test.ts --maxWorkers=1` → los casos nuevos detectan el comportamiento previo.
2. Crea una comparación de identidad canónica que prefiera `sourceRef.source + id` y solo use `contentId` cuando el paso y la respuesta carezcan de `sourceRef` y ese ID sea estable. Cuenta respuestas evaluables únicas por objetivo; conserva el umbral de 40% únicamente donde el paso tiene objetivos evaluables. Essential Words solo puede resolver palabras del plan por intersección suficiente, no por tres respuestas arbitrarias. **Verifica**: el test focalizado pasa y las pruebas anteriores de coincidencia real siguen pasando.
3. Extiende la misma comparación a pasos con ejercicios (`chunk_review`, `grammar_focus`, `false_friends` y otros seleccionados con `exercises.length > 0`) mediante una política por `kind`, sin aplicar reglas de ejercicio a pasos de exposición o enlaces. Reader debe exigir el mismo `passageId` si se reconcilia; no inferirlo de una lectura distinta. **Verifica**: tests positivos y negativos por cada nuevo `kind`.
4. Ejecuta `node_modules/.bin/tsc.cmd --noEmit`, `node_modules/.bin/eslint.cmd lib/progress/daily-reconcile.ts lib/progress/__tests__/daily-reconcile.test.ts` y `git diff --check` → exit 0.

## Cierre, límites y STOP

Hecho cuando las sesiones externas equivalentes resuelven solo el paso exacto y ninguna respuesta omitida cuenta. Si los productores no conservan IDs suficientes, detente y documenta la superficie concreta: no sustituyas identidad por palabras parecidas. Mantén separado `done` (sesión Daily), `resolved` (equivalente fuera de Daily) y evidencia de dominio. Ejecuta también `pnpm type-check && pnpm lint` o los binarios locales si `pnpm` intenta instalar.
