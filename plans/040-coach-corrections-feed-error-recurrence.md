# Plan 040: Las correcciones del AI Coach alimentan la cola de errores repetidos

> **Executor instructions**: Sigue el plan paso a paso y ejecuta cada verificación antes de avanzar.
> Si ocurre algo de "STOP conditions", detente y reporta; no improvises. No añadas llamadas nuevas a
> Gemini: la etiqueta de error viaja en la misma llamada `annotate_turn` que ya existe. Al terminar,
> actualiza la fila de este plan en `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 866979df -- lib/ai-practice/tools lib/ai-practice/correction.ts lib/ai-practice/prompts.ts lib/ai-practice/learning-state.ts lib/practice/error-recurrence.ts lib/practice/error-recurrence-sync.ts hooks/useStreamingChat.ts components/ai-coach/CorrectionCard.tsx`
> Compara los extractos de "Estado actual" con el código vivo; si no coinciden, STOP.

## Estado

- **Priority**: P1
- **Effort**: S (~1 día)
- **Risk**: LOW
- **Depends on**: — (compatible con 037; si 037 fase A ya tocó `hooks/useStreamingChat.ts`, integra sobre esa versión)
- **Category**: pedagogía / bucle de aprendizaje
- **Planned at**: commit `866979df`, 2026-09-23

## Por qué importa

Los errores de la corrección del Diario y de los ejercicios de producción entran a una cola de
repaso espaciado (1, 3 y 7 días) que el Plan diario usa para programar práctica. Las correcciones que
el AI Coach hace **en la conversación** no entran: la IA marca el error, pero no dice de qué tipo es, así
que nada puede programarlo. Si la persona dice "I have 25 years" en el chat, ve la corrección y la
olvida. Con este plan, esa misma corrección programa un repaso del patrón, sin gastar requests extra.

## Estado actual

- `lib/ai-practice/tools/declarations.ts:133-148` — declaración de `annotate_turn`; `correction` tiene
  `original`, `corrected`, `rule` (en español) y `kind: "error" | "unnatural"`. **No** tiene tipo de error.
- `lib/ai-practice/tools/registry.ts:63-70` — `TurnCorrection = { original; corrected; rule; kind }`.
  `parseTurnCorrection` (l. ~228) descarta correcciones incompletas sin lanzar error.
- `lib/ai-practice/correction.ts` — `extractTurnCorrection(toolCalls)` devuelve la corrección del turno. La
  usa `components/ai-coach/chat/AIBubble.tsx:63` para pintar `components/ai-coach/CorrectionCard.tsx` (36 líneas).
- `lib/exercises/error-patterns.ts` — `ErrorPatternId` (16 ids: `tense_present_for_past`, `present_perfect_vs_past`,
  `missing_auxiliary`, `subject_verb_agreement`, `word_order`, `preposition_choice`, `article_use`,
  `plural_countable`, `modal_form`, `conditional_form`, `gerund_infinitive`, `comparative_form`, `negation_form`,
  `question_form`, `vocabulary_choice`, `spelling`), `ERROR_PATTERN_IDS`, `isErrorPatternId()`, `describeErrorPattern()`.
- `lib/practice/error-recurrence-sync.ts` — `recordPracticeErrorRecurrence(userId, errorPattern, rehearsedPattern, isCorrect)`:
  actualiza `learningState` en Dexie y encola el upsert a Supabase. Es el camino que ya usan los ejercicios
  (`lib/practice/queries.ts:206`). **Reutilízalo**; no escribas otro.
- `lib/practice/error-recurrence.ts` — `recordErrorPattern` reinicia el patrón a 1 día y suma `failCount`.
- `hooks/useStreamingChat.ts` — tras el stream, construye `finalModelMsg` (l. ~202) y lo persiste. Ahí se conoce
  la corrección del turno recién recibido. `loadMessages` hidrata conversaciones antiguas (no debe registrar nada).
- `app/api/gemini/grade-production/route.ts:48-50` — patrón a imitar: descarta etiquetas inventadas con
  `isErrorPatternId` y no registra etiqueta cuando la respuesta es correcta.

## Comandos

