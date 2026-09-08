# AI Coach — Guardado unificado en Guardadas (Fase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que lo que el usuario guarda desde el chat del AI Coach — palabras y expresiones — aterrice en Guardadas (`/tracking`), herede el SRS existente y sincronice con Supabase, en lugar de morir en un silo local invisible.

**Architecture:** Una función `persistSaveable` enruta por tipo: las palabras van a `word_bank` por el camino normal (`quickAddWord` + `toggleFavorite`) y las expresiones a `tracked_items` con `kind: "phrase"`, ambas marcadas con `source: "ai_coach"`. Los `saveables` que `annotate_turn` ya devuelve desde la fase 1 se pintan como chips bajo la prosa. `/tracking` gana un filtro por origen. La tabla `db.aiWords` desaparece.

**Tech Stack:** Next.js 16 App Router · TypeScript · Vitest · Dexie · Supabase

**Spec:** `docs/superpowers/specs/2026-09-05-ai-coach-adaptive-redesign-design.md`
**Depende de:** Fase 1 (`docs/superpowers/plans/2026-09-05-ai-coach-implicit-correction.md`) — el tipo `TurnSaveable` y el tool `annotate_turn` deben existir.

---

## Contexto para quien implementa

**Qué es "Guardadas".** La ruta `/tracking` muestra tres cosas mezcladas, unificadas por
`hooks/useTracking.ts` en una lista de `TrackingReviewSource`:

- **Palabras**: filas de la tabla Supabase `word_bank` **marcadas como favoritas**
  (`is_favorite === true`). Ojo: sin ese flag la palabra existe pero no aparece en
  Guardadas.
- **Frases y lecciones**: filas de `tracked_items` (Dexie `db.trackedItems` + Supabase
  `tracked_items`, sincronizadas por el outbox de `lib/sync/`).

**El silo que hay que matar.** `hooks/useSavedWords.ts` guarda en `db.aiWords` vía
`lib/db/ai.ts`. Esa tabla es **solo Dexie**: no sincroniza, no entra en el SRS y no se ve
en `/tracking`. Hoy la alimentan dos caminos: seleccionar texto en un mensaje del coach, y
el tool `save_word` que el modelo puede llamar.

**Qué se conserva.** El modal (`SaveWordModal`) sigue vivo para la selección manual de
texto, porque ahí el usuario quiere escribir el significado a mano. Lo que cambia es
adónde escribe.

**Decisión ya tomada:** las palabras existentes en `db.aiWords` **se descartan sin
migrar**. No escribas una migración.

### Reglas del proyecto que aplican aquí

- Todo acceso a Supabase va en `lib/*/queries.ts`. Nada de `fetch` desde la UI.
- Estado persistente → Dexie o Supabase. Zustand solo para UI efímera.
- **Nunca dupliques estado entre Dexie y Zustand** (hay un audit: `pnpm audit:state-duplication`).
- El modo offline debe seguir funcionando: el outbox absorbe las escrituras sin conexión.
- Componentes ≤250 líneas. Nada de `style={{}}` salvo runtime. Solo tokens de diseño.

### Comandos

```bash
pnpm test <ruta>             # Vitest, un archivo
pnpm type-check              # tsc --noEmit
pnpm lint                    # ESLint
pnpm audit:hard-rules        # prompts + RLS + tokens + duplicación de estado
```

---

## Estructura de archivos

| Archivo | Responsabilidad | Acción |
| - | - | - |
| `lib/ai-coach/saveables/persist.ts` | Enrutar un `TurnSaveable` a su destino real | **Crear** |
| `lib/ai-coach/saveables/source.ts` | La constante `AI_COACH_SOURCE` y el predicado de origen | **Crear** |
| `components/ai-coach/SaveChips.tsx` | Los chips bajo la prosa, con estado optimista | **Crear** |
| `app/api/words/route.ts:15` | Aceptar `source: "ai_coach"` | Modificar |
| `lib/word-bank/queries.ts:31` | Ampliar el tipo de `source` en `quickAddWord` | Modificar |
| `components/ai-coach/MessageBubble.tsx` | Renderizar `SaveChips` | Modificar |
| `hooks/useSavedWords.ts` | Reducirlo a estado de modal + `persistSaveable` | Modificar |
| `components/tracking/TrackingToolbar.tsx` | Quinto filtro "Del coach" | Modificar |
| `components/tracking/TrackingClient.tsx` | Filtrar por origen además de por tipo | Modificar |
| `components/tracking/TrackingCard.tsx` | Badge `✦ coach` | Modificar |
| `lib/tracking/types.ts` | `TrackingFilter` y `source` en `TrackingItem` | Modificar |
| `hooks/useTracking.ts` | Propagar el origen a `TrackingItem` | Modificar |
| `lib/db/ai.ts` | Borrar los helpers de `aiWords` | Modificar |
| `lib/db/index.ts` | Borrar la tabla `aiWords` (nueva versión Dexie) | Modificar |
| `lib/types.ts` | Borrar `AISavedWord` | Modificar |

---

## Task 1: La constante de origen

Un solo sitio define qué significa "esto vino del coach". Sin esto, la cadena
`"ai_coach"` acabaría repetida en seis archivos.

**Files:**
- Create: `lib/ai-coach/saveables/source.ts`
- Test: `lib/ai-coach/saveables/__tests__/source.test.ts`

- [x] **Step 1: Escribir el test que falla**

