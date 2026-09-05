# AI Coach — Corrección implícita e intereses (Fase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el AI Coach corrija al alumno en cada turno que lo necesite — en todos los modos, no solo en el de corrección — mediante un tool call tipado, y que use los intereses declarados del perfil en todas sus respuestas.

**Architecture:** Un tool nuevo `annotate_turn` transporta la corrección como datos tipados en el mismo turno que la prosa del coach (el stream ya soporta partes de texto y `functionCall` mezcladas). El system prompt gana un bloque `FEEDBACK DISCIPLINE` que exige llamarlo cuando hay algo que corregir y prohíbe felicitar cuando no lo hay. `intentToToolConfig` se abre para que el tool esté disponible en las tres intenciones. Los intereses de `user_profiles.interests` se leen server-side en `/api/gemini` y se inyectan en el system prompt.

**Tech Stack:** Next.js 16 App Router · TypeScript · Vitest · Google GenAI SDK (`@google/genai`) · Supabase

**Spec:** `docs/superpowers/specs/2026-09-05-ai-coach-adaptive-redesign-design.md`

---

## Contexto para quien implementa

Esta app es un diario de aprendizaje de inglés para hispanohablantes. El "AI Coach" es un
chat con Gemini que vive en un panel lateral. Lo que necesitas saber:

- **El modelo puede llamar "tools"** (function calling de Gemini). Hay dos familias:
  *exercise tools*, que renderizan un ejercicio interactivo, y *action tools*, que
  disparan un efecto y no renderizan nada. `annotate_turn` es un action tool.
- **El servidor decide qué tools puede usar el modelo** en cada turno, según la intención
  detectada en el último mensaje del usuario (`lib/ai-practice/intent-detection.ts`). El
  cliente no influye en esto — es una decisión de seguridad deliberada.
- **El stream se procesa en `lib/ai-practice/stream-processor.ts`**, que va acumulando
  partes de texto y llamadas a tools en un `StreamState`. Las llamadas terminadas quedan
  en `message.toolCalls` (un `Map`), y sus argumentos ya validados.
- **Hoy la corrección se saca del texto con regex** (`lib/ai-coach/parse-correction.ts`),
  buscando patrones como `~~wrong~~ → **right**`. Nada en el prompt pide ese formato, así
  que falla a menudo. Esa función **se queda como red de seguridad**, no se borra.

### Reglas del proyecto que aplican aquí

De `CLAUDE.md`, no negociables:

- Ningún prompt de Gemini dentro de componentes. Los prompts del coach viven en
  `lib/ai-practice/prompts.ts` y `lib/ai-prompts.ts`.
- Ningún archivo pasa de 250 líneas (convención); ESLint avisa a 300.
- Nada de `any` sin un comentario explicando por qué.
- Solo clases de Tailwind v4 con tokens de diseño. Nada de `style={{}}` salvo valores
  calculados en runtime.

### Comandos

```bash
pnpm test                    # Vitest, suite completa
pnpm test <ruta>             # Vitest, un archivo
pnpm type-check              # tsc --noEmit
pnpm lint                    # ESLint
pnpm test:integration        # Vitest con vitest.integration.config.ts (*.integration.test.ts)
```

Los tests unitarios viven en `__tests__/` junto al código. Los de integración se llaman
`*.integration.test.ts` y quedan **excluidos** de `pnpm test`.

---

## Estructura de archivos

| Archivo | Responsabilidad | Acción |
| - | - | - |
| `lib/ai-practice/tools/declarations.ts` | Las declaraciones JSON-schema que se envían a Gemini | **Crear** (extraído de `registry.ts`) |
| `lib/ai-practice/tools/registry.ts` | Tipos de args, validación (`parseToolArgs`), predicados | Modificar |
| `lib/ai-practice/intent-detection.ts` | Qué tools se permiten según la intención | Modificar |
| `lib/ai-practice/prompts.ts` | `BASE_TUTOR_PROMPT` y bloques de instrucción | Modificar |
| `lib/ai-practice/wire.ts` | Ensamblado del system prompt | Modificar |
| `lib/ai-practice/correction.ts` | Leer la corrección de un mensaje (tool call, con fallback a regex) | **Crear** |
| `app/api/gemini/route.ts` | Lee intereses server-side y los pasa al prompt | Modificar |
| `components/ai-coach/MessageBubble.tsx` | Consume la corrección tipada; no renderiza `annotate_turn` como widget | Modificar |
| `components/ai-coach/CorrectionCard.tsx` | Muestra la corrección; gana la regla y el tipo | Modificar |

`registry.ts` está hoy en **355 líneas**. La Task 1 lo baja extrayendo las declaraciones,
lo que deja sitio para `annotate_turn` sin superar el umbral.

---

## Task 1: Extraer `TOOL_DECLARATIONS` a su propio archivo

Refactor puro, sin cambio de comportamiento. Baja `registry.ts` de 355 líneas y separa dos
responsabilidades distintas: el contrato con Gemini (declarations) y la validación de lo
que vuelve (registry).

**Files:**
- Create: `lib/ai-practice/tools/declarations.ts`
- Modify: `lib/ai-practice/tools/registry.ts`

- [ ] **Step 1: Localizar el bloque a mover**

Lee `lib/ai-practice/tools/registry.ts` y localiza `export const TOOL_DECLARATIONS = [`
(empieza en la línea 90) hasta el `];` que lo cierra. Ese array completo es lo que se
mueve, sin editar su contenido.

- [ ] **Step 2: Crear el archivo nuevo**

Crea `lib/ai-practice/tools/declarations.ts` con esta cabecera, seguida del array
`TOOL_DECLARATIONS` **copiado literalmente** de `registry.ts`:

```ts
// Gemini function-calling declarations — the contract we send to the model.
// Kept apart from registry.ts, which validates what comes back.

import { listScriptedMissions } from '@/lib/ai-practice/missions/registry'

export const TOOL_DECLARATIONS = [
  // ...pega aquí el array tal cual estaba en registry.ts...
];
```

