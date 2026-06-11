# Core 1000 with Weak Forms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deck de las 1000 palabras más frecuentes del inglés con weak forms, evaluado por producción hablada sobre oraciones, conectado al SM-2/Dexie existente, en `/practice/core-1000`.

**Architecture:** Contenido = JSON versionado en `public/core-1000/` (10 chunks de 100, validados con Zod), espejo del patrón `lib/courses/grammar-deck/decks.ts`. Estado SRS en la tabla Dexie `srsData` existente con `wordId = "c1k:" + word`. Sesión cliente: cola pura (vencidas + 10 nuevas/día) → tarjeta de estudio strong/weak → ejercicio hablado (`useSpeechRecognition` → `defaultEvaluationEngine` → `accuracyToQuality` → `updateSRS`), con fallback self-grade sin micrófono.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind v4 (tokens), Dexie, Zod, Vitest + Testing Library (jsdom), `cmu-pronouncing-dictionary` (ya es dependencia).

**Spec:** `docs/superpowers/specs/2026-06-11-core-1000-weak-forms-design.md` (leerlo antes de empezar).

**⚠️ Branch:** el trabajo va sobre `dev`. Si ejecutas en un worktree aislado, el worktree se crea desde `main` — haz `git checkout dev` (o checkout del SHA objetivo) ANTES de tocar nada.

**Convenciones del repo que aplican a cada task** (de `CLAUDE.md`):
componentes ≤250 líneas y ≤8 props; bloque de comentario "Planned structure" antes de cada componente; Tailwind tokens (nunca colores hardcodeados, nunca `style={{}}`); `cn()` de `@/lib/cn` para clases condicionales; imports absolutos `@/`; TTS nunca se guarda; offline no se rompe.

---

## File Map

| Archivo | Responsabilidad |
| --- | --- |
| `lib/core-1000/types.ts` | Tipos `CoreWord`, `CefrLevel`, helpers `hasReduction()`, `core1000WordId()`, constantes |
| `lib/core-1000/schema.ts` | Zod: `CoreWordSchema`, `CoreChunkSchema` |
| `lib/core-1000/data.ts` | Loader server-only (fs): lee chunks, valida, ranks contiguos |
| `lib/core-1000/client.ts` | Fetch de chunks desde el cliente con cache en memoria |
| `lib/core-1000/weak-forms.ts` | Whitelist cerrada de function words con weak form |
| `lib/core-1000/validate-core.ts` | Validación de contenido: IPA vs CMU, whitelist, oración contiene palabra |
| `lib/core-1000/queue.ts` | `buildSessionQueue()` — función pura: vencidas + cupo de nuevas |
| `lib/core-1000/grade.ts` | `gradeCore1000Word()` — persiste SRS (+ attempt/XP cuando hay accuracy) |
| `lib/db/index.ts` (modify) | Helpers: `getCore1000SrsEntries`, `recordCore1000Introduction`, `getCore1000IntroducedToday` |
| `lib/types.ts` (modify) | `DailyProgress.core1000NewWords?: string[]` |
| `hooks/useCore1000Session.ts` | Orquestación: carga datos, cola, fase study/speak, avance |
| `components/practice/core-1000/WordStudyCard.tsx` | Tarjeta strong vs weak con TTS |
| `components/practice/core-1000/SpeakReviewCard.tsx` | Ejercicio hablado + scoring |
| `components/practice/core-1000/SelfGradeBar.tsx` | Fallback self-grade (4 botones) |
| `components/practice/core-1000/DeckProgressHeader.tsx` | x/1000, vencidas, nuevas hoy |
| `components/practice/core-1000/SessionDone.tsx` | Resumen al terminar |
| `components/practice/core-1000/Core1000Session.tsx` | Orquestador client (compone lo anterior) |
| `app/practice/core-1000/page.tsx` | Ruta (compose only) |
| `components/sidebar/navConfig.ts` (modify) | Entrada "Core 1000" |
| `app/practice/decks/page.tsx` (modify) | Banner hacia Core 1000 |
| `public/core-1000/words-001.json` … `words-010.json` | Dataset (10 × 100 entradas) |
| `scripts/core-1000/data/ngsl-1000.csv` | Ranking canónico NGSL |
| `scripts/core-1000/data/ipa-exceptions.json` | Discrepancias CMU aceptadas, con razón |

---

### Task 1: Tipos + schema Zod

**Files:**

- Create: `lib/core-1000/types.ts`
- Create: `lib/core-1000/schema.ts`
- Test: `lib/core-1000/__tests__/schema.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/core-1000/__tests__/schema.test.ts
import { describe, expect, it } from "vitest";
import { CoreWordSchema, CoreChunkSchema } from "../schema";
import { hasReduction, core1000WordId } from "../types";

const base = {
  rank: 4,
  word: "to",
  pos: "preposition",
  ipa_strong: "/tuː/",
  example_sentence: "I want to go home.",
  cefr_level: "A1",
};

describe("CoreWordSchema", () => {
  it("accepts a strong-only entry", () => {
    expect(CoreWordSchema.safeParse(base).success).toBe(true);
  });

  it("accepts a weak-form entry with sentence_ipa", () => {
    const entry = { ...base, ipa_weak: "/tə/", sentence_ipa: "/aɪ ˈwɑnt tə ˈɡoʊ ˈhoʊm/" };
    expect(CoreWordSchema.safeParse(entry).success).toBe(true);
  });

  it("rejects ipa_weak without sentence_ipa", () => {
    const entry = { ...base, ipa_weak: "/tə/" };
    expect(CoreWordSchema.safeParse(entry).success).toBe(false);
  });

  it("rejects rank out of range", () => {
    expect(CoreWordSchema.safeParse({ ...base, rank: 0 }).success).toBe(false);
    expect(CoreWordSchema.safeParse({ ...base, rank: 1001 }).success).toBe(false);
  });

  it("rejects unknown pos and cefr", () => {
    expect(CoreWordSchema.safeParse({ ...base, pos: "thing" }).success).toBe(false);
    expect(CoreWordSchema.safeParse({ ...base, cefr_level: "C2" }).success).toBe(false);
  });
});

describe("CoreChunkSchema", () => {
  it("requires version 1 and at least one entry", () => {
    expect(CoreChunkSchema.safeParse({ version: 1, entries: [base] }).success).toBe(true);
    expect(CoreChunkSchema.safeParse({ version: 2, entries: [base] }).success).toBe(false);
    expect(CoreChunkSchema.safeParse({ version: 1, entries: [] }).success).toBe(false);
  });
});

describe("helpers", () => {
  it("hasReduction derives from ipa_weak", () => {
    expect(hasReduction({ ...base, cefr_level: "A1", pos: "preposition" } as never)).toBe(false);
    expect(
      hasReduction({ ...base, ipa_weak: "/tə/", sentence_ipa: "/x/", cefr_level: "A1" } as never)
    ).toBe(true);
  });

  it("core1000WordId namespaces and lowercases", () => {
    expect(core1000WordId("To")).toBe("c1k:to");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/core-1000/__tests__/schema.test.ts`
Expected: FAIL — "Cannot find module '../schema'"

- [ ] **Step 3: Write the implementation**

```ts
// lib/core-1000/types.ts
/** Core 1000 word entry — authored JSON in public/core-1000/, validated by ./schema. */

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1";

export const CORE_POS = [
  "noun", "verb", "adjective", "adverb", "pronoun", "preposition",
  "conjunction", "determiner", "article", "modal", "auxiliary",
  "number", "interjection",
] as const;
export type CorePos = (typeof CORE_POS)[number];

export interface CoreWord {
  rank: number;               // 1–1000, único, contiguo por chunk
  word: string;
  pos: CorePos;
  ipa_strong: string;         // General American, con marcas de stress
  ipa_weak?: string;          // solo function words (whitelist en ./weak-forms)
  example_sentence: string;   // contiene la palabra; ahí vive la weak form
  sentence_ipa?: string;      // obligatorio si hay ipa_weak (Zod refine)
  cefr_level: CefrLevel;
}

export const CORE1000_PREFIX = "c1k:";
export const NEW_CARDS_PER_DAY = 10;
export const CHUNK_SIZE = 100;
export const MAX_CHUNKS = 10;

export function hasReduction(entry: CoreWord): boolean {
  return entry.ipa_weak != null;
}

/** wordId de srsData para una palabra del Core 1000 (namespaced, lowercase). */
export function core1000WordId(word: string): string {
  return `${CORE1000_PREFIX}${word.toLowerCase()}`;
}
```

