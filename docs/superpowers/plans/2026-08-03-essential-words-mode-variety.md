# Essential Words — Variedad de modos de ejercicio (Fase 1: lógica) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar la monotonía de los ejercicios de essential-words: rotar modos dentro de cada tier de madurez SRS (en vez de first-match fijo), evitar repetir el mismo modo dos cards seguidas, y añadir un modo nuevo `cloze_sentence` (oración con hueco) que rompe el monopolio del dictado en el tier medio y da variedad al tier maduro.

**Architecture:** `selectMode` (lib/essential-words/exercise-modes.ts) deja de usar `firstUsable` (prioridad fija) y pasa a rotación determinista: un seed = hash(palabra) + repetitions indexa la lista de candidatos usables del tier; un parámetro opcional `previousMode` (el modo de la card anterior en la sesión) desplaza el índice si coincidiría, evitando dos cards idénticas seguidas. La elegibilidad por modo se centraliza en `modeHasData`, que para cloze delega en un helper nuevo `clozeFor` (lib/essential-words/cloze.ts) construido sobre `blankLemma`/`hasEnoughContext` de `lib/exercises/eligibility` (ya existen y manejan formas flexionadas). El hook `useEssentialWordsSession` guarda el modo de la card recién calificada en estado y lo pasa a `selectMode`. `ClozeCard` es un componente nuevo hermano de `DictationCard`.

**Tech Stack:** Next.js 16 / React 19 / TypeScript, Vitest + Testing Library, Tailwind v4 (tokens). Sin cambios de datos ni de schema — todo funciona con los JSON actuales.

**Contexto que el ejecutor no tiene:** este repo corre en Windows; usa PowerShell para comandos. El runner de tests es Vitest (`pnpm vitest run <path>`). Regla del proyecto: componentes ≤250 líneas, comentario de estructura planeada antes de implementar, clases Tailwind con tokens (nunca colores/espaciados hardcodeados), sin `style={{}}`. Los tests de componentes viven en `__tests__/` junto al código.

**Decisiones ya tomadas (no re-litigar):**
- Tiers por `repetitions` (SM-2 consecutive-correct): tender ≤2, middle 3–5, mature ≥6. Ya existen en `exercise-modes.ts`.
- Candidatos por tier tras esta fase:
  - `learning` y tender → `[recognize_translation, recognize_meaning]` (rotados — hoy `recognize_meaning` es código muerto porque translation está al 100% y first-match siempre la gana).
  - middle → `[weak_form, dictation_sentence, cloze_sentence]`.
  - mature → `[speak_sentence, cloze_sentence]` (hoy es siempre `speak_sentence`, para siempre).
- La rotación es determinista (hash + reps), NO `Math.random()`: los tests deben poder fijar el resultado.
- `new` sigue yendo a `study` siempre; el render de sesión ya maneja el caso `study` en fase speak (fallback a SpeakReviewCard) — no tocar eso.

---

## File Structure

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `lib/essential-words/cloze.ts` | Crear | Helper puro `clozeFor(entry)`: oración con hueco + respuesta esperada, o `null` si no es viable |
| `lib/essential-words/__tests__/cloze.test.ts` | Crear | Tests de `clozeFor` |
| `lib/essential-words/exercise-modes.ts` | Modificar | Nuevo modo `cloze_sentence`, `modeHasData`, rotación con seed + `previousMode` |
| `lib/essential-words/__tests__/exercise-modes.test.ts` | Modificar | Tests de rotación, anti-repetición e invariante con `modeHasData` |
| `hooks/useEssentialWordsSession.ts` | Modificar | Estado `previousMode`, pasa el modo real de la card al payload y a `selectMode` |
| `components/practice/essential-words/ClozeCard.tsx` | Crear | Card de oración con hueco |
| `components/practice/essential-words/__tests__/ClozeCard.test.tsx` | Crear | Tests del componente |
| `components/practice/essential-words/EssentialWordsSession.tsx` | Modificar | Renderiza `ClozeCard` cuando `currentMode === 'cloze_sentence'` |

---

### Task 1: Helper puro `clozeFor`

**Files:**
- Create: `lib/essential-words/cloze.ts`
- Test: `lib/essential-words/__tests__/cloze.test.ts`

