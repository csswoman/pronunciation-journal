# AI Coach — Cierre de sesión con resumen (Fase 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el usuario pueda cerrar una conversación con el coach cuando quiera y llevarse un resumen de lo corregido, lo aprendido y lo que conviene repasar — con un botón que guarda todo eso en Guardadas de una vez.

**Architecture:** Un botón "Terminar" en la cabecera del panel, visible solo cuando hay conversación suficiente, envía un mensaje oculto pidiendo el cierre. El coach responde con un tool de render nuevo, `render_session_summary`, cuyos argumentos pinta `SessionSummaryCard`. El botón "Guardar todo" de esa tarjeta reutiliza `persistSaveable` de la fase 2, sin ninguna vía de escritura nueva.

**Tech Stack:** Next.js 16 App Router · TypeScript · Vitest

**Spec:** `docs/superpowers/specs/2026-09-05-ai-coach-adaptive-redesign-design.md`
**Depende de:** Fase 1 (`annotate_turn`, `declarations.ts`) y fase 2 (`persistSaveable`, `TurnSaveable`). No depende de la fase 3.

---

## Contexto para quien implementa

**Hoy no existe ningún "cerrar chat".** La conversación se abandona: el panel se cierra o
se pulsa "Nueva conversación" (`onNewChat` en `AICoachHeader`). Lo único que ocurre al
salir es `finalizeSession()` en `hooks/useStreamingChat.ts:271`, que persiste los
ejercicios completados y emite el evento `session_ended`. **Eso se conserva tal cual** —
el resumen es una capa encima, no un reemplazo.

**Dos familias de tools.** Los *exercise tools* renderizan un widget y esperan respuesta
del alumno; los *action tools* disparan un efecto. `render_session_summary` es un caso
intermedio: renderiza, pero no se responde. Se declara como **exercise tool** para que el
`stream-processor` lo deje en estado `rendered` (no `answered`), y `MessageBubble` lo
despacha aparte de `PracticeSession`, que es donde van los ejercicios reales.

> Ojo con esto: `MessageBubble` agrupa **todos** los exercise tools de un mensaje en un
> `<PracticeSession>`. Si `render_session_summary` entra ahí sin más, aparecerá dentro de
> un carrusel de ejercicios. La Task 4 lo excluye explícitamente.

**El presupuesto de líneas está justo.** `AICoachPanel.tsx` está en 249 líneas y
`AICoachPanelParts.tsx` en 246, ambos al borde del límite de 250. **Nada nuevo entra
ahí**: el botón sale a su propio archivo.

### Reglas del proyecto que aplican aquí

- Ningún prompt fuera de `lib/ai-prompts.ts` / `lib/ai-practice/prompts.ts`.
- Componentes ≤250 líneas; máximo 8 props.
- Solo tokens de diseño; `style={{}}` únicamente para valores de runtime.
- El modo offline debe seguir funcionando (el resumen requiere red — eso es esperado, pero
  no debe romper nada).

### Comandos

```bash
pnpm test <ruta>
pnpm type-check
pnpm lint
pnpm audit:hard-rules
```

---

## Estructura de archivos

| Archivo | Responsabilidad | Acción |
| - | - | - |
| `lib/ai-practice/tools/registry.ts` | Tipos y validación de `render_session_summary` | Modificar |
| `lib/ai-practice/tools/declarations.ts` | La declaración para Gemini | Modificar |
| `lib/ai-prompts.ts` | El prompt oculto que pide el cierre | Modificar |
| `components/ai-coach/session/CoachSessionEndButton.tsx` | El botón "Terminar" | **Crear** |
| `components/ai-coach/session/SessionSummaryCard.tsx` | La tarjeta de resumen | **Crear** |
| `components/ai-coach/MessageBubble.tsx` | Despachar el resumen fuera de `PracticeSession` | Modificar |
| `components/ai-coach/AICoachPanelParts.tsx` | Hueco para el botón en la cabecera | Modificar |
| `components/ai-coach/AICoachPanel.tsx` | Cablear el botón | Modificar |
| `hooks/useStreamingChat.ts` | Exponer el recuento de turnos del usuario | Modificar |

---

## Task 1: El tool `render_session_summary`