```ts
// lib/core-1000/schema.ts
// Zod schema for Core 1000 chunks (public/core-1000/words-00N.json).
// Must stay in sync with the compile-time types in ./types.ts.

import { z } from "zod";
import { CORE_POS } from "./types";

export const CoreWordSchema = z
  .object({
    rank: z.number().int().min(1).max(1000),
    word: z.string().min(1),
    pos: z.enum(CORE_POS),
    ipa_strong: z.string().regex(/^\/.+\/$/, "IPA entre slashes, p.ej. /tuː/"),
    ipa_weak: z.string().regex(/^\/.+\/$/).optional(),
    example_sentence: z.string().min(1),
    sentence_ipa: z.string().regex(/^\/.+\/$/).optional(),
    cefr_level: z.enum(["A1", "A2", "B1", "B2", "C1"]),
  })
  .refine((w) => !w.ipa_weak || !!w.sentence_ipa, {
    message: "sentence_ipa es obligatorio cuando hay ipa_weak",
    path: ["sentence_ipa"],
  });

export const CoreChunkSchema = z.object({
  version: z.literal(1),
  entries: z.array(CoreWordSchema).nonempty(),
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/core-1000/__tests__/schema.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/core-1000/types.ts lib/core-1000/schema.ts lib/core-1000/__tests__/schema.test.ts
git commit -m "feat(core-1000): word entry types and Zod schema"
```

---

### Task 2: Loader server-only

**Files:**

- Create: `lib/core-1000/data.ts`
- Test: `lib/core-1000/__tests__/data.test.ts`

- [ ] **Step 1: Write the failing test**

El loader acepta `dir` inyectable (default `public/core-1000`) para poder testearlo con fixtures temporales.

```ts
// lib/core-1000/__tests__/data.test.ts
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { loadCoreWords } from "../data";

function entry(rank: number) {
  return {
    rank,
    word: `word${rank}`,
    pos: "noun",
    ipa_strong: `/wɜrd${rank}/`,
    example_sentence: `This is word${rank}.`,
    cefr_level: "A1",
  };
}

function chunk(n: number, size = 100) {
  return {
    version: 1,
    entries: Array.from({ length: size }, (_, i) => entry((n - 1) * 100 + i + 1)),
  };
}

let tmp: string;
function writeChunks(...chunks: Array<{ n: number; data: unknown }>) {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "core1000-"));
  for (const { n, data } of chunks) {
    fs.writeFileSync(
      path.join(tmp, `words-${String(n).padStart(3, "0")}.json`),
      JSON.stringify(data)
    );
  }
  return tmp;
}

afterEach(() => {
  if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
});

describe("loadCoreWords", () => {
  it("returns [] when the directory has no chunks", () => {
    const dir = writeChunks();
    expect(loadCoreWords(dir)).toEqual([]);
  });

  it("loads contiguous chunks in rank order", () => {
    const dir = writeChunks({ n: 1, data: chunk(1) }, { n: 2, data: chunk(2) });
    const words = loadCoreWords(dir);
    expect(words).toHaveLength(200);
    expect(words[0].rank).toBe(1);
    expect(words[199].rank).toBe(200);
  });

  it("stops at the first missing chunk (contiguous from 001)", () => {
    const dir = writeChunks({ n: 1, data: chunk(1) }, { n: 3, data: chunk(3) });
    expect(loadCoreWords(dir)).toHaveLength(100);
  });

  it("throws in dev on a chunk with wrong size", () => {
    const dir = writeChunks({ n: 1, data: chunk(1, 99) });
    expect(() => loadCoreWords(dir)).toThrow(/100/);
  });

  it("throws in dev on non-contiguous ranks", () => {
    const bad = chunk(1);
    bad.entries[5] = entry(999);
    const dir = writeChunks({ n: 1, data: bad });
    expect(() => loadCoreWords(dir)).toThrow(/rank/i);
  });

  it("throws in dev on Zod-invalid content", () => {
    const bad = chunk(1);
    (bad.entries[0] as Record<string, unknown>).cefr_level = "Z9";
    const dir = writeChunks({ n: 1, data: bad });
    expect(() => loadCoreWords(dir)).toThrow(/Zod/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/core-1000/__tests__/data.test.ts`
Expected: FAIL — "Cannot find module '../data'"

- [ ] **Step 3: Write the implementation**

```ts
// lib/core-1000/data.ts
// Server-side loader for the Core 1000 dataset.
//
// Chunks live as public/core-1000/words-001.json … words-010.json — outside
// the JS module graph — read from disk and validated with Zod. Mirrors
// lib/courses/grammar-deck/decks.ts: throws loudly in dev, logs + returns []
// in prod. The `fs` import makes this module server-only by construction.

import fs from "fs";
import path from "path";
import { z } from "zod";
import { CoreChunkSchema } from "./schema";
import { CHUNK_SIZE, MAX_CHUNKS, type CoreWord } from "./types";

const DEFAULT_DIR = path.join(process.cwd(), "public", "core-1000");

function chunkPath(dir: string, n: number): string {
  return path.join(dir, `words-${String(n).padStart(3, "0")}.json`);
}

function readAll(dir: string): CoreWord[] {
  const words: CoreWord[] = [];
  for (let n = 1; n <= MAX_CHUNKS; n++) {
    const file = chunkPath(dir, n);
    if (!fs.existsSync(file)) break; // chunks contiguos desde 001

    const data: unknown = JSON.parse(fs.readFileSync(file, "utf-8"));
    const parsed = CoreChunkSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(
        `[core-1000] Zod validation failed for "${file}":\n${z.prettifyError(parsed.error)}`
      );
    }
    const entries = parsed.data.entries;
    if (entries.length !== CHUNK_SIZE) {
      throw new Error(`[core-1000] ${file}: expected ${CHUNK_SIZE} entries, got ${entries.length}`);
    }
    entries.forEach((entry, i) => {
      const expected = (n - 1) * CHUNK_SIZE + i + 1;
      if (entry.rank !== expected) {
        throw new Error(
          `[core-1000] ${file}: rank ${entry.rank} at position ${i}, expected ${expected}`
        );
      }
    });
    words.push(...entries);
  }
  return words;
}

/**
 * Returns every available Core 1000 entry, rank-sorted. Tolerates a partially
 * curated dataset (chunks must be contiguous from 001). Dev: malformed data
 * throws; prod: logs and returns [] so the app degrades gracefully.
 */
export function loadCoreWords(dir: string = DEFAULT_DIR): CoreWord[] {
  try {
    return readAll(dir);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") throw err;
    console.error(String(err));
    return [];
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/core-1000/__tests__/data.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/core-1000/data.ts lib/core-1000/__tests__/data.test.ts
git commit -m "feat(core-1000): server-only chunk loader with dev/prod contract"
```

---

### Task 3: Whitelist de weak forms + validación de contenido

**Files:**

- Create: `lib/core-1000/weak-forms.ts`
- Create: `lib/core-1000/validate-core.ts`
- Test: `lib/core-1000/__tests__/validate-core.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/core-1000/__tests__/validate-core.test.ts
import { describe, expect, it } from "vitest";
import { normalizeIpaForCompare, validateEntry } from "../validate-core";
import type { CoreWord } from "../types";

const to: CoreWord = {
  rank: 4,
  word: "to",
  pos: "preposition",
  ipa_strong: "/tuː/",
  ipa_weak: "/tə/",
  example_sentence: "I want to go home.",
  sentence_ipa: "/aɪ ˈwɑnt tə ˈɡoʊ ˈhoʊm/",
  cefr_level: "A1",
};

describe("normalizeIpaForCompare", () => {
  it("strips slashes, stress and spaces; unifies r/ɹ, g/ɡ, ʌ/ə", () => {
    expect(normalizeIpaForCompare("/ˈwɔːtər/")).toBe(normalizeIpaForCompare("wɔːtəɹ"));
    expect(normalizeIpaForCompare("/ɡoʊ/")).toBe(normalizeIpaForCompare("/goʊ/"));
    expect(normalizeIpaForCompare("/ʌbaʊt/")).toBe(normalizeIpaForCompare("/əbaʊt/"));
  });
});

describe("validateEntry", () => {
  it("passes a correct weak-form entry", () => {
    // "to" está en CMUdict como T UW1 → /tuː/
    expect(validateEntry(to)).toEqual([]);
  });

  it("flags ipa_strong that disagrees with CMU", () => {
    const issues = validateEntry({ ...to, ipa_strong: "/taʊ/" });
    expect(issues.some((i) => i.kind === "ipa-mismatch")).toBe(true);
  });

  it("flags weak form on a non-whitelisted word", () => {
    const issues = validateEntry({
      ...to,
      word: "table",
      ipa_strong: "/ˈteɪbəl/",
      example_sentence: "The table is big.",
    });
    expect(issues.some((i) => i.kind === "weak-not-whitelisted")).toBe(true);
  });

  it("flags a sentence that does not contain the word", () => {
    const issues = validateEntry({ ...to, example_sentence: "I want it." });
    expect(issues.some((i) => i.kind === "sentence-missing-word")).toBe(true);
  });

  it("does not flag words missing from CMUdict", () => {
    const issues = validateEntry({
      ...to,
      word: "zzzznotaword",
      ipa_weak: undefined,
      sentence_ipa: undefined,
      example_sentence: "A zzzznotaword here.",
    });
    expect(issues.filter((i) => i.kind === "ipa-mismatch")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/core-1000/__tests__/validate-core.test.ts`