- [ ] **Step 1: Write the failing test**

Crear `lib/essential-words/__tests__/cloze.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { clozeFor } from "../cloze";
import type { EssentialWord } from "../types";

function entry(overrides: Partial<EssentialWord> = {}): EssentialWord {
  return {
    rank: 1,
    word: "through",
    pos: "preposition",
    ipa_strong: "/θruː/",
    example_sentence: "We walked through the park yesterday morning.",
    cefr_level: "A1",
    meaning: "from one side to the other",
    translation: "a través de",
    ...overrides,
  };
}

describe("clozeFor", () => {
  it("blanks the exact word and returns it as the answer", () => {
    const result = clozeFor(entry());
    expect(result).not.toBeNull();
    expect(result!.blanked).toBe("We walked ___ the park yesterday morning.");
    expect(result!.answer).toBe("through");
  });

  it("blanks an inflected form and returns the surface token, not the lemma", () => {
    const e = entry({
      word: "work",
      example_sentence: "She works at a hospital downtown every single day.",
    });
    const result = clozeFor(e);
    expect(result).not.toBeNull();
    expect(result!.blanked).toBe("She ___ at a hospital downtown every single day.");
    expect(result!.answer).toBe("works");
  });

  it("strips trailing punctuation from the answer token", () => {
    const e = entry({
      word: "park",
      example_sentence: "The children played happily in the beautiful green park.",
    });
    const result = clozeFor(e);
    expect(result).not.toBeNull();
    expect(result!.answer).toBe("park");
  });

  it("returns null when the word is not in the sentence", () => {
    const e = entry({ example_sentence: "A completely unrelated sentence here." });
    expect(clozeFor(e)).toBeNull();
  });

  it("returns null when the blanked sentence lacks context", () => {
    // Tras el hueco quedan casi solo function words → sin contexto para adivinar.
    const e = entry({ word: "cat", example_sentence: "It is a cat." });
    expect(clozeFor(e)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run lib/essential-words/__tests__/cloze.test.ts`
Expected: FAIL — `Cannot find module '../cloze'` (o equivalente).

- [ ] **Step 3: Write minimal implementation**

Crear `lib/essential-words/cloze.ts`:

```ts
// Cloze (oración con hueco) para essential-words. Puro — construido sobre la
// elegibilidad compartida de lib/exercises/eligibility, que ya maneja formas
// flexionadas ("works" para lemma "work") e irregulares.

import { blankLemma, hasEnoughContext } from "@/lib/exercises/eligibility";
import type { EssentialWord } from "./types";

export interface ClozeData {
  /** La oración con el token objetivo reemplazado por "___". */
  blanked: string;
  /** El token que se quitó (forma superficial, sin puntuación), p.ej. "works". */
  answer: string;
}

/**
 * Devuelve la oración con hueco y la respuesta esperada, o null cuando el
 * ejercicio no es viable (la palabra no aparece, o el resto de la oración no
 * da contexto suficiente para adivinarla).
 */
export function clozeFor(entry: EssentialWord): ClozeData | null {
  const blanked = blankLemma(entry.example_sentence, entry.word);
  if (!blanked || !hasEnoughContext(blanked)) return null;

  // Recupera el token quitado comparando token a token contra el original.
  const original = entry.example_sentence.split(/\s+/);
  const gapped = blanked.split(/\s+/);
  const idx = gapped.findIndex((token, i) => token !== original[i]);
  const raw = original[idx] ?? entry.word;
  const answer = raw.replace(/[^\w'-]/g, "");
  return { blanked, answer };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run lib/essential-words/__tests__/cloze.test.ts`
Expected: PASS (5 tests).

Si el test de "lacks context" no devuelve null, revisa `hasEnoughContext` en `lib/exercises/eligibility.ts` (exige `MIN_CONTENT_WORDS_AFTER_BLANK` palabras de contenido tras quitar function words) y ajusta la oración del test para que de verdad quede sin contenido — no cambies la implementación para forzar el test.

- [ ] **Step 5: Commit**

```powershell
git add lib/essential-words/cloze.ts lib/essential-words/__tests__/cloze.test.ts
git commit -m "feat(essential-words): add clozeFor helper for fill-blank exercises"
```

---

