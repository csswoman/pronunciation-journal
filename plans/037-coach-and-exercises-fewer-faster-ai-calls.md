# Plan 037: AI Coach y ejercicios más rápidos, variados y con menos llamadas a IA

> **Executor instructions**: Sigue el plan por fases y paso a paso; ejecuta cada verificación antes
> de avanzar. Si ocurre algo de "STOP conditions", detente y reporta. No cambies la selección de
> modelos (Plan 035) ni la evaluación de pronunciación (Plan 038). Respeta `CLAUDE.md`: prompts solo
> en `lib/ai-prompts.ts` o los archivos de prompts ya existentes de `lib/ai-practice/`; Dexie para
> datos persistentes; Zustand solo para UI efímera; componentes ≤250 líneas. Al terminar cada fase,
> actualiza la fila de este plan en `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 866979df -- app/api/gemini/route.ts hooks/useStreamingChat.ts lib/ai-practice components/ai-coach components/exercises lib/exercises lib/db`
> Compara los extractos de "Estado actual" con el código vivo; si no coinciden, STOP.

## Estado

- **Priority**: P1
- **Effort**: L (fase A: ~1 día · fase B: 1–2 días · fase C: 1–2 días)
- **Risk**: MED
- **Depends on**: fase A de `plans/035-resilient-free-ai-quotas-and-voice.md` (modelos Lite primero y cooldown)
- **Category**: IA / rendimiento / pedagogía
- **Planned at**: commit `866979df`, 2026-09-23

## Por qué importa

La dueña de la app nota que el AI Coach es lento y repetitivo, y teme gastar requests cada vez que
falla un ejercicio. El código confirma tres causas: (1) cada "Siguiente ejercicio" es una request
completa que reenvía hasta 100 mensajes de historial; (2) cada intento en ejercicios de producción
llama a Gemini aunque el texto sea idéntico a la referencia o al intento anterior; (3) nada evita que
el Coach repita ejercicios ya vistos. Apps como Duolingo generan el contenido **antes** y guardan la
clave de respuesta: la IA solo interviene cuando la respuesta es abierta y nueva. Este plan aplica ese
patrón: generar en lote, corregir en local cuando se puede, guardar lo ya corregido y reservar la IA
para lo que de verdad requiere juicio.

## Estado actual

**AI Coach**
- `hooks/useStreamingChat.ts` (313 líneas) — `sendMessage` envía `messagesToWire(nextMessages)` completo
  (línea ~89). `answerToolCall` (línea ~243) registra la respuesta **sin** llamar a la IA: la corrección
  de opción múltiple y de rellenar huecos ya es local.
- `components/ai-coach/AICoachPanelViews.tsx:166` — `onNext={() => p.sendMessage("next")}`: una
  request por ejercicio. Línea ~168: al terminar un set envía `"I just finished — X of Y right. How did I do?"`,
  otra request.
- `components/ai-coach/PracticeSession.tsx` — ya soporta varios ejercicios de un mismo turno
  (`initialExercises`, creado desde `BubbleContent.tsx:82` con todas las llamadas de herramienta del mensaje).
- `lib/ai-practice/tools/registry.ts:17-44` — los ejercicios ya traen clave de respuesta y feedback:
  `MultipleChoiceArgs { correctIndex, explanation?, commonWrongAnswers?, hint? }`,
  `FillBlankArgs { answer, acceptableAnswers?, acceptableAlternatives?, commonWrongAnswers? }`.
- `lib/ai-practice/fetch-card.ts` — `fetchExerciseCard` pide **un** ejercicio por request.
- `app/api/gemini/schema.ts:39` — `messages: z.array(MessageSchema).min(1).max(100)`; `app/api/gemini/route.ts:~104`
  pasa todo a `buildHistory(body.messages.slice(0, -1))`. No hay recorte de historial.