Crea `lib/ai-coach/saveables/__tests__/source.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { AI_COACH_SOURCE, isFromCoach } from "../source";

describe("isFromCoach", () => {
  it("recognises a word_bank row saved by the coach", () => {
    expect(isFromCoach({ source: AI_COACH_SOURCE })).toBe(true);
  });

  it("recognises a tracked_items row saved by the coach", () => {
    expect(isFromCoach({ payload: { source: AI_COACH_SOURCE } })).toBe(true);
  });

  it("rejects a manually saved word", () => {
    expect(isFromCoach({ source: "manual" })).toBe(false);
  });

  it("rejects a row with no origin at all", () => {
    expect(isFromCoach({})).toBe(false);
  });

  it("rejects null and undefined", () => {
    expect(isFromCoach(null)).toBe(false);
    expect(isFromCoach(undefined)).toBe(false);
  });
});
```

- [x] **Step 2: Ejecutar y ver fallar**

```bash
pnpm test lib/ai-coach/saveables/__tests__/source.test.ts
```

Esperado: FAIL con "Failed to resolve import ../source".

- [x] **Step 3: Implementar**

Crea `lib/ai-coach/saveables/source.ts`:

```ts
/**
 * Marks a saved item as having come from the AI Coach.
 *
 * Two shapes carry it: `word_bank.source` (a flat column) and
 * `tracked_items.payload.source` (inside the JSON payload). `isFromCoach`
 * accepts either so the Guardadas filter can treat both alike.
 */
export const AI_COACH_SOURCE = "ai_coach";

export function isFromCoach(row: unknown): boolean {
  if (!row || typeof row !== "object") return false;
  const o = row as { source?: unknown; payload?: { source?: unknown } };
  if (o.source === AI_COACH_SOURCE) return true;
  return o.payload?.source === AI_COACH_SOURCE;
}
```

- [x] **Step 4: Ejecutar y ver pasar**

```bash
pnpm test lib/ai-coach/saveables/__tests__/source.test.ts
```

Esperado: PASS.

- [x] **Step 5: Commit**

```bash
git add lib/ai-coach/saveables/source.ts lib/ai-coach/saveables/__tests__/source.test.ts
git commit -m "feat(ai-coach): add AI_COACH_SOURCE marker for saved items"
```

---

## Task 2: Aceptar `ai_coach` como origen de palabra

La columna `word_bank.source` es **texto libre, sin CHECK constraint** (ver
`supabase/migrations/20260523120000_word_bank_source.sql`). **No hace falta migración.**
Solo hay que abrir la validación de Zod en la ruta y el tipo en el cliente.

**Files:**
- Modify: `app/api/words/route.ts:15`
- Modify: `lib/word-bank/queries.ts:31-37`

- [x] **Step 1: Ampliar el enum de la ruta**

En `app/api/words/route.ts` línea 15, sustituye:

```ts
    source: z.enum(["manual", "reader", "journal"]).default("manual"),
```

por:

```ts
    source: z.enum(["manual", "reader", "journal", "ai_coach"]).default("manual"),
```

- [x] **Step 2: Ampliar el tipo del cliente**

En `lib/word-bank/queries.ts`, dentro de la firma de `quickAddWord`, sustituye:

```ts
  source?: "manual" | "reader" | "journal";
```

por:

```ts
  source?: "manual" | "reader" | "journal" | "ai_coach";
```

- [x] **Step 3: Verificar**

```bash
pnpm type-check && pnpm test app/api lib/word-bank
```

Esperado: `tsc` limpio y los suites existentes en verde.

- [x] **Step 4: Commit**

```bash
git add app/api/words/route.ts lib/word-bank/queries.ts
git commit -m "feat(words): accept ai_coach as a word_bank source"
```

---

## Task 3: `persistSaveable` — el puente a Guardadas

**Files:**
- Create: `lib/ai-coach/saveables/persist.ts`
- Test: `lib/ai-coach/saveables/__tests__/persist.test.ts`

- [x] **Step 1: Escribir los tests que fallan**

