# Coach starter: guardar la lección + sugerencias de respuesta acordes al tema

**Fecha:** 2026-09-07
**Estado:** Aprobado, listo para plan de implementación
**Rama:** dev

## Problema

Cuando el coach enseña un concepto a través de un *starter* (p. ej. el starter
"enséñame algo nuevo" enseñando "possessive adjectives"), dos cosas fallan en ese
primer turno de enseñanza:

1. **No aparece el botón «Guardar explicación».** `AIBubble` solo renderiza
   `SaveConceptChip` cuando el coach emite `concept: { title }` dentro de una
   llamada `annotate_turn`. Los prompts de starter prohíben explícitamente
   *cualquier* tool call en el turno 1 ("Do NOT call any tool on this first
   turn"), pensado para mantener el turno 1 rápido/barato. Resultado: nunca se
   puede guardar la lección desde ese primer párrafo.

2. **Las sugerencias de respuesta son genéricas.** Los chips que ve el alumno
   ("Could you give me an example?", "Can you rephrase that simpler?", "How do I
   answer this in English?") vienen del fallback
   `generateContextualSuggestions()` en `components/ai-coach/chat/message-formatting.tsx`,
   porque el coach no escribió un bloque `suggestions:` y ningún keyword del
   fallback matchea un turno de gramática. No están relacionadas con el tema.

## Solución

**Solo cambios de prompt.** Toda la infraestructura de cliente ya existe:

- `concept` ya está en el schema de `annotate_turn`
  (`lib/ai-practice/tools/declarations.ts`).
- `extractTurnConcept()` (`lib/ai-practice/correction.ts`) ya lo lee.
- `SaveConceptChip` ya se renderiza en `AIBubble` cuando hay `concept` +
  `onSaveConcept`.
- `extractSuggestions()` ya parsea un bloque `suggestions:` con líneas `- `
  (regex `/suggestions?:\s*([\s\S]*?)(?:\n\n|$)/i`), y `hasSuggestions` en
  `AIBubble` prefiere el bloque explícito sobre el fallback.

### A. Relajar la regla del turno 1

En **`buildLearnStarterPrompt`**, **`buildPronunciationStarterPrompt`** y
**`buildWorldStarterPrompt`** (`lib/ai-prompts.ts`):

- Cambiar la prohibición de "cualquier tool" por "solo exercise tools":
  - Antes: `Do NOT call any exercise tool on this first turn` /
    `Do NOT call any tool on this first turn`
  - Después: `Do NOT call any exercise tool on this first turn — you MAY call
    annotate_turn.`
- **`buildReviewStarterPrompt` NO cambia.** Ese starter va directo a un
  ejercicio y no enseña un concepto discreto guardable.

### B. Instruir a emitir `concept` en el turno de enseñanza

Añadir a los tres builders (learn / pronunciation / world):

> After your teaching text, call `annotate_turn` with a `concept` whose `title`
> is a short Spanish label for what you just taught (e.g. `'Adjetivos posesivos
> — my, your, his'`). This lets the student save the lesson.

Para pronunciation el `title` describe el sonido (p. ej. `'Sonido /æ/ vs /ʌ/'`);
para world, el punto de vocabulario o expresión introducida.

### C. Instruir a cerrar con un bloque `suggestions:`

Añadir a los mismos tres builders:

> End your message with a `suggestions:` block — exactly 3 short first-person
> replies the student could send right now, each on its own line prefixed with
> `- `. Make them fit *this* topic: one an attempt at the task you asked for,
> one a request for another example, one a request to explain it more simply.
> Write them in English at the student's level.

Ejemplo (caso del screenshot, possessive adjectives):

```
suggestions:
- This is my phone.
- Can you give me another example?
- Can you explain that more simply?
```

## Componentes tocados

| Archivo | Cambio |
|---|---|
| `lib/ai-prompts.ts` | `buildLearnStarterPrompt`, `buildPronunciationStarterPrompt`, `buildWorldStarterPrompt`: relajar regla de tool (permitir `annotate_turn`) + instrucción de `concept` + instrucción de bloque `suggestions:` |

Sin cambios en `declarations.ts`, `correction.ts`, `AIBubble.tsx`,
`SaveConceptChip.tsx`, `message-formatting.tsx`.

## Flujo de datos

```
starter "learn" → buildLearnStarterPrompt (texto nuevo)
  → modelo responde: texto de enseñanza
                     + bloque "suggestions:" (3 líneas)
                     + annotate_turn({ concept: { title } })
  → stream llega a AIBubble
     ├─ extractTurnConcept(toolCalls) → { title } → <SaveConceptChip> visible
     └─ hasSuggestions = true
        → extractSuggestions(proseBody) → <SuggestionChips> con las 3 respuestas del tema
```

## Riesgos y mitigaciones

- **El modelo puede no seguir el formato `suggestions:`.** El fallback
  `generateContextualSuggestions()` sigue en su sitio; no empeora respecto a hoy.
- **Coste del turno 1:** una llamada `annotate_turn` extra (sin ejercicio, es
  barata). Es el trade-off deseado.
- **El bloque `suggestions:` podría verse como texto si el parser falla.** El
  regex ya está en producción; riesgo bajo.
- **El modelo podría lanzar un exercise tool aprovechando la regla relajada.**
  El texto sigue diciendo explícitamente "Do NOT call any exercise tool on this
  first turn".

## Pruebas

Unit test de los tres builders (`lib/ai-practice/starters/__tests__/` o junto a
`ai-prompts`):

- El string resultante **contiene** la instrucción de `concept`.
- El string resultante **contiene** la instrucción del bloque `suggestions:`.
- El string resultante **ya no contiene** "Do NOT call any tool" y **sí
  contiene** "Do NOT call any exercise tool".
- `buildReviewStarterPrompt` **no** contiene la instrucción de `concept` ni la
  de `suggestions:` (no debe cambiar).

No hay lógica nueva de runtime que probar — el parsing y el render ya están
cubiertos por el flujo existente.

## Fuera de alcance (YAGNI)

- Fallback de cliente para detectar turnos de gramática y generar sugerencias
  con andamiaje (descartado: la vía del prompt cubre el caso).
- Mostrar el chip de guardar sin condiciones en el cliente para turnos de
  starter (descartado por la misma razón).
- Cambios en el starter `review`.