**Files:**
- Modify: `lib/ai-practice/tools/registry.ts`
- Modify: `lib/ai-practice/tools/declarations.ts`
- Test: `lib/ai-practice/__tests__/registry.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Añade a `lib/ai-practice/__tests__/registry.test.ts`:

```ts
describe("parseToolArgs: render_session_summary", () => {
  it("parses a full summary", () => {
    const args = parseToolArgs("render_session_summary", {
      corrections: [{ original: "I go", corrected: "I went", rule: "Pasado simple" }],
      learned: [{ type: "word", text: "creepy", meaning: "escalofriante" }],
      reviewNext: ["Pasado simple irregular"],
    }) as SessionSummaryArgs;

    expect(args.corrections).toHaveLength(1);
    expect(args.learned).toHaveLength(1);
    expect(args.reviewNext).toEqual(["Pasado simple irregular"]);
  });

  it("accepts a summary with nothing to report", () => {
    const args = parseToolArgs("render_session_summary", {}) as SessionSummaryArgs;
    expect(args).toEqual({ corrections: [], learned: [], reviewNext: [] });
  });

  it("drops corrections missing a side instead of throwing", () => {
    const args = parseToolArgs("render_session_summary", {
      corrections: [{ original: "I go" }, { original: "a", corrected: "b", rule: "c" }],
    }) as SessionSummaryArgs;
    expect(args.corrections).toHaveLength(1);
  });

  it("reuses the saveable shape for learned items and caps the list", () => {
    const learned = Array.from({ length: 12 }, (_, i) => ({
      type: "word", text: `w${i}`, meaning: `m${i}`,
    }));
    const args = parseToolArgs("render_session_summary", { learned }) as SessionSummaryArgs;
    expect(args.learned.length).toBeLessThanOrEqual(8);
  });

  it("is an exercise tool so the stream leaves it rendered, not answered", () => {
    expect(isExerciseTool("render_session_summary")).toBe(true);
  });
});
```

Añade `SessionSummaryArgs` a los imports del archivo de test.

- [ ] **Step 2: Ejecutar y ver fallar**

```bash
pnpm test lib/ai-practice/__tests__/registry.test.ts
```

Esperado: FAIL — el nombre no existe.

- [ ] **Step 3: Añadir tipos y nombre**

En `lib/ai-practice/tools/registry.ts`, junto a los otros tipos:

```ts
export type SummaryCorrection = {
  original: string;
  corrected: string;
  rule: string;
};

export type SessionSummaryArgs = {
  corrections: SummaryCorrection[];
  /** Reuses the saveable shape so "Guardar todo" can hand these to persistSaveable. */
  learned: TurnSaveable[];
  /** Short Spanish labels of what to revisit; display only in this phase. */
  reviewNext: string[];
};
```

Añade la variante a `ToolArgs`:

```ts
  | { name: "render_session_summary"; args: SessionSummaryArgs }
```

Y amplía las listas:

```ts
export type ExerciseToolName =
  | "render_multiple_choice"
  | "render_fill_blank"
  | "render_speaking"
  | "render_word_card"
  | "render_session_summary";

export const EXERCISE_TOOL_NAMES: ExerciseToolName[] = [
  "render_multiple_choice",
  "render_fill_blank",
  "render_speaking",
  "render_word_card",
  "render_session_summary",
];
```

- [ ] **Step 4: Añadir el parser**

Junto a los otros helpers privados:

```ts
/** Cap on summary items: a wall of twenty cards is not a summary. */
const MAX_SUMMARY_ITEMS = 8;

function parseSummaryCorrections(val: unknown): SummaryCorrection[] {
  if (!Array.isArray(val)) return [];
  const out: SummaryCorrection[] = [];
  for (const item of val) {
    if (out.length >= MAX_SUMMARY_ITEMS) break;
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (typeof o.original !== "string" || !o.original) continue;
    if (typeof o.corrected !== "string" || !o.corrected) continue;
    out.push({
      original: o.original,
      corrected: o.corrected,
      rule: typeof o.rule === "string" ? o.rule : "",
    });
  }
  return out;
}