Crea `lib/ai-coach/saveables/__tests__/persist.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TurnSaveable } from "@/lib/ai-practice/tools/registry";

const quickAddWord = vi.fn();
const toggleFavorite = vi.fn();
const saveTrackedItem = vi.fn();

vi.mock("@/lib/word-bank/queries", () => ({
  quickAddWord: (...args: unknown[]) => quickAddWord(...args),
  toggleFavorite: (...args: unknown[]) => toggleFavorite(...args),
  DuplicateWordError: class DuplicateWordError extends Error {
    constructor(readonly wordId: string, readonly text: string) {
      super(text);
      this.name = "DuplicateWordError";
    }
  },
}));

vi.mock("@/lib/tracking/queries", () => ({
  saveTrackedItem: (...args: unknown[]) => saveTrackedItem(...args),
}));

const { persistSaveable } = await import("../persist");
const { DuplicateWordError } = await import("@/lib/word-bank/queries");

const WORD: TurnSaveable = {
  type: "word",
  text: "creepy",
  meaning: "escalofriante",
  example: "That old house looks creepy.",
};

const PHRASE: TurnSaveable = {
  type: "phrase",
  text: "that sounds creepy",
  meaning: "eso suena escalofriante",
};

beforeEach(() => {
  quickAddWord.mockReset();
  toggleFavorite.mockReset();
  saveTrackedItem.mockReset();
});

describe("persistSaveable: words", () => {
  it("adds the word to the word bank tagged as coach-sourced", async () => {
    quickAddWord.mockResolvedValue({ id: "w1" });
    await persistSaveable("u1", WORD);

    expect(quickAddWord).toHaveBeenCalledWith({
      text: "creepy",
      context: "That old house looks creepy.",
      source: "ai_coach",
    });
  });

  it("favourites the new word so it shows up in Guardadas", async () => {
    quickAddWord.mockResolvedValue({ id: "w1" });
    await persistSaveable("u1", WORD);
    expect(toggleFavorite).toHaveBeenCalledWith("w1", true);
  });

  it("omits context when the saveable has no example", async () => {
    quickAddWord.mockResolvedValue({ id: "w1" });
    await persistSaveable("u1", { ...WORD, example: undefined });
    expect(quickAddWord).toHaveBeenCalledWith({
      text: "creepy",
      source: "ai_coach",
    });
  });

  it("favourites the existing word when it was already saved", async () => {
    quickAddWord.mockRejectedValue(new DuplicateWordError("w-existing", "creepy"));
    await expect(persistSaveable("u1", WORD)).resolves.toBeUndefined();
    expect(toggleFavorite).toHaveBeenCalledWith("w-existing", true);
  });

  it("propagates a genuine failure so the chip can show a retry", async () => {
    quickAddWord.mockRejectedValue(new Error("network down"));
    await expect(persistSaveable("u1", WORD)).rejects.toThrow("network down");
  });
});

describe("persistSaveable: phrases", () => {
  it("saves the phrase as a tracked item tagged as coach-sourced", async () => {
    await persistSaveable("u1", PHRASE);

    expect(saveTrackedItem).toHaveBeenCalledWith({
      userId: "u1",
      kind: "phrase",
      ref: "that sounds creepy",
      title: "that sounds creepy",
      payload: {
        text: "that sounds creepy",
        meaning: "eso suena escalofriante",
        source: "ai_coach",
      },
    });
  });

  it("lowercases the ref so the same phrase is not saved twice", async () => {
    await persistSaveable("u1", { ...PHRASE, text: "That Sounds Creepy" });
    expect(saveTrackedItem).toHaveBeenCalledWith(
      expect.objectContaining({ ref: "that sounds creepy", title: "That Sounds Creepy" }),
    );
  });

  it("does not touch the word bank for a phrase", async () => {
    await persistSaveable("u1", PHRASE);
    expect(quickAddWord).not.toHaveBeenCalled();
  });
});
```

- [x] **Step 2: Ejecutar y ver fallar**

```bash
pnpm test lib/ai-coach/saveables/__tests__/persist.test.ts
```

Esperado: FAIL con "Failed to resolve import ../persist".

- [x] **Step 3: Implementar**

Crea `lib/ai-coach/saveables/persist.ts`:

```ts
import type { TurnSaveable } from "@/lib/ai-practice/tools/registry";
import { quickAddWord, toggleFavorite, DuplicateWordError } from "@/lib/word-bank/queries";
import { saveTrackedItem } from "@/lib/tracking/queries";
import { AI_COACH_SOURCE } from "./source";

/**
 * Routes one coach-proposed item to the store it belongs in, so it inherits
 * the review machinery that already exists rather than living in a side table.
 *
 * - `word`  → word_bank, favourited (Guardadas lists favourites only)
 * - `phrase`→ tracked_items, which the outbox syncs to Supabase
 *
 * Offline is fine: quickAddWord fails loudly (the chip offers a retry) and
 * saveTrackedItem writes to Dexie and queues the upsert.
 */
export async function persistSaveable(userId: string, saveable: TurnSaveable): Promise<void> {
  if (saveable.type === "phrase") {
    await saveTrackedItem({
      userId,
      kind: "phrase",
      ref: saveable.text.toLocaleLowerCase(),
      title: saveable.text,
      payload: {
        text: saveable.text,
        meaning: saveable.meaning,
        source: AI_COACH_SOURCE,
      },
    });
    return;
  }

  try {
    const word = await quickAddWord({
      text: saveable.text,
      ...(saveable.example ? { context: saveable.example } : {}),
      source: AI_COACH_SOURCE,
    });
    await toggleFavorite(word.id, true);
  } catch (err) {
    // Saving a word the learner already has is a success from their point of
    // view — they wanted it in Guardadas, so favourite the existing row.
    if (err instanceof DuplicateWordError) {
      await toggleFavorite(err.wordId, true);
      return;
    }
    throw err;
  }
}
```

**Por qué se ignora `meaning` en las palabras:** `quickAddWord` dispara el enriquecimiento
asíncrono del servidor, que rellena significado, IPA y audio con la misma calidad que
cualquier otra palabra del banco. Guardar el significado del modelo lo pisaría con datos
peores. En las frases sí se guarda, porque `tracked_items` no tiene enriquecimiento.

- [x] **Step 4: Ejecutar y ver pasar**

```bash
pnpm test lib/ai-coach/saveables/__tests__/persist.test.ts && pnpm type-check
```

Esperado: PASS y `tsc` limpio.

- [x] **Step 5: Commit**

```bash
git add lib/ai-coach/saveables/persist.ts lib/ai-coach/saveables/__tests__/persist.test.ts
git commit -m "feat(ai-coach): route coach saveables into word_bank and tracked_items"
```

---