- `lib/gemini/chat-route.ts:buildGenerationConfig` — no fija `temperature`.
- Anti-repetición existente: `STARTER_ANGLES` en `lib/ai-prompts.ts:~162` (solo para starters) y la regla
  "Never correct the same rule twice in a row" en `lib/ai-practice/prompts.ts`. No hay lista de
  ejercicios ya vistos.

**Ejercicios con corrección por IA** (todos llaman a `gradeProduction` de `lib/exercises/grade-production-client.ts`):
- `components/exercises/TranslationEsEnExercise.tsx:~35` — ya corta en local con `isExactTranslation`
  (`lib/exercises/translation.ts`), que compara contra `referenceEn` + `acceptedAnswers`.
- `components/exercises/SentenceTransformationExercise.tsx:~60` — tiene `referenceAnswer` y
  `acceptedAnswers` pero **siempre** llama a la IA.
- `components/exercises/WrittenProductionExercise.tsx:~85` y `SpokenProductionExercise.tsx:~117` —
  producción libre; llaman a la IA en cada intento.
- No existe caché de calificaciones ni banco de respuestas aceptadas.

## Comandos

| Propósito | Comando | Esperado |
|---|---|---|
| Tests | `pnpm test -- lib/ai-practice lib/exercises hooks components/ai-coach components/exercises` | todo pasa |
| Typecheck | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Diseño | `npm run lint:design` | exit 0 |

## Alcance

**Dentro**: `hooks/useStreamingChat.ts`, `app/api/gemini/route.ts`, `app/api/gemini/schema.ts`,
`lib/gemini/chat-route.ts` (solo historial y temperatura), `lib/ai-practice/**`, `components/ai-coach/**`,
`components/exercises/{SentenceTransformation,WrittenProduction,SpokenProduction,TranslationEsEn}Exercise.tsx`,
`lib/exercises/**`, `lib/db/**` (nueva tabla Dexie), tests. Además, los documentos listados en el paso de documentación de este plan.

**Fuera**: orden de modelos y presupuesto (035), formato JSON de rutas (036), puntuación de
pronunciación (038), prompts de misiones guionizadas.

## Fase A — Coach: menos requests por sesión

### A1. Sets de 5 ejercicios en un turno
Cuando la intención es práctica (la que hoy resuelve `selectionForRequest` en
`lib/ai-practice/intent-detection.ts` con `toolChoice: "any"`), añade al prompt del Coach
(`lib/ai-practice/prompts.ts`) una instrucción: generar **5 llamadas a herramientas de ejercicio en el
mismo turno**, variando formato (opción múltiple, huecos, speaking), cada una con `commonWrongAnswers`,
`hint` y `explanation` completos, para que la corrección y el feedback no necesiten otra request.
Sube `MAX_OUTPUT_TOKENS` solo para esos turnos si 2048 no alcanza (mide antes; tope 4096).
**Verify**: test en `lib/ai-practice/__tests__/` que simula un stream con 5 `functionCall` y comprueba que
`PracticeSession` recibe 5 `initialExercises`.

### A2. "Siguiente" consume una cola local
En `hooks/useStreamingChat.ts`, mantén una cola de ejercicios pendientes del último set. `onNext` muestra
el siguiente de la cola y solo llama a `sendMessage` cuando la cola está vacía.
**Verify**: test del hook: 5 ejercicios en cola → 4 `onNext` sin `fetch`; el quinto `onNext` sí hace `fetch`.

### A3. Resumen del set sin IA
Sustituye el mensaje `"I just finished — X of Y right..."` (`AICoachPanelViews.tsx:~168`) por un resumen
local (aciertos, temas fallados con su `explanation`) y un botón "Comentar con el Coach" que solo entonces
envía la request.
**Verify**: test del componente: terminar un set no llama a `fetch`.

