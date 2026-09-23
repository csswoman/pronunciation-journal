# Plan 024: Conectar Focus con la actividad y las respuestas evaluadas

> **Ejecutor**: lee `CLAUDE.md`, `ENGINEERING_STANDARDS.md`, `PRODUCT.md` y el contexto UI exigido por `AGENTS.md`. Conserva `focus_sprints.practice_progress` como progreso del sprint y actualiza solo la fila 024 del índice.
>
> **Drift check inicial**: `git diff --stat eb4cb5d3..HEAD -- lib/focus/queries.ts lib/focus/practice-progress.ts lib/focus/types.ts components/focus/FocusContentViewer.tsx components/focus/FocusExerciseRunner.tsx components/focus/FocusErrorTrapPractice.tsx components/focus/FocusSongVoicePractice.tsx lib/progress/activity-hub.ts`.

## Estado

- Prioridad: P1. Esfuerzo: L. Riesgo: HIGH. Categoría: arquitectura.
- Depende de: 021 y 022. Planificado en `eb4cb5d3` (2026-09-22).

## Por qué

Focus registra qué contenido se abrió, respondió o terminó, pero no conserva el resultado de cada respuesta en el circuito común. Así, una práctica real de Focus no entra en `answer_history`, `activity_sessions`, Progreso ni en la reconciliación del plan. El objetivo es registrar lo que la interacción realmente demuestra, manteniendo la separación entre lectura, actividad y respuesta evaluada.

## Estado actual y patrón

- `lib/focus/practice-progress.ts`: `answered` guarda solo la clave `contentId:exerciseId`; no guarda respuesta ni corrección.
- `lib/focus/queries.ts:186-211`: `recordFocusPractice` actualiza Dexie y encola `focus_sprints.practice_progress`.
- `components/focus/FocusExerciseRunner.tsx`: `onSubmit(correct, _answer, extras)` descarta texto, tiempo y payload; comunica únicamente `{kind:'answered',exerciseId}`.
- `components/focus/FocusErrorTrapPractice.tsx`: conoce `guess`, `hasError` y `isCorrect`, pero comunica solo el ID `trap-<index>`.
- `components/focus/FocusSongVoicePractice.tsx`: usa coincidencia de palabras STT; dice expresamente que no mide fonemas ni ritmo.
- Exemplar: `components/practice/session/useSessionState.ts` construye `ExerciseResult`, llama `savePracticeAnswer` y al cerrar llama `recordActivitySession`. `lib/practice/resolve-attribution.ts` decide los targets que admiten evidencia.

## Alcance

Modificar `components/focus/FocusContentViewer.tsx`, `FocusExerciseRunner.tsx`, `FocusErrorTrapPractice.tsx`, `FocusSongVoicePractice.tsx`, `lib/focus/queries.ts` y tests focalizados nuevos o existentes en esos dominios; ampliar `lib/focus/types.ts` solo para un contrato de resultado si es necesario. Fila 024. Fuera de alcance: regenerar contenido Gemini, convertir el inicio/completado de material en dominio, atribuir exactitud fonética al STT, sustituir el avance de sprint o crear una segunda tabla de respuestas.

## Flujo Git

Si el operador pide rama, usa `codex/024-connect-focus-practice-to-evidence` desde `dev`. No hagas commit, push ni PR sin instrucción explícita. Preserva cambios ajenos y comprueba `git status --short` antes de editar.

## Pasos y verificación

1. Define un resultado Focus con ID de intento estable, identidad del ejercicio/contenido, estado (`answered`/`skipped`/`evaluator_failed`), respuesta, veredicto, duración y target canónico solo cuando pueda derivarse de `FocusContent.gapIds` o `GenericExercise.sourceRef`. Si hay más de un gap y no hay atribución exacta, guarda actividad pero no elijas un target al azar. **Verifica**: tests puros de target único, ambiguo y ausente.
2. Haz que los tres runners emitan resultados evaluados. Reutiliza `savePracticeAnswer` para tipos soportados y `recordActivitySession` una vez por sesión con ID estable; usa `focus_sprints.practice_progress` para el día practicado. Un `skip` no suma correcto ni SRS. **Verifica**: tests de responder, omitir, repetir, cierre parcial, doble callback y fallo offline; espera una respuesta idempotente y una sesión por ejecución real.
3. Limita la reconciliación Daily a objetivos exactos. Una sesión Focus con un tema o sonido asignado puede resolver su paso equivalente según las reglas del plan 022; abrir la historia, pulsar comenzar o completar una vista sin respuesta no lo resuelve. **Verifica**: test de integración del `recordActivitySession` con pasos asignados y no asignados.
4. Ejecuta tests focalizados, `node_modules/.bin/tsc.cmd --noEmit`, ESLint de archivos tocados, `node_modules/.bin/tsx.cmd scripts/audit-learning-loop.mjs` y `git diff --check` → exit 0. Ejecuta `pnpm type-check && pnpm lint` si `pnpm` usa las dependencias existentes sin reinstalar.

## STOP y mantenimiento

Detente si un runner no entrega un resultado evaluable o si los gaps no identifican un target del registro canónico. En ese caso delimita el modo como actividad, sin inventar una respuesta ni una habilidad. Revisa que los reintentos no dupliquen `answer_history` ni la sesión y que el modo invitado conserve su progreso local.
