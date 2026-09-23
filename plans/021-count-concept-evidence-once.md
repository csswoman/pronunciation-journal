# Plan 021: Contar cada respuesta de teoría una sola vez

> **Ejecutor**: lee `CLAUDE.md` y `ENGINEERING_STANDARDS.md`, ejecuta los gates por paso y actualiza solo la fila 021 de `plans/README.md`.
>
> **Drift check inicial**: `git diff --stat eb4cb5d3..HEAD -- lib/progress/activity-hub.ts lib/progress/__tests__/activity-hub.test.ts lib/practice/queries.ts`.

## Estado

- Prioridad: P1. Esfuerzo: S. Riesgo: MED. Categoría: bug.
- Depende de: ninguno. Planificado en `eb4cb5d3` (2026-09-22).

## Por qué

`recordActivitySession` crea estadísticas para `metadata.lessonSlug` con todas las respuestas y vuelve a sumar respuestas que llevan `exercisePayload.lessonSlug` o `sourceRef: grammar_deck`. El quiz de lección en `lib/practice/queries.ts:240-266` pasa `lessonSlug` tanto por payload como por metadata. La señal conceptual puede registrar el doble de `total`, alterando tamaño de muestra, historial y decisiones posteriores.

## Estado actual y patrón

- `lib/progress/activity-hub.ts:197-203`: `lessonStats.set(input.metadata.lessonSlug, { correct, total })` usa toda la sesión.
- `lib/progress/activity-hub.ts:205-215`: el bucle agrega cada respuesta con `payload.lessonSlug`, `payload.deckSlug` o `sourceRef`.
- `lib/progress/activity-hub.ts:218-244`: las estadísticas se convierten en `ConceptSignal` y pasan a `updateConceptSignalsWithEvidence`.
- `lib/practice/queries.ts:247,263`: `recordLessonQuizAttempt` pone `lessonSlug` en cada respuesta y metadata de sesión.
- Sigue el test mockeado de `recordActivitySession` en `lib/progress/__tests__/activity-hub.test.ts`; conserva el contrato `source: 'exercise'` y la resolución CEFR existente.

## Alcance

Modificar solo `lib/progress/activity-hub.ts` y `lib/progress/__tests__/activity-hub.test.ts`; fila 021 del índice. `lib/practice/queries.ts` es referencia, no un archivo a editar. No cambiar umbral de aprobado, `answer_history`, SRS, CEFR ni la política de `mergeConceptSignals`.

## Flujo Git

Si el operador pide rama, usa `codex/021-count-concept-evidence-once` desde `dev`. No hagas commit, push ni PR sin instrucción explícita. Preserva cambios ajenos y comprueba `git status --short` antes de editar.

## Pasos y verificación

1. Añade una prueba que reproduzca una sesión de dos respuestas para la misma lección con metadata y payload: espera `total: 2`, `correct` exacto y una sola señal. Añade caso sin metadata y caso de respuestas de lecciones distintas; una metadata de sesión no debe atribuir respuestas etiquetadas con otra lección. **Verifica**: `node_modules/.bin/vitest.cmd run lib/progress/__tests__/activity-hub.test.ts --maxWorkers=1` → la prueba de regresión falla antes del arreglo.
2. Cambia la agregación para que cada resultado aporte como máximo una vez al slug explícito. Usa `metadata.lessonSlug` solo como fallback de resultados sin slug propio; no preagregues la sesión completa. Excluye respuestas `skipped`, `unscored` y `evaluator_failed` de evidencia conceptual si su estado lo indica. **Verifica**: el mismo comando → exit 0; tests existentes de nivel/título siguen pasando.
3. Ejecuta `node_modules/.bin/tsc.cmd --noEmit`, `node_modules/.bin/eslint.cmd lib/progress/activity-hub.ts lib/progress/__tests__/activity-hub.test.ts` y `git diff --check` → exit 0.

## Cierre y STOP

Hecho cuando una respuesta evaluable genera como máximo una contribución conceptual y los casos mixtos quedan probados. `pnpm type-check && pnpm lint` es el gate general; ante intento de reinstalación usa binarios locales e indícalo. Detente si aparece otro escritor que requiere atribuir una sola respuesta a varios conceptos: ese cambio necesita una política explícita de atribución, no duplicar por metadata. En revisión, comprueba también `lastSessions.exercisesCompleted`, que deriva de `total` en `lib/courses/assessment-profile.ts`.