Expected: FAIL — "Cannot find module '../validate-core'"

- [ ] **Step 3: Write the implementation**

```ts
// lib/core-1000/weak-forms.ts
// Closed whitelist of English function words that have a standard weak form
// in General American. The content validator rejects `ipa_weak` on any word
// not listed here. Extending the list is a deliberate, reviewed change.

export const WEAK_FORM_WHITELIST: ReadonlySet<string> = new Set([
  // artículos y determinantes
  "a", "an", "the", "some",
  // conjunciones
  "and", "but", "or", "as", "than", "that",
  // preposiciones
  "at", "for", "from", "of", "to", "into", "upon", "per",
  // pronombres y posesivos
  "he", "him", "his", "her", "she", "we", "us", "you", "your", "them", "there",
  // be / have / do
  "am", "is", "are", "was", "were", "be", "been", "have", "has", "had", "do", "does",
  // modales
  "can", "could", "shall", "should", "will", "would", "must",
]);
```

```ts
// lib/core-1000/validate-core.ts
// Content-quality validation for Core 1000 entries. Pure logic — runs in
// Vitest (npm run validate:core1000). IPA mismatches against CMUdict are a
// SIGNAL for manual review, silenced explicitly via
// scripts/core-1000/data/ipa-exceptions.json, never auto-accepted.

import { lookupIpaFromCmu } from "@/lib/lexicon/ipa";
import { WEAK_FORM_WHITELIST } from "./weak-forms";
import type { CoreWord } from "./types";

export type IssueKind = "ipa-mismatch" | "weak-not-whitelisted" | "sentence-missing-word";

export interface ValidationIssue {
  rank: number;
  word: string;
  kind: IssueKind;
  detail: string;
}

/**
 * Normalization for comparing authored IPA against CMU-derived IPA.
 * CMU (via ARPABET_TO_IPA) carries no stress and writes ʌ for every AH, so we
 * erase stress marks and merge ʌ/ə, r/ɹ, g/ɡ on BOTH sides. This loses real
 * contrasts on purpose: the comparison is a review signal, not a proof.
 */
export function normalizeIpaForCompare(ipa: string): string {
  return ipa
    .replace(/[/[\]ˈˌ.\s]/g, "")
    .replace(/r/g, "ɹ")
    .replace(/ɡ/g, "g")
    .replace(/ʌ/g, "ə");
}

export function validateEntry(entry: CoreWord): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { rank, word } = entry;

  const cmuIpa = lookupIpaFromCmu(word);
  if (cmuIpa && normalizeIpaForCompare(cmuIpa) !== normalizeIpaForCompare(entry.ipa_strong)) {
    issues.push({
      rank, word, kind: "ipa-mismatch",
      detail: `ipa_strong=${entry.ipa_strong} vs CMU=${cmuIpa}`,
    });
  }

  if (entry.ipa_weak && !WEAK_FORM_WHITELIST.has(word.toLowerCase())) {
    issues.push({
      rank, word, kind: "weak-not-whitelisted",
      detail: `ipa_weak=${entry.ipa_weak} pero "${word}" no está en la whitelist`,
    });
  }

  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!new RegExp(`\\b${escaped}\\b`, "i").test(entry.example_sentence)) {
    issues.push({
      rank, word, kind: "sentence-missing-word",
      detail: `"${entry.example_sentence}" no contiene "${word}"`,
    });
  }

  return issues;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/core-1000/__tests__/validate-core.test.ts`
Expected: PASS (6 tests). Si el test de "to" falla por el detalle del símbolo (p.ej. CMU da `/tuː/` exacto), imprime `lookupIpaFromCmu("to")` y ajusta el fixture — NO el normalizador — salvo que el normalizador tenga un bug real.

- [ ] **Step 5: Commit**

```bash
git add lib/core-1000/weak-forms.ts lib/core-1000/validate-core.ts lib/core-1000/__tests__/validate-core.test.ts
git commit -m "feat(core-1000): content validator (CMU IPA signal + weak-form whitelist)"
```

---

### Task 4: NGSL CSV + gate de dataset en CI

**Files:**

- Create: `scripts/core-1000/data/ngsl-1000.csv`
- Create: `scripts/core-1000/data/ipa-exceptions.json`
- Create: `lib/core-1000/__tests__/dataset.test.ts`
- Modify: `package.json` (script `validate:core1000`)

- [ ] **Step 1: Obtener el ranking NGSL**

Busca y descarga la New General Service List (NGSL 1.01, CC BY 3.0 — Browne, Culligan & Phillips). Fuentes: <https://www.newgeneralservicelist.com/> o un mirror público del CSV. Toma las primeras 1000 palabras por frecuencia ajustada y escribe `scripts/core-1000/data/ngsl-1000.csv` con este formato exacto:

```csv
# NGSL 1.01 top 1000 — Browne, Culligan & Phillips (CC BY 3.0)
# source: <URL real de descarga usada>
rank,word
1,the
2,be
3,and
4,of
5,to
```

**Sanity checks obligatorios** (si alguno falla, la fuente es mala — busca otra):
- Exactamente 1000 filas de datos, ranks 1–1000 contiguos, sin palabras duplicadas.
- Top 10 contiene: the, be, and, of, to, a, in, have.
- Todo lowercase, sin espacios ni signos.

Si no logras descargar ninguna fuente verificable: genera la lista desde conocimiento del modelo, cambia la cabecera a `# source: agent-generated, PENDING manual verification` y repórtalo como nota al cerrar la task.

- [ ] **Step 2: Crear el archivo de excepciones vacío**

```json
{
  "_comment": "ipa-mismatch aceptados tras revisión manual. Clave = palabra, valor = razón. El dataset test silencia solo estos.",
  "_example": "water: CMU da AH para la vocal final; el dataset usa ə deliberadamente"
}
```

(Guardar como `scripts/core-1000/data/ipa-exceptions.json` — las claves `_comment`/`_example` se ignoran en el test.)

- [ ] **Step 3: Write the dataset gate test**

