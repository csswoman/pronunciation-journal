# 03 · Ejercicio de producción libre (escrita + oral) con grading IA

> 🔴 **Crítico** · Impacto alto · ~4-6 días · Estado: 📋 Por planear

## Problema

Ruptura total **Controlled → Free Production**, el salto más importante en SLA. Hoy:

- `speak_word` es repetición de **1 palabra**.
- `sentence_dictation` es **copiar al oído**, no componer.

Cero lenguaje propio del alumno → cero transferencia al mundo real (la auditoría puntuó transferencia **35/100**). Falta también el **Output Hypothesis** (Swain): nunca se fuerza producción que revele los huecos del alumno.

## Objetivo

Dos nuevos modos de producción, ambos con grading IA:

1. **Producción escrita**: "Usa **X** en una oración" / "Responde: ...". El alumno escribe; la IA evalúa uso correcto del ítem objetivo + corrección + feedback.
2. **Producción oral libre**: extender `SpeakScoredExercise.tsx` (en staging) de palabra única a **respuesta/oración libre**.

## Estado de partida

- `SpeakScoredExercise.tsx` (en git status actual) es la base perfecta para lo oral.
- Grading IA: ruta `/api/gemini/*` nueva + prompt en `lib/ai-prompts.ts` (hard rules de CLAUDE.md). Fallback chain flash-lite → flash → latest.
- `exercises.md:364` ya prevé un `lib/exercises/generators/ai.ts`.
- Tipo nuevo sigue el flujo de `exercises.md:367` (tipo discriminado → generador → componente → migración → registro).

## Tareas (alto nivel)

1. Definir tipos `written_production` y `spoken_production` en `lib/exercises/types.ts`.
2. Prompt(s) de grading en `lib/ai-prompts.ts`: input = ítem objetivo + producción del alumno; output = `{ correct, usedTarget, feedback, corrections }`.
3. Ruta `/api/gemini/grade-production`.
4. Generador que produce el prompt-tarea desde `word_bank`/`topic`.
5. Componente escrito (textarea + feedback IA) y extensión del oral (STT → texto → mismo grading).
6. Registrar en `GenericExerciseSession` + migración `exercise_types`.
7. Conectar resultado al SRS (plan 01): producción correcta = grade alto.

## Criterios de aceptación

- [ ] El alumno escribe una oración original usando el ítem objetivo; la IA evalúa y da feedback accionable.
- [ ] El modo oral captura habla libre (no solo 1 palabra) y la evalúa.
- [ ] El grading distingue "usó la palabra objetivo correctamente" de "oración gramatical".
- [ ] Falla offline con gracia (producción libre requiere red — degradar, no romper).
- [ ] Sin prompts inline; toda llamada vía `/api/gemini/*`.

## Riesgos / decisiones abiertas

- **Producción libre rompe offline-first**: aceptar que este modo es online-only (precedente: `/practice/sounds` es online-only temporal). Documentar la excepción.
- **Consistencia del grading IA**: definir rúbrica estricta en el prompt para evitar evaluación errática.
- **Coste de tokens**: usar flash-lite por defecto.