Nota: revisa si el array usa helpers o constantes de `registry.ts` (por ejemplo, la
declaración de `start_mission` puede enumerar misiones). Si es así, importa lo que haga
falta desde `@/lib/ai-practice/missions/registry`; si no usa nada, borra el import de
arriba.

- [ ] **Step 3: Reexportar desde `registry.ts` para no romper a nadie**

Borra el array de `registry.ts` y añade en su lugar, junto a los demás exports:

```ts
export { TOOL_DECLARATIONS } from "./declarations";
```

- [ ] **Step 4: Verificar que nada se rompió**

```bash
pnpm type-check && pnpm test lib/ai-practice/__tests__/registry.test.ts
```

Esperado: `tsc` sin errores y el suite de registry en verde. Si `type-check` se queja de
un import circular entre `declarations.ts` y `registry.ts`, mueve el helper compartido a
`declarations.ts` en lugar de importarlo desde `registry.ts`.

- [ ] **Step 5: Confirmar el tamaño**

```bash
wc -l lib/ai-practice/tools/registry.ts lib/ai-practice/tools/declarations.ts
```

Esperado: `registry.ts` por debajo de 250 líneas.

- [ ] **Step 6: Commit**

```bash
git add lib/ai-practice/tools/declarations.ts lib/ai-practice/tools/registry.ts
git commit -m "refactor(ai-coach): extract TOOL_DECLARATIONS to its own module"
```

---

## Task 2: El tool `annotate_turn`

**Files:**
- Modify: `lib/ai-practice/tools/registry.ts`
- Modify: `lib/ai-practice/tools/declarations.ts`
- Test: `lib/ai-practice/__tests__/registry.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Añade al final de `lib/ai-practice/__tests__/registry.test.ts`:

```ts
describe("parseToolArgs: annotate_turn", () => {
  it("parses a correction with all required fields", () => {
    const args = parseToolArgs("annotate_turn", {
      correction: {
        original: "I go to the cinema yesterday",
        corrected: "I went to the cinema yesterday",
        rule: "Past simple: 'yesterday' requires the past form of the verb",
        kind: "error",
      },
    });
    expect(args).toEqual({
      correction: {
        original: "I go to the cinema yesterday",
        corrected: "I went to the cinema yesterday",
        rule: "Past simple: 'yesterday' requires the past form of the verb",
        kind: "error",
      },
      saveables: undefined,
    });
  });

  it("accepts an empty call — the turn needed no feedback", () => {
    expect(parseToolArgs("annotate_turn", {})).toEqual({
      correction: undefined,
      saveables: undefined,
    });
  });

  it("drops a correction missing required fields instead of throwing", () => {
    const args = parseToolArgs("annotate_turn", {
      correction: { original: "I go", kind: "error" },
    }) as AnnotateTurnArgs;
    expect(args.correction).toBeUndefined();
  });

  it("defaults an unknown kind to 'error'", () => {
    const args = parseToolArgs("annotate_turn", {
      correction: { original: "a", corrected: "b", rule: "c", kind: "banana" },
    }) as AnnotateTurnArgs;
    expect(args.correction?.kind).toBe("error");
  });

  it("parses saveables and caps them at 2", () => {
    const args = parseToolArgs("annotate_turn", {
      saveables: [
        { type: "word", text: "creepy", meaning: "escalofriante" },
        { type: "phrase", text: "that sounds creepy", meaning: "eso suena escalofriante" },
        { type: "word", text: "spooky", meaning: "tenebroso" },
      ],
    }) as AnnotateTurnArgs;
    expect(args.saveables).toHaveLength(2);
    expect(args.saveables?.[0]).toEqual({
      type: "word",
      text: "creepy",
      meaning: "escalofriante",
      example: undefined,
      ipa: undefined,
    });
  });

  it("skips saveables with an invalid type", () => {
    const args = parseToolArgs("annotate_turn", {
      saveables: [
        { type: "sentence", text: "x", meaning: "y" },
        { type: "word", text: "creepy", meaning: "escalofriante" },
      ],
    }) as AnnotateTurnArgs;
    expect(args.saveables).toHaveLength(1);
    expect(args.saveables?.[0].text).toBe("creepy");
  });

  it("is an action tool, not an exercise tool", () => {
    expect(isExerciseTool("annotate_turn")).toBe(false);
    expect(ACTION_TOOL_NAMES).toContain("annotate_turn");
  });
});
```

Ajusta los imports al principio del archivo de test para incluir lo que falte:
`parseToolArgs`, `isExerciseTool`, `ACTION_TOOL_NAMES` y el tipo `AnnotateTurnArgs`, todos
desde `../tools/registry`.

- [ ] **Step 2: Ejecutar el test y verlo fallar**

```bash
pnpm test lib/ai-practice/__tests__/registry.test.ts
```

Esperado: FAIL. `tsc` no conoce `AnnotateTurnArgs` y `parseToolArgs` no acepta
`"annotate_turn"` como nombre.

- [ ] **Step 3: Añadir tipos y nombres en `registry.ts`**

Junto a los otros tipos de args:

```ts
export type CorrectionKind = "error" | "unnatural";

export type TurnCorrection = {
  original: string;
  corrected: string;
  rule: string;
  kind: CorrectionKind;
};

export type TurnSaveable = {
  type: "word" | "phrase";
  text: string;
  meaning: string;
  example?: string;
  ipa?: string;
};

export type AnnotateTurnArgs = {
  correction?: TurnCorrection;
  saveables?: TurnSaveable[];
};
```

Añade la variante a la unión `ToolArgs`:

```ts
  | { name: "annotate_turn"; args: AnnotateTurnArgs }
```

Amplía `ActionToolName` y la lista:

```ts
export type ActionToolName =
  | "save_word"
  | "start_mission"
  | "mission_intent_observed"
  | "annotate_turn";