## Task 4: `SaveChips` — los chips bajo la prosa

**Files:**
- Create: `components/ai-coach/SaveChips.tsx`
- Test: `components/ai-coach/__tests__/SaveChips.test.tsx`

Mira `components/ai-coach/SuggestionChips.tsx` (44 líneas) antes de empezar: el chip nuevo
reutiliza su patrón de píldora y sus tokens.

- [x] **Step 1: Escribir los tests que fallan**

Crea `components/ai-coach/__tests__/SaveChips.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SaveChips from "../SaveChips";
import type { TurnSaveable } from "@/lib/ai-practice/tools/registry";

const SAVEABLES: TurnSaveable[] = [
  { type: "word", text: "creepy", meaning: "escalofriante" },
  { type: "phrase", text: "that sounds creepy", meaning: "eso suena escalofriante" },
];

describe("SaveChips", () => {
  it("renders one chip per saveable", () => {
    render(<SaveChips saveables={SAVEABLES} onSave={vi.fn()} />);
    expect(screen.getByRole("button", { name: /creepy/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /that sounds creepy/ })).toBeInTheDocument();
  });

  it("renders nothing when there are no saveables", () => {
    const { container } = render(<SaveChips saveables={[]} onSave={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("calls onSave with the saveable when a chip is tapped", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<SaveChips saveables={SAVEABLES} onSave={onSave} />);
    await userEvent.click(screen.getByRole("button", { name: /^\+ creepy$/ }));
    expect(onSave).toHaveBeenCalledWith(SAVEABLES[0]);
  });

  it("shows the saved state and disables the chip after a successful save", async () => {
    render(<SaveChips saveables={SAVEABLES} onSave={vi.fn().mockResolvedValue(undefined)} />);
    const chip = screen.getByRole("button", { name: /^\+ creepy$/ });
    await userEvent.click(chip);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Guardada/ })).toBeDisabled();
    });
  });

  it("offers a retry when the save fails", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("nope"));
    render(<SaveChips saveables={SAVEABLES} onSave={onSave} />);
    await userEvent.click(screen.getByRole("button", { name: /^\+ creepy$/ }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /reintentar/i })).toBeEnabled();
    });
  });

  it("retries the same saveable when the retry chip is tapped", async () => {
    const onSave = vi.fn().mockRejectedValueOnce(new Error("nope")).mockResolvedValueOnce(undefined);
    render(<SaveChips saveables={SAVEABLES} onSave={onSave} />);
    await userEvent.click(screen.getByRole("button", { name: /^\+ creepy$/ }));
    const retry = await screen.findByRole("button", { name: /reintentar/i });
    await userEvent.click(retry);
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
  });

  it("saves each chip independently", async () => {
    render(<SaveChips saveables={SAVEABLES} onSave={vi.fn().mockResolvedValue(undefined)} />);
    await userEvent.click(screen.getByRole("button", { name: /^\+ creepy$/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Guardada/ })).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /^\+ that sounds creepy$/ })).toBeEnabled();
  });
});
```

- [x] **Step 2: Ejecutar y ver fallar**

```bash
pnpm test components/ai-coach/__tests__/SaveChips.test.tsx
```

Esperado: FAIL con "Failed to resolve import ../SaveChips".

- [x] **Step 3: Implementar**

Crea `components/ai-coach/SaveChips.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Bookmark, Check, RotateCcw } from "@/components/icons";
import type { TurnSaveable } from "@/lib/ai-practice/tools/registry";
import { cn } from "@/lib/cn";

// Planned structure:
// <SaveChips>
//   <SaveChip /> × n — one pill per coach-proposed item
// </SaveChips>

type ChipState = "idle" | "saving" | "saved" | "error";

interface SaveChipsProps {
  saveables: TurnSaveable[];
  onSave: (saveable: TurnSaveable) => Promise<void>;
}

export default function SaveChips({ saveables, onSave }: SaveChipsProps) {
  const [states, setStates] = useState<Record<string, ChipState>>({});

  if (saveables.length === 0) return null;

  const handleSave = async (saveable: TurnSaveable) => {
    const key = saveable.text;
    setStates((prev) => ({ ...prev, [key]: "saving" }));
    try {
      await onSave(saveable);
      setStates((prev) => ({ ...prev, [key]: "saved" }));
    } catch {
      setStates((prev) => ({ ...prev, [key]: "error" }));
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Guardar de este mensaje">
      {saveables.map((saveable) => {
        const state = states[saveable.text] ?? "idle";
        const isSaved = state === "saved";
        const isError = state === "error";

        return (
          <button
            key={saveable.text}
            type="button"
            disabled={state === "saving" || isSaved}
            onClick={() => void handleSave(saveable)}
            title={saveable.meaning}
            className={cn(
              "flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3",
              "text-caption font-medium whitespace-nowrap",
              "transition-colors duration-150 focus-ring",
              "disabled:cursor-default",
              isSaved
                ? "border-success bg-success-soft text-success"
                : isError
                  ? "border-warning bg-warning-soft text-warning"
                  : "border-border-subtle bg-surface-raised text-fg-muted hover:border-primary hover:bg-primary-soft hover:text-primary",
            )}
          >
            {isSaved ? (
              <Check size={13} strokeWidth={2.25} aria-hidden />
            ) : isError ? (
              <RotateCcw size={13} strokeWidth={2} aria-hidden />
            ) : (
              <Bookmark size={13} strokeWidth={2} aria-hidden />
            )}
            {isSaved ? "Guardada" : isError ? `${saveable.text} · reintentar` : `+ ${saveable.text}`}
          </button>
        );
      })}
    </div>
  );
}
```