```ts
// lib/core-1000/__tests__/dataset.test.ts
// Gate de CI para el dataset completo: schema Zod (vía loadCoreWords) +
// validate-core. Pasa trivialmente con 0 chunks; rompe el build si alguien
// commitea un chunk inválido. npm run validate:core1000 ejecuta solo este file.
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { loadCoreWords } from "../data";
import { validateEntry } from "../validate-core";

const EXCEPTIONS_PATH = path.join(
  process.cwd(), "scripts", "core-1000", "data", "ipa-exceptions.json"
);

function loadExceptions(): Record<string, string> {
  const raw = JSON.parse(fs.readFileSync(EXCEPTIONS_PATH, "utf-8")) as Record<string, string>;
  return Object.fromEntries(Object.entries(raw).filter(([k]) => !k.startsWith("_")));
}

describe("Core 1000 dataset", () => {
  const words = loadCoreWords(); // throws si un chunk es inválido (dev/test)

  it("has complete chunks only", () => {
    expect(words.length % 100).toBe(0);
  });

  it("has no unreviewed content issues", () => {
    const exceptions = loadExceptions();
    const issues = words
      .flatMap((w) => validateEntry(w))
      .filter((i) => !(i.kind === "ipa-mismatch" && exceptions[i.word] !== undefined));
    const report = issues.map((i) => `#${i.rank} ${i.word} [${i.kind}] ${i.detail}`).join("\n");
    expect(issues, `\n${report}`).toEqual([]);
  });

  it("every exception still corresponds to a real word in the dataset", () => {
    const known = new Set(words.map((w) => w.word));
    const stale = Object.keys(loadExceptions()).filter((w) => words.length > 0 && !known.has(w));
    expect(stale).toEqual([]);
  });
});
```

- [ ] **Step 4: Add npm script**

En `package.json`, dentro de `"scripts"`, después de `"test:watch"`:

```json
"validate:core1000": "vitest run lib/core-1000/__tests__/dataset.test.ts"
```

- [ ] **Step 5: Run and verify**

Run: `npm run validate:core1000`
Expected: PASS (3 tests, trivial con 0 chunks)

- [ ] **Step 6: Commit**

```bash
git add scripts/core-1000/data/ngsl-1000.csv scripts/core-1000/data/ipa-exceptions.json lib/core-1000/__tests__/dataset.test.ts package.json
git commit -m "feat(core-1000): NGSL ranking source and dataset CI gate"
```

---

### Task 5: Generar chunk 001 (establece el patrón de curación)

**Files:**

- Create: `public/core-1000/words-001.json`
- Maybe modify: `scripts/core-1000/data/ipa-exceptions.json`

Este task lo ejecuta el agente generando contenido, no escribiendo código. Reglas de autoría:

- **Palabras y ranks**: exactamente las filas 1–100 de `ngsl-1000.csv`, en orden.
- **IPA**: General American. Usa SOLO los símbolos de `ARPABET_TO_IPA` en `lib/pronunciation/phonemes.ts` (ɑ æ ʌ ɔ aʊ aɪ ɛ ɜr eɪ ɪ iː oʊ ɔɪ ʊ uː b tʃ d ð f ɡ h dʒ k l m n ŋ p ɹ s ʃ t θ v w j z ʒ) más ˈ ˌ para stress y ə para vocales reducidas. Formato `/…/`.
- **`ipa_weak`**: solo si la palabra está en `WEAK_FORM_WHITELIST` (`lib/core-1000/weak-forms.ts`) Y la reducción es estándar en GA. No toda palabra whitelisted la lleva obligatoriamente.
- **`example_sentence`**: 4–10 palabras, nivel A1/A2, natural, contiene la palabra exacta. Para weak forms, la oración debe ponerla en posición átona (donde la reducción ocurre de verdad).
- **`sentence_ipa`**: transcripción GA de la oración completa CON la weak form aplicada. Obligatoria si hay `ipa_weak`; opcional (pero bienvenida) si no.
- **`pos`**: el más frecuente para esa palabra (enum `CORE_POS`). `cefr_level`: nivel típico de adquisición.

- [ ] **Step 1: Generar `public/core-1000/words-001.json`** con `{ "version": 1, "entries": [...] }` y las 100 entradas (formato del ejemplo de Task 1).

- [ ] **Step 2: Validar**

Run: `npm run validate:core1000`
Expected: o PASS, o lista de `ipa-mismatch` en el reporte del test.

- [ ] **Step 3: Revisar cada mismatch** — para cada uno: si el IPA autorado está mal, corrígelo; si el IPA autorado es correcto y CMU es el impreciso (pasa con ə, ɔ/ɑ cot-caught, etc.), añade `"palabra": "razón concreta"` a `ipa-exceptions.json`. Nunca silencies sin razón escrita.

- [ ] **Step 4: Re-run** `npm run validate:core1000` hasta PASS.

- [ ] **Step 5: Commit**

```bash
git add public/core-1000/words-001.json scripts/core-1000/data/ipa-exceptions.json
git commit -m "content(core-1000): chunk 001 (ranks 1-100)"
```

---

### Task 6: Generar chunks 002–010

**Files:**

- Create: `public/core-1000/words-002.json` … `words-010.json`
- Maybe modify: `scripts/core-1000/data/ipa-exceptions.json`

- [ ] **Steps 1–9: Para cada chunk N de 002 a 010**, generar `public/core-1000/words-00N.json` con `{ "version": 1, "entries": [...] }` y las 100 entradas de las filas `(N-1)*100+1` a `N*100` del CSV, aplicando las mismas reglas de autoría (se repiten aquí por si esta task se ejecuta aislada):

  - Palabras y ranks exactos del CSV, en orden.
  - IPA General American con SOLO los símbolos de `ARPABET_TO_IPA` (`lib/pronunciation/phonemes.ts`) + ˈ ˌ + ə para reducidas, formato `/…/`.
  - `ipa_weak` solo para palabras en `WEAK_FORM_WHITELIST` con reducción estándar en GA; `sentence_ipa` obligatorio cuando hay `ipa_weak`, con la reducción aplicada en contexto.
  - `example_sentence`: 4–10 palabras, A1/A2, contiene la palabra exacta; weak forms en posición átona.
  - `pos` del enum `CORE_POS` (el más frecuente); `cefr_level` = nivel típico de adquisición.

  Después de cada chunk: `npm run validate:core1000` → revisar cada `ipa-mismatch` (corregir el IPA, o añadir excepción con razón escrita en `ipa-exceptions.json`) → re-run hasta PASS → commit `content(core-1000): chunk 00N (ranks X-Y)`. **Un commit por chunk** — los PRs de contenido se revisan chunk a chunk.

- [ ] **Step 10: Verificación final del dataset completo**

Run: `npm run validate:core1000`
Expected: PASS con 1000 palabras cargadas (añade un `console.log(words.length)` temporal o verifica con `node -e` que los 10 archivos existen y suman 1000 entradas).

---

### Task 7: Tipo DailyProgress + helpers Dexie

**Files:**

- Modify: `lib/types.ts` (interfaz `DailyProgress`, línea ~118)
- Modify: `lib/db/index.ts` (nuevos helpers al final de la sección "Daily Progress Helpers")

Campo no indexado en Dexie ⇒ **no requiere version bump** del schema.

- [ ] **Step 1: Añadir el campo al tipo**

En `lib/types.ts`, dentro de `interface DailyProgress`:

```ts
export interface DailyProgress {
  id?: number;
  date: string; // YYYY-MM-DD
  totalAttempts: number;
  correctAttempts: number;
  averageAccuracy: number;
  xp: number;
  wordsStudied: string[];
  /** Palabras del Core 1000 introducidas hoy (cupo diario de nuevas). */
  core1000NewWords?: string[];
}
```

- [ ] **Step 2: Añadir helpers en `lib/db/index.ts`**

Después de `updateDailyProgress` (y reutilizando el `getTodayKey()` privado existente del mismo archivo):

```ts
// ── Core 1000 Helpers ──

const CORE1000_SRS_PREFIX = "c1k:";

/** Todas las entradas SRS del Core 1000 (scan; ~1000 filas máx, aceptable). */
export async function getCore1000SrsEntries(): Promise<SRSData[]> {
  return db.srsData.filter((e) => e.wordId.startsWith(CORE1000_SRS_PREFIX)).toArray();
}

/** Palabras del Core 1000 introducidas hoy (para el cupo de nuevas). */
export async function getCore1000IntroducedToday(): Promise<string[]> {
  const row = await db.dailyProgress.where("date").equals(getTodayKey()).first();
  return row?.core1000NewWords ?? [];
}

/** Registra una palabra nueva introducida hoy. Crea la fila del día si no existe. */
export async function recordCore1000Introduction(word: string): Promise<void> {
  const today = getTodayKey();
  const existing = await db.dailyProgress.where("date").equals(today).first();
  if (existing) {
    const set = new Set(existing.core1000NewWords ?? []);
    set.add(word);
    await db.dailyProgress.update(existing.id!, { core1000NewWords: [...set] });
  } else {
    await db.dailyProgress.add({
      date: today,
      totalAttempts: 0,
      correctAttempts: 0,
      averageAccuracy: 0,
      xp: 0,
      wordsStudied: [],
      core1000NewWords: [word],
    });
  }
}
```

- [ ] **Step 3: Verify**

Run: `npm run type-check`
Expected: sin errores. (Estos helpers se cubren funcionalmente por el component test de Task 11; no llevan unit test propio — la lógica con valor está en `queue.ts`, que sí lo lleva.)

- [ ] **Step 4: Commit**

```bash
git add lib/types.ts lib/db/index.ts
git commit -m "feat(core-1000): Dexie helpers for SRS entries and daily new-card quota"
```

---

### Task 8: Queue builder puro

**Files:**

- Create: `lib/core-1000/queue.ts`
- Test: `lib/core-1000/__tests__/queue.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/core-1000/__tests__/queue.test.ts
import { describe, expect, it } from "vitest";
import { buildSessionQueue } from "../queue";
import { core1000WordId, type CoreWord } from "../types";
import type { SRSData } from "@/lib/types";

const NOW = new Date("2026-06-11T12:00:00Z");

function word(rank: number, w: string): CoreWord {
  return {
    rank, word: w, pos: "noun", ipa_strong: `/${w}/`,
    example_sentence: `A ${w} here.`, cefr_level: "A1",
  };
}

function srs(w: string, nextReviewIso: string): SRSData {
  return {
    wordId: core1000WordId(w), word: w, ease: 2.5,
    interval: 1, repetitions: 1, nextReview: nextReviewIso,
  };
}

const WORDS = [word(1, "the"), word(2, "be"), word(3, "and"), word(4, "of"), word(5, "to")];

