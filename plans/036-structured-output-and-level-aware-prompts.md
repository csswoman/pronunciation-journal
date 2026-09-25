# Plan 036: Salida estructurada y prompts ajustados al nivel

> **Executor instructions**: Sigue el plan paso a paso y ejecuta cada verificación antes de
> avanzar. Si ocurre algo de "STOP conditions", detente y reporta. No cambies la selección de
> modelos (Plan 035) ni el flujo del AI Coach (Plan 037). Al terminar, actualiza la fila de este plan
> en `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 866979df -- lib/gemini/json-route.ts lib/ai-prompts.ts app/api/gemini components/exercises/SentenceTransformationExercise.tsx`
> y `git status --short -- lib/ai-prompts.ts app/api/gemini`. `lib/ai-prompts.ts` tenía cambios sin
> commitear cuando se escribió el plan: compara los extractos con el código vivo; si no coinciden, STOP.

## Estado

- **Priority**: P2
- **Effort**: M (~1,5 días)
- **Risk**: MED (cambiar prompts puede cambiar la calidad del feedback)
- **Depends on**: fase A de `plans/035-resilient-free-ai-quotas-and-voice.md`
- **Category**: IA / calidad pedagógica
- **Planned at**: commit `866979df`, 2026-09-23
- **Implementation state (2026-09-25)**: DONE en `dev` (20 rutas JSON con esquema, evaluación 11/12 frente a 8/12, suite completa 5313/5313).

## Por qué importa

La cuota gratuita se mide en requests, no en tokens, así que acortar prompts ahorra poca cuota.
Lo que sí gasta requests es: (1) respuestas JSON mal formadas que fallan el parseo y obligan a
reintentar, y (2) feedback que no sirve y hace que la persona vuelva a preguntar. Ninguna ruta usa
hoy salida estructurada nativa (`responseJsonSchema`); todas dependen de "Return ONLY valid JSON" en
el texto y de `stripJsonFences`. Además, la corrección del Diario devuelve hasta 8 errores sin
importar el nivel, lo que abruma en A1/A2.

## Estado actual

- `lib/gemini/json-route.ts` — `respondWithGeminiJson` / `callGeminiJson` reciben `params.config` y
  un `parse` que hace `JSON.parse(stripJsonFences(text))` + validación Zod.
- 29 rutas en `app/api/gemini/**` usan `respondWithGeminiJson`, `callGeminiJson` o `callWithFallback`.
  Todas pasan `responseMimeType: 'application/json'` y ninguna `responseJsonSchema`
  (`grep -rn "responseJsonSchema" app lib` → vacío).
- `@google/genai` ^2.23 acepta `config.responseJsonSchema` (ver `node_modules/@google/genai/dist/genai.d.ts`).
  Zod es ^4.6 y trae `z.toJSONSchema(schema)`.
- Ejemplo de ruta con esquema Zod ya definido: `app/api/gemini/grade-production/route.ts:23-32`
  (`GradeResponseSchema`), y el prompt repite ese formato a mano al final de
  `GRADE_PRODUCTION_SYSTEM_PROMPT` en `lib/ai-prompts.ts:107-127`.
- `JOURNAL_CORRECTION_SYSTEM_PROMPT` (`lib/ai-prompts.ts:346`) — "max 8 items" fijo; la ruta no pasa el
  nivel CEFR.
- Violación de la regla "No prompts en componentes": `components/exercises/SentenceTransformationExercise.tsx:64-67`
  construye el `taskPrompt` en el componente.
- Los prompts del AI Coach viven en `lib/ai-practice/prompts.ts` y `lib/ai-practice/missions/prompts.ts`
  (fuera de `lib/ai-prompts.ts`). No los muevas en este plan; el Plan 037 los toca.

## Comandos