Antes de dar la task por buena, comprueba que `Bookmark`, `Check` y `RotateCcw` están
exportados en `components/icons/index.ts`. Si `RotateCcw` no lo está, añádelo siguiendo el
patrón de los demás iconos de ese archivo.

- [x] **Step 4: Ejecutar y ver pasar**

```bash
pnpm test components/ai-coach/__tests__/SaveChips.test.tsx
```

Esperado: PASS los 7.

- [x] **Step 5: Commit**

```bash
git add components/ai-coach/SaveChips.tsx components/ai-coach/__tests__/SaveChips.test.tsx components/icons/index.ts
git commit -m "feat(ai-coach): add SaveChips for coach-proposed saveables"
```

---

## Task 5: Conectar los chips a la burbuja

**Files:**
- Modify: `lib/ai-practice/correction.ts`
- Modify: `lib/ai-practice/__tests__/correction.test.ts`
- Modify: `components/ai-coach/MessageBubble.tsx`

- [x] **Step 1: Escribir el test que falla**

Añade a `lib/ai-practice/__tests__/correction.test.ts`:

```ts
import { extractTurnSaveables } from "../correction";

describe("extractTurnSaveables", () => {
  it("returns the saveables carried by an annotate_turn call", () => {
    const calls = callMap([
      {
        id: "c1",
        name: "annotate_turn",
        status: "answered",
        args: {
          saveables: [{ type: "word", text: "creepy", meaning: "escalofriante" }],
        },
      },
    ]);
    expect(extractTurnSaveables(calls)).toEqual([
      { type: "word", text: "creepy", meaning: "escalofriante" },
    ]);
  });

  it("returns an empty array when annotate_turn carried none", () => {
    const calls = callMap([
      { id: "c1", name: "annotate_turn", status: "answered", args: { correction: undefined } },
    ]);
    expect(extractTurnSaveables(calls)).toEqual([]);
  });

  it("returns an empty array when there is no annotate_turn call", () => {
    expect(extractTurnSaveables(new Map())).toEqual([]);
  });

  it("ignores an annotate_turn call that errored", () => {
    const calls = callMap([
      { id: "c1", name: "annotate_turn", status: "error", args: {}, error: "boom", errorId: "e1" },
    ]);
    expect(extractTurnSaveables(calls)).toEqual([]);
  });
});
```

- [x] **Step 2: Ejecutar y ver fallar**

```bash
pnpm test lib/ai-practice/__tests__/correction.test.ts
```

Esperado: FAIL — `extractTurnSaveables` no existe.

- [x] **Step 3: Implementar el extractor**

Añade a `lib/ai-practice/correction.ts`:

```ts
import type { AnnotateTurnArgs, TurnCorrection, TurnSaveable } from "./tools/registry";

/** Companion to extractTurnCorrection: the items the coach offered to save. */
export function extractTurnSaveables(
  toolCalls: Map<string, ToolCall>,
): TurnSaveable[] {
  for (const call of toolCalls.values()) {
    if (call.name !== "annotate_turn") continue;
    if (call.status === "error") continue;
    const args = call.args as AnnotateTurnArgs;
    if (args?.saveables?.length) return args.saveables;
  }
  return [];
}
```

Ajusta el import existente de la primera línea para que incluya `TurnSaveable` en lugar de
duplicar la sentencia.

- [x] **Step 4: Renderizar los chips en la burbuja**

En `components/ai-coach/MessageBubble.tsx`:

Añade los imports:

```ts
import { extractTurnCorrection, extractTurnSaveables } from "@/lib/ai-practice/correction";
import SaveChips from "./SaveChips";
import type { TurnSaveable } from "@/lib/ai-practice/tools/registry";
```

(Sustituye el import de `extractTurnCorrection` que dejó la fase 1, no añadas otro.)

Añade la prop a `AIBubbleProps` y a la interfaz del componente exportado que lo envuelve
(la que ya declara `onSaveWord` dos veces, en las líneas 58 y 262 del archivo original):

```ts
  onSaveSaveable: (saveable: TurnSaveable) => Promise<void>;
```

Recíbela en la firma de `AIBubble` y en la del wrapper, y pásala hacia abajo igual que se
pasa `onSaveWord`.

Dentro de `AIBubble`, junto al cálculo de la corrección:

```ts
const saveables = extractTurnSaveables(message.toolCalls);
```

Y en el JSX, **después** del `div` de la prosa y antes del cierre del contenedor de la
columna (el `div` con `className="flex min-w-0 flex-1 flex-col gap-2"`):

```tsx
        {saveables.length > 0 && (
          <SaveChips saveables={saveables} onSave={onSaveSaveable} />
        )}
```

- [x] **Step 5: Propagar la prop desde arriba**

`onSaveSaveable` tiene que llegar desde `AICoachPanel`. Sigue el rastro que ya existe para
`onSaveWord`:

- `components/ai-coach/ChatView.tsx:20` — añade `onSaveSaveable` a las props y pásala a
  `MessageBubble` (línea 113).