### Task 2: Rotación de modos + `modeHasData` + anti-repetición en `selectMode`

**Files:**
- Modify: `lib/essential-words/exercise-modes.ts` (reemplazo completo del archivo, ~100 líneas)
- Modify: `lib/essential-words/__tests__/exercise-modes.test.ts` (reemplazo completo)

- [ ] **Step 1: Write the failing tests**

Reemplazar el contenido completo de `lib/essential-words/__tests__/exercise-modes.test.ts` por:

```ts
import { describe, expect, it } from "vitest";
import {
  selectMode,
  modeHasData,
  MODE_REQUIRED_FIELD,
  type EssentialWordMode,
} from "../exercise-modes";
import type { EssentialWordQueueItem } from "../queue";
import type { EssentialWord } from "../types";

function entry(overrides: Partial<EssentialWord> = {}): EssentialWord {
  return {
    rank: 1,
    word: "through",
    pos: "preposition",
    ipa_strong: "/θruː/",
    example_sentence: "We walked through the park yesterday morning.",
    cefr_level: "A1",
    meaning: "from one side to the other",
    translation: "a través de",
    ...overrides,
  };
}

function item(
  kind: EssentialWordQueueItem["kind"],
  e: EssentialWord = entry(),
  repetitions = 0,
): EssentialWordQueueItem {
  return { kind, entry: e, repetitions };
}

describe("selectMode — tiers", () => {
  it("sends new words to study", () => {
    expect(selectMode(item("new"))).toBe("study");
  });

  it("gives learning items recognition, never production", () => {
    for (let reps = 0; reps <= 10; reps++) {
      const mode = selectMode(item("learning", entry(), reps));
      expect(["recognize_translation", "recognize_meaning"]).toContain(mode);
    }
  });

  it("uses recognition for tender reviews (repetitions <= 2)", () => {
    for (let reps = 0; reps <= 2; reps++) {
      const mode = selectMode(item("review", entry(), reps));
      expect(["recognize_translation", "recognize_meaning"]).toContain(mode);
    }
  });

  it("uses dictation, weak form, or cloze for middle reviews (3-5)", () => {
    for (let reps = 3; reps <= 5; reps++) {
      const mode = selectMode(item("review", entry(), reps));
      expect(["dictation_sentence", "weak_form", "cloze_sentence"]).toContain(mode);
    }
  });

  it("uses production or cloze for mature reviews (>= 6)", () => {
    for (let reps = 6; reps <= 12; reps++) {
      const mode = selectMode(item("review", entry(), reps));
      expect(["speak_sentence", "cloze_sentence"]).toContain(mode);
    }
  });
});

describe("selectMode — rotación", () => {
  it("is deterministic: same item always gets the same mode", () => {
    const it1 = item("review", entry(), 1);
    expect(selectMode(it1)).toBe(selectMode(it1));
  });

  it("varies the tender mode as repetitions advance (meaning is no longer dead code)", () => {
    const seen = new Set<EssentialWordMode>();
    for (let reps = 0; reps <= 2; reps++) {
      seen.add(selectMode(item("review", entry(), reps)));
    }
    // Con 2 candidatos y 3 reps consecutivas, ambos modos deben aparecer.
    expect(seen).toEqual(
      new Set(["recognize_translation", "recognize_meaning"]),
    );
  });

  it("varies the middle mode across repetitions", () => {
    const seen = new Set<EssentialWordMode>();
    for (let reps = 3; reps <= 5; reps++) {
      seen.add(selectMode(item("review", entry(), reps)));
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe("selectMode — anti-repetición (previousMode)", () => {
  it("avoids repeating the previous card's mode when an alternative has data", () => {
    const target = item("review", entry(), 1);
    const chosen = selectMode(target);
    const avoided = selectMode(target, chosen);
    expect(avoided).not.toBe(chosen);
    expect(["recognize_translation", "recognize_meaning"]).toContain(avoided);
  });

  it("repeats the mode when it is the only usable candidate", () => {
    // Sin meaning, el único candidato tender con datos es recognize_translation.
    const only = item("review", entry({ meaning: undefined }), 1);
    expect(selectMode(only, "recognize_translation")).toBe("recognize_translation");
  });
});

describe("selectMode — fallbacks", () => {
  it("falls back to speech when no tender candidate has data", () => {
    const bare = entry({ meaning: undefined, translation: undefined });
    expect(selectMode(item("review", bare, 1))).toBe("speak_sentence");
  });

  // Invariante central: nunca elegir un modo sin datos.
  it("never returns a mode whose backing data is absent", () => {
    const variants: EssentialWord[] = [
      entry(),
      entry({ translation: undefined }),
      entry({ meaning: undefined }),
      entry({ meaning: undefined, translation: undefined }),
      entry({ ipa_weak: "/ðə/", sentence_ipa: "/wiː wɔːkt ðə pɑːrk/" }),
      entry({ example_sentence: "It is through." }), // cloze inviable: sin contexto
    ];
    const kinds: EssentialWordQueueItem["kind"][] = ["review", "learning"];
    const previous: (EssentialWordMode | undefined)[] = [
      undefined,
      "recognize_translation",
      "dictation_sentence",
      "speak_sentence",
    ];

    for (const e of variants) {
      for (const kind of kinds) {
        for (let reps = 0; reps <= 10; reps++) {
          for (const prev of previous) {
            const mode = selectMode(item(kind, e, reps), prev);
            expect(modeHasData(e, mode)).toBe(true);
          }
        }
      }
    }
  });

  it("keeps MODE_REQUIRED_FIELD in sync with the mode list", () => {
    expect(Object.keys(MODE_REQUIRED_FIELD).sort()).toEqual(
      [
        "cloze_sentence",
        "dictation_sentence",
        "recognize_meaning",
        "recognize_translation",
        "speak_sentence",
        "study",
        "weak_form",
      ].sort(),
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run lib/essential-words/__tests__/exercise-modes.test.ts`
Expected: FAIL — `modeHasData` no existe, `cloze_sentence` no es un modo, y `selectMode` no acepta segundo argumento.