| Propósito | Comando | Esperado |
|---|---|---|
| Tests | `pnpm test -- lib/ai-practice lib/practice hooks components/ai-coach` | todo pasa |
| Typecheck | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint` y `npm run lint:design` | exit 0 |

## Alcance

**Dentro**: `lib/ai-practice/tools/declarations.ts`, `lib/ai-practice/tools/registry.ts`,
`lib/ai-practice/correction.ts`, `lib/ai-practice/prompts.ts`, `hooks/useStreamingChat.ts` (o un hook nuevo
`hooks/useCoachErrorRecurrence.ts` si el archivo pasa de 313 líneas), `components/ai-coach/CorrectionCard.tsx`,
tests. Además, los documentos listados en el paso de documentación.

**Fuera**: `lib/practice/error-recurrence.ts` (no cambies la lógica de la cola), el resumen de sesión
(`render_session_summary` repite correcciones ya registradas: no lo registres), la lista de ids de error.

## Pasos

### Paso 1: Campo `errorPattern` en la herramienta
En `declarations.ts`, añade a `correction.properties`:
`errorPattern: { type: "string", enum: [...ERROR_PATTERN_IDS], description: "Only when kind is \"error\": the single error type. Omit for \"unnatural\"." }`
(importa `ERROR_PATTERN_IDS`; no lo añadas a `required`). En `registry.ts`, añade `errorPattern?: ErrorPatternId` a
`TurnCorrection` y, en `parseTurnCorrection`, consérvalo solo si `isErrorPatternId(o.errorPattern)` **y** `kind === "error"`.
**Verify**: tests en `lib/ai-practice/__tests__/registry.test.ts`: id válido con `kind:"error"` → se conserva; id
inventado → `undefined`; `kind:"unnatural"` con id → `undefined`; la corrección sigue siendo válida en todos los casos.

### Paso 2: Instrucción en el prompt del Coach
En `lib/ai-practice/prompts.ts`, bloque "FEEDBACK DISCIPLINE", añade una línea: cuando `kind:"error"`, rellena
`errorPattern` con el id que mejor describa el error; si ninguno encaja, omítelo. No añadas la lista de ids al texto:
ya viaja en el `enum` de la herramienta.
**Verify**: `pnpm test -- lib/ai-practice` → pasa (actualiza snapshots de prompt si existen).

### Paso 3: Registrar el patrón una vez por conversación
Crea la función pura `pickCorrectionToRecord(correction, alreadyRecorded: Set<ErrorPatternId>)` en
`lib/ai-practice/correction.ts`: devuelve el `errorPattern` solo si existe, `kind === "error"` y no está en el set.
En `useStreamingChat`, justo después de fijar `finalModelMsg` en `sendMessage` (camino en vivo, **no** en
`loadMessages` ni en mensajes `hidden`), si hay `userId` y la función devuelve un patrón:
`void recordPracticeErrorRecurrence(userId, pattern, undefined, false)` y añade el patrón al set (un `useRef` que se
vacía en `resetChat`). Así, repetir el mismo error diez veces en una charla cuenta una vez.
**Verify**: tests del hook con `recordPracticeErrorRecurrence` simulado: 2 turnos con el mismo patrón → 1 llamada;
patrones distintos → 2 llamadas; `loadMessages` con correcciones → 0 llamadas; sin `userId` → 0 llamadas.

### Paso 4: Decirle a la persona que se guardó
Añade `errorPattern?: ErrorPatternId` a `CorrectionCardData` (`components/ai-coach/CorrectionCard.tsx:5-11`) y
pásalo desde `AIBubble`. En `CorrectionCard`, cuando la corrección trae `errorPattern`, muestra una línea pequeña:
"Lo repasarás en tu práctica: {describeErrorPattern(id)}". Usa tokens de texto existentes (p. ej. `text-caption text-fg-muted`).
**Verify**: test del componente: con `errorPattern` aparece la línea; sin él, no.

### Paso 5: Documentación

| Archivo | Qué escribir |
|---|---|
| `docs/architecture/integrated-learning-loop.md` | Las correcciones del Coach (`kind:"error"` + `errorPattern`) son una fuente de la cola de reincidencia, máximo una vez por patrón y conversación |
| `docs/architecture/ai-coach.md` (si ya existe por el Plan 037; si no, créalo con esta sección) | Campo `errorPattern` de `annotate_turn` y su validación |

**Verify**: `grep -n "errorPattern" docs/architecture/integrated-learning-loop.md` → ≥1 resultado.

## Test plan

- `lib/ai-practice/__tests__/registry.test.ts`: parseo de `errorPattern` (4 casos del paso 1).
- `lib/ai-practice/__tests__/correction.test.ts`: `pickCorrectionToRecord`.
- Test del hook (patrón: `hooks/__tests__/useAIPractice.test.tsx`): casos del paso 3.
- Patrón para aserciones sobre la cola: `lib/ai-practice/__tests__/learning-state-recurrence.test.ts`.

## Criterios de aceptación

- [ ] Una corrección `kind:"error"` con id válido llega a `recordPracticeErrorRecurrence` una vez por patrón y conversación.
- [ ] Ids inventados y correcciones `unnatural` no llegan a la cola.
- [ ] Conversaciones cargadas del historial no registran nada.
- [ ] Ninguna request nueva a `/api/gemini/*`.
- [ ] `pnpm test`, `pnpm type-check`, `pnpm lint`, `npm run lint:design` en exit 0.
- [ ] Documentación del paso 5 actualizada.

## STOP conditions

- El modelo rechaza el `enum` dentro de `annotate_turn` (error 400 de esquema) en una prueba real.
- `useStreamingChat.ts` supera 330 líneas con el cambio y no se puede extraer un hook sin tocar otros archivos.
- En la prueba manual, el Coach etiqueta mal más de 1 de cada 3 correcciones (anota ejemplos y reporta).

## Notas de mantenimiento

- Si se añade un id a `ERROR_PATTERNS`, el `enum` de la herramienta lo recoge solo.
- El Plan 042 permite retirar un patrón registrado por una corrección equivocada.