function parseSummaryStrings(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val.filter((v): v is string => typeof v === "string" && v.length > 0).slice(0, MAX_SUMMARY_ITEMS);
}
```

Y el `case`, reutilizando `parseTurnSaveables` de la fase 1 pero con el tope del resumen:

```ts
    case "render_session_summary":
      return {
        corrections: parseSummaryCorrections(obj.corrections),
        learned: parseSummarySaveables(obj.learned),
        reviewNext: parseSummaryStrings(obj.reviewNext),
      } satisfies SessionSummaryArgs;
```

`parseTurnSaveables` de la fase 1 corta en 2 (`MAX_SAVEABLES_PER_TURN`), que aquí es
demasiado poco. Extrae el tope a un parámetro:

```ts
function parseSaveableList(val: unknown, max: number): TurnSaveable[] {
  if (!Array.isArray(val)) return [];
  const out: TurnSaveable[] = [];
  for (const item of val) {
    if (out.length >= max) break;
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
  return out;
}

function parseTurnSaveables(val: unknown): TurnSaveable[] | undefined {
  const out = parseSaveableList(val, MAX_SAVEABLES_PER_TURN);
  return out.length ? out : undefined;
}

function parseSummarySaveables(val: unknown): TurnSaveable[] {
  return parseSaveableList(val, MAX_SUMMARY_ITEMS);
}
```

Fíjate en la diferencia de contrato: `annotate_turn` devuelve `undefined` cuando no hay
nada (el campo es opcional); el resumen devuelve `[]` (los campos son obligatorios y la
tarjeta itera sobre ellos). Los tests de la fase 1 siguen pasando con este cambio.

- [ ] **Step 5: Añadir la declaración**

En `lib/ai-practice/tools/declarations.ts`:

```ts
  {
    name: "render_session_summary",
    description:
      "Close the session with a summary card. Call this ONLY when the student asks to finish. Fill it from what actually happened in this conversation — never invent corrections or words that did not come up. Empty arrays are fine if there is nothing to report.",
    parameters: {
      type: "object",
      properties: {
        corrections: {
          type: "array",
          maxItems: 8,
          items: {
            type: "object",
            properties: {
              original:  { type: "string", description: "What the student wrote, verbatim." },
              corrected: { type: "string" },
              rule:      { type: "string", description: "One short sentence in SPANISH." },
            },
            required: ["original", "corrected", "rule"],
          },
        },
        learned: {
          type: "array",
          maxItems: 8,
          items: {
            type: "object",
            properties: {
              type:    { type: "string", enum: ["word", "phrase"] },
              text:    { type: "string" },
              meaning: { type: "string", description: "In SPANISH." },
              example: { type: "string" },
              ipa:     { type: "string" },
            },
            required: ["type", "text", "meaning"],
          },
        },
        reviewNext: {
          type: "array",
          maxItems: 8,
          items: { type: "string", description: "A short SPANISH label of what to revisit." },
        },
      },
    },
  },
```

- [ ] **Step 6: Ejecutar y ver pasar**

```bash
pnpm test lib/ai-practice/__tests__/registry.test.ts && pnpm type-check
```

Esperado: PASS, incluidos los tests de `annotate_turn` de la fase 1.

- [ ] **Step 7: Commit**

```bash
git add lib/ai-practice/tools/
git commit -m "feat(ai-coach): add render_session_summary tool"
```

---

## Task 2: El prompt de cierre

**Files:**
- Modify: `lib/ai-prompts.ts`
- Test: `lib/__tests__/ai-prompts-session-close.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Crea `lib/__tests__/ai-prompts-session-close.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildSessionSummaryPrompt } from "@/lib/ai-prompts";

describe("buildSessionSummaryPrompt", () => {
  it("asks for the summary tool by name", () => {
    expect(buildSessionSummaryPrompt()).toContain("render_session_summary");
  });

  it("forbids inventing content that did not come up", () => {
    expect(buildSessionSummaryPrompt()).toMatch(/do not invent|only.*actually/i);
  });

  it("forbids continuing the conversation afterwards", () => {
    expect(buildSessionSummaryPrompt()).toMatch(/do not ask another question/i);
  });
});
```

- [ ] **Step 2: Ejecutar y ver fallar**

```bash
pnpm test lib/__tests__/ai-prompts-session-close.test.ts
```

Esperado: FAIL.

- [ ] **Step 3: Implementar**

Añade a `lib/ai-prompts.ts`:

```ts
export function buildSessionSummaryPrompt(): string {
  return `The student is ending this session. Close it now.
Call render_session_summary with what ACTUALLY happened in this conversation:
- corrections: the mistakes you flagged, with the rule in Spanish.
- learned: words or expressions you taught or that they asked about.
- reviewNext: at most three short Spanish labels of what they should revisit.
Do not invent corrections, words or topics that did not come up — empty arrays
are the right answer for a short conversation.
Write ONE warm closing sentence before the tool call, and nothing after it.
Do not ask another question. Do not offer more practice.`;
}
```

- [ ] **Step 4: Ejecutar y verificar la regla dura**

```bash
pnpm test lib/__tests__/ai-prompts-session-close.test.ts && pnpm audit:ai-prompts
```

Esperado: PASS y exit 0.

- [ ] **Step 5: Commit**

```bash
git add lib/ai-prompts.ts lib/__tests__/ai-prompts-session-close.test.ts
git commit -m "feat(ai-coach): add the session-close prompt"
```

---

## Task 3: `SessionSummaryCard`

**Files:**
- Create: `components/ai-coach/session/SessionSummaryCard.tsx`
- Test: `components/ai-coach/session/__tests__/SessionSummaryCard.test.tsx`

- [ ] **Step 1: Escribir los tests que fallan**

Crea `components/ai-coach/session/__tests__/SessionSummaryCard.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SessionSummaryCard from "../SessionSummaryCard";
import type { SessionSummaryArgs } from "@/lib/ai-practice/tools/registry";

const FULL: SessionSummaryArgs = {
  corrections: [{ original: "I go", corrected: "I went", rule: "Pasado simple" }],
  learned: [{ type: "word", text: "creepy", meaning: "escalofriante" }],
  reviewNext: ["Pasado simple irregular"],
};

const EMPTY: SessionSummaryArgs = { corrections: [], learned: [], reviewNext: [] };

describe("SessionSummaryCard", () => {
  it("shows the three sections when there is content for each", () => {
    render(<SessionSummaryCard summary={FULL} onSaveAll={vi.fn()} />);
    expect(screen.getByText(/Corregimos/)).toBeInTheDocument();
    expect(screen.getByText(/Aprendiste/)).toBeInTheDocument();
    expect(screen.getByText(/Repasar/)).toBeInTheDocument();
  });

  it("shows both sides of each correction", () => {
    render(<SessionSummaryCard summary={FULL} onSaveAll={vi.fn()} />);
    expect(screen.getByText("I go")).toBeInTheDocument();
    expect(screen.getByText("I went")).toBeInTheDocument();
  });

  it("hides a section that has no content", () => {
    render(
      <SessionSummaryCard summary={{ ...FULL, learned: [] }} onSaveAll={vi.fn()} />,
    );
    expect(screen.queryByText(/Aprendiste/)).not.toBeInTheDocument();
  });

  it("tells the user plainly when there was nothing to report", () => {
    render(<SessionSummaryCard summary={EMPTY} onSaveAll={vi.fn()} />);
    expect(screen.getByText(/sin correcciones/i)).toBeInTheDocument();
  });

  it("hides the save button when there is nothing to save", () => {
    render(<SessionSummaryCard summary={EMPTY} onSaveAll={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /Guardar todo/ })).not.toBeInTheDocument();
  });

  it("hands every learned item to onSaveAll", async () => {
    const onSaveAll = vi.fn().mockResolvedValue(undefined);
    render(<SessionSummaryCard summary={FULL} onSaveAll={onSaveAll} />);
    await userEvent.click(screen.getByRole("button", { name: /Guardar todo/ }));
    expect(onSaveAll).toHaveBeenCalledWith(FULL.learned);
  });

  it("confirms and disables after saving", async () => {
    render(<SessionSummaryCard summary={FULL} onSaveAll={vi.fn().mockResolvedValue(undefined)} />);
    await userEvent.click(screen.getByRole("button", { name: /Guardar todo/ }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Guardado/ })).toBeDisabled();
    });
  });

  it("offers a retry when saving fails", async () => {
    render(<SessionSummaryCard summary={FULL} onSaveAll={vi.fn().mockRejectedValue(new Error("x"))} />);
    await userEvent.click(screen.getByRole("button", { name: /Guardar todo/ }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /reintentar/i })).toBeEnabled();
    });
  });
});
```

- [ ] **Step 2: Ejecutar y ver fallar**

```bash
pnpm test components/ai-coach/session/__tests__/SessionSummaryCard.test.tsx
```

Esperado: FAIL — no existe el componente.

- [ ] **Step 3: Implementar**

Crea `components/ai-coach/session/SessionSummaryCard.tsx`:

```tsx
"use client";

import { useState } from "react";
import { ArrowRight, Check, Sparkles } from "@/components/icons";
import Button from "@/components/ui/Button";
import type { SessionSummaryArgs, TurnSaveable } from "@/lib/ai-practice/tools/registry";

// Planned structure:
// <SessionSummaryCard>
//   <SummarySection> × 3 — Corregimos / Aprendiste / Repasar
//   <SaveAllButton />
// </SessionSummaryCard>

type SaveState = "idle" | "saving" | "saved" | "error";

interface SessionSummaryCardProps {
  summary: SessionSummaryArgs;
  onSaveAll: (learned: TurnSaveable[]) => Promise<void>;
}

export default function SessionSummaryCard({ summary, onSaveAll }: SessionSummaryCardProps) {
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const isEmpty =
    summary.corrections.length === 0 &&
    summary.learned.length === 0 &&
    summary.reviewNext.length === 0;

  const handleSave = async () => {
    setSaveState("saving");
    try {
      await onSaveAll(summary.learned);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  };

  return (
    <div className="layout-stack w-full rounded-xl border border-border-subtle bg-surface-raised p-4">
      <p className="m-0 flex items-center gap-1.5 font-kicker font-semibold text-primary">
        <Sparkles size={14} strokeWidth={2.25} aria-hidden />
        Resumen de la sesión
      </p>

      {isEmpty && (
        <p className="m-0 text-body-sm text-fg-muted">
          Sesión corta, sin correcciones ni palabras nuevas. ¡Nos vemos en la próxima!
        </p>
      )}

      {summary.corrections.length > 0 && (
        <section className="layout-stack-tight">
          <h3 className="m-0 text-caption font-semibold text-fg">
            Corregimos ({summary.corrections.length})
          </h3>
          <ul className="m-0 list-none space-y-1.5 p-0">
            {summary.corrections.map((c) => (
              <li key={`${c.original}-${c.corrected}`} className="layout-stack-tight">
                <span className="flex flex-wrap items-center gap-1.5 text-body-sm">
                  <s className="text-fg-subtle">{c.original}</s>
                  <ArrowRight size={13} strokeWidth={2} className="shrink-0 text-fg-subtle" aria-hidden />
                  <b className="font-semibold text-fg">{c.corrected}</b>
                </span>
                {c.rule && <span className="block text-caption text-fg-subtle">{c.rule}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {summary.learned.length > 0 && (
        <section className="layout-stack-tight">
          <h3 className="m-0 text-caption font-semibold text-fg">
            Aprendiste ({summary.learned.length})
          </h3>
          <ul className="m-0 list-none space-y-1 p-0">
            {summary.learned.map((item) => (
              <li key={item.text} className="text-body-sm text-fg">
                <b className="font-semibold">{item.text}</b>
                <span className="text-fg-subtle"> — {item.meaning}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {summary.reviewNext.length > 0 && (
        <section className="layout-stack-tight">
          <h3 className="m-0 text-caption font-semibold text-fg">Repasar</h3>
          <ul className="m-0 list-none space-y-1 p-0">
            {summary.reviewNext.map((label) => (
              <li key={label} className="text-body-sm text-fg-muted">{label}</li>
            ))}
          </ul>
        </section>
      )}

      {summary.learned.length > 0 && (
        <Button
          variant={saveState === "saved" ? "secondary" : "primary"}
          size="sm"
          disabled={saveState === "saving" || saveState === "saved"}
          loading={saveState === "saving"}
          onClick={() => void handleSave()}
        >
          {saveState === "saved" ? (
            <>
              <Check size={14} strokeWidth={2.25} aria-hidden />
              Guardado en Guardadas
            </>
          ) : saveState === "error" ? (
            "No se pudo guardar · reintentar"
          ) : (
            "Guardar todo en Guardadas"
          )}
        </Button>
      )}
    </div>
  );
}
```

Antes de commitear, comprueba en `components/ui/Button.tsx` qué `variant`, `size` y props
(`loading`) acepta realmente, y ajusta si no coinciden.

- [ ] **Step 4: Ejecutar y ver pasar**

```bash
pnpm test components/ai-coach/session/__tests__/SessionSummaryCard.test.tsx && wc -l components/ai-coach/session/SessionSummaryCard.tsx
```

Esperado: PASS los 8, y el archivo por debajo de 250 líneas. Si se pasa, extrae
`SummarySection` a su propio componente dentro de la misma carpeta.

- [ ] **Step 5: Commit**

```bash
git add components/ai-coach/session/
git commit -m "feat(ai-coach): add SessionSummaryCard"
```

---

## Task 4: Despachar el resumen en la burbuja

Sin esto, `render_session_summary` acabaría dentro del carrusel `<PracticeSession>`, junto
a los ejercicios.

**Files:**
- Modify: `components/ai-coach/MessageBubble.tsx`

- [ ] **Step 1: Excluirlo del agrupado de ejercicios**

En `components/ai-coach/MessageBubble.tsx`, el bloque que calcula `exerciseCalls` filtra
hoy por `isExerciseTool(tc.name as never)`. Añade la exclusión:

```ts
              const exerciseCalls = message.contentParts
                .filter((p) => p.type === "tool_call")
                .map((p) => message.toolCalls.get(p.callId))
                .filter(
                  (tc): tc is NonNullable<typeof tc> =>
                    tc != null &&
                    isExerciseTool(tc.name as never) &&
                    // The summary renders, but it is not an exercise: it must not
                    // land inside the PracticeSession carousel.
                    tc.name !== "render_session_summary" &&
                    tc.status !== "error",
                );
```

- [ ] **Step 2: Renderizarlo aparte**

En el mismo bloque, junto a `exerciseCalls`, calcula:

```ts
              const summaryCall = message.contentParts
                .filter((p) => p.type === "tool_call")
                .map((p) => message.toolCalls.get(p.callId))
                .find((tc) => tc?.name === "render_session_summary" && tc.status !== "error");
```

Y en el JSX, justo antes del bloque `{exerciseCalls.length > 0 && (`:

```tsx
                  {summaryCall && (
                    <SessionSummaryCard
                      summary={summaryCall.args as SessionSummaryArgs}
                      onSaveAll={onSaveAllFromSummary}
                    />
                  )}
```

Y en el `map` sobre `contentParts`, añade el nombre a la lista de tools que no se
renderizan como `ToolWidget` (donde ya están `suggestions` y `annotate_turn`):

```ts
                    if (
                      !tc ||
                      tc.name === "suggestions" ||
                      tc.name === "annotate_turn" ||
                      tc.name === "render_session_summary"
                    ) return null;
```

- [ ] **Step 3: Añadir la prop y propagarla**

Añade a `AIBubbleProps` y al wrapper exportado:

```ts
  onSaveAllFromSummary: (learned: TurnSaveable[]) => Promise<void>;
```

Y propágala desde `AICoachPanel` por la misma cadena que `onSaveSaveable` de la fase 2:
`AICoachPanel` → `ChatView` → `MessageBubble`, y `AICoachPanel` → `MissionWorkspace` →
`MessageBubble`.

En `AICoachPanel`, defínela apoyándote en lo que ya existe:

```tsx
  const saveAllFromSummary = useCallback(
    async (learned: TurnSaveable[]) => {
      // persistSaveable is idempotent enough for this: a word already in the
      // bank is simply favourited again (see phase 2, DuplicateWordError).
      for (const item of learned) {
        await saveSaveable(item);
      }
    },
    [saveSaveable],
  );
```

Se guarda en serie a propósito: `quickAddWord` va contra `/api/words` y dispara
enriquecimiento; ocho peticiones en paralelo desde el navegador no aportan nada y castigan
al rate limiter.

- [ ] **Step 4: Verificar**

```bash
pnpm test components/ai-coach && pnpm type-check && wc -l components/ai-coach/MessageBubble.tsx
```

Esperado: PASS. Si `MessageBubble.tsx` supera las 300 líneas (venía de 309 antes de la fase
1), **extrae `AIBubble` a `components/ai-coach/chat/AIBubble.tsx`** antes de seguir. A
estas alturas ya lleva tres capas nuevas encima y probablemente toque.

- [ ] **Step 5: Commit**

```bash
git add components/ai-coach/
git commit -m "feat(ai-coach): render the session summary outside the exercise carousel"
```

---

## Task 5: El botón "Terminar"

**Files:**
- Create: `components/ai-coach/session/CoachSessionEndButton.tsx`
- Modify: `hooks/useStreamingChat.ts`
- Modify: `components/ai-coach/AICoachPanelParts.tsx`
- Modify: `components/ai-coach/AICoachPanel.tsx`
- Test: `components/ai-coach/session/__tests__/CoachSessionEndButton.test.tsx`

- [ ] **Step 1: Escribir los tests que fallan**

Crea `components/ai-coach/session/__tests__/CoachSessionEndButton.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CoachSessionEndButton from "../CoachSessionEndButton";

describe("CoachSessionEndButton", () => {
  it("stays hidden until the conversation is worth summarising", () => {
    const { container } = render(
      <CoachSessionEndButton userTurns={2} isStreaming={false} onEnd={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("appears at three user turns", () => {
    render(<CoachSessionEndButton userTurns={3} isStreaming={false} onEnd={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Terminar/ })).toBeInTheDocument();
  });

  it("asks to end the session when tapped", async () => {
    const onEnd = vi.fn();
    render(<CoachSessionEndButton userTurns={5} isStreaming={false} onEnd={onEnd} />);
    await userEvent.click(screen.getByRole("button", { name: /Terminar/ }));
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it("is disabled while the coach is still answering", () => {
    render(<CoachSessionEndButton userTurns={5} isStreaming onEnd={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Terminar/ })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Ejecutar y ver fallar**

```bash
pnpm test components/ai-coach/session/__tests__/CoachSessionEndButton.test.tsx
```

Esperado: FAIL.

- [ ] **Step 3: Implementar**

Crea `components/ai-coach/session/CoachSessionEndButton.tsx`:

```tsx
"use client";

import { Flag } from "@/components/icons";
import { cn } from "@/lib/cn";

/** Below this, there is nothing worth summarising. */
const MIN_USER_TURNS = 3;

interface CoachSessionEndButtonProps {
  userTurns: number;
  isStreaming: boolean;
  onEnd: () => void;
}

export default function CoachSessionEndButton({
  userTurns,
  isStreaming,
  onEnd,
}: CoachSessionEndButtonProps) {
  if (userTurns < MIN_USER_TURNS) return null;

  return (
    <button
      type="button"
      disabled={isStreaming}
      onClick={onEnd}
      title="Terminar y ver el resumen"
      className={cn(
        "flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border-subtle",
        "bg-surface-base px-2.5 text-caption font-medium text-fg-muted",
        "transition-colors duration-150 focus-ring",
        "hover:border-primary hover:bg-primary-soft hover:text-primary",
        "disabled:cursor-default disabled:opacity-50",
      )}
    >
      <Flag size={13} strokeWidth={2} aria-hidden />
      Terminar
    </button>
  );
}
```

Comprueba que `Flag` está exportado en `components/icons/index.ts`; si no, añádelo.

- [ ] **Step 4: Exponer el recuento de turnos**

En `hooks/useStreamingChat.ts`, junto a lo que ya devuelve el hook (línea 342 en adelante),
añade un valor derivado:

```ts
  const userTurnCount = useMemo(
    () => messages.filter((m) => m.role === "user").length,
    [messages],
  );
```

y expónlo en el objeto de retorno. Propágalo por `hooks/useAIPractice.ts` igual que se
propaga `isStreaming`.

> Los mensajes ocultos (los prompts de starter) también son `role: "user"`. Eso significa
> que el botón aparece un turno antes de lo estricto cuando la sesión arrancó desde un
> starter. Es aceptable — y si prefieres el recuento exacto, filtra por un flag `hidden` si
> el tipo `AIMessage` lo lleva; compruébalo en `lib/ai-practice/types.ts` antes de decidir.

- [ ] **Step 5: Hacer hueco en la cabecera**

`AICoachPanelParts.tsx` está en 246 líneas: **no metas el botón dentro**. Añade solo una
prop de slot a `AICoachHeader`:

```tsx
export function AICoachHeader({
  pageLabel,
  showHistory,
  onNewChat,
  onToggleHistory,
  onClose,
  endSessionSlot,
}: {
  pageLabel?: string;
  showHistory: boolean;
  onNewChat: () => void;
  onToggleHistory: () => void;
  onClose: () => void;
  endSessionSlot?: React.ReactNode;
}) {
```

y renderízala como primer hijo del `div` de acciones:

```tsx
      <div className="flex items-center gap-1 shrink-0">
        {endSessionSlot}
        <PanelIconButton onClick={onNewChat} title="Nueva conversación">
```

- [ ] **Step 6: Cablear el panel**

En `components/ai-coach/AICoachPanel.tsx`, donde se renderiza `<AICoachHeader ... />`:

```tsx
        endSessionSlot={
          <CoachSessionEndButton
            userTurns={userTurnCount}
            isStreaming={isStreaming}
            onEnd={() => sendMessage(buildSessionSummaryPrompt(), { hidden: true })}
          />
        }
```

con los imports de `CoachSessionEndButton` y `buildSessionSummaryPrompt`.

- [ ] **Step 7: Verificar**

```bash
pnpm test components/ai-coach && pnpm type-check && pnpm lint
wc -l components/ai-coach/AICoachPanel.tsx components/ai-coach/AICoachPanelParts.tsx
```

Esperado: PASS y **ambos archivos por debajo de 250 líneas**. Si `AICoachPanel.tsx` se pasa
(estaba en 249), extrae el bloque `renderHome`/`renderMission` a
`components/ai-coach/AICoachPanelViews.tsx`.

- [ ] **Step 8: Commit**

```bash
git add components/ai-coach/ hooks/
git commit -m "feat(ai-coach): add a manual Terminar button that closes the session with a summary"
```

---

## Verificación final de la fase

- [ ] **Step 1: Suite completa y puertas**

```bash
pnpm test && pnpm type-check && pnpm lint && pnpm audit:hard-rules
```

Esperado: todo verde.

- [ ] **Step 2: Comprobación manual**

```bash
pnpm dev
```

1. Abre un chat nuevo → **no** hay botón "Terminar".
2. Escribe tres mensajes (algunos con errores, para que haya correcciones) → aparece
   "Terminar" en la cabecera.
3. Mientras el coach está respondiendo → el botón está deshabilitado.
4. Pulsa "Terminar" → una frase de despedida y la tarjeta de resumen, **fuera** del
   carrusel de ejercicios, con las correcciones que de verdad ocurrieron.
5. Pulsa "Guardar todo" → pasa a "Guardado en Guardadas"; comprueba en `/tracking` que los
   items están ahí con el badge `✦ coach`.
6. Termina una conversación de tres mensajes sin errores → la tarjeta dice que no hubo
   correcciones y **no** muestra el botón de guardar.
7. Comprueba que "Nueva conversación" sigue funcionando y que `finalizeSession` sigue
   registrando el progreso de los ejercicios (mira `/progress`).

- [ ] **Step 3: Comprobar que el modelo no inventa**

Este es el riesgo real de esta fase. Ten una conversación de 4-5 turnos, apunta lo que el
coach corrigió de verdad, y compara con el resumen. Si inventa correcciones que no
ocurrieron, endurece el prompt: añade
`If you are not certain a correction happened in THIS conversation, leave it out.` y repite.

- [ ] **Step 4: Commit de cierre si hubo ajustes**

```bash
git add -A && git commit -m "chore(ai-coach): phase 4 verification fixes"
```

---

## Qué queda fuera de esta fase

- **`reviewNext` solo se muestra, no se persiste.** Convertirlo en planes con `dueAt` que
  alimenten el starter `review` está fuera de alcance en todo el spec: arrastra
  scheduling, notificaciones y una vista de agenda.
- El cierre automático al salir del panel: se descartó a favor del botón manual para no
  gastar cuota Gemini sin que el usuario lo pida.
- El resumen requiere conexión. Sin red, el botón fallará como cualquier otro mensaje y
  mostrará el error habitual del chat; no se añade manejo especial.