- [ ] **Step 3: Write the implementation**

Reemplazar el contenido completo de `lib/essential-words/exercise-modes.ts` por:

```ts
import { clozeFor } from "./cloze";
import type { EssentialWordQueueItem } from "./queue";
import type { EssentialWord } from "./types";

/**
 * How a due word is practiced. `speak_sentence` is the universal fallback:
 * `example_sentence` is mandatory on every entry, so it always has data.
 */
export type EssentialWordMode =
  | "study"
  | "recognize_translation"
  | "recognize_meaning"
  | "dictation_sentence"
  | "cloze_sentence"
  | "weak_form"
  | "speak_sentence";

/**
 * The optional `EssentialWord` field each mode needs. Modes backed by a
 * mandatory field — or by a computed check (cloze) — map to null. Exported so
 * tests can assert the invariant that a mode is never chosen without data.
 */
export const MODE_REQUIRED_FIELD: Record<
  EssentialWordMode,
  keyof EssentialWord | null
> = {
  study: null,
  recognize_translation: "translation",
  recognize_meaning: "meaning",
  dictation_sentence: null, // example_sentence is mandatory
  cloze_sentence: null, // computed: clozeFor(entry) must be non-null
  weak_form: "ipa_weak",
  speak_sentence: null, // example_sentence is mandatory
};

/** Maturity tiers, driven by SM-2 consecutive-correct count. */
const TENDER_MAX = 2;
const MIDDLE_MAX = 5;

/** True when `entry` has everything `mode` needs to render. */
export function modeHasData(entry: EssentialWord, mode: EssentialWordMode): boolean {
  const field = MODE_REQUIRED_FIELD[mode];
  if (field && !entry[field]) return false;
  if (mode === "cloze_sentence") return clozeFor(entry) !== null;
  return true;
}

/** Deterministic per-word seed so rotation varies across words, not renders. */
function wordSeed(word: string): number {
  let hash = 0;
  for (const char of word) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return Math.abs(hash);
}

/**
 * Pick from `candidates` rotating deterministically by word + repetitions.
 * If the pick would repeat `previousMode` and another candidate has data,
 * advance one position so two consecutive cards differ.
 */
function pickRotating(
  entry: EssentialWord,
  candidates: EssentialWordMode[],
  repetitions: number,
  previousMode?: EssentialWordMode,
): EssentialWordMode {
  const usable = candidates.filter((mode) => modeHasData(entry, mode));
  if (usable.length === 0) return "speak_sentence";
  let index = (wordSeed(entry.word) + repetitions) % usable.length;
  if (usable[index] === previousMode && usable.length > 1) {
    index = (index + 1) % usable.length;
  }
  return usable[index];
}

/**
 * Pick how to practice this item.
 *
 * New words study. Otherwise the SRS maturity tier decides the candidate set,
 * and a deterministic rotation (word hash + repetitions) walks through it so
 * the same word is practiced differently across reviews. `learning` items (a
 * lapse re-inserted mid-session) always get recognition — they just failed,
 * so production would only fail again.
 *
 * `previousMode` is the mode of the card graded just before this one; when
 * provided, the rotation avoids repeating it if an alternative has data.
 *
 * Never returns a mode whose backing data is missing; falls back to
 * `speak_sentence`, which is always renderable.
 */
export function selectMode(
  item: EssentialWordQueueItem,
  previousMode?: EssentialWordMode,
): EssentialWordMode {
  if (item.kind === "new") return "study";

  const { entry } = item;
  const reps = item.repetitions ?? 0;
  const recognition: EssentialWordMode[] = [
    "recognize_translation",
    "recognize_meaning",
  ];

  if (item.kind === "learning" || reps <= TENDER_MAX) {
    return pickRotating(entry, recognition, reps, previousMode);
  }
  if (reps <= MIDDLE_MAX) {
    return pickRotating(
      entry,
      ["weak_form", "dictation_sentence", "cloze_sentence"],
      reps,
      previousMode,
    );
  }
  return pickRotating(entry, ["speak_sentence", "cloze_sentence"], reps, previousMode);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run lib/essential-words/__tests__/exercise-modes.test.ts lib/essential-words/__tests__/cloze.test.ts`