| Propósito | Comando | Esperado |
|---|---|---|
| Tests | `pnpm test -- app/api/gemini lib/gemini lib/ai-prompts` | todo pasa |
| Typecheck | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint` | exit 0 |

## Alcance

**Dentro**: `lib/gemini/json-route.ts`, `lib/ai-prompts.ts`, `app/api/gemini/**/route.ts` (config y
esquemas), `app/api/gemini/journal-correct/route.ts` (añadir nivel), `components/exercises/SentenceTransformationExercise.tsx`
(solo mover el texto del prompt), `scripts/prompt-eval/` (crear), tests. Además, los documentos listados en el paso de documentación de este plan.

**Fuera**: orden de modelos, chat del AI Coach (`lib/gemini/chat-route.ts`, `lib/ai-practice/**`),
rutas de audio/TTS, UI.

## Pasos

### Paso 1: Set de evaluación antes de tocar prompts
Crea `scripts/prompt-eval/cases/` con 12 casos JSON (entrada fija + qué debe cumplir la salida) para
`grade-production` (6: correcto A1, error de artículo A1, restricción no cumplida B1, sin target,
en español, perfecto B2) y `journal-correct` (6: entradas A1, A2, B1, B2, una sin errores y una con
un falso amigo). Crea `scripts/prompt-eval/run.ts` que llame a la ruta interna vía las funciones de
`lib/` (no por HTTP), valide con el esquema Zod de la ruta y compruebe reglas simples por caso
(p. ej. `correct === false`, `errors.length <= 3`). Ejecútalo con el prompt actual y guarda el
resultado en `scripts/prompt-eval/baseline.json`. Gasta como máximo 12 requests por corrida.
**Verify**: `pnpm tsx scripts/prompt-eval/run.ts` → imprime N/12 casos OK y escribe `baseline.json`.

### Paso 2: Soporte de esquema en `json-route`
En `lib/gemini/json-route.ts` añade la opción `schema?: z.ZodType` a `GeminiJsonRouteOptions`. Si
viene, añade `responseJsonSchema: z.toJSONSchema(schema)` a `params.config` y usa ese mismo esquema
en `parse`. Si `z.toJSONSchema` produce algo que la API rechaza (400 por palabras clave no
soportadas), elimina esas claves en un helper `toGeminiJsonSchema` y documenta cuáles.
**Verify**: test nuevo en `lib/gemini/__tests__/json-route.test.ts`: con `schema`, el `config` enviado
contiene `responseJsonSchema` → pasa.

### Paso 3: Migrar las rutas
Ruta por ruta, pasa el esquema Zod de respuesta existente como `schema`. Empieza por
`grade-production`, `journal-correct`, `translate`, `word-search`, `generate-reader`, luego el resto.
Al migrar cada una, borra del prompt de sistema el bloque "Return ONLY valid JSON …" y la plantilla
del objeto, **pero conserva la explicación de cada campo** (qué significa, reglas y rangos).
Si una ruta no tiene esquema Zod de respuesta, créalo junto a la ruta siguiendo `GradeResponseSchema`.
**Verify**: `grep -rn "responseMimeType" app/api/gemini --include=route.ts | wc -l` igual a
`grep -rn "schema:" app/api/gemini --include=route.ts | wc -l`; `pnpm test -- app/api/gemini` → pasa.

### Paso 4: Corrección del Diario según nivel
Pasa el nivel CEFR del usuario a `journal-correct` (usa el mismo lector de nivel que `grade-production`;
si no hay nivel, A2). En `JOURNAL_CORRECTION_SYSTEM_PROMPT` cambia "max 8 items" por un tope por nivel:
A1/A2 → 3, B1 → 5, B2+ → 8, priorizando errores que bloquean la comprensión y errores repetidos.
A1/A2: explicaciones sin jerga gramatical (misma regla que `GRADE_PRODUCTION_SYSTEM_PROMPT` punto 6).
**Verify**: caso A1 del paso 1 devuelve ≤3 errores.

### Paso 5: Sacar el prompt del componente
Mueve el texto de `taskPrompt` de `components/exercises/SentenceTransformationExercise.tsx:64-67` a
`buildTransformationTaskPrompt({ sourceSentence, instruction, referenceAnswer? })` en `lib/ai-prompts.ts`.
**Verify**: `grep -n "Transform the original sentence" components` → sin resultados.

### Paso 6: Comparar contra la línea base
Vuelve a ejecutar `scripts/prompt-eval/run.ts`. El resultado debe tener ≥ tantos casos OK como
`baseline.json` y ningún error de parseo.
**Verify**: salida del script ≥ línea base, 0 fallos de parseo.

### Paso 7: Documentación

| Archivo | Qué escribir |
|---|---|
| `ENGINEERING_STANDARDS.md` → "Rutas Gemini" | Toda ruta JSON pasa `schema` (Zod) y no repite el formato JSON en el prompt |
| `docs/ai/prompt-eval.md` (crear) | Para qué sirve el set de evaluación, cómo correrlo, cuántas requests gasta y cuándo actualizar `baseline.json` |
| `docs/architecture/exercises.md` → "Contrato de feedback pedagogico" | Tope de errores por nivel CEFR en la corrección del Diario |
| `docs/README.md` → tabla "Arquitectura" | Enlace a `docs/ai/prompt-eval.md` |

**Verify**: `grep -n "prompt-eval" docs/README.md ENGINEERING_STANDARDS.md` → ≥1 resultado.

## Test plan

- `lib/gemini/__tests__/json-route.test.ts` (nuevo): esquema añadido al config; parseo con el mismo esquema.
- Tests existentes de rutas (`app/api/gemini/**/__tests__/route.test.ts`) deben seguir pasando; si un
  test fija el texto exacto del prompt, actualízalo al texto nuevo.

## Criterios de aceptación

- [x] Todas las rutas JSON envían `responseJsonSchema`.
- [x] `grep -rn "Return ONLY valid JSON" lib/ai-prompts.ts` → sin resultados.
- [x] Corrección del Diario acotada por nivel.
- [x] Ningún texto de prompt en `components/`.
- [x] `pnpm test`, `pnpm type-check`, `pnpm lint` en exit 0.
- [x] Eval ≥ línea base.
- [x] Documentación del paso 7 actualizada.

## STOP conditions

- La API rechaza `responseJsonSchema` en los modelos del inventario del Plan 035.
- El eval del paso 6 queda por debajo de la línea base dos veces seguidas.
- Migrar una ruta exige cambiar la forma de la respuesta que consume el cliente.

## Notas de mantenimiento

- Toda ruta JSON nueva debe pasar `schema`; añádelo al checklist de revisión.
- Cambiar un prompt → volver a correr `scripts/prompt-eval/run.ts` y actualizar `baseline.json` si mejora.