- `components/ai-coach/missions/MissionWorkspace.tsx:51` — igual, y pásala en la línea 257.
- `components/ai-coach/AICoachPanel.tsx` — pásala en las líneas 131 y 201, con el valor que
  crearás en la Task 6 (`saveSaveable` de `useSavedWords`).

- [x] **Step 6: Verificar**

```bash
pnpm test lib/ai-practice components/ai-coach && pnpm type-check
```

Esperado: PASS. `tsc` señalará que `saveSaveable` aún no existe en `useSavedWords` — eso lo
resuelve la Task 6. Si prefieres no dejar el árbol roto entre tasks, haz la Task 6 antes
del step 5 y vuelve.

- [x] **Step 7: Commit**

```bash
git add lib/ai-practice/correction.ts lib/ai-practice/__tests__/correction.test.ts components/ai-coach/
git commit -m "feat(ai-coach): render SaveChips from annotate_turn saveables"
```

---

## Task 6: Reducir `useSavedWords` y matar el silo

**Files:**
- Modify: `hooks/useSavedWords.ts`
- Modify: `components/ai-coach/AICoachPanel.tsx`
- Modify: `hooks/useAIPractice.ts`
- Modify: `lib/ai-practice/stream-processor.ts`

- [x] **Step 1: Reescribir el hook**

Sustituye `hooks/useSavedWords.ts` entero por:

```ts
"use client";

import { useState, useCallback, useMemo } from "react";
import { persistSaveable } from "@/lib/ai-coach/saveables/persist";
import type { TurnSaveable } from "@/lib/ai-practice/tools/registry";
import type { Difficulty } from "@/lib/types";

export interface SaveWordData {
  word: string;
  meaning: string;
  difficulty: Difficulty;
  context: string;
}

/**
 * Modal state for the manual "select text to save" path, plus the single
 * write entry point both paths share.
 *
 * The saved list itself is no longer held here — coach-saved items live in
 * word_bank / tracked_items and are read from /tracking.
 */
export function useSavedWords(userId: string | null) {
  const [wordToSave, setWordToSave] = useState<{ word: string; context: string } | null>(null);

  const openSaveWordModal = useCallback((word: string, context: string) => {
    setWordToSave({ word, context });
  }, []);

  const closeSaveWordModal = useCallback(() => setWordToSave(null), []);

  const saveSaveable = useCallback(
    async (saveable: TurnSaveable) => {
      if (!userId) throw new Error("Not authenticated");
      await persistSaveable(userId, saveable);
    },
    [userId],
  );

  const confirmSaveWord = useCallback(
    async (data: SaveWordData) => {
      if (!userId) return;
      await persistSaveable(userId, {
        type: "word",
        text: data.word.trim(),
        meaning: data.meaning,
        ...(data.context ? { example: data.context } : {}),
      });
      setWordToSave(null);
    },
    [userId],
  );

  return useMemo(
    () => ({
      wordToSave,
      setWordToSave,
      openSaveWordModal,
      closeSaveWordModal,
      confirmSaveWord,
      saveSaveable,
    }),
    [wordToSave, openSaveWordModal, closeSaveWordModal, confirmSaveWord, saveSaveable],
  );
}
```

Fíjate en que **desaparece el parámetro `conversationId`**: ya no hace falta, porque
`AISavedWord.conversationId` era el único que lo usaba.

- [x] **Step 2: Actualizar los consumidores**

En `hooks/useAIPractice.ts`:

- Línea 54: `useSavedWords(user?.id ?? null, conversationId)` → `useSavedWords(user?.id ?? null)`
- Expón `saveSaveable` en el objeto que devuelve el hook, junto a `openSaveWordModal` y
  `closeSaveWordModal` (líneas 208-209).
- Borra cualquier referencia a `savedWords`, `loadSavedWords` o `deleteSavedWord` que
  encuentres.

En `components/ai-coach/AICoachPanel.tsx`:

- Añade `saveSaveable` a la desestructuración de la línea 60.
- Pásalo como `onSaveSaveable={saveSaveable}` en las líneas 131 y 201 (lo que quedó
  pendiente en la Task 5, step 5).

- [x] **Step 3: Quitar la rama `save_word` del stream-processor**

En `lib/ai-practice/stream-processor.ts`, líneas 67-69, borra:

```ts
            if (tc.name === "save_word") {
              const { word, meaning } = args as SaveWordArgs;
              handlers.onSaveWord(word, meaning);
            } else if (tc.name === "start_mission") {
```

y deja `if (tc.name === "start_mission") {` como primera rama.

Borra también de `ActionHandlers` la entrada `onSaveWord` y el import de `SaveWordArgs`.

Actualiza los llamantes de `processChunk` que pasaban `onSaveWord`: `hooks/useStreamingChat.ts`
y el test de integración de la fase 1
(`lib/ai-practice/__tests__/annotate-turn.integration.test.ts`).

> **Por qué:** `save_word` abría el modal a espaldas del usuario. Los `saveables` de
> `annotate_turn` hacen el mismo trabajo mejor: proponen sin interrumpir. La declaración de
> `save_word` se queda en `declarations.ts` por compatibilidad con conversaciones ya
> persistidas que la contengan, pero no dispara nada.

- [x] **Step 4: Desenganchar `load-state.ts` del silo**

`lib/ai-practice/load-state.ts` también lee el silo: lo usa para construir
`vocabulary.savedWords`, que alimenta `compactState()`. Hay que quitarlo **antes** de
borrar el helper, o el build se rompe.

En ese archivo:

- Borra el import `import { getAIWords } from "@/lib/db/ai";` (línea 4).
- Quita `getAIWords(userId, 50)` del `Promise.allSettled` (línea 66) y la variable `aiWords`
  de la desestructuración correspondiente.
- Borra `const resolvedAIWords = ...` (línea 74).
- Simplifica `savedWords` (líneas 83-86) a:

```ts
    const savedWords = resolvedFavs.map(f => ({ word: f.word, ipa: f.ipa }));
```

El `filter` de deduplicación desaparece con ellos: sobraba solo porque se fusionaban dos
fuentes. No se pierde nada de cara al futuro — las palabras que el coach guarde a partir de
ahora van a `word_bank` como favoritas, que es justo lo que `resolvedFavs` recoge.

- [x] **Step 5: Borrar la tabla y el tipo**

En `lib/db/ai.ts`: borra `saveAIWord`, `getAIWords` y `deleteAIWord`, y el import de
`AISavedWord`. Los helpers de conversaciones se quedan.

En `lib/db/index.ts`:

- Borra la línea `aiWords!: Table<AISavedWord, number>;` (línea 374) y el import del tipo.
- Añade una versión nueva de Dexie **al final** de la cadena de versiones (la última hoy es
  la 35), que elimina el store:

```ts
    // v36 — the AI Coach no longer keeps its own word silo: saved items go to
    // word_bank / tracked_items so they sync and enter the SRS.
    this.version(36).stores({ aiWords: null });
```

- En la línea 529 hay una lista de stores (`'aiConversations', 'aiWords', ...`). Quita
  `'aiWords'` de ahí.

En `lib/types.ts`: borra la interfaz `AISavedWord` (líneas 209-219).

- [x] **Step 6: Verificar que no quedan referencias**

```bash
grep -rn "aiWords\|AISavedWord\|saveAIWord\|getAIWords\|deleteAIWord" --include=*.ts --include=*.tsx lib components hooks app
```

Esperado: sin resultados.

- [x] **Step 7: Verificar todo**

```bash
pnpm test && pnpm type-check && pnpm lint && pnpm audit:state-duplication
```

Esperado: todo verde. `audit:state-duplication` debería estar más contento que antes: se ha
eliminado una duplicación real.

- [x] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor(ai-coach): drop the aiWords silo, route all saves through persistSaveable"
```

---

## Task 7: El filtro "Del coach" en Guardadas

**Files:**
- Modify: `lib/tracking/types.ts`
- Modify: `hooks/useTracking.ts`
- Modify: `components/tracking/TrackingToolbar.tsx`
- Modify: `components/tracking/TrackingClient.tsx`
- Modify: `components/tracking/TrackingCard.tsx`
- Test: `components/tracking/__tests__/TrackingToolbar.test.tsx`

- [x] **Step 1: Escribir el test que falla**

Crea o amplía `components/tracking/__tests__/TrackingToolbar.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrackingToolbar } from "../TrackingToolbar";

const BASE_PROPS = {
  filter: "all" as const,
  onFilterChange: vi.fn(),
  searchQuery: "",
  onSearchChange: vi.fn(),
  canReview: false,
  availableReviewCount: 0,
  startingReview: false,
  onStartReview: vi.fn(),
};