Expected: PASS.

Si "varies the tender mode" falla: con 2 candidatos y reps 0,1,2 el índice `(seed + reps) % 2` alterna sí o sí; un fallo aquí indica que filtraste candidatos de más o que el seed no suma `repetitions`.

- [ ] **Step 5: Run the whole essential-words lib suite (detecta regresiones en otros tests que usan selectMode)**

Run: `pnpm vitest run lib/essential-words`
Expected: PASS. Si algún test ajeno asume que reps≤2 siempre da `recognize_translation` (first-match viejo), actualiza su aserción para aceptar el set `["recognize_translation", "recognize_meaning"]` — no fuerces la implementación.

- [ ] **Step 6: Commit**

```powershell
git add lib/essential-words/exercise-modes.ts lib/essential-words/__tests__/exercise-modes.test.ts
git commit -m "feat(essential-words): rotate exercise modes per tier with anti-repeat and cloze"
```

---

### Task 3: `previousMode` en el hook de sesión

**Files:**
- Modify: `hooks/useEssentialWordsSession.ts` (3 puntos concretos, ver abajo)

El hook hoy llama `selectMode(item)` dos veces sin coordinación: en el render (línea ~318, para `currentMode`) y dentro de `submitGrade` (línea ~219, para el payload del resultado). Hay que unificar ambas en un solo valor y encadenar el modo previo.

- [ ] **Step 1: Añadir el estado y el ref**

En `hooks/useEssentialWordsSession.ts`, junto a los demás `useState` del hook, añadir:

```ts
const [previousMode, setPreviousMode] = useState<EssentialWordMode | undefined>(undefined);
```

Localizar la línea (~318):

```ts
const currentMode: EssentialWordMode = current ? selectMode(current) : "speak_sentence";
```

y reemplazarla por:

```ts
const currentMode: EssentialWordMode = current
  ? selectMode(current, previousMode)
  : "speak_sentence";
// Ref-mirror so submitGrade (a useCallback) reads the mode actually rendered,
// without re-deriving it and without adding it to dependency arrays.
const currentModeRef = useRef<EssentialWordMode>(currentMode);
currentModeRef.current = currentMode;
```

`useRef` ya está importado en el archivo (el hook usa `seenIdsRef`/`pendingLapsesRef`); si no aparece en el import de React, añadirlo.

- [ ] **Step 2: Usar el modo renderizado en `submitGrade` y encadenar `previousMode`**