### A4. Historial recortado
En `app/api/gemini/route.ts`, antes de `buildHistory`, conserva solo los últimos 16 mensajes, cortando
siempre en un mensaje `user` de texto para no separar un `functionCall` de su `functionResponse`.
Implementa el corte como función pura `trimHistoryForModel(messages, max)` en `lib/ai-practice/` con tests.
Para misiones, el contexto de la misión va en el prompt de sistema (`buildMissionPrompt`), así que el recorte es seguro;
compruébalo leyendo `lib/ai-practice/missions/prompts.ts` antes.
**Verify**: tests: 40 mensajes → ≤16; el primer mensaje devuelto es `role: "user"` con texto; ningún
`tool` queda sin su `functionCall` previo.

## Fase B — Coach: variedad

### B1. Lista de ejercicios ya vistos
Guarda en Dexie (nueva tabla `coachSeenItems`: `id`, `userId`, `topic`, `stem` normalizado, `seenAt`) cada
ejercicio mostrado. Al pedir un set, el cliente envía los últimos 20 `stem` (máx. 80 caracteres cada uno)
en un campo nuevo `recentStems` del body (valídalo en `app/api/gemini/schema.ts`), y `buildSystemPrompt`
añade: "No repitas estas oraciones ni sus variaciones mínimas: …".
**Verify**: test de `buildSystemPrompt` con `recentStems` → el bloque aparece; test de esquema rechaza más de 20.

### B2. Rotación de formato y ángulo en el cliente
Decide en el cliente el reparto de formatos del set (p. ej. rotar 2-2-1) y un "ángulo" de una lista fija
(vida diaria, trabajo, viajes, intereses del perfil, errores recientes) que no se repita en las últimas 3
peticiones; envíalo en el mensaje de práctica. Reutiliza el patrón de `STARTER_ANGLES`.
**Verify**: test: 3 peticiones seguidas → 3 ángulos distintos.

### B3. Temperatura
En `buildGenerationConfig` fija `temperature: 0.9` para conversación y `0.7` para turnos de ejercicio.
**Verify**: test del config.

## Fase C — Ejercicios: corregir en local primero y no pagar dos veces

### C1. Pipeline de corrección "local primero"
Crea `lib/exercises/grading-pipeline.ts` con `gradeWithLocalFirst(input, deps)`. Orden:
1. **Vacío o <2 palabras** → feedback local, sin IA.
2. **Idéntico a la oración de origen** (transformación) → feedback local: "No transformaste la oración".
3. **Coincide con referencia o respuesta aceptada** (normalizado: minúsculas, sin puntuación final,
   contracciones expandidas: `don't`→`do not`, etc.) → correcto, score 100, sin IA.
   Generaliza `isExactTranslation` a `matchesAcceptedAnswer(answer, candidates)`.
4. **Caché de calificación** (clave `sha256(exerciseKey + respuesta normalizada)`) → devuelve la nota guardada.
5. Solo entonces → `gradeProduction`.
Guarda el resultado de 5 en la caché. Si `correct && score >= 90` y el ejercicio tiene referencia fija
(traducción o transformación), añade la respuesta normalizada al **banco de respuestas aceptadas**.
La caché y el banco van en Dexie (tabla nueva `gradedAnswers`: `key`, `userId`, `exerciseKey`, `normalized`,
`result`, `createdAt`); son datos del usuario, no se comparten.
**Verify**: tests unitarios de cada rama; con `deps.gradeProduction` simulado, las ramas 1–4 no lo llaman.

### C2. Reintentos que no gastan
En los 4 componentes de ejercicio, usa `gradeWithLocalFirst`. Tras un intento incorrecto:
- muestra la `corrections` / referencia y la pista (ya vienen de la primera respuesta);
- el segundo intento va a la IA solo si el texto cambió respecto al anterior (distancia de edición ≥ 3
  caracteres normalizados); si no, feedback local "Es la misma respuesta";
- máximo **2 llamadas a IA por ejercicio y sesión**; después, autoevaluación con la referencia (el texto
  `PRODUCTION_AI_UNAVAILABLE_MESSAGE` ya existe como modelo de copy).
Mantén cada componente ≤250 líneas; si se pasa, extrae un hook `useProductionGrading` a `hooks/`.
**Verify**: test del hook/componente: 3 envíos del mismo texto → 1 llamada; 4 textos distintos → 2 llamadas.