describe("TrackingToolbar coach filter", () => {
  it("renders a 'Del coach' filter alongside the type filters", () => {
    render(<TrackingToolbar {...BASE_PROPS} />);
    expect(screen.getByRole("button", { name: "Del coach" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Palabras" })).toBeInTheDocument();
  });

  it("reports the ai_coach filter when tapped", async () => {
    const onFilterChange = vi.fn();
    render(<TrackingToolbar {...BASE_PROPS} onFilterChange={onFilterChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Del coach" }));
    expect(onFilterChange).toHaveBeenCalledWith("ai_coach");
  });

  it("marks the coach filter as pressed when it is active", () => {
    render(<TrackingToolbar {...BASE_PROPS} filter="ai_coach" />);
    expect(screen.getByRole("button", { name: "Del coach" })).toHaveAttribute("aria-pressed", "true");
  });
});
```

Si el toolbar no usa hoy `aria-pressed`, mira cómo marca el filtro activo (línea 63,
`const isActive = filter === id;`) y adapta el tercer test a ese mecanismo real.

- [x] **Step 2: Ejecutar y ver fallar**

```bash
pnpm test components/tracking/__tests__/TrackingToolbar.test.tsx
```

Esperado: FAIL — no existe el botón "Del coach".

- [x] **Step 3: Añadir el tipo de filtro**

En `lib/tracking/types.ts`, añade:

```ts
/**
 * Guardadas filters. The first four narrow by item kind; "ai_coach" narrows by
 * origin instead, so it cuts across all three kinds.
 */
export type TrackingFilter = "all" | TrackedKind | "ai_coach";
```

Y añade el origen a `TrackingItem`, para que la tarjeta pueda pintar el badge sin volver a
mirar la fila cruda:

```ts
export interface TrackingItem {
  id: string;
  kind: TrackedKind;
  title: string;
  description?: string | null;
  href?: string;
  progressState?: WordProgressSignal;
  progressLabel?: string;
  /** True when the AI Coach saved this item. */
  fromCoach?: boolean;
}
```

- [x] **Step 4: Propagar el origen desde `useTracking`**

En `hooks/useTracking.ts`, dentro de `reviewSources`:

En el bloque de palabras favoritas (línea 30 en adelante), añade al objeto `item`:

```ts
          fromCoach: isFromCoach(word),
```

En el bloque de `trackedItems` (línea 42 en adelante), añade al objeto `item`:

```ts
        fromCoach: isFromCoach(trackedItem),
```

Y el import:

```ts
import { isFromCoach } from "@/lib/ai-coach/saveables/source";
```

`isFromCoach` acepta las dos formas (columna plana y `payload.source`), así que la misma
llamada sirve para ambos bloques.

- [x] **Step 5: Añadir el chip al toolbar**

En `components/tracking/TrackingToolbar.tsx`:

```ts
import type { TrackingFilter } from "@/lib/tracking/types";

const FILTERS: { id: TrackingFilter; label: string }[] = [
  { id: "all", label: "Todo" },
  { id: "word", label: "Palabras" },
  { id: "phrase", label: "Frases" },
  { id: "lesson", label: "Lecciones" },
  { id: "ai_coach", label: "Del coach" },
];
```

Y cambia el tipo de las props:

```ts
  filter: TrackingFilter;
  onFilterChange: (filter: TrackingFilter) => void;
```

- [x] **Step 6: Filtrar en el cliente**

En `components/tracking/TrackingClient.tsx`, la línea 73 es hoy:

```ts
let list = filter === "all" ? reviewSources : reviewSources.filter((s) => s.item.kind === filter);
```

Sustitúyela por:

```ts
    // "ai_coach" filters by origin, not by kind — it cuts across words,
    // phrases and lessons alike.
    let list =
      filter === "all"
        ? reviewSources
        : filter === "ai_coach"
          ? reviewSources.filter((s) => s.item.fromCoach)
          : reviewSources.filter((s) => s.item.kind === filter);
```

La línea 141 tiene la misma forma para `hasCategoryItems`. Cámbiala igual:

```ts
  const hasCategoryItems =
    filter === "all"
      ? reviewSources.length > 0
      : filter === "ai_coach"
        ? reviewSources.some((s) => s.item.fromCoach)
        : reviewSources.some((s) => s.item.kind === filter);
```

Y actualiza el tipo del `useState` del filtro a `TrackingFilter`.

- [x] **Step 7: El badge en la tarjeta**

En `components/tracking/TrackingCard.tsx`, junto a donde ya se pinta `progressLabel`, añade:

```tsx
        {source.item.fromCoach && (
          <Badge label="✦ coach" variant="info" size="sm" />
        )}
```

Comprueba primero cómo se importa y qué variantes acepta `Badge` en este proyecto —
`components/pronunciation/IntonationParts.tsx:144` tiene un ejemplo de uso. Si no existe la
variante `info`, usa la que más se acerque a un tono neutro-informativo.

- [x] **Step 8: Verificar**

```bash
pnpm test components/tracking && pnpm type-check && pnpm lint
```

Esperado: PASS y limpio.

- [x] **Step 9: Commit**

```bash
git add lib/tracking/types.ts hooks/useTracking.ts components/tracking/
git commit -m "feat(tracking): filter Guardadas by AI Coach origin"
```

---

## Verificación final de la fase

- [x] **Step 1: Suite completa y puertas**

```bash
pnpm test && pnpm type-check && pnpm lint && pnpm audit:hard-rules
```

Esperado: todo verde.

- [x] **Step 2: Comprobación manual**

```bash
pnpm dev
```

1. Habla con el coach hasta que use una palabra poco común → aparecen los chips bajo su
   mensaje.
2. Toca un chip → pasa a `✓ Guardada` al instante, sin modal.
3. Ve a **Guardadas** → la palabra está ahí con el badge `✦ coach`, y su ficha se va
   completando (significado, IPA) según termina el enriquecimiento del servidor.
4. Filtra por **"Del coach"** → solo se ven los items del coach, de los tres tipos.
5. Guarda una **frase** desde un chip → aparece en Guardadas bajo "Frases" con el badge.
6. Selecciona texto en un mensaje del coach → se abre `SaveWordModal`; al confirmar,
   también acaba en Guardadas.
7. Toca un chip de una palabra que **ya tenías** guardada → debe quedar en `✓ Guardada`,
   no en error.

- [x] **Step 3: Offline**

Con DevTools en Offline:

1. Guarda una **frase** desde un chip → debe quedar `✓ Guardada` (Dexie + outbox).
2. Guarda una **palabra** → fallará, porque `quickAddWord` va contra `/api/words`. El chip
   debe mostrar `· reintentar`, no romper la burbuja.
3. Vuelve online y toca reintentar → se guarda.

Ese comportamiento asimétrico es esperado y correcto: las palabras necesitan el
enriquecimiento del servidor, las frases no. Si te parece que merece una cola offline
propia para palabras, anótalo como trabajo futuro — no lo metas en esta fase.

- [x] **Step 4: Commit de cierre si hubo ajustes**

```bash
git add -A && git commit -m "chore(ai-coach): phase 2 verification fixes"
```

---

## Qué queda fuera de esta fase

- Los starters siguen siendo los cuatro estáticos de siempre (fase 3).
- No hay botón "Terminar" ni resumen de sesión (fase 4).
- No hay planes con `dueAt` ("mañana repasamos X"): fuera de alcance en todo el spec.
- Las palabras guardadas offline no tienen cola propia; fallan y ofrecen reintento.