Localizar dentro de `submitGrade` (~línea 219):

```ts
const result = buildEssentialWordExerciseResult(item, quality, extras, selectMode(item));
```

y reemplazar por:

```ts
const result = buildEssentialWordExerciseResult(item, quality, extras, currentModeRef.current);
setPreviousMode(currentModeRef.current);
```

Esto además corrige un desajuste latente: el payload registraba `selectMode(item)` recalculado, que ahora podría diferir del modo realmente mostrado.

- [ ] **Step 3: Resetear al recargar sesión**

En la función `bootstrap` del hook (la que resetea `phase` a "loading" y reconstruye la queue), añadir junto a los demás resets de estado:

```ts
setPreviousMode(undefined);
```

- [ ] **Step 4: Verificar tipos y tests del hook/sesión**

Run: `pnpm type-check`
Expected: sin errores nuevos (los preexistentes en `components/home` sobre `WeakestPhonemeHome` no son de esta tarea; si aparecen, ignorarlos y anotarlo en el commit).

Run: `pnpm vitest run components/practice/essential-words components/practice/session`
Expected: PASS. Si `EssentialWordsSession.test.tsx` fija un modo concreto para un item y ahora recibe el otro candidato del tier, ajusta el test para aceptar cualquiera de los candidatos válidos del tier, o fija `repetitions` del item de prueba para que el seed determine el modo esperado.

- [ ] **Step 5: Commit**

```powershell
git add hooks/useEssentialWordsSession.ts
git commit -m "feat(essential-words): thread previousMode through session hook for anti-repeat"
```

---

### Task 4: Componente `ClozeCard`

**Files:**
- Create: `components/practice/essential-words/ClozeCard.tsx`
- Test: `components/practice/essential-words/__tests__/ClozeCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Crear `components/practice/essential-words/__tests__/ClozeCard.test.tsx` (mismo patrón que `DictationCard.test.tsx`):

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ClozeCard } from "../ClozeCard";
import type { EssentialWord } from "@/lib/essential-words/types";

vi.mock("@/lib/ui-sounds/cues", () => ({ playUiCue: vi.fn() }));

const entry: EssentialWord = {
  rank: 67,
  word: "work",
  pos: "verb",
  ipa_strong: "/ˈwɜrk/",
  example_sentence: "She works at a hospital downtown every single day.",
  cefr_level: "A1",
  meaning: "to do a job",
  translation: "trabajar",
};

function setup(onGraded = vi.fn().mockResolvedValue(undefined)) {
  render(<ClozeCard entry={entry} onGraded={onGraded} />);
  return onGraded;
}

describe("ClozeCard", () => {
  it("shows the blanked sentence, not the answer", () => {
    setup();
    expect(
      screen.getByText("She ___ at a hospital downtown every single day."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/^works$/)).not.toBeInTheDocument();
  });

  it("shows the translation as a hint", () => {
    setup();
    expect(screen.getByText(/trabajar/)).toBeInTheDocument();
  });

  it("grades 5 on the exact surface form", () => {
    const onGraded = setup();
    fireEvent.change(screen.getByLabelText("Escribe la palabra que falta"), {
      target: { value: "Works" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    expect(onGraded).toHaveBeenCalledWith(5);
  });

  it("grades 5 on the base form too", () => {
    const onGraded = setup();
    fireEvent.change(screen.getByLabelText("Escribe la palabra que falta"), {
      target: { value: "work" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    expect(onGraded).toHaveBeenCalledWith(5);
  });

  it("grades 2 on a wrong answer and reveals the full sentence", () => {
    const onGraded = setup();
    fireEvent.change(screen.getByLabelText("Escribe la palabra que falta"), {
      target: { value: "sleeps" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    expect(onGraded).toHaveBeenCalledWith(2);
    expect(
      screen.getByText("She works at a hospital downtown every single day."),
    ).toBeInTheDocument();
  });

  it("does not grade an empty answer", () => {
    const onGraded = setup();
    fireEvent.click(screen.getByRole("button", { name: "Comprobar" }));
    expect(onGraded).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run components/practice/essential-words/__tests__/ClozeCard.test.tsx`
Expected: FAIL — `Cannot find module '../ClozeCard'`.