### C3. Ejercicios con clave pregenerada
Las rutas que generan ejercicios (`generate-translations`, `generate-transformations`) deben devolver ya
3–5 `acceptedAnswers` por ítem para que C1 corte más casos sin IA. Ajusta sus prompts en `lib/ai-prompts.ts`
(`GENERATE_TRANSLATIONS_SYSTEM_PROMPT`, `GENERATE_TRANSFORMATIONS_SYSTEM_PROMPT`).
**Verify**: tests de las rutas con respuesta simulada que incluye `acceptedAnswers`.

## Paso final — Documentación (al cerrar cada fase)

| Archivo | Qué escribir |
|---|---|
| `docs/architecture/ai-coach.md` (crear) | Flujo de un turno: sets de 5 ejercicios, cola local de "Siguiente", resumen local, recorte de historial a 16 mensajes, `recentStems` y rotación de ángulos. Cuántas requests cuesta cada acción |
| `docs/architecture/exercises.md` → nueva sección "Corrección local primero" | Las 5 ramas de `gradeWithLocalFirst`, el banco de respuestas aceptadas, el límite de 2 llamadas a IA por ejercicio y el comportamiento offline |
| `docs/architecture/offline-sync.md` | Tablas Dexie nuevas (`coachSeenItems`, `gradedAnswers`): solo locales, no se sincronizan con Supabase |
| `CLAUDE.md` → "Hard rules" | Añade: "Ejercicios corregidos con IA → `gradeWithLocalFirst` (`lib/exercises/grading-pipeline.ts`)" |
| `docs/README.md` → tabla "Arquitectura" | Enlace a `ai-coach.md` |

**Verify**: `grep -n "gradeWithLocalFirst" CLAUDE.md docs/architecture/exercises.md` → ≥2 resultados; `grep -n "ai-coach.md" docs/README.md` → 1 resultado.

## Test plan

- Patrón de tests de hooks: los existentes en `hooks/__tests__/` (si no hay uno de `useStreamingChat`,
  créalo con `fetch` simulado por `vi.fn`).
- Patrón de tests de rutas: `app/api/gemini/__tests__/route.test.ts`.
- Nuevos: `trimHistoryForModel`, cola de `onNext`, resumen local, `recentStems`, `gradeWithLocalFirst`
  (5 ramas), límite de reintentos.

## Criterios de aceptación

- [ ] Un set de 5 ejercicios del Coach cuesta 1 request (antes 5 + 1 de resumen).
- [ ] El historial enviado al modelo tiene ≤16 mensajes.
- [ ] Reenviar la misma respuesta o una respuesta aceptada no llama a `gradeProduction`.
- [ ] Máximo 2 llamadas a IA por ejercicio y sesión.
- [ ] Offline: los ejercicios con referencia se corrigen en local.
- [ ] `pnpm test`, `pnpm type-check`, `pnpm lint`, `npm run lint:design` en exit 0; ningún archivo >250 líneas.
- [ ] Documentación del "Paso final" actualizada para las fases ejecutadas.

## STOP conditions

- El modelo no emite varias llamadas a herramientas en un turno con `toolChoice: "any"` (compruébalo con
  una llamada real antes de A2); en ese caso reporta y propón una ruta JSON `generate-coach-set` en su lugar.
- Recortar el historial rompe una misión (la IA pierde el objetivo) en la prueba manual.
- Un componente de ejercicio necesita más de 8 props para el pipeline.
- La tabla Dexie nueva exige subir la versión del esquema y hay una migración pendiente de otro plan.

## Notas de mantenimiento

- Todo ejercicio nuevo que se corrija con IA debe pasar por `gradeWithLocalFirst`.
- Si se cambia la normalización, invalida la caché (incluye una versión en la clave).
- Fuera de alcance: banco compartido de ejercicios entre usuarios en Supabase. Hacerlo después de medir
  con el reporte del Plan 035 si los sets generados se repiten entre personas.
