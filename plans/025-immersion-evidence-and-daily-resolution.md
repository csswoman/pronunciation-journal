# Plan 025: Registrar el quiz de inmersión y resolver su lección exacta

> **Ejecutor**: lee `CLAUDE.md`, `ENGINEERING_STANDARDS.md`, `PRODUCT.md` y el contexto UI de `AGENTS.md`. Actualiza solo la fila 025 del índice.
>
> **Drift check inicial**: `git diff --stat eb4cb5d3..HEAD -- components/immersion/LessonQuizTab.tsx components/immersion/LessonStudyPanel.tsx lib/immersion/use-immersion-progress.ts lib/immersion/progress-queries.ts lib/learning-loop/immersion-entries.ts lib/learning-loop/evidence-exits.ts lib/practice/daily-plan/immersion-step.ts lib/progress/daily-reconcile.ts`.

## Estado

- Prioridad: P2. Esfuerzo: M. Riesgo: MED. Categoría: arquitectura.
- Depende de: 021 y 022. Planificado en `eb4cb5d3` (2026-09-22).

## Por qué

El quiz de inmersión ofrece preguntas evaluadas, pero solo guarda un porcentaje agregado en `immersion_lesson_progress`. No queda evidencia por pregunta ni una sesión de actividad, y el paso `immersion_lesson:<id>` no se resuelve al completar esa lección. El manifest lo declara honestamente como `activity_only`; debe actualizarse cuando el runtime registre respuestas reales.

## Estado actual y patrón

- `components/immersion/LessonQuizTab.tsx`: `handleSelectOption` conoce la opción elegida y `correctIndex`, pero al final envía solo `scorePercent`.
- `lib/immersion/use-immersion-progress.ts:15-25`: `markedRef` permite una única llamada a `markImmersionLessonWatched` por montaje; revisa su semántica antes de soportar reintentos.
- `lib/immersion/progress-queries.ts:75-108`: persiste `watched: true` y `quiz_score` en Dexie/outbox.
- `components/immersion/LessonStudyPanel.tsx:154`: el único caller de `markWatched` es `onQuizComplete`; el player YouTube actual no informa finalización. Por ello un quiz terminado se está etiquetando como video visto.
- `lib/practice/daily-plan/immersion-step.ts:42-49`: el plan usa ID `immersion_lesson:<lesson.id>` y enlaza a la lección.
- `lib/learning-loop/immersion-entries.ts`: con `canonicalTopic` usa `activity_only`; sin tema usa allowlist de exposición. `lib/learning-loop/evidence-exits.ts` declara `answerWriter: null`, `sessionWriter: null`.
- Patrón de respuesta: `lib/practice/queries.ts` y `lib/progress/activity-hub.ts`.

## Alcance

Modificar `components/immersion/LessonQuizTab.tsx`, `LessonStudyPanel.tsx`, `ImmersionLessonDetailClient.tsx`, `YouTubeLessonPlayer.tsx`, `lib/immersion/use-immersion-progress.ts`, `progress-queries.ts`, `lib/learning-loop/immersion-entries.ts`, `evidence-exits.ts`, `lib/progress/daily-reconcile.ts` y los tests de esos módulos. Fila 025. Fuera de alcance: asumir que el quiz demuestra haber visto el video, atribuir dominio a lecciones sin tema canónico, alterar el umbral de quiz ya existente o generar preguntas nuevas.

## Flujo Git

Si el operador pide rama, usa `codex/025-immersion-evidence-and-daily-resolution` desde `dev`. No hagas commit, push ni PR sin instrucción explícita. Preserva cambios ajenos y comprueba `git status --short` antes de editar.

## Pasos y verificación

1. Separa dos acciones: `recordImmersionQuiz` guarda `quiz_score` sin modificar `watched`, y una acción explícita «Marcar como visto» junto al video llama `markImmersionLessonWatched` sin fingir telemetría del iframe. Ambas escrituras deben preservar el valor previo de la otra acción al hacer upsert offline. **Verifica**: tests de quiz sin visionado, visionado sin quiz y ambos órdenes de ejecución.
2. En la finalización del quiz, crea una `PracticeAnswer` por pregunta con `attemptId` estable, respuesta elegida, acierto, lección e ID de pregunta. Registra una `activity_sessions` con ID estable por intento completo. La atribución a `canonicalTopic` solo procede si el catálogo lo proporciona. **Verifica**: tests de quiz parcial, completo, reintento, doble llamada y lección sin tema.
3. Reconcílialo con `immersion_lesson:<id>` exacto usando la finalización del quiz, no solo la navegación. Actualiza manifest/evidence exits cuando exista el escritor runtime. **Verifica**: `node_modules/.bin/tsx.cmd scripts/audit-learning-loop.mjs` → cero incidencias y test de lección asignada/otra lección.
4. Ejecuta tests focalizados, `node_modules/.bin/tsc.cmd --noEmit`, ESLint de archivos tocados y `git diff --check` → exit 0. Ejecuta `pnpm type-check && pnpm lint` si `pnpm` no intenta instalar.

## STOP y mantenimiento

Detente ante falta de un ID canónico estable por pregunta o si preservar la escritura `watched`/`quiz_score` requiere una migración fuera del alcance. No conviertas `quiz_score` agregado en varias respuestas inferidas: guarda las opciones realmente elegidas. El revisor debe comparar `answer_history`, `activity_sessions` e `immersion_lesson_progress` para evitar doble conteo.
