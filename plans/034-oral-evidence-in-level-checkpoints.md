# Plan 034: Incorporar evidencia oral verificable en checkpoints

> **Executor instructions**: Ejecuta después del Plan 033. Revisa el contrato de nivel y las rutas de audio reales antes de diseñar el flujo. No uses un booleano ni una nota enviada por el cliente como prueba de habla. Actualiza `plans/README.md` al terminar.
>
> **Drift check (run first)**: inspecciona `components/courses/AssessmentClient.tsx`, `lib/courses/assessment.ts`, `lib/courses/server-assessment.ts`, `app/api/assessment/results/route.ts`, `lib/courses/assessment-schema.ts`, `components/exercises/SpokenProductionExercise.tsx`, `hooks/useSpeechInput.ts` y `/api/gemini/transcribe-sentence` en el checkout vigente.

## Status

- **Execution status**: IN PROGRESS — A1/A2 server-verified pilot implemented locally; human calibration and launch checks remain open.
- **Priority**: P2
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: 033
- **Category**: assessment / pedagogy
- **Planned at**: revisión de la serie 4, 2026-09-22

## Why this matters

Un checkpoint con escucha todavía puede promover a quien nunca produjo una frase. La app ya practica habla en otras superficies, pero el examen no la evalúa. La evidencia oral debe corresponder a un objetivo comunicativo del nivel y ser verificable por el servidor. Una transcripción, nota o `passed: true` enviada por el navegador es insuficiente para autorizar la promoción.

## Current state

- `SpokenProductionExercise` utiliza captura/transcripción de frases mediante `useSpeechInput`; esa experiencia es una referencia de interacción, no un contrato seguro de checkpoint.
- `AssessmentClient` guarda respuestas de opción múltiple en `Record<string, number>`.
- `/api/assessment/results` reconstruye las preguntas y recalcula el resultado en servidor, pero no recibe ni valida evidencia de audio.

## Execution log — 2026-09-24

- Implemented an A1/A2 pilot. A1 asks the learner to describe a fictional person; A2 asks for a fictional Saturday plan. Prompts explicitly avoid real location, plans, or personal information.
- The server owns each task and rubric, transcribes submitted audio through Gemini, checks the requested details, and gates A1/A2 promotion on the saved attempt. Raw audio and the transcript are not stored by English Journal; the audio digest, rubric version, answers, and attempt state are persisted for retry and audit.
- Checkpoint results now persist oral status and the written/listening threshold breakdown. Attempts can be resumed on the same account for 24 hours; challenge IDs expire after five minutes. Authenticated clients can read their own attempt, while writes remain server-only under RLS.
- The rubric is a literal transcript-content check. It does not establish acoustic pronunciation quality or mastery, and its promotion threshold has not been calibrated with human-reviewed samples.
- The migration remains local and has not been pushed. Real-browser microphone, accessibility, and unsupported-device acceptance remains untested. Do not treat the A1/A2 pilot rubric as launch-approved until those checks and the human sample review are complete.
- Before launch, confirm that the product audience meets the current Gemini Developer API age restrictions and verify the project’s service tier. Google’s terms and data handling differ between unpaid and paid services.
- Focused Vitest, `pnpm type-check`, `pnpm lint`, `pnpm audit:hard-rules`, and `pnpm check:migrations` passed. The RLS audit detects this table’s isolation case and still warns about three pre-existing tables. The live RLS integration script has not been run.

## Scope and steps

1. Especifica por nivel A1–C2 una tarea oral breve y evaluable: prompt, contenido esperado, criterio mínimo, posibilidad de reintento y qué evidencia representa (inteligibilidad/uso de la estructura, no precisión acústica inexistente). Prioriza un piloto A1/A2 **sin habilitar promoción oral para los otros niveles** hasta tener tareas y umbrales validados; el criterio final exige cobertura A1–C2.
2. Define un flujo de envío de audio autenticado y ligado a usuario, intento, nivel e ítem con caducidad y límites de tamaño/tiempo. Reutiliza transcripción del servidor si cumple el contrato; calcula la evaluación del objetivo en el servidor. Nunca aceptes una nota o transcripción enviada por el cliente como evidencia autoritativa. Protege el audio según el contrato de privacidad y retención vigente; no lo guardes automáticamente si no es necesario.
3. Añade una condición oral independiente al scorer y a la ruta de persistencia. Una puntuación escrita o auditiva perfecta no promociona si falta la evidencia oral requerida. La evaluación oral fallida o indisponible debe permanecer pendiente, sin falsificar un aprobado ni degradar automáticamente el nivel por una falla técnica.
4. Integra captura, permiso, reproducción/reintento y feedback accesible en el flujo de checkpoint. Ofrece un estado honesto para dispositivos sin micrófono o sin servicio de transcripción. El usuario puede conservar el resto del intento y terminar la tarea oral más tarde; documenta cualquier cambio a la persistencia de intentos.
5. Prueba manipulación de payload, ID ajeno, replay, expiración, fallo de transcripción, audio vacío, reintento y dos dispositivos. Añade evaluación humana de una muestra por nivel antes de fijar umbrales de promoción y registra los límites de fiabilidad de la señal.

## Done criteria

- [ ] La promoción A1–C2 exige una tarea oral evaluada por el servidor, con criterios adecuados por nivel.
- [x] Sin audio válido, la promoción queda pendiente y el progreso previo se conserva.
- [x] El cliente no puede inventar un aprobado oral ni reutilizar evidencia de otro intento.
- [x] Tests focalizados de scorer, endpoint, captura y fallos técnicos, `pnpm type-check` y `pnpm lint` pasan.
- [ ] Prueba manual de micrófono, accesibilidad y comportamiento sin soporte documentada.
- [x] `plans/README.md` refleja el resultado real.

## STOP conditions

- La transcripción o evaluación solo puede verificarse en el navegador.
- No hay criterio oral fiable para un nivel que se pretende promover.
- El flujo técnico trata falta de micrófono/transcripción como error del alumno.