describe("buildSessionQueue", () => {
  it("puts due reviews first, then new cards by rank", () => {
    const q = buildSessionQueue({
      words: WORDS,
      srsEntries: [srs("of", "2026-06-10T00:00:00Z")],
      introducedToday: [],
      now: NOW,
      newPerDay: 2,
    });
    expect(q.map((i) => [i.entry.word, i.isNew])).toEqual([
      ["of", false], ["the", true], ["be", true],
    ]);
  });

  it("excludes reviews not yet due", () => {
    const q = buildSessionQueue({
      words: WORDS,
      srsEntries: [srs("of", "2026-06-20T00:00:00Z")],
      introducedToday: [],
      now: NOW,
      newPerDay: 0,
    });
    expect(q).toEqual([]);
  });

  it("discounts cards already introduced today from the quota", () => {
    const q = buildSessionQueue({
      words: WORDS,
      srsEntries: [srs("the", "2026-06-12T00:00:00Z"), srs("be", "2026-06-12T00:00:00Z")],
      introducedToday: ["the", "be"],
      now: NOW,
      newPerDay: 3,
    });
    expect(q.map((i) => i.entry.word)).toEqual(["and"]); // 3 - 2 = 1 nueva
  });

  it("never returns a negative quota", () => {
    const q = buildSessionQueue({
      words: WORDS,
      srsEntries: [],
      introducedToday: ["the", "be", "and", "of"],
      now: NOW,
      newPerDay: 2,
    });
    expect(q).toEqual([]);
  });

  it("ignores srs entries whose word is not in the dataset", () => {
    const q = buildSessionQueue({
      words: WORDS,
      srsEntries: [srs("ghost", "2026-06-01T00:00:00Z")],
      introducedToday: [],
      now: NOW,
      newPerDay: 0,
    });
    expect(q).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/core-1000/__tests__/queue.test.ts`
Expected: FAIL — "Cannot find module '../queue'"

- [ ] **Step 3: Write the implementation**

```ts
// lib/core-1000/queue.ts
// Pure session-queue builder: SM-2 due reviews first, then today's remaining
// quota of new cards in rank order. Pure on purpose — all Dexie I/O lives in
// the caller (useCore1000Session) so this is trivially unit-testable.

import { NEW_CARDS_PER_DAY, core1000WordId, type CoreWord } from "./types";
import type { SRSData } from "@/lib/types";

export interface Core1000QueueItem {
  entry: CoreWord;
  isNew: boolean;
}

export interface BuildQueueOptions {
  words: CoreWord[];          // dataset completo, ordenado por rank
  srsEntries: SRSData[];      // entradas existentes con prefijo c1k:
  introducedToday: string[];  // palabras nuevas ya introducidas hoy
  now: Date;
  newPerDay?: number;
}

export function buildSessionQueue({
  words,
  srsEntries,
  introducedToday,
  now,
  newPerDay = NEW_CARDS_PER_DAY,
}: BuildQueueOptions): Core1000QueueItem[] {
  const byId = new Map(words.map((w) => [core1000WordId(w.word), w]));
  const seen = new Set(srsEntries.map((e) => e.wordId));

  const due: Core1000QueueItem[] = srsEntries
    .filter((e) => new Date(e.nextReview).getTime() <= now.getTime())
    .map((e) => byId.get(e.wordId))
    .filter((entry): entry is CoreWord => entry !== undefined)
    .sort((a, b) => a.rank - b.rank)
    .map((entry) => ({ entry, isNew: false }));

  const quota = Math.max(0, newPerDay - introducedToday.length);
  const fresh: Core1000QueueItem[] = words
    .filter((w) => !seen.has(core1000WordId(w.word)))
    .slice(0, quota)
    .map((entry) => ({ entry, isNew: true }));

  return [...due, ...fresh];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/core-1000/__tests__/queue.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/core-1000/queue.ts lib/core-1000/__tests__/queue.test.ts
git commit -m "feat(core-1000): pure session queue builder (due + daily new quota)"
```

---

### Task 9: Grading + fetch cliente

**Files:**

- Create: `lib/core-1000/grade.ts`
- Create: `lib/core-1000/client.ts`
- Test: `lib/core-1000/__tests__/grade.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/core-1000/__tests__/grade.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getSRSData: vi.fn(),
  saveSRSData: vi.fn(async () => undefined),
  saveAttempt: vi.fn(async () => undefined),
  updateDailyProgress: vi.fn(async () => undefined),
  updateUserStats: vi.fn(async () => undefined),
}));
vi.mock("@/lib/db", () => dbMocks);

import { gradeCore1000Word } from "../grade";
import type { SRSData } from "@/lib/types";

beforeEach(() => {
  vi.clearAllMocks();
  dbMocks.getSRSData.mockResolvedValue(undefined);
});

describe("gradeCore1000Word", () => {
  it("creates the SRS entry on first grade and namespaces the id", async () => {
    await gradeCore1000Word("To", 4);
    expect(dbMocks.getSRSData).toHaveBeenCalledWith("c1k:to");
    const saved = dbMocks.saveSRSData.mock.calls[0][0] as SRSData;
    expect(saved.wordId).toBe("c1k:to");
    expect(saved.repetitions).toBe(1);
  });

  it("updates an existing entry instead of resetting it", async () => {
    dbMocks.getSRSData.mockResolvedValue({
      wordId: "c1k:to", word: "to", ease: 2.5, interval: 1,
      repetitions: 2, nextReview: "2026-06-10T00:00:00Z",
    } satisfies SRSData);
    await gradeCore1000Word("to", 5);
    const saved = dbMocks.saveSRSData.mock.calls[0][0] as SRSData;
    expect(saved.repetitions).toBe(3);
  });

  it("persists attempt + daily progress + stats when accuracy is provided (speak path)", async () => {
    await gradeCore1000Word("to", 4, { accuracy: 85, transcript: "i want to go home" });
    expect(dbMocks.saveAttempt).toHaveBeenCalledOnce();
    expect(dbMocks.updateDailyProgress).toHaveBeenCalledOnce();
    expect(dbMocks.updateUserStats).toHaveBeenCalledOnce();
  });

  it("only touches SRS on self-grade (no accuracy)", async () => {
    await gradeCore1000Word("to", 3);
    expect(dbMocks.saveAttempt).not.toHaveBeenCalled();
    expect(dbMocks.updateDailyProgress).not.toHaveBeenCalled();
    expect(dbMocks.updateUserStats).not.toHaveBeenCalled();
    expect(dbMocks.saveSRSData).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/core-1000/__tests__/grade.test.ts`
Expected: FAIL — "Cannot find module '../grade'"

- [ ] **Step 3: Write the implementations**

```ts
// lib/core-1000/grade.ts
// Single write path for grading a Core 1000 card. Both the speak flow
// (quality derived from accuracy) and the self-grade fallback land here, so
// SM-2 state can never diverge between the two.

import { createSRSEntry, updateSRS } from "@/lib/srs";
import { calculateXP } from "@/lib/pronunciation/scoring";
import {
  getSRSData, saveSRSData, saveAttempt, updateDailyProgress, updateUserStats,
} from "@/lib/db";
import { core1000WordId } from "./types";

export interface GradeExtras {
  /** Accuracy 0–100 del scoring hablado. Ausente en self-grade. */
  accuracy?: number;
  transcript?: string;
}

export async function gradeCore1000Word(
  word: string,
  quality: number,
  extras: GradeExtras = {}
): Promise<void> {
  const normalized = word.toLowerCase();
  const wordId = core1000WordId(normalized);

  const current = (await getSRSData(wordId)) ?? createSRSEntry(wordId, normalized);
  await saveSRSData(updateSRS(current, quality));

  // Solo el camino hablado alimenta attempts/XP; el self-grade no inventa accuracy.
  if (extras.accuracy !== undefined) {
    const xp = calculateXP(extras.accuracy);
    await saveAttempt({
      word: normalized,
      lessonId: "core-1000",
      transcript: extras.transcript ?? "",
      accuracy: extras.accuracy,
      isCorrect: extras.accuracy >= 70,
      timestamp: new Date().toISOString(),
    });
    await updateDailyProgress(extras.accuracy, normalized, xp);
    await updateUserStats(extras.accuracy, xp);
  }
}
```

```ts
// lib/core-1000/client.ts
// Client-side dataset fetch. Chunks are static assets under /core-1000/ and
// HTTP-cacheable, so offline-cached sessions keep working. We always load
// every available chunk: mapping a due wordId back to its entry needs the
// whole dataset anyway (rank does not live in srsData).

import { CoreChunkSchema } from "./schema";
import { MAX_CHUNKS, type CoreWord } from "./types";

let cache: CoreWord[] | null = null;

export async function fetchCoreWords(): Promise<CoreWord[]> {
  if (cache) return cache;
  const words: CoreWord[] = [];
  for (let n = 1; n <= MAX_CHUNKS; n++) {
    const res = await fetch(`/core-1000/words-${String(n).padStart(3, "0")}.json`);
    if (!res.ok) break; // chunks contiguos: el primero ausente termina la serie
    const parsed = CoreChunkSchema.safeParse(await res.json());
    if (!parsed.success) {
      console.error(`[core-1000] invalid chunk ${n}`, parsed.error);
      break;
    }
    words.push(...parsed.data.entries);
  }
  cache = words;
  return words;
}

/** Solo para tests. */
export function __resetCoreWordsCache(): void {
  cache = null;
}
```

- [ ] **Step 4: Run tests + type-check**

Run: `npx vitest run lib/core-1000/__tests__/grade.test.ts && npm run type-check`
Expected: PASS (4 tests), sin errores de tipos

- [ ] **Step 5: Commit**

```bash
git add lib/core-1000/grade.ts lib/core-1000/client.ts lib/core-1000/__tests__/grade.test.ts
git commit -m "feat(core-1000): unified grading path and client chunk fetcher"
```

---

### Task 10: Hook de sesión

**Files:**

- Create: `hooks/useCore1000Session.ts`

La lógica con riesgo (cola, grading) ya tiene unit tests; este hook es orquestación fina y se cubre con el component test de Task 11.

- [ ] **Step 1: Write the implementation**

```ts
// hooks/useCore1000Session.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchCoreWords } from "@/lib/core-1000/client";
import { buildSessionQueue, type Core1000QueueItem } from "@/lib/core-1000/queue";
import { gradeCore1000Word, type GradeExtras } from "@/lib/core-1000/grade";
import { NEW_CARDS_PER_DAY } from "@/lib/core-1000/types";
import {
  getCore1000SrsEntries, getCore1000IntroducedToday, recordCore1000Introduction,
} from "@/lib/db";

export type Core1000Phase = "loading" | "study" | "speak" | "done" | "empty";

export interface Core1000Stats {
  totalWords: number;   // tamaño del dataset disponible
  learned: number;      // entradas SRS existentes
  dueCount: number;     // vencidas en esta sesión
  newToday: number;     // nuevas ya introducidas hoy
  newQuota: number;     // cupo diario
}

interface UseCore1000SessionReturn {
  phase: Core1000Phase;
  current: Core1000QueueItem | null;
  position: number;       // 1-based dentro de la cola
  queueLength: number;
  stats: Core1000Stats;
  startSpeak: () => void; // study → speak (tarjetas nuevas)
  submitGrade: (quality: number, extras?: GradeExtras) => Promise<void>;
}

const EMPTY_STATS: Core1000Stats = {
  totalWords: 0, learned: 0, dueCount: 0, newToday: 0, newQuota: NEW_CARDS_PER_DAY,
};

export function useCore1000Session(): UseCore1000SessionReturn {
  const [phase, setPhase] = useState<Core1000Phase>("loading");
  const [queue, setQueue] = useState<Core1000QueueItem[]>([]);
  const [index, setIndex] = useState(0);
  const [stats, setStats] = useState<Core1000Stats>(EMPTY_STATS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [words, srsEntries, introducedToday] = await Promise.all([
        fetchCoreWords(),
        getCore1000SrsEntries(),
        getCore1000IntroducedToday(),
      ]);
      if (cancelled) return;
      const items = buildSessionQueue({ words, srsEntries, introducedToday, now: new Date() });
      setQueue(items);
      setStats({
        totalWords: words.length,
        learned: srsEntries.length,
        dueCount: items.filter((i) => !i.isNew).length,
        newToday: introducedToday.length,
        newQuota: NEW_CARDS_PER_DAY,
      });
      if (items.length === 0) setPhase("empty");
      else setPhase(items[0].isNew ? "study" : "speak");
    })();
    return () => { cancelled = true; };
  }, []);

  const advance = useCallback((from: number) => {
    const next = from + 1;
    if (next >= queue.length) {
      setPhase("done");
      return;
    }
    setIndex(next);
    setPhase(queue[next].isNew ? "study" : "speak");
  }, [queue]);

  const startSpeak = useCallback(() => setPhase("speak"), []);

  const submitGrade = useCallback(
    async (quality: number, extras?: GradeExtras) => {
      const item = queue[index];
      if (!item) return;
      await gradeCore1000Word(item.entry.word, quality, extras);
      if (item.isNew) {
        await recordCore1000Introduction(item.entry.word.toLowerCase());
        setStats((s) => ({ ...s, newToday: s.newToday + 1, learned: s.learned + 1 }));
      }
      advance(index);
    },
    [queue, index, advance]
  );

  return {
    phase,
    current: queue[index] ?? null,
    position: Math.min(index + 1, queue.length),
    queueLength: queue.length,
    stats,
    startSpeak,
    submitGrade,
  };
}
```

- [ ] **Step 2: Verify**

Run: `npm run type-check`
Expected: sin errores

- [ ] **Step 3: Commit**

```bash
git add hooks/useCore1000Session.ts
git commit -m "feat(core-1000): session orchestration hook"
```

---

### Task 11: Componentes UI + página

**Files:**

- Create: `components/practice/core-1000/SelfGradeBar.tsx`
- Create: `components/practice/core-1000/WordStudyCard.tsx`
- Create: `components/practice/core-1000/SpeakReviewCard.tsx`
- Create: `components/practice/core-1000/DeckProgressHeader.tsx`
- Create: `components/practice/core-1000/SessionDone.tsx`
- Create: `components/practice/core-1000/Core1000Session.tsx`
- Create: `app/practice/core-1000/page.tsx`
- Test: `components/practice/core-1000/__tests__/Core1000Session.test.tsx`

Antes de implementar, mira `components/exercises/SpeakScoredExercise.tsx` — `SpeakReviewCard` sigue su mismo patrón (useSpeechRecognition + defaultEvaluationEngine + PronunciationFeedback) con dos diferencias: el expected es la **oración**, y al continuar entrega `(quality, extras)` en vez de `(isCorrect, answer)`.

- [ ] **Step 1: SelfGradeBar**

```tsx
// components/practice/core-1000/SelfGradeBar.tsx
'use client'

// Planned structure:
// <SelfGradeBar>
//   <GradeButton × 4 />   — Otra vez / Difícil / Bien / Fácil
// </SelfGradeBar>

import { cn } from '@/lib/cn'

const GRADES = [
  { label: 'Otra vez', quality: 1 },
  { label: 'Difícil', quality: 3 },
  { label: 'Bien', quality: 4 },
  { label: 'Fácil', quality: 5 },
] as const

interface Props {
  onGrade: (quality: number) => void
  disabled?: boolean
}

export function SelfGradeBar({ onGrade, disabled }: Props) {
  return (
    <div className="flex w-full justify-center gap-2">
      {GRADES.map(({ label, quality }) => (
        <button
          key={quality}
          type="button"
          disabled={disabled}
          onClick={() => onGrade(quality)}
          className={cn(
            'flex-1 max-w-28 py-2 px-3 text-xs font-medium rounded-[var(--radius-full)] border cursor-pointer [font-family:inherit] disabled:opacity-40',
            quality === 1
              ? 'border-[var(--error)] text-[var(--error)] bg-transparent'
              : 'border-[var(--border-subtle)] text-[var(--text-secondary)] bg-transparent',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: WordStudyCard**

```tsx
// components/practice/core-1000/WordStudyCard.tsx
'use client'

// Planned structure:
// <WordStudyCard>
//   <WordHeading />      — palabra + chips pos/CEFR
//   <PronRow strong />   — IPA strong + TTS de la palabra aislada
//   <PronRow weak />     — IPA weak + TTS de la oración (solo si hay ipa_weak)
//   <SentenceBlock />    — oración con la palabra resaltada + sentence_ipa
//   <ContinueButton />
// </WordStudyCard>

import { Volume2 } from 'lucide-react'
import { speak } from '@/lib/phoneme-practice/tts'
import { hasReduction, type CoreWord } from '@/lib/core-1000/types'

interface Props {
  entry: CoreWord
  onContinue: () => void
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-tiny font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)] border border-[var(--border-subtle)] rounded-[var(--radius-full)] py-0.5 px-2">
      {children}
    </span>
  )
}

function PronRow({ label, ipa, onPlay }: { label: string; ipa: string; onPlay: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-[var(--border-subtle)] last:border-b-0">
      <div className="flex items-baseline gap-3">
        <span className="text-tiny font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)] w-14">
          {label}
        </span>
        <span className="[font-family:var(--font-ipa),monospace] text-lg text-[var(--primary)]">{ipa}</span>
      </div>
      <button
        type="button"
        onClick={onPlay}
        aria-label={`Escuchar forma ${label.toLowerCase()}`}
        className="inline-flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-[var(--radius-full)] border border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] cursor-pointer [font-family:inherit]"
      >
        <Volume2 size={14} aria-hidden />
        Escuchar
      </button>
    </div>
  )
}

function SentenceBlock({ entry }: { entry: CoreWord }) {
  const regex = new RegExp(`\\b(${entry.word})\\b`, 'i')
  const [before, match, after] = entry.example_sentence.split(regex)
  return (
    <div className="flex flex-col gap-1 text-center">
      <p className="text-base text-[var(--text-primary)] m-0">
        {before}
        <mark className="bg-transparent font-semibold text-[var(--primary)]">{match}</mark>
        {after}
      </p>
      {entry.sentence_ipa && (
        <p className="[font-family:var(--font-ipa),monospace] text-sm text-[var(--text-tertiary)] m-0">
          {entry.sentence_ipa}
        </p>
      )}
    </div>
  )
}

export function WordStudyCard({ entry, onContinue }: Props) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5">
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <Chip>#{entry.rank}</Chip>
          <Chip>{entry.pos}</Chip>
          <Chip>{entry.cefr_level}</Chip>
        </div>
        <h2 className="[font-family:var(--font-phoneme),serif] text-5xl font-bold tracking-[-1px] leading-none text-[var(--text-primary)] m-0">
          {entry.word}
        </h2>
      </div>

      <div className="w-full">
        <PronRow label="Strong" ipa={entry.ipa_strong} onPlay={() => speak(entry.word)} />
        {hasReduction(entry) && (
          <PronRow
            label="Weak"
            ipa={entry.ipa_weak!}
            onPlay={() => speak(entry.example_sentence, { rate: 0.95 })}
          />
        )}
      </div>

      <SentenceBlock entry={entry} />

      <button
        type="button"
        onClick={onContinue}
        className="text-xs py-2 px-5 rounded-[var(--radius-full)] bg-[var(--primary)] text-white border-none cursor-pointer [font-family:inherit] font-medium"
      >
        Practicar
      </button>
    </div>
  )
}
```

Notas:
- La weak form se escucha **en la oración completa** — aislada no existe. Por eso su botón TTS reproduce `example_sentence`.
- **TTS no disponible** (spec §5): `speak()` ya es no-op sin `speechSynthesis`, pero el spec pide botones deshabilitados. Añade en ambos componentes con botones de audio: `const ttsAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window` y pasa `disabled={!ttsAvailable}` (+ `disabled:opacity-40` en la clase). El IPA queda siempre visible.

- [ ] **Step 3: SpeakReviewCard**

```tsx
// components/practice/core-1000/SpeakReviewCard.tsx
'use client'

// Planned structure:
// <SpeakReviewCard>
//   <SentencePrompt />          — oración objetivo + IPA + TTS modelo
//   <MicButton />               — useSpeechRecognition → transcript
//   <PronunciationFeedback />   — resultado + Continuar
//   <SelfGradeBar />            — fallback sin SpeechRecognition o con error
// </SpeakReviewCard>

import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Volume2 } from 'lucide-react'
import { speak } from '@/lib/phoneme-practice/tts'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { defaultEvaluationEngine } from '@/lib/exercises/evaluation'
import { accuracyToQuality } from '@/lib/srs'
import { getFeedbackMessage, calculateXP } from '@/lib/pronunciation/scoring'
import PronunciationFeedback from '@/components/lesson/PronunciationFeedback'
import { SelfGradeBar } from './SelfGradeBar'
import { cn } from '@/lib/cn'
import type { CoreWord } from '@/lib/core-1000/types'
import type { WordResult } from '@/lib/types'

interface Props {
  entry: CoreWord
  onGraded: (quality: number, extras?: { accuracy: number; transcript: string }) => void
}

interface Scored {
  score: number
  wordResults: WordResult[]
  transcript: string
}

export function SpeakReviewCard({ entry, onGraded }: Props) {
  const { status, result, isSupported, start, stop, reset } = useSpeechRecognition()
  const [scored, setScored] = useState<Scored | null>(null)
  const [isScoring, setIsScoring] = useState(false)
  const submitted = useRef(false)

  const sentence = entry.example_sentence

  // Reset interno cuando cambia la tarjeta
  useEffect(() => {
    submitted.current = false
    setScored(null)
    reset()
  }, [entry.rank, reset])

  // Score cuando llega el transcript
  useEffect(() => {
    if (!isSupported || status !== 'done' || !result || isScoring || scored) return
    setIsScoring(true)
    defaultEvaluationEngine
      .evaluate({
        // El engine de pronunciación evalúa speech contra texto esperado;
        // mismo uso que useScoring/SpeakScoredExercise, aquí con la oración.
        exercise: { domain: 'pronunciation', mode: 'speak' },
        expected: sentence,
        actual: { kind: 'speech', transcript: result.transcript },
      })
      .then((evalResult) => {
        setScored({
          score: evalResult.score ?? 0,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          wordResults: (evalResult as any).wordResults ?? [],
          transcript: result.transcript,
        })
      })
      .finally(() => setIsScoring(false))
  }, [isSupported, status, result, isScoring, scored, sentence])

  const handleContinue = () => {
    if (!scored || submitted.current) return
    submitted.current = true
    onGraded(accuracyToQuality(scored.score), {
      accuracy: scored.score,
      transcript: scored.transcript,
    })
  }

  const handleSelfGrade = (quality: number) => {
    if (submitted.current) return
    submitted.current = true
    onGraded(quality)
  }

  const handleRetry = () => {
    setScored(null)
    reset()
  }

  const isListening = status === 'listening'
  const useFallback = !isSupported || status === 'error'

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5">
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-xs font-semibold uppercase tracking-[.08em] text-[var(--text-tertiary)] m-0">
          Di la oración
        </p>
        <p className="text-xl text-[var(--text-primary)] m-0">{sentence}</p>
        {entry.sentence_ipa && (
          <p className="[font-family:var(--font-ipa),monospace] text-sm text-[var(--text-tertiary)] m-0">
            {entry.sentence_ipa}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => speak(sentence, { rate: 0.95 })}
        className="inline-flex items-center gap-1.5 text-xs py-2 px-4 rounded-[var(--radius-full)] border border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] cursor-pointer [font-family:inherit]"
      >
        <Volume2 size={14} aria-hidden />
        Escuchar modelo
      </button>

      {useFallback ? (
        <div className="flex w-full flex-col items-center gap-2">
          <p className="text-xs text-[var(--text-tertiary)] m-0">
            Sin micrófono disponible — practica en voz alta y califícate:
          </p>
          <SelfGradeBar onGrade={handleSelfGrade} />
        </div>
      ) : !scored ? (
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={isListening ? stop : start}
            disabled={isScoring}
            aria-label={isListening ? 'Detener grabación' : 'Grabar mi voz'}
            className={cn(
              'w-20 h-20 rounded-full border-none flex items-center justify-center cursor-pointer transition-all text-white disabled:opacity-40',
              isListening
                ? 'bg-[var(--error)] shadow-[0_0_0_14px_color-mix(in_oklch,var(--error)_18%,transparent)]'
                : 'bg-[var(--primary)] shadow-[0_4px_16px_color-mix(in_oklch,var(--primary)_35%,transparent)]',
            )}
          >
            {isListening ? <MicOff size={28} /> : <Mic size={28} />}
          </button>
          <p className="text-xs text-[var(--text-tertiary)] tracking-[.05em] m-0">
            {isListening ? 'Escuchando… toca para parar' : isScoring ? 'Analizando…' : 'Toca para hablar'}
          </p>
        </div>
      ) : (
        <>
          <PronunciationFeedback
            wordResults={scored.wordResults}
            accuracy={scored.score}
            feedback={getFeedbackMessage(scored.score, 70)}
            xpEarned={calculateXP(scored.score)}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRetry}
              className="text-xs py-1.5 px-3 rounded-[var(--radius-full)] border border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] cursor-pointer [font-family:inherit]"
            >
              Intentar de nuevo
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className="text-xs py-1.5 px-3 rounded-[var(--radius-full)] bg-[var(--primary)] text-white border-none cursor-pointer [font-family:inherit] font-medium"
            >
              Continuar
            </button>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 4: DeckProgressHeader y SessionDone**

```tsx
// components/practice/core-1000/DeckProgressHeader.tsx

// Planned structure:
// <DeckProgressHeader>
//   <Stat × 3 />   — aprendidas x/1000 · vencidas hoy · nuevas hoy x/cupo
// </DeckProgressHeader>

import type { Core1000Stats } from '@/hooks/useCore1000Session'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-sm font-semibold text-[var(--text-primary)]">{value}</span>
      <span className="text-tiny uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{label}</span>
    </div>
  )
}

export function DeckProgressHeader({ stats }: { stats: Core1000Stats }) {
  return (
    <div className="flex w-full max-w-md items-center justify-around border-b border-[var(--border-subtle)] pb-4">
      <Stat label="Aprendidas" value={`${stats.learned}/${stats.totalWords}`} />
      <Stat label="Vencidas hoy" value={String(stats.dueCount)} />
      <Stat label="Nuevas hoy" value={`${stats.newToday}/${stats.newQuota}`} />
    </div>
  )
}
```

```tsx
// components/practice/core-1000/SessionDone.tsx

// Planned structure:
// <SessionDone>
//   <Headline />   — sesión completa / nada pendiente
//   <Stats />      — resumen breve
// </SessionDone>

import type { Core1000Stats } from '@/hooks/useCore1000Session'

interface Props {
  stats: Core1000Stats
  /** true cuando la cola estaba vacía desde el inicio */
  wasEmpty?: boolean
}

export function SessionDone({ stats, wasEmpty }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 text-center py-10">
      <h2 className="font-display text-h3 text-[var(--text-primary)] m-0">
        {wasEmpty ? 'Nada pendiente por hoy' : 'Sesión completa'}
      </h2>
      <p className="text-sm text-[var(--text-secondary)] m-0">
        {stats.learned} de {stats.totalWords} palabras en tu deck · {stats.newToday}/{stats.newQuota} nuevas hoy
      </p>
      <p className="text-xs text-[var(--text-tertiary)] m-0">
        Vuelve mañana — el repaso espaciado hace el resto.
      </p>
    </div>
  )
}
```

- [ ] **Step 5: Core1000Session + page**

```tsx
// components/practice/core-1000/Core1000Session.tsx
'use client'

// Planned structure:
// <Core1000Session>
//   <DeckProgressHeader />
//   <WordStudyCard />    — fase study (tarjetas nuevas)
//   <SpeakReviewCard />  — fase speak
//   <SessionDone />      — fases done / empty
// </Core1000Session>

import { useCore1000Session } from '@/hooks/useCore1000Session'
import { DeckProgressHeader } from './DeckProgressHeader'
import { WordStudyCard } from './WordStudyCard'
import { SpeakReviewCard } from './SpeakReviewCard'
import { SessionDone } from './SessionDone'

export function Core1000Session() {
  const { phase, current, position, queueLength, stats, startSpeak, submitGrade } =
    useCore1000Session()

  if (phase === 'loading') {
    return (
      <p className="text-sm text-[var(--text-tertiary)] text-center py-10">Cargando deck…</p>
    )
  }

  if (phase === 'empty' || phase === 'done') {
    return <SessionDone stats={stats} wasEmpty={phase === 'empty'} />
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <DeckProgressHeader stats={stats} />
      <p className="text-tiny uppercase tracking-[0.12em] text-[var(--text-tertiary)] m-0">
        {position} / {queueLength}
      </p>
      {phase === 'study' && current && (
        <WordStudyCard entry={current.entry} onContinue={startSpeak} />
      )}
      {phase === 'speak' && current && (
        <SpeakReviewCard entry={current.entry} onGraded={submitGrade} />
      )}
    </div>
  )
}
```

```tsx
// app/practice/core-1000/page.tsx
import PageLayout from '@/components/layout/PageLayout'
import { Core1000Session } from '@/components/practice/core-1000/Core1000Session'

export const metadata = { title: 'Core 1000' }

export default function Core1000Page() {
  return (
    <PageLayout cardWrapper={false}>
      <div className="mx-auto w-full max-w-[1080px] px-6 pb-18">
        <header className="flex flex-col gap-2 pt-2 pb-8">
          <span className="text-tiny font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            Vocabulario · repaso espaciado
          </span>
          <h1 className="font-display text-h2 font-normal leading-tight tracking-[-0.02em] text-[var(--text-primary)]">
            Core 1000
          </h1>
        </header>
        <Core1000Session />
      </div>
    </PageLayout>
  )
}
```

- [ ] **Step 6: Write the component test**

```tsx
// components/practice/core-1000/__tests__/Core1000Session.test.tsx
// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { CoreWord } from '@/lib/core-1000/types'

const WORDS: CoreWord[] = [
  {
    rank: 1, word: 'the', pos: 'article', ipa_strong: '/ðiː/', ipa_weak: '/ðə/',
    example_sentence: 'The book is here.', sentence_ipa: '/ðə ˈbʊk ɪz ˈhɪɹ/', cefr_level: 'A1',
  },
  {
    rank: 2, word: 'be', pos: 'verb', ipa_strong: '/biː/',
    example_sentence: 'I want to be happy.', cefr_level: 'A1',
  },
]

vi.mock('@/lib/core-1000/client', () => ({
  fetchCoreWords: vi.fn(async () => WORDS),
}))

const dbMocks = vi.hoisted(() => ({
  getCore1000SrsEntries: vi.fn(async () => []),
  getCore1000IntroducedToday: vi.fn(async () => []),
  recordCore1000Introduction: vi.fn(async () => undefined),
  getSRSData: vi.fn(async () => undefined),
  saveSRSData: vi.fn(async () => undefined),
  saveAttempt: vi.fn(async () => undefined),
  updateDailyProgress: vi.fn(async () => undefined),
  updateUserStats: vi.fn(async () => undefined),
}))
vi.mock('@/lib/db', () => dbMocks)

vi.mock('@/lib/phoneme-practice/tts', () => ({
  speak: vi.fn(),
  getEnglishVoices: vi.fn(() => []),
  invalidateVoiceCache: vi.fn(),
}))

// Forzamos el fallback self-grade: sin SpeechRecognition el flujo no depende
// del mic en jsdom y aún ejercita grading + avance de cola.
vi.mock('@/hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: () => ({
    status: 'idle', result: null, isSupported: false,
    start: vi.fn(), stop: vi.fn(), reset: vi.fn(),
  }),
}))

import { Core1000Session } from '../Core1000Session'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Core1000Session', () => {
  it('introduces a new card as study first, then speak with self-grade fallback', async () => {
    const user = userEvent.setup()
    render(<Core1000Session />)

    // study phase: tarjeta con strong y weak
    await screen.findByRole('heading', { name: 'the' })
    expect(screen.getByText('/ðiː/')).toBeTruthy()
    expect(screen.getByText('/ðə/')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Practicar' }))

    // speak phase con fallback (mock isSupported=false)
    expect(await screen.findByText('The book is here.')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Bien' }))

    // graded: SRS + introducción registrada, avanza a la segunda tarjeta
    await waitFor(() => expect(dbMocks.saveSRSData).toHaveBeenCalledOnce())
    expect(dbMocks.recordCore1000Introduction).toHaveBeenCalledWith('the')
    await screen.findByRole('heading', { name: 'be' })
  })

  it('shows the empty state when there is nothing due and no quota left', async () => {
    dbMocks.getCore1000IntroducedToday.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => `w${i}`)
    )
    render(<Core1000Session />)
    expect(await screen.findByText('Nada pendiente por hoy')).toBeTruthy()
  })
})
```

- [ ] **Step 7: Run tests + type-check + line budget**

Run: `npx vitest run components/practice/core-1000 && npm run type-check`
Expected: PASS (2 tests), sin errores. Verifica además que ningún archivo nuevo supera 250 líneas (`SpeakReviewCard` es el más cercano; si se pasa, extrae el bloque del mic a un sub-componente `MicRecorder` en el mismo directorio).

- [ ] **Step 8: Commit**

```bash
git add components/practice/core-1000 app/practice/core-1000 hooks/useCore1000Session.ts
git commit -m "feat(core-1000): session UI with strong/weak study card and spoken review"
```

---

### Task 12: Entry points + verificación final

**Files:**

- Modify: `components/sidebar/navConfig.ts`
- Modify: `app/practice/decks/page.tsx`

- [ ] **Step 1: Sidebar**

En `components/sidebar/navConfig.ts`: añadir `ListOrdered` al import de `lucide-react` y, en `learningNav.items`, después de `Words`:

```ts
{ name: "Core 1000", href: "/practice/core-1000", icon: ListOrdered },
```

- [ ] **Step 2: Banner en el índice de decks**

En `app/practice/decks/page.tsx`, importar `Link` de `next/link` y añadir entre `</header>` y `<DecksIndexClient …/>`:

```tsx
<Link
  href="/practice/core-1000"
  className="mb-6 flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] px-5 py-4 no-underline"
>
  <div className="flex flex-col gap-0.5">
    <span className="text-sm font-semibold text-[var(--text-primary)]">Core 1000</span>
    <span className="text-xs text-[var(--text-secondary)]">
      Las 1000 palabras más frecuentes, con weak forms y repaso espaciado
    </span>
  </div>
  <span className="text-xs text-[var(--primary)] font-medium">Practicar →</span>
</Link>
```

(Si `--surface-raised` o `--radius-lg` no existen en `globals.css`, usa los tokens equivalentes que ya usen las cards de `DecksIndexClient` — nunca valores hardcodeados.)

- [ ] **Step 3: Verificación final completa**

```bash
npm run test && npm run type-check && npm run lint
```

Expected: todo PASS. Después, checklist de CLAUDE.md sobre los archivos del feature: ningún archivo >250 líneas, sin `style={{}}`, sin colores hardcodeados, sin Supabase fuera de queries (este feature no toca Supabase), offline intacto (Dexie + assets estáticos + self-grade).

- [ ] **Step 4: Smoke test manual**

Run: `npm run dev` → abrir `/practice/core-1000`. Verificar: header de progreso, tarjeta de estudio con strong/weak y TTS, flujo speak (o fallback), avance de cola, estado "Nada pendiente" al agotar cupo.

- [ ] **Step 5: Commit**

```bash
git add components/sidebar/navConfig.ts app/practice/decks/page.tsx
git commit -m "feat(core-1000): sidebar and decks-index entry points"
```

---

## Notas para el ejecutor

- **Orden**: las tasks 1–4 son la base; 5–6 (contenido) pueden correr en paralelo con 7–12 (app) una vez que la 4 está commiteada, porque la UI funciona con dataset parcial.
- **`useSpeechRecognition`**: su API real es la que usa `components/exercises/SpeakScoredExercise.tsx` (status/result/isSupported/start/stop/reset). Si difiere de lo escrito aquí, el patrón de ese archivo manda.
- **`PronunciationFeedback`**: verifica sus props reales en `components/lesson/PronunciationFeedback.tsx` antes de usarlo; si no encaja con oraciones multi-palabra, muestra accuracy + transcript con un bloque simple propio.
- **No tocar**: `lib/srs/*`, la taxonomía de ejercicios, ni el flujo `/practice/sounds`.