export const ACTION_TOOL_NAMES: ActionToolName[] = [
  "save_word",
  "start_mission",
  "mission_intent_observed",
  "annotate_turn",
];
```

- [ ] **Step 4: Añadir los parsers**

Junto a los otros helpers privados de `registry.ts`:

```ts
function parseTurnCorrection(val: unknown): TurnCorrection | undefined {
  if (!val || typeof val !== "object") return undefined;
  const o = val as Record<string, unknown>;
  if (
    typeof o.original !== "string" || !o.original ||
    typeof o.corrected !== "string" || !o.corrected ||
    typeof o.rule !== "string" || !o.rule
  ) {
    // A half-filled correction is worse than none: it would render a card
    // with a blank side. Drop it rather than throwing — the prose is still
    // worth showing.
    return undefined;
  }
  return {
    original: o.original,
    corrected: o.corrected,
    rule: o.rule,
    kind: o.kind === "unnatural" ? "unnatural" : "error",
  };
}

/** Max saveables surfaced per turn — more than two chips crowds the bubble. */
const MAX_SAVEABLES_PER_TURN = 2;

function parseTurnSaveables(val: unknown): TurnSaveable[] | undefined {
  if (!Array.isArray(val)) return undefined;
  const out: TurnSaveable[] = [];
  for (const item of val) {
    if (out.length >= MAX_SAVEABLES_PER_TURN) break;
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (o.type !== "word" && o.type !== "phrase") continue;
    if (typeof o.text !== "string" || !o.text) continue;
    if (typeof o.meaning !== "string" || !o.meaning) continue;
    out.push({
      type: o.type,
      text: o.text,
      meaning: o.meaning,
      example: typeof o.example === "string" ? o.example : undefined,
      ipa: typeof o.ipa === "string" ? o.ipa : undefined,
    });
  }
  return out.length ? out : undefined;
}
```

Y el `case` dentro de `parseToolArgs`:

```ts
    case "annotate_turn":
      return {
        correction: parseTurnCorrection(obj.correction),
        saveables: parseTurnSaveables(obj.saveables),
      } satisfies AnnotateTurnArgs;
```

**Por qué no lanza excepción:** los demás tools lanzan si faltan campos porque sin ellos
no hay nada que renderizar. Aquí el turno tiene prosa válida; una anotación malformada
debe desaparecer en silencio, no romper el mensaje.

- [ ] **Step 5: Añadir la declaración para Gemini**

En `lib/ai-practice/tools/declarations.ts`, dentro del array:

```ts
  {
    name: "annotate_turn",
    description:
      "Attach feedback to the student's latest turn. Call it alongside your normal reply — never instead of it. Include `correction` ONLY when the student's message has a real error or sounds unnatural; omit it entirely when their English was fine. Include `saveables` for words or expressions worth keeping.",
    parameters: {
      type: "object",
      properties: {
        correction: {
          type: "object",
          properties: {
            original:  { type: "string", description: "The student's exact wording, quoted verbatim." },
            corrected: { type: "string", description: "The fixed or more natural wording." },
            rule:      { type: "string", description: "One short sentence in SPANISH explaining why." },
            kind:      { type: "string", enum: ["error", "unnatural"] },
          },
          required: ["original", "corrected", "rule", "kind"],
        },
        saveables: {
          type: "array",
          maxItems: 2,
          items: {
            type: "object",
            properties: {
              type:    { type: "string", enum: ["word", "phrase"] },
              text:    { type: "string", description: "The English word or expression." },
              meaning: { type: "string", description: "Its meaning in SPANISH." },
              example: { type: "string", description: "A sentence using it, from the current conversation." },
              ipa:     { type: "string" },
            },
            required: ["type", "text", "meaning"],
          },
        },
      },
    },
  },
```

Fíjate en que **no hay `required` a nivel raíz**: una llamada vacía es válida.

- [ ] **Step 6: Ejecutar los tests**

```bash
pnpm test lib/ai-practice/__tests__/registry.test.ts && pnpm type-check
```

Esperado: PASS en todos, `tsc` limpio.

- [ ] **Step 7: Commit**

```bash
git add lib/ai-practice/tools/registry.ts lib/ai-practice/tools/declarations.ts lib/ai-practice/__tests__/registry.test.ts
git commit -m "feat(ai-coach): add annotate_turn tool for typed turn feedback"
```

---

## Task 3: Permitir `annotate_turn` en las tres intenciones

Sin esto el tool es inalcanzable. Hoy `explanation_request` fuerza `toolChoice: "none"` y
`allowedTools: []`, lo que **apagaría la corrección justo cuando el alumno pregunta "explain
X"** — un turno en el que suele escribir en inglés y equivocarse.

**Files:**
- Modify: `lib/ai-practice/intent-detection.ts`
- Test: `lib/ai-practice/__tests__/intent-detection.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Añade a `lib/ai-practice/__tests__/intent-detection.test.ts`:

```ts
describe("intentToToolConfig: annotate_turn availability", () => {
  it("allows annotate_turn on a conversation turn", () => {
    const config = intentToToolConfig({ type: "conversation" });
    expect(config.allowedTools).toContain("annotate_turn");
    expect(config.toolChoice).toBe("auto");
  });

  it("allows annotate_turn on an explanation request", () => {
    const config = intentToToolConfig({ type: "explanation_request" });
    expect(config.allowedTools).toEqual(["annotate_turn"]);
    expect(config.toolChoice).toBe("auto");
  });

  it("allows annotate_turn alongside the exercise tools", () => {
    const config = intentToToolConfig({ type: "exercise_request" });
    expect(config.allowedTools).toContain("annotate_turn");
    expect(config.allowedTools).toContain("render_fill_blank");
  });

  it("no longer forces toolChoice 'none' on explanation requests", () => {
    expect(intentToToolConfig({ type: "explanation_request" }).toolChoice).not.toBe("none");
  });
});
```

- [ ] **Step 2: Ejecutar y ver fallar**

```bash
pnpm test lib/ai-practice/__tests__/intent-detection.test.ts
```

Esperado: FAIL — `explanation_request` devuelve hoy `{ toolChoice: "none", allowedTools: [] }`.

- [ ] **Step 3: Implementar**

En `lib/ai-practice/intent-detection.ts`, amplía primero el tipo del array — hoy es
`ExerciseToolName[] | ActionToolName[] | []`, y ahora un mismo array mezcla las dos
familias:

```ts
export type ToolConfig = {
  toolChoice: "any" | "none" | "auto";
  allowedTools: Array<ExerciseToolName | ActionToolName>;
};
```

Y sustituye `intentToToolConfig`:

```ts
/**
 * Feedback is not a mode: the coach must be able to correct the student on
 * every kind of turn, so annotate_turn is allowed for all three intents.
 * Explanation requests can no longer use toolChoice "none" for that reason —
 * "auto" with a single allowed tool keeps exercises out just as effectively.
 */
export function intentToToolConfig(intent: Intent): ToolConfig {
  switch (intent.type) {
    case "exercise_request":
      return { toolChoice: "any", allowedTools: [...EXERCISE_TOOLS, "annotate_turn"] };
    case "explanation_request":
      return { toolChoice: "auto", allowedTools: ["annotate_turn"] };
    case "conversation":
      return { toolChoice: "auto", allowedTools: [...ACTION_TOOLS, "annotate_turn"] };
  }
}
```

Si `ACTION_TOOLS` ya se deriva de `ACTION_TOOL_NAMES`, `annotate_turn` estará duplicado en
la rama `conversation`. Comprueba cómo está definido `ACTION_TOOLS` al principio del
archivo: si es `ACTION_TOOL_NAMES`, deja simplemente `allowedTools: [...ACTION_TOOLS]` en
esa rama y añade un `expect` en el test que confirme que lo contiene.

> **Ojo con `toolChoice: "any"`** en `exercise_request`: obliga al modelo a llamar *algún*
> tool. Con `annotate_turn` en la lista, el modelo podría llamarlo en vez de generar el
> ejercicio. Si el test de integración de la Task 8 muestra ese comportamiento, la
> solución es dejar `exercise_request` con solo `EXERCISE_TOOLS` y aceptar que en ese turno
> no hay corrección — el alumno pidió un ejercicio, no escribió inglés que corregir.

- [ ] **Step 4: Ejecutar los tests**

```bash
pnpm test lib/ai-practice/__tests__/intent-detection.test.ts && pnpm type-check
```

Esperado: PASS y `tsc` limpio. Si `tsc` se queja en `app/api/gemini/route.ts` por el
cambio de tipo de `allowedTools`, ajusta ahí el tipo de la variable `selection`.

- [ ] **Step 5: Commit**

```bash
git add lib/ai-practice/intent-detection.ts lib/ai-practice/__tests__/intent-detection.test.ts
git commit -m "feat(ai-coach): allow annotate_turn on every intent so feedback is never gated"
```

---

## Task 4: `FEEDBACK DISCIPLINE` en el prompt del tutor

**Files:**
- Modify: `lib/ai-practice/prompts.ts`
- Test: `lib/ai-practice/__tests__/wire.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Añade a `lib/ai-practice/__tests__/wire.test.ts`:

```ts
describe("BASE_TUTOR_PROMPT feedback discipline", () => {
  it("instructs the model to call annotate_turn for corrections", () => {
    expect(BASE_TUTOR_PROMPT).toContain("annotate_turn");
  });

  it("forbids praising a turn that had nothing to correct", () => {
    expect(BASE_TUTOR_PROMPT).toMatch(/DO NOT say "that's correct"/i);
  });

  it("limits feedback to one item per turn", () => {
    expect(BASE_TUTOR_PROMPT).toMatch(/ONE only/i);
  });
});
```

Asegúrate de que `BASE_TUTOR_PROMPT` esté importado en ese archivo (ya lo está).

- [ ] **Step 2: Ejecutar y ver fallar**

```bash
pnpm test lib/ai-practice/__tests__/wire.test.ts
```

Esperado: FAIL en los tres — el prompt no menciona `annotate_turn`.

- [ ] **Step 3: Añadir los bloques al prompt**

En `lib/ai-practice/prompts.ts`, dentro del template literal de `BASE_TUTOR_PROMPT`, justo
**antes** de la sección `EXERCISE QUALITY`, inserta:

```
FEEDBACK DISCIPLINE (applies to EVERY user turn, in every mode):
Before replying, scan the student's message for ONE thing worth flagging:
  1. A grammar or vocabulary error, OR
  2. Phrasing that is correct but a native speaker would not say.
If you find one, call annotate_turn with `correction` — ONE only, the most
useful one. Set kind:"error" or kind:"unnatural". Write `rule` in SPANISH.
If the message is fine, DO NOT call annotate_turn with a correction and DO NOT
say "that's correct" or "good job" — just continue the conversation naturally.
Silence is the signal that their English was fine.
Never let the correction take over the reply: your prose stays conversational
and moves the conversation forward. The card carries the correction.
Never correct the same rule twice in a row — if they repeat it, let it pass
once and raise it later.
Do not correct a message that is only a greeting, a single word, or written in
Spanish.

SAVEABLES:
When you use a word or expression the student likely does not know — or you
teach one on purpose — call annotate_turn with `saveables`. Max 2 per turn.
Give `meaning` in SPANISH, and an `example` using the word in the context you
were just discussing, not a generic one.
Prefer vocabulary from the student's declared interest areas.
```

- [ ] **Step 4: Ejecutar los tests**

```bash
pnpm test lib/ai-practice/__tests__/wire.test.ts
```

Esperado: PASS. Si algún test previo comparaba `BASE_TUTOR_PROMPT` por igualdad exacta,
actualízalo — sigue siendo válido comparar por `toContain`.

- [ ] **Step 5: Comprobar la regla dura de prompts**

```bash
pnpm audit:ai-prompts
```

Esperado: exit 0. El prompt vive en `lib/`, no en un componente.

- [ ] **Step 6: Commit**

```bash
git add lib/ai-practice/prompts.ts lib/ai-practice/__tests__/wire.test.ts
git commit -m "feat(ai-coach): make correction implicit in every turn via FEEDBACK DISCIPLINE"
```

---

## Task 5: `buildSystemPrompt` pasa a objeto de opciones y recibe `interests`

Hoy tiene 4 parámetros posicionales. Añadir un quinto lo hace ilegible en la llamada
(`buildSystemPrompt(state, undefined, false, undefined, interests)`).

**Files:**
- Modify: `lib/ai-practice/wire.ts`
- Modify: `app/api/gemini/route.ts:70`
- Test: `lib/ai-practice/__tests__/wire.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Añade a `lib/ai-practice/__tests__/wire.test.ts`:

```ts
describe("buildSystemPrompt interests", () => {
  it("includes the declared interests when there are any", () => {
    const prompt = buildSystemPrompt(null, { interests: ["technology", "gaming"] });
    expect(prompt).toContain("technology, gaming");
  });

  it("tells the model not to force interests into every message", () => {
    const prompt = buildSystemPrompt(null, { interests: ["food"] });
    expect(prompt).toMatch(/do NOT force/i);
  });

  it("omits the interests block entirely when the list is empty", () => {
    const prompt = buildSystemPrompt(null, { interests: [] });
    expect(prompt).not.toMatch(/declared interests/i);
  });

  it("omits the interests block when interests are not provided", () => {
    expect(buildSystemPrompt(null)).not.toMatch(/declared interests/i);
  });

  it("keeps interests alongside the learning state hint", () => {
    const state = createEmptyState("u1", "d1");
    const prompt = buildSystemPrompt(state, { interests: ["books"] });
    expect(prompt).toContain("books");
    expect(prompt).toContain("Student:");
  });

  it("keeps interests in mission mode", () => {
    const prompt = buildSystemPrompt(null, { missionId: "roleplay.cafe", interests: ["travel"] });
    expect(prompt).toContain("travel");
  });
});
```

Además, **actualiza las llamadas posicionales existentes** en ese archivo a la firma nueva:

```ts
buildSystemPrompt(null, undefined, false)          →  buildSystemPrompt(null)
buildSystemPrompt(null, undefined, true)           →  buildSystemPrompt(null, { voiceScored: true })
buildSystemPrompt(state, undefined, true)          →  buildSystemPrompt(state, { voiceScored: true })
buildSystemPrompt(null, undefined, false, "roleplay.cafe")
                                                   →  buildSystemPrompt(null, { missionId: "roleplay.cafe" })
buildSystemPrompt(null, undefined, false, "roleplay.unknown")
                                                   →  buildSystemPrompt(null, { missionId: "roleplay.unknown" })
```

- [ ] **Step 2: Ejecutar y ver fallar**

```bash
pnpm test lib/ai-practice/__tests__/wire.test.ts
```

Esperado: FAIL — el segundo argumento se interpreta hoy como `lastTopic: string`.

- [ ] **Step 3: Implementar la firma nueva**

En `lib/ai-practice/wire.ts`, añade el tipo y el helper, y reescribe la función:

```ts
export interface SystemPromptOptions {
  lastTopic?: string;
  voiceScored?: boolean;
  missionId?: string;
  /** Interests the student picked in their profile (lib/users/interests.ts). */
  interests?: readonly string[];
}

function interestsBlock(interests: readonly string[] | undefined): string {
  if (!interests?.length) return "";
  return `\n\nThe student's declared interests: ${interests.join(", ")}.
Ground your examples, scenarios and vocabulary in these areas whenever it fits
naturally. Do NOT force every message into them, and do NOT announce that you
are using their interests.`;
}

export function buildSystemPrompt(
  learningState: UserLearningState | null,
  options: SystemPromptOptions = {},
): string {
  const { lastTopic, voiceScored, missionId, interests } = options;
  const voiceSuffix = voiceScored ? `\n\n${VOICE_TURN_INSTRUCTION}` : "";
  const interestsSuffix = interestsBlock(interests);

  const mission = missionId ? getMission(missionId) : null;
  if (mission && isConversationalMission(mission)) {
    const missionPrompt = buildMissionPrompt(
      mission,
      learningState ? compactState(learningState) : undefined,
    );
    return `${missionPrompt}${interestsSuffix}${voiceSuffix}`;
  }

  if (!learningState) return `${BASE_TUTOR_PROMPT}${interestsSuffix}${voiceSuffix}`;

  const stateHint = compactState(learningState);
  const knownTopics = learningState.grammar.weakTopics.map(t => t.topic);
  const { topic, isNew } = selectNextExerciseTopic(learningState, knownTopics, lastTopic);

  const nextHint = isNew
    ? `Next exercise: introduce a NEW topic — "${topic}". Do not repeat the last topic.`
    : `Next exercise: focus on "${topic}" (student has struggled here). Do not repeat the last topic.`;

  return `${BASE_TUTOR_PROMPT}\n\n${stateHint}\n\n${nextHint}${interestsSuffix}${voiceSuffix}`;
}
```

Ojo: el test `buildSystemPrompt(null, { missionId: "roleplay.unknown" })` debe seguir
devolviendo exactamente `BASE_TUTOR_PROMPT` (sin intereses, porque no se pasan). Ese
comportamiento se conserva con este código.

- [ ] **Step 4: Actualizar la única llamada de producción**

En `app/api/gemini/route.ts` línea 70, sustituye:

```ts
const systemPrompt = buildSystemPrompt(learningState, lastTopic, voice?.scored === true, body.missionId);
```

por:

```ts
const systemPrompt = buildSystemPrompt(learningState, {
  lastTopic,
  voiceScored: voice?.scored === true,
  missionId: body.missionId,
});
```

(Los intereses se añaden en la Task 6.)

- [ ] **Step 5: Ejecutar los tests**

```bash
pnpm test lib/ai-practice/__tests__/wire.test.ts && pnpm type-check
```

Esperado: PASS y `tsc` limpio.

- [ ] **Step 6: Commit**

```bash
git add lib/ai-practice/wire.ts app/api/gemini/route.ts lib/ai-practice/__tests__/wire.test.ts
git commit -m "refactor(ai-coach): buildSystemPrompt takes an options object, accepts interests"
```

---

## Task 6: Leer los intereses del perfil en la ruta

**Files:**
- Modify: `app/api/gemini/route.ts:67-70`

Los intereses ya existen y ya los usan otras rutas. Mira
`app/api/gemini/journal-correct/route.ts:28` como referencia del patrón.

- [ ] **Step 1: Añadir el import**

En `app/api/gemini/route.ts`, junto a los demás imports de `lib`:

```ts
import { getUserInterests } from "@/lib/users/server-queries";
```

- [ ] **Step 2: Leer los intereses en paralelo**

Sustituye la línea 67:

```ts
const learningState = await fetchServerLearningState(user.id, accessToken);
```

por:

```ts
// Interests are a nice-to-have: a profile read failure must never block the
// chat, so it degrades to an empty list rather than rejecting the request.
const [learningState, interests] = await Promise.all([
  fetchServerLearningState(user.id, accessToken),
  getUserInterests(user.id).catch(() => []),
]);
```

- [ ] **Step 3: Pasarlos al prompt**

Actualiza la llamada que dejaste en la Task 5:

```ts
const systemPrompt = buildSystemPrompt(learningState, {
  lastTopic,
  voiceScored: voice?.scored === true,
  missionId: body.missionId,
  interests,
});
```

- [ ] **Step 4: Verificar**

```bash
pnpm type-check && pnpm lint && pnpm test lib/ai-practice
```

Esperado: todo limpio y en verde.

- [ ] **Step 5: Commit**

```bash
git add app/api/gemini/route.ts
git commit -m "feat(ai-coach): feed profile interests into the coach system prompt"
```

---

## Task 7: Leer la corrección tipada en la burbuja

`annotate_turn` es un action tool: el `stream-processor` ya lo marca `answered` y guarda
sus args en `message.toolCalls`, sin necesidad de un handler nuevo. Pero hoy
`MessageBubble` renderiza como `<ToolWidget>` **cualquier** tool call que no sea de
ejercicio, así que sin este cambio aparecería un widget vacío.

**Files:**
- Create: `lib/ai-practice/correction.ts`
- Create: `lib/ai-practice/__tests__/correction.test.ts`
- Modify: `components/ai-coach/CorrectionCard.tsx`
- Modify: `components/ai-coach/MessageBubble.tsx`

- [ ] **Step 1: Escribir el test que falla**

Crea `lib/ai-practice/__tests__/correction.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { extractTurnCorrection } from "../correction";
import type { ToolCall } from "../types";

function callMap(calls: ToolCall[]): Map<string, ToolCall> {
  return new Map(calls.map((c) => [c.id, c]));
}

describe("extractTurnCorrection", () => {
  it("returns the correction carried by an annotate_turn call", () => {
    const calls = callMap([
      {
        id: "c1",
        name: "annotate_turn",
        status: "answered",
        args: {
          correction: {
            original: "I go yesterday",
            corrected: "I went yesterday",
            rule: "Pasado simple",
            kind: "error",
          },
        },
      },
    ]);
    expect(extractTurnCorrection(calls)).toEqual({
      original: "I go yesterday",
      corrected: "I went yesterday",
      rule: "Pasado simple",
      kind: "error",
    });
  });

  it("returns null when annotate_turn carried no correction", () => {
    const calls = callMap([
      { id: "c1", name: "annotate_turn", status: "answered", args: { saveables: [] } },
    ]);
    expect(extractTurnCorrection(calls)).toBeNull();
  });

  it("returns null when there is no annotate_turn call at all", () => {
    const calls = callMap([
      { id: "c1", name: "render_word_card", status: "rendered", args: { word: "a", meaning: "b" } },
    ]);
    expect(extractTurnCorrection(calls)).toBeNull();
  });

  it("ignores an annotate_turn call that errored", () => {
    const calls = callMap([
      { id: "c1", name: "annotate_turn", status: "error", args: {}, error: "boom", errorId: "e1" },
    ]);
    expect(extractTurnCorrection(calls)).toBeNull();
  });

  it("returns null for an empty map", () => {
    expect(extractTurnCorrection(new Map())).toBeNull();
  });
});
```

Si el tipo `ToolCall` exige campos que no puse aquí, mira su definición en
`lib/ai-practice/types.ts` y complétalos en el helper `callMap`.

- [ ] **Step 2: Ejecutar y ver fallar**

```bash
pnpm test lib/ai-practice/__tests__/correction.test.ts
```

Esperado: FAIL con "Failed to resolve import ../correction".

- [ ] **Step 3: Implementar**

Crea `lib/ai-practice/correction.ts`:

```ts
import type { ToolCall } from "./types";
import type { AnnotateTurnArgs, TurnCorrection } from "./tools/registry";

/**
 * Pulls the correction out of a model turn's annotate_turn call.
 *
 * This is the primary path. `lib/ai-coach/parse-correction.ts` stays as a
 * fallback for turns where the model wrote the correction into its prose
 * instead of calling the tool.
 */
export function extractTurnCorrection(
  toolCalls: Map<string, ToolCall>,
): TurnCorrection | null {
  for (const call of toolCalls.values()) {
    if (call.name !== "annotate_turn") continue;
    if (call.status === "error") continue;
    const args = call.args as AnnotateTurnArgs;
    if (args?.correction) return args.correction;
  }
  return null;
}
```

- [ ] **Step 4: Ejecutar y ver pasar**

```bash
pnpm test lib/ai-practice/__tests__/correction.test.ts
```

Esperado: PASS.

- [ ] **Step 5: Ampliar `CorrectionCard` para mostrar la regla**

`CorrectionCard` recibe hoy `ParsedCorrection` (solo `original` y `corrected`). Ahora
recibe un tipo que admite también `rule` y `kind`. Sustituye
`components/ai-coach/CorrectionCard.tsx` por:

```tsx
"use client";

import { ArrowRight, Check } from "@/components/icons";

export interface CorrectionCardData {
  original: string;
  corrected: string;
  /** Present only on tool-provided corrections; the regex fallback has none. */
  rule?: string;
  kind?: "error" | "unnatural";
}

interface CorrectionCardProps {
  correction: CorrectionCardData;
}

export default function CorrectionCard({ correction }: CorrectionCardProps) {
  const label = correction.kind === "unnatural" ? "Suena más natural" : "Corrección rápida";

  return (
    <div className="self-end max-w-[88%] rounded-xl border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[var(--success-soft)] px-3.5 py-2.5 text-body-sm leading-relaxed">
      <p className="mb-1 flex items-center gap-1.5 font-kicker font-semibold text-[var(--success)]">
        <Check size={14} strokeWidth={2.25} aria-hidden />
        {label}
      </p>
      <p className="flex flex-wrap items-center gap-1.5">
        <s className="text-[var(--text-tertiary)]">{correction.original}</s>
        <ArrowRight size={14} strokeWidth={2} className="shrink-0 text-[var(--text-tertiary)]" aria-hidden />
        <b className="font-semibold text-[var(--text-primary)]">{correction.corrected}</b>
      </p>
      {correction.rule && (
        <p className="mt-1.5 text-caption text-[var(--text-tertiary)]">{correction.rule}</p>
      )}
    </div>
  );
}
```

`ParsedCorrection` (`{ original, corrected }`) sigue encajando en `CorrectionCardData`
porque `rule` y `kind` son opcionales.

- [ ] **Step 6: Conectar la burbuja**

En `components/ai-coach/MessageBubble.tsx`, añade el import:

```ts
import { extractTurnCorrection } from "@/lib/ai-practice/correction";
```

Sustituye la línea que hoy calcula la corrección:

```ts
const { correction, body: proseBody } = parseCorrection(fullText);
```

por:

```ts
// The tool call is the primary source; parseCorrection stays as a fallback for
// turns where the model wrote the correction into its prose instead.
const toolCorrection = extractTurnCorrection(message.toolCalls);
const parsed = parseCorrection(fullText);
const correction = toolCorrection ?? parsed.correction;
// Only strip text from the prose when the regex fallback matched it there.
const proseBody = toolCorrection ? fullText : parsed.body;
```

Y en el `map` sobre `contentParts`, junto a la línea que salta `suggestions`, añade
`annotate_turn` para que no se renderice como widget:

```ts
                    const tc = message.toolCalls.get(part.callId);
                    if (!tc || tc.name === "suggestions" || tc.name === "annotate_turn") return null;
```

Cuidado con `displayText`, que hoy es:

```ts
const displayText = textParts.length === 1 && correction ? proseBody : null;
```

Con `toolCorrection`, `proseBody === fullText`, así que esta línea es inocua. Déjala
igual.

- [ ] **Step 7: Verificar todo**

```bash
pnpm test lib/ai-practice components/ai-coach && pnpm type-check && pnpm lint
```

Esperado: PASS, `tsc` limpio, ESLint sin errores nuevos.

- [ ] **Step 8: Comprobar tamaños de archivo**

```bash
wc -l components/ai-coach/MessageBubble.tsx components/ai-coach/CorrectionCard.tsx
```

Esperado: `MessageBubble.tsx` por debajo de 320 (venía de 309; ESLint avisa a 300 — si ya
avisaba antes, no lo empeores; si el aviso es nuevo por este cambio, extrae `AIBubble` a
su propio archivo `components/ai-coach/chat/AIBubble.tsx` antes de commitear).

- [ ] **Step 9: Commit**

```bash
git add lib/ai-practice/correction.ts lib/ai-practice/__tests__/correction.test.ts components/ai-coach/CorrectionCard.tsx components/ai-coach/MessageBubble.tsx
git commit -m "feat(ai-coach): render corrections from annotate_turn, keep regex as fallback"
```

---

## Task 8: Test de integración contra Gemini

**Este es el test que valida el supuesto del que depende toda la fase:** que flash-lite
llame a `annotate_turn` mientras también escribe prosa. Si falla, la respuesta es subir ese
caso a `flash` en la cadena de fallback — no rediseñar.

**Files:**
- Create: `lib/ai-practice/__tests__/annotate-turn.integration.test.ts`

**Cómo funciona la ruta real** (ya verificado, no hace falta que lo investigues):

- `sendMessageWithFallback` devuelve `Promise<string>` — **solo texto**, descarta los
  function calls. No sirve para este test.
- `streamWithFallback(ai, systemPrompt, history, lastMessage, selection, controller,
  abortSignal)` sí los expone: escribe chunks en un `ReadableStreamDefaultController`
  mediante `encodeChunk`, que serializa como `data: {json}\n\n`.
- Esos chunks tienen exactamente la forma `StreamChunk` que consume `processChunk` en el
  cliente. El test los recoge con un controller falso y los pasa por `processChunk`, así
  que ejercita **la cadena completa de producción**: prompt real, declarations reales,
  fallback real, validación real.
- `buildGenerationConfig` envía siempre todas las `TOOL_DECLARATIONS` y restringe con
  `allowedFunctionNames` a partir de `selection.allowedTools`.

- [ ] **Step 1: Escribir el test**

Crea `lib/ai-practice/__tests__/annotate-turn.integration.test.ts`:

```ts
import { describe, it, expect, beforeAll } from "vitest";
import { GoogleGenAI } from "@google/genai";
import { streamWithFallback } from "@/lib/gemini/chat-route";
import { buildSystemPrompt } from "@/lib/ai-practice/wire";
import { intentToToolConfig } from "@/lib/ai-practice/intent-detection";
import { makeStreamState, processChunk } from "@/lib/ai-practice/stream-processor";
import { extractTurnCorrection } from "@/lib/ai-practice/correction";
import type { StreamChunk, ToolCall } from "@/lib/ai-practice/types";

// Turns a Spanish-speaking learner would realistically write.
const TURNS_NEEDING_CORRECTION = [
  "I go to the cinema yesterday with my friends",
  "Yesterday I have eaten pizza in a restaurant very good",
  "I am agree with you about this topic",
  "She don't like to study English in the morning",
  "I have 25 years old and I work in a company of technology",
];

const TURNS_NEEDING_NO_CORRECTION = [
  "I went to the cinema yesterday with my friends.",
  "I completely agree with you on that.",
  "She doesn't like studying English in the morning.",
];

type CoachTurn = { text: string; calls: Map<string, ToolCall> };

/** Runs one turn through the real production path and assembles the result. */
async function coachTurn(userText: string): Promise<CoachTurn> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const systemPrompt = buildSystemPrompt(null, { interests: ["technology", "films"] });
  const selection = intentToToolConfig({ type: "conversation" });

  const chunks: StreamChunk[] = [];
  const decoder = new TextDecoder();

  // streamWithFallback only ever calls enqueue/close on the controller.
  const controller = {
    enqueue(bytes: Uint8Array) {
      for (const line of decoder.decode(bytes).split("\n\n")) {
        const trimmed = line.replace(/^data: /, "").trim();
        if (trimmed) chunks.push(JSON.parse(trimmed) as StreamChunk);
      }
    },
    close() {},
  } as unknown as ReadableStreamDefaultController;

  await streamWithFallback(
    ai,
    systemPrompt,
    [],
    userText,
    selection,
    controller,
    new AbortController().signal,
  );

  const state = makeStreamState();
  for (const chunk of chunks) {
    processChunk(chunk, state, {
      onSaveWord: () => {},
      onActionToolResult: () => {},
      onError: () => {},
    });
  }

  const text = state.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");

  return { text, calls: state.calls };
}

describe("annotate_turn against the real model chain", () => {
  beforeAll(() => {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is required — run with the real env loaded");
    }
  });

  it.each(TURNS_NEEDING_CORRECTION)(
    "corrects: %s",
    async (userText) => {
      const { calls } = await coachTurn(userText);
      const correction = extractTurnCorrection(calls);

      expect(correction, "model produced no correction for a faulty turn").not.toBeNull();
      expect(correction?.original).toBeTruthy();
      expect(correction?.corrected).toBeTruthy();
      expect(correction?.corrected).not.toBe(correction?.original);
    },
    30_000,
  );

  it.each(TURNS_NEEDING_NO_CORRECTION)(
    "stays silent on correct English: %s",
    async (userText) => {
      const { calls } = await coachTurn(userText);
      expect(extractTurnCorrection(calls)).toBeNull();
    },
    30_000,
  );

  it("writes conversational prose alongside the tool call", async () => {
    const { text, calls } = await coachTurn(TURNS_NEEDING_CORRECTION[0]);
    expect(extractTurnCorrection(calls)).not.toBeNull();
    expect(text.trim().length).toBeGreaterThan(20);
  });
});
```

Nota sobre el controller falso: `streamWithFallback` solo llama a `enqueue` y `close`, por
eso el objeto no implementa el resto de `ReadableStreamDefaultController`. El `as unknown as`
es deliberado y está acotado a este test.

- [ ] **Step 2: Ejecutar el test**

```bash
pnpm test:integration lib/ai-practice/__tests__/annotate-turn.integration.test.ts
```

Esperado: los 5 turnos con error llaman a `annotate_turn` con `correction`; los 3
correctos no. Como el modelo no es determinista, **repite la ejecución 3 veces**.

- [ ] **Step 3: Decidir según el resultado**

- **8/8 estable en las 3 pasadas** → la fase está validada. Sigue al step 5.
- **Falla en algún turno con error** (no llama al tool): refuerza la instrucción en
  `FEEDBACK DISCIPLINE` — por ejemplo, empezando el bloque con
  `You MUST call annotate_turn whenever the student's message contains an error.` Repite
  el step 3. Este es el mismo remedio que ya funcionó para los exercise tools.
- **Inventa correcciones sobre inglés correcto** (falsos positivos): endurece la regla
  negativa — `If in doubt, DO NOT correct. A missed correction is better than a wrong one.`
- **Sigue fallando tras dos intentos de prompt** → sube este caso a `flash` en la cadena de
  fallback en lugar de seguir peleando con `flash-lite`. Documenta la decisión en el commit.

- [ ] **Step 4: Commit**

```bash
git add lib/ai-practice/__tests__/annotate-turn.integration.test.ts
git commit -m "test(ai-coach): integration coverage for annotate_turn on the real model chain"
```

---

## Verificación final de la fase

- [ ] **Step 1: Suite completa**

```bash
pnpm test
```

Esperado: todo verde. Presta atención a `lib/ai-practice/__tests__/conversation-title.test.ts`
— no debería verse afectado en esta fase (los prompts de starters no se han tocado), pero
si falla, es la señal de que algo tocó `AI_COACH_EMPTY_STATE_PROMPTS`, que pertenece a la
fase 3.

- [ ] **Step 2: Puertas del proyecto**

```bash
pnpm type-check && pnpm lint && pnpm audit:hard-rules
```

Esperado: los tres limpios.

- [ ] **Step 3: Comprobación manual en el navegador**

```bash
pnpm dev
```

Abre el AI Coach y verifica, en este orden:

1. Escribe `I go to the cinema yesterday` → aparece la `CorrectionCard` con la regla en
   español debajo, y el coach sigue la conversación con normalidad.
2. Escribe `I went to the cinema yesterday.` → **no** aparece tarjeta y el coach **no**
   dice "correct!" ni equivalente.
3. Escribe `explain the present perfect` con un error incluido, p. ej.
   `explain me the present perfect please` → sigue apareciendo corrección (esto valida la
   Task 3; antes era imposible).
4. No aparece ningún widget vacío ni caja rara en el mensaje (valida el skip de
   `annotate_turn` en `MessageBubble`).
5. Con intereses puestos en tu perfil, los ejemplos del coach tienden a esas áreas.
6. Corta la conexión (DevTools → Offline) y comprueba que el resto de la app sigue
   funcionando: la fase no toca Dexie ni el outbox, así que no debería haber regresión.

- [ ] **Step 4: Commit de cierre si hubo ajustes**

```bash
git add -A && git commit -m "chore(ai-coach): phase 1 verification fixes"
```

---

## Qué queda fuera de esta fase

Los `saveables` que `annotate_turn` ya devuelve **no se muestran ni se guardan todavía** —
se validan y se descartan. Los consume la fase 2 (`SaveChips` + `persistSaveable`). Es
deliberado: la fase 1 ya entrega valor completo por su cuenta (corrección siempre activa e
intereses), y así el test de integración de la Task 8 valida el transporte antes de que
nada dependa de él.

Tampoco se toca `AI_COACH_EMPTY_STATE_PROMPTS`, `conversation-title.ts` ni `db.aiWords`.