- [ ] **Step 3: Write the implementation**

Crear `components/practice/essential-words/ClozeCard.tsx`:

```tsx
'use client'

// Planned structure:
// <ClozeCard>
//   <Prompt />        — kicker + oración con hueco + pista (traducción)
//   <AnswerInput />
//   <Reveal />
// </ClozeCard>

import { useState } from 'react'
import { PillButton } from '@/components/ui/PillButton'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { clozeFor } from '@/lib/essential-words/cloze'
import type { EssentialWord } from '@/lib/essential-words/types'

interface Props {
  entry: EssentialWord
  onGraded: (quality: number) => Promise<void>
}

/** Quality scores: a correct fill is a 5, a miss is a lapse (2). */
const CORRECT_QUALITY = 5
const WRONG_QUALITY = 2

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9']/g, '').trim()
}

export function ClozeCard({ entry, onGraded }: Props) {
  const [answer, setAnswer] = useState('')
  const [revealed, setRevealed] = useState(false)

  // selectMode garantiza clozeFor(entry) !== null antes de elegir este modo;
  // el fallback existe solo para no romper el render si esa invariante falla.
  const cloze = clozeFor(entry)

  const handleCheck = () => {
    if (revealed || answer.trim() === '' || !cloze) return
    const given = normalize(answer)
    const isCorrect =
      given === normalize(cloze.answer) || given === normalize(entry.word)
    setRevealed(true)
    playUiCue(isCorrect ? 'correct' : 'wrong')
    void onGraded(isCorrect ? CORRECT_QUALITY : WRONG_QUALITY)
  }

  if (!cloze) return null

  return (
    <div className="flex w-full flex-col items-center gap-[var(--space-5)] rounded-lg border border-border-subtle bg-surface-raised layout-card-pad">
      <div className="flex max-w-[42ch] flex-col items-center gap-1 text-center">
        <p className="font-kicker m-0 text-fg-muted">Completa la oración</p>
        <p className="m-0 text-body-lg leading-relaxed text-balance text-fg">
          {cloze.blanked}
        </p>
        {entry.translation && (
          <p className="m-0 text-caption text-fg-muted">Pista: {entry.translation}</p>
        )}
      </div>

      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
        disabled={revealed}
        aria-label="Escribe la palabra que falta"
        className="w-full max-w-sm rounded-md border border-border-subtle bg-surface px-3 py-2 text-body text-fg focus-ring"
      />

      {revealed ? (
        <p className="m-0 max-w-[42ch] text-center text-body-lg text-fg">
          {entry.example_sentence}
        </p>
      ) : (
        <PillButton type="button" variant="primary" onClick={handleCheck}>
          Comprobar
        </PillButton>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run components/practice/essential-words/__tests__/ClozeCard.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```powershell
git add components/practice/essential-words/ClozeCard.tsx components/practice/essential-words/__tests__/ClozeCard.test.tsx
git commit -m "feat(essential-words): add ClozeCard fill-blank component"
```

---

### Task 5: Cablear `ClozeCard` en la sesión

**Files:**
- Modify: `components/practice/essential-words/EssentialWordsSession.tsx`
- Test: `components/practice/essential-words/__tests__/EssentialWordsSession.test.tsx` (añadir un caso)

- [ ] **Step 1: Write the failing test**

`EssentialWordsSession.test.tsx` es un test de integración: NO mockea `useEssentialWordsSession` — mockea `@/lib/db` y `@/lib/essential-words/client` y deja correr el hook real. Para forzar el modo cloze no se hardcodea el modo: se busca qué valor de `repetitions` del tier medio (3–5) hace que `selectMode` elija `cloze_sentence` para la palabra `the` (con 3 candidatos usables y rotación por `seed + reps`, algún valor de 3–5 lo produce siempre), y se monta un SRS entry due con ese valor.

Añadir al final del `describe('EssentialWordsSession', ...)`:

```tsx
it('renders ClozeCard for a middle-tier review whose rotation picks cloze', async () => {
  // selectMode es determinista (hash de palabra + repetitions). Buscamos el
  // reps del tier medio que produce cloze para "the" en vez de hardcodearlo,
  // así el test no depende de la función de hash.
  const { selectMode } = await import('@/lib/essential-words/exercise-modes')
  const theEntry = WORDS[0]
  const reps = [3, 4, 5].find(
    (r) => selectMode({ kind: 'review', entry: theEntry, repetitions: r }) === 'cloze_sentence',
  )
  expect(reps).toBeDefined()

  dbMocks.getEssentialWordsSrsEntries.mockResolvedValue([
    {
      wordId: 'c1k:the',
      word: 'the',
      interval: 6,
      ease: 2.5,
      repetitions: reps!,
      nextReview: '2026-07-01T00:00:00.000Z',
    },
  ])
  // Sin cuota de nuevas, para que la primera card sea el review de "the".
  dbMocks.getEssentialWordsIntroducedToday.mockResolvedValue(
    Array.from({ length: 10 }, (_, i) => `w${i}`),
  )

  render(<EssentialWordsSession />)

  expect(await screen.findByText('Completa la oración')).toBeTruthy()
  expect(screen.getByText('Give me ___ book please.')).toBeTruthy()
})
```

Nota: `WORDS[0]` (`the`) tiene `ipa_weak`, así que sus candidatos del tier medio son los 3 (`weak_form`, `dictation_sentence`, `cloze_sentence`); con reps 3, 4 y 5 la rotación recorre los 3, por lo que `reps` siempre se encuentra. Si `hasEnoughContext` rechazara "Give me ___ book please." (cloze inviable → `reps` undefined), cambia la aserción del kicker por la de otra palabra: añade a `WORDS` una entrada con oración más larga y usa esa — no debilites `hasEnoughContext`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run components/practice/essential-words/__tests__/EssentialWordsSession.test.tsx`
Expected: FAIL — el nuevo caso no encuentra "Completa la oración" (los demás casos siguen en verde).

- [ ] **Step 3: Wire the card**

En `EssentialWordsSession.tsx`:

1. Añadir el import junto a los demás cards:

```tsx
import { ClozeCard } from './ClozeCard'
```

2. Dentro del bloque `{phase === 'speak' && current && (...)}`, junto a los demás modos (después del bloque de `weak_form`, líneas ~166-168), añadir:

```tsx
{currentMode === 'cloze_sentence' && (
  <ClozeCard entry={current.entry} onGraded={submitGrade} />
)}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run components/practice/essential-words/__tests__/EssentialWordsSession.test.tsx`
Expected: PASS, incluido el caso nuevo.

- [ ] **Step 5: Commit**

```powershell
git add components/practice/essential-words/EssentialWordsSession.tsx components/practice/essential-words/__tests__/EssentialWordsSession.test.tsx
git commit -m "feat(essential-words): render ClozeCard in session for cloze_sentence mode"
```

---

### Task 6: Verificación final

**Files:** ninguno nuevo — solo verificación.

- [ ] **Step 1: Suite completa de essential-words + sesión**

Run: `pnpm vitest run lib/essential-words components/practice/essential-words lib/practice/study-card components/practice/session`
Expected: PASS total. Antes de esta fase eran 27 archivos / 154 tests; ahora deben ser más (cloze.test, ClozeCard.test y el caso nuevo de sesión).

- [ ] **Step 2: Type-check y lint**

Run: `pnpm type-check`
Expected: sin errores nuevos atribuibles a estos archivos.

Run: `pnpm lint`
Expected: sin errores en los archivos tocados.

- [ ] **Step 3: Validación del dataset (no debería cambiar, es solo lógica)**

Run: `pnpm validate:essential-words`
Expected: 4 tests PASS.

- [ ] **Step 4: Commit final si quedó algo suelto**

```powershell
git status
```

Si hay archivos modificados sin commitear de pasos anteriores, commitearlos con un mensaje descriptivo. No commitear archivos ajenos a este plan (p.ej. cambios previos en `public/essential-words/` o `meaning-overrides.json` que ya estaban en el working tree — déjalos como están).

---

## Fuera de alcance (fases siguientes, NO implementar aquí)

- `recognize_audio` / `recall_translation` (dirección inversa) — candidatos para una fase 1.5.
- `example_sentences[]` (múltiples oraciones por palabra) — fase de schema + contenido, con script de generación en `/scripts`.
- Cambios en los JSON de `public/essential-words/`.
