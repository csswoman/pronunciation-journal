# Essential Words — `example_sentences[]` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let each Essential Word carry several example sentences instead of one, so that repeated reviews of the same word show different sentences — closing the last source of monotony left after the exercise-mode-variety work.

**Architecture:** Add an optional `example_sentences: SentenceVariant[]` array to `EssentialWord` while keeping the existing `example_sentence` / `sentence_ipa` fields as the canonical *first* sentence. A new pure selector (`lib/essential-words/sentence-variants.ts`) picks which variant a given review sees, using the same deterministic `wordSeed + repetitions` rotation already used by `selectMode`. Cards consume the selected variant instead of reading `entry.example_sentence` directly. Content is generated offline by a new `/scripts` job that calls Gemini in batches, writes to a reviewable staging file, and only then patches the chunk JSONs.

**Tech Stack:** TypeScript, Zod, Vitest, Node ESM scripts, `@google/genai` via the existing `/api/gemini` conventions (script-side calls go direct with a server key — see Task 8), `cmu-pronouncing-dictionary` for IPA.

---

## Why additive, not a replacement

`example_sentence` (singular) is read in ~15 production files and ~30 test files — `WordStudyCard`, `SpeakReviewCard`, `DictationCard`, `WeakFormCard`, `ClozeCard`, `RecallTranslationCard`, `lib/practice/study-card/model.ts`, `lib/courses/practice/word-exercise-builder.ts`, `lib/word-of-day`, `lib/essential-words/client-fetch.ts`, plus the `validate-core` and dataset CI gates.

Renaming the field to a plural is a 45-file mechanical change with real regression risk and no user-visible payoff on its own. Instead:

- `example_sentence` + `sentence_ipa` stay **required**, and remain the first/default sentence. Every existing consumer keeps working untouched.
- `example_sentences?: SentenceVariant[]` is **optional and additive**. A word with no variants behaves exactly as today.
- Only the cards that benefit from variety are migrated to the selector (Tasks 5–7). Everything else (word-of-day, course builder, study card) keeps using the singular field.

This means the plan is shippable in slices: Tasks 1–4 land the schema + selector with zero behavior change, Tasks 5–7 turn variety on for the SRS cards, Tasks 8–11 produce the content.

## File Structure

**Create:**
- `lib/essential-words/sentence-variants.ts` — pure variant selection (rotation, IPA pairing, fallback to the singular field).
- `lib/essential-words/__tests__/sentence-variants.test.ts` — its tests.
- `scripts/essential-words/generate-example-sentences.mjs` — Gemini batch generation → staging file.
- `scripts/essential-words/apply-example-sentences.mjs` — staging file → chunk JSON patch + `words-all.json` rebuild.
- `scripts/essential-words/data/example-sentences.json` — generated staging content (committed, reviewable).

**Modify:**
- `lib/essential-words/types.ts` — add `SentenceVariant` + `example_sentences?`.
- `lib/essential-words/schema.ts` — matching Zod shape + refine.
- `lib/essential-words/validate-core.ts` — validate every variant, not just the first.
- `lib/essential-words/__tests__/dataset.test.ts` — extend the `sentence_ipa` gate to variants.
- `lib/ai-prompts.ts` — the generation prompt (hard rule: no prompt strings in scripts or components).
- `components/practice/essential-words/DictationCard.tsx`, `ClozeCard.tsx`, `SpeakReviewCard.tsx` — consume the selected variant.
- `components/practice/essential-words/EssentialWordsSession.tsx` — thread the variant down.
- `package.json` — two new script entries.

---

## Task 1: `SentenceVariant` type + schema

**Files:**
- Modify: `lib/essential-words/types.ts:25-36`
- Modify: `lib/essential-words/schema.ts:7-23`
- Test: `lib/essential-words/__tests__/schema.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `lib/essential-words/__tests__/schema.test.ts`:

```ts
describe("example_sentences", () => {
  it("accepts an entry with no variants (back-compat)", () => {
    expect(EssentialWordSchema.safeParse(base).success).toBe(true);
  });

  it("accepts well-formed variants", () => {
    const withVariants = {
      ...base,
      example_sentences: [
        { sentence: "I want to go home.", sentence_ipa: "/aɪ wɑnt tu ɡoʊ hoʊm/" },
        { sentence: "We want more time.", sentence_ipa: "/wi wɑnt mɔr taɪm/" },
      ],
    };
    expect(EssentialWordSchema.safeParse(withVariants).success).toBe(true);
  });

  it("rejects a variant whose sentence_ipa is not slash-wrapped", () => {
    const bad = {
      ...base,
      example_sentences: [{ sentence: "I want it.", sentence_ipa: "aɪ wɑnt ɪt" }],
    };
    expect(EssentialWordSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects an empty variants array — omit the field instead", () => {
    expect(
      EssentialWordSchema.safeParse({ ...base, example_sentences: [] }).success
    ).toBe(false);
  });
});
```

`base` is the existing fixture at the top of that file (the object with `example_sentence: "I want to go home."`). If it is named differently, reuse whatever name is already there rather than redefining it.

- [ ] **Step 2: Run tests to verify they fail**

```powershell
pnpm vitest run lib/essential-words/__tests__/schema.test.ts
```

Expected: FAIL — the variant cases pass a field Zod strips, so `rejects…` assertions get `true` instead of `false`.

- [ ] **Step 3: Add the type**

In `lib/essential-words/types.ts`, above `interface EssentialWord`:

```ts
/**
 * One example sentence plus its IPA. The entry's own `example_sentence` /
 * `sentence_ipa` is variant 0 and stays mandatory; this array holds the
 * *additional* sentences, so a word with no variants behaves as before.
 */
export interface SentenceVariant {
  sentence: string;
  sentence_ipa: string;
}
```

And inside `EssentialWord`, after `translation?`:

```ts
  example_sentences?: SentenceVariant[]; // extra sentences beyond example_sentence
```

- [ ] **Step 4: Add the schema**

In `lib/essential-words/schema.ts`, before `EssentialWordSchema`:

```ts
export const SentenceVariantSchema = z.object({
  sentence: z.string().min(1),
  sentence_ipa: z.string().regex(/^\/.+\/$/, "IPA entre slashes"),
});
```

And inside the `z.object({...})`, after `translation`:

```ts
    example_sentences: z.array(SentenceVariantSchema).nonempty().optional(),
```

- [ ] **Step 5: Run tests to verify they pass**

```powershell
pnpm vitest run lib/essential-words/__tests__/schema.test.ts
```

Expected: PASS.

- [ ] **Step 6: Type-check and commit**

```powershell
pnpm type-check
```

```bash
git add lib/essential-words/types.ts lib/essential-words/schema.ts lib/essential-words/__tests__/schema.test.ts
git commit -m "feat(essential-words): add optional example_sentences variants to schema"
```

---

## Task 2: The variant selector

**Files:**
- Create: `lib/essential-words/sentence-variants.ts`
- Test: `lib/essential-words/__tests__/sentence-variants.test.ts`

Design notes for the implementer:

- Variant 0 is always the entry's own `example_sentence` / `sentence_ipa`. Variants 1..n come from `example_sentences`. So the effective pool is `[entry, ...entry.example_sentences]`.
- Selection must be **pure and deterministic** — no `Math.random()`. Same word + same `repetitions` → same sentence, exactly like `selectMode`. This keeps it testable and avoids a sentence changing under the learner mid-card on a re-render.
- `sentence_ipa` on the base entry is optional in the type but guaranteed present by the dataset CI gate. Return `undefined` rather than throwing when it is missing, so unit-test fixtures without IPA still work.

- [ ] **Step 1: Write the failing test**

Create `lib/essential-words/__tests__/sentence-variants.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { sentenceVariants, selectSentence } from "../sentence-variants";
import type { EssentialWord } from "../types";

function entry(overrides: Partial<EssentialWord> = {}): EssentialWord {
  return {
    rank: 1,
    word: "want",
    pos: "verb",
    ipa_strong: "/wɑnt/",
    example_sentence: "I want to go home.",
    sentence_ipa: "/aɪ wɑnt tu ɡoʊ hoʊm/",
    cefr_level: "A1",
    ...overrides,
  };
}

const withTwo = entry({
  example_sentences: [
    { sentence: "We want more time.", sentence_ipa: "/wi wɑnt mɔr taɪm/" },
    { sentence: "They want a new car.", sentence_ipa: "/ðeɪ wɑnt ə nu kɑr/" },
  ],
});

describe("sentenceVariants", () => {
  it("returns the base sentence as the only variant when none are authored", () => {
    expect(sentenceVariants(entry())).toEqual([
      { sentence: "I want to go home.", sentence_ipa: "/aɪ wɑnt tu ɡoʊ hoʊm/" },
    ]);
  });

  it("puts the base sentence first, then the authored variants", () => {
    expect(sentenceVariants(withTwo).map((v) => v.sentence)).toEqual([
      "I want to go home.",
      "We want more time.",
      "They want a new car.",
    ]);
  });

  it("tolerates a missing sentence_ipa on the base entry", () => {
    const bare = entry({ sentence_ipa: undefined });
    expect(sentenceVariants(bare)[0].sentence_ipa).toBeUndefined();
  });
});

describe("selectSentence", () => {
  it("returns the base sentence when there are no variants", () => {
    expect(selectSentence(entry(), 0).sentence).toBe("I want to go home.");
    expect(selectSentence(entry(), 7).sentence).toBe("I want to go home.");
  });

  it("is deterministic: same word and repetitions give the same sentence", () => {
    expect(selectSentence(withTwo, 3)).toEqual(selectSentence(withTwo, 3));
  });

  it("cycles through every variant as repetitions advance", () => {
    const seen = new Set<string>();
    for (let reps = 0; reps <= 8; reps++) {
      seen.add(selectSentence(withTwo, reps).sentence);
    }
    expect(seen.size).toBe(3);
  });

  it("never returns a variant with an empty sentence", () => {
    for (let reps = 0; reps <= 20; reps++) {
      expect(selectSentence(withTwo, reps).sentence.length).toBeGreaterThan(0);
    }
  });

  it("treats a negative or fractional repetitions count as 0", () => {
    expect(selectSentence(withTwo, -1)).toEqual(selectSentence(withTwo, 0));
    expect(selectSentence(withTwo, 2.7)).toEqual(selectSentence(withTwo, 2));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```powershell
pnpm vitest run lib/essential-words/__tests__/sentence-variants.test.ts
```

Expected: FAIL — `Cannot find module '../sentence-variants'`.

- [ ] **Step 3: Write the implementation**

Create `lib/essential-words/sentence-variants.ts`:

```ts
// Which example sentence a given review shows. Pure — same rotation contract as
// selectMode (deterministic on word + repetitions), so a re-render never swaps
// the sentence under the learner mid-card.

import type { EssentialWord, SentenceVariant } from "./types";

/** A variant as consumed by cards: IPA is optional because fixtures may omit it. */
export interface ResolvedSentence {
  sentence: string;
  sentence_ipa?: string;
}

/** Deterministic per-word seed. Mirrors exercise-modes.ts — kept local so the
 *  two rotations stay independently tunable. */
function wordSeed(word: string): number {
  let hash = 0;
  for (const char of word) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return Math.abs(hash);
}

/**
 * Every sentence available for `entry`, base sentence first. Always non-empty:
 * `example_sentence` is mandatory on every entry.
 */
export function sentenceVariants(entry: EssentialWord): ResolvedSentence[] {
  const base: ResolvedSentence = {
    sentence: entry.example_sentence,
    sentence_ipa: entry.sentence_ipa,
  };
  const extra: SentenceVariant[] = entry.example_sentences ?? [];
  return [base, ...extra.filter((v) => v.sentence.trim().length > 0)];
}

/**
 * Pick the sentence for this review. Rotates through the pool as `repetitions`
 * advances so a word reviewed many times is not always drilled on the same
 * sentence. Falls back to the base sentence when nothing else is authored.
 */
export function selectSentence(
  entry: EssentialWord,
  repetitions: number,
): ResolvedSentence {
  const pool = sentenceVariants(entry);
  if (pool.length === 1) return pool[0];
  const reps = Number.isFinite(repetitions) ? Math.max(0, Math.floor(repetitions)) : 0;
  const index = (wordSeed(entry.word) + reps) % pool.length;
  return pool[index];
}
```

- [ ] **Step 4: Run test to verify it passes**

```powershell
pnpm vitest run lib/essential-words/__tests__/sentence-variants.test.ts
```

Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/essential-words/sentence-variants.ts lib/essential-words/__tests__/sentence-variants.test.ts
git commit -m "feat(essential-words): add deterministic example-sentence variant selector"
```

---

## Task 3: Validate every variant, not just the first

`validate-core.ts` currently checks that `example_sentence` contains the target word. A generated variant that drops the word would silently break `ClozeCard` and `WeakFormCard`, so the same check must cover variants.

**Files:**
- Modify: `lib/essential-words/validate-core.ts:11` and `:56-61`
- Test: `lib/essential-words/__tests__/validate-core.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `lib/essential-words/__tests__/validate-core.test.ts`:

```ts
describe("example_sentences variants", () => {
  it("accepts variants that contain the word", () => {
    const issues = validateEntry({
      ...to,
      example_sentences: [
        { sentence: "I want to eat now.", sentence_ipa: "/aɪ wɑnt tu it naʊ/" },
      ],
    });
    expect(issues).toEqual([]);
  });

  it("flags a variant that does not contain the word", () => {
    const issues = validateEntry({
      ...to,
      example_sentences: [
        { sentence: "A totally unrelated line.", sentence_ipa: "/ə laɪn/" },
      ],
    });
    expect(issues.map((i) => i.kind)).toContain("variant-missing-word");
  });

  it("flags a variant identical to the base sentence", () => {
    const issues = validateEntry({
      ...to,
      example_sentences: [
        { sentence: to.example_sentence, sentence_ipa: "/dup/" },
      ],
    });
    expect(issues.map((i) => i.kind)).toContain("variant-duplicate");
  });
});
```

`to` is the existing fixture in that file (`example_sentence: "I want to go home."`, word `to`). Reuse the name already present.

- [ ] **Step 2: Run test to verify it fails**

```powershell
pnpm vitest run lib/essential-words/__tests__/validate-core.test.ts
```

Expected: FAIL — no `variant-missing-word` / `variant-duplicate` issues are produced.

- [ ] **Step 3: Extend the validator**

In `lib/essential-words/validate-core.ts`, widen `IssueKind`:

```ts
export type IssueKind =
  | "ipa-mismatch"
  | "weak-not-whitelisted"
  | "sentence-missing-word"
  | "variant-missing-word"
  | "variant-duplicate";
```

And append to `validateEntry`, just before `return issues;`:

```ts
  const seen = new Set([entry.example_sentence.trim().toLowerCase()]);
  for (const [i, variant] of (entry.example_sentences ?? []).entries()) {
    const text = variant.sentence.trim();
    if (!sentenceContainsLemma(text, word)) {
      issues.push({
        rank, word, kind: "variant-missing-word",
        detail: `variante ${i + 1}: "${text}" no contiene "${word}"`,
      });
    }
    const key = text.toLowerCase();
    if (seen.has(key)) {
      issues.push({
        rank, word, kind: "variant-duplicate",
        detail: `variante ${i + 1} repite una oración ya presente: "${text}"`,
      });
    }
    seen.add(key);
  }
```

- [ ] **Step 4: Run test to verify it passes**

```powershell
pnpm vitest run lib/essential-words/__tests__/validate-core.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/essential-words/validate-core.ts lib/essential-words/__tests__/validate-core.test.ts
git commit -m "feat(essential-words): validate example-sentence variants for word presence and duplicates"
```

---

## Task 4: Extend the dataset CI gate

The gate at `dataset.test.ts:41` asserts every entry has `sentence_ipa`. Variants need the same guarantee, or `DictationCard` would read a variant with no IPA.

**Files:**
- Modify: `lib/essential-words/__tests__/dataset.test.ts:41-51`

- [ ] **Step 1: Add the gate**

Append inside the `describe("Core 1000 dataset", ...)` block:

```ts
  it("every example_sentences variant has slash-wrapped sentence_ipa", () => {
    const bad = words.flatMap((w) =>
      (w.example_sentences ?? [])
        .map((v, i) => ({ w, v, i }))
        .filter(({ v }) => !v.sentence_ipa || !v.sentence_ipa.trim().startsWith("/"))
    );
    const report = bad.map(({ w, i }) => `#${w.rank} ${w.word} variante ${i + 1}`).join("\n");
    expect(bad, `\n${report}`).toEqual([]);
  });
```

- [ ] **Step 2: Run the gate**

```powershell
pnpm validate:essential-words
```

Expected: PASS — no variants exist in the dataset yet, so the new test is vacuously green. That is correct: it becomes meaningful the moment Task 10 lands content.

- [ ] **Step 3: Commit**

```bash
git add lib/essential-words/__tests__/dataset.test.ts
git commit -m "test(essential-words): gate sentence_ipa on example-sentence variants"
```

---

## Task 5: `DictationCard` consumes the selected sentence

This is the card that benefits most: it dictates a sentence and grades the typed transcription, so a repeated sentence is a memorized answer rather than a listening test.

**Files:**
- Modify: `components/practice/essential-words/DictationCard.tsx:41,52`
- Test: `components/practice/essential-words/__tests__/DictationCard.test.tsx`

Interface change: `DictationCard` gains a `repetitions` prop (default `0`) and derives the sentence internally. Default `0` keeps every existing call site and test valid.

- [ ] **Step 1: Write the failing test**

Append to `components/practice/essential-words/__tests__/DictationCard.test.tsx`:

```tsx
const withVariants = {
  ...entry,
  example_sentences: [
    { sentence: "We walked home slowly.", sentence_ipa: "/wi wɔkt hoʊm sloʊli/" },
  ],
};

it("grades against the selected variant, not always the base sentence", async () => {
  const onGraded = vi.fn().mockResolvedValue(undefined);
  const { unmount } = render(
    <DictationCard entry={withVariants} repetitions={0} onGraded={onGraded} />
  );

  // Find which sentence this repetitions count selects, then type it.
  const expected = selectSentence(withVariants, 0).sentence;
  await userEvent.type(screen.getByRole("textbox"), expected);
  await userEvent.click(screen.getByRole("button", { name: /comprobar/i }));

  expect(onGraded).toHaveBeenCalledWith(5);
  unmount();
});

it("reveals the selected variant after grading", async () => {
  const onGraded = vi.fn().mockResolvedValue(undefined);
  render(<DictationCard entry={withVariants} repetitions={1} onGraded={onGraded} />);

  await userEvent.type(screen.getByRole("textbox"), "something wrong");
  await userEvent.click(screen.getByRole("button", { name: /comprobar/i }));

  expect(
    screen.getByText(selectSentence(withVariants, 1).sentence)
  ).toBeInTheDocument();
});
```

Add the import at the top of the file:

```tsx
import { selectSentence } from "@/lib/essential-words/sentence-variants";
```

Check the existing "Comprobar" button label in `DictationCard.tsx` before relying on the regex above; if the button reads something else, match the real label.

- [ ] **Step 2: Run test to verify it fails**

```powershell
pnpm vitest run components/practice/essential-words/__tests__/DictationCard.test.tsx
```

Expected: FAIL — `repetitions` is not a prop, so the card still uses `entry.example_sentence` and the variant assertions miss.

- [ ] **Step 3: Update the card**

In `components/practice/essential-words/DictationCard.tsx`:

Add the import:

```tsx
import { selectSentence } from '@/lib/essential-words/sentence-variants'
```

Add to the `Props` interface:

```tsx
  /** SM-2 repetition count — rotates which example sentence is dictated. */
  repetitions?: number
```

Inside the component, above `handleCheck`:

```tsx
  const { sentence } = selectSentence(entry, repetitions)
```

Then replace the three `entry.example_sentence` reads with `sentence`:
- the grading comparison (`normalize(answer) === normalize(sentence)`),
- the `onPlay={() => speak(sentence, { rate: 0.95 })}`,
- the reveal that renders the sentence after grading.

Destructure the new prop in the signature: `({ entry, repetitions = 0, onGraded }: Props)`.

- [ ] **Step 4: Run tests to verify they pass**

```powershell
pnpm vitest run components/practice/essential-words/__tests__/DictationCard.test.tsx
```

Expected: PASS — the new tests plus all pre-existing ones (which pass no `repetitions` and therefore get variant 0, the base sentence).

- [ ] **Step 5: Commit**

```bash
git add components/practice/essential-words/DictationCard.tsx components/practice/essential-words/__tests__/DictationCard.test.tsx
git commit -m "feat(essential-words): rotate the dictated sentence across reviews"
```

---

## Task 6: `ClozeCard` and `SpeakReviewCard` consume the selected sentence

Same shape as Task 5. `ClozeCard` needs care: `clozeFor(entry)` reads `entry.example_sentence` internally, so it must accept an explicit sentence.

**Files:**
- Modify: `lib/essential-words/cloze.ts:20-31`
- Modify: `components/practice/essential-words/ClozeCard.tsx:36`
- Modify: `components/practice/essential-words/SpeakReviewCard.tsx:67`
- Test: `lib/essential-words/__tests__/cloze.test.ts`, `components/practice/essential-words/__tests__/ClozeCard.test.tsx`

- [ ] **Step 1: Write the failing test for `clozeFor`**

Append to `lib/essential-words/__tests__/cloze.test.ts`:

```ts
it("blanks an explicitly supplied sentence instead of the entry's own", () => {
  const e = entry();
  const result = clozeFor(e, "She walked through a long dark tunnel today.");
  expect(result?.blanked).toContain("___");
  expect(result?.blanked).not.toContain("park");
  expect(result?.answer).toBe("through");
});

it("falls back to the entry's sentence when none is supplied", () => {
  const e = entry();
  expect(clozeFor(e)?.blanked).toBe(clozeFor(e, e.example_sentence)?.blanked);
});
```

- [ ] **Step 2: Run test to verify it fails**

```powershell
pnpm vitest run lib/essential-words/__tests__/cloze.test.ts
```

Expected: FAIL — `clozeFor` takes one argument, so the second is ignored and the first assertion sees the park sentence.

- [ ] **Step 3: Make `clozeFor` accept a sentence**

In `lib/essential-words/cloze.ts`, change the signature and body to use a local `text`:

```ts
export function clozeFor(
  entry: EssentialWord,
  sentence?: string,
): ClozeData | null {
  const text = sentence ?? entry.example_sentence;
  const blanked = blankLemma(text, entry.word);
  if (!blanked || !hasEnoughContext(blanked)) return null;

  const original = text.split(/\s+/);
  const gapped = blanked.split(/\s+/);
  const idx = gapped.findIndex((token, i) => token !== original[i]);
  const raw = original[idx] ?? entry.word;
  const answer = raw.replace(/[^\w'-]/g, "");
  return { blanked, answer };
}
```

The optional second parameter keeps `modeHasData`'s `clozeFor(entry)` call in `exercise-modes.ts` working unchanged.

- [ ] **Step 4: Run test to verify it passes**

```powershell
pnpm vitest run lib/essential-words/__tests__/cloze.test.ts
```

Expected: PASS.

- [ ] **Step 5: Thread the sentence through both cards**

In `ClozeCard.tsx` — add the `repetitions?: number` prop (default `0`, same JSDoc as Task 5), the `selectSentence` import, and:

```tsx
  const { sentence } = selectSentence(entry, repetitions)
  const cloze = clozeFor(entry, sentence)
```

The reveal at the bottom of that card renders `entry.example_sentence` — change it to `{sentence}` so the revealed sentence matches the one that was blanked.

In `SpeakReviewCard.tsx:67`, replace:

```tsx
  const sentence = entry.example_sentence
```

with:

```tsx
  const { sentence } = selectSentence(entry, repetitions)
```

adding the same `repetitions?: number` prop and import. Check the rest of `SpeakReviewCard` for other `entry.example_sentence` reads and switch them to `sentence` too.

- [ ] **Step 6: Run the full card suite**

```powershell
pnpm vitest run components/practice/essential-words
```

Expected: PASS. Existing tests pass no `repetitions`, so they get variant 0 — identical behavior to before.

- [ ] **Step 7: Type-check and commit**

```powershell
pnpm type-check
```

```bash
git add lib/essential-words/cloze.ts lib/essential-words/__tests__/cloze.test.ts components/practice/essential-words/ClozeCard.tsx components/practice/essential-words/SpeakReviewCard.tsx components/practice/essential-words/__tests__/ClozeCard.test.tsx
git commit -m "feat(essential-words): rotate cloze and speak sentences across reviews"
```

---

## Task 7: Thread `repetitions` from the session

Without this, every card gets the default `0` and the rotation never fires in the real app.

**Files:**
- Modify: `components/practice/essential-words/EssentialWordsSession.tsx:173-184`
- Test: `components/practice/essential-words/__tests__/EssentialWordsSession.test.tsx`

`current` is an `EssentialWordQueueItem` and already carries `repetitions` (used by `selectMode`).

- [ ] **Step 1: Write the failing test**

Append to `components/practice/essential-words/__tests__/EssentialWordsSession.test.tsx` a test in the style of the existing ones: seed a due word that has an `example_sentences` variant and a `repetitions` count that `selectSentence` maps to variant 1, render the session, and assert the variant's sentence appears rather than the base one.

Follow the existing fixture-and-mock setup in that file exactly — it already stubs the queue/loader. Compute the expectation with `selectSentence(word, reps).sentence` rather than hardcoding a string, so the test does not encode the hash.

- [ ] **Step 2: Run test to verify it fails**

```powershell
pnpm vitest run components/practice/essential-words/__tests__/EssentialWordsSession.test.tsx
```

Expected: FAIL — the base sentence renders because no `repetitions` reaches the card.

- [ ] **Step 3: Pass the prop**

In `EssentialWordsSession.tsx`, add `repetitions={current.repetitions ?? 0}` to the three migrated cards:

```tsx
              {currentMode === 'dictation_sentence' && (
                <DictationCard
                  entry={current.entry}
                  repetitions={current.repetitions ?? 0}
                  onGraded={submitGrade}
                />
              )}
```

Same addition on the `ClozeCard` block and on the `SpeakReviewCard` block.

- [ ] **Step 4: Run the full suite**

```powershell
pnpm vitest run lib/essential-words components/practice/essential-words components/practice/session
```

Expected: PASS, all files.

- [ ] **Step 5: Commit**

```bash
git add components/practice/essential-words/EssentialWordsSession.tsx components/practice/essential-words/__tests__/EssentialWordsSession.test.tsx
git commit -m "feat(essential-words): thread repetitions into sentence-rotating cards"
```

**At this point the feature is complete and inert.** No word has variants yet, so behavior is byte-identical to today. Tasks 8–11 supply the content. This is a safe place to stop, review, or merge.

---

## Task 8: The generation prompt

Hard rule from `CLAUDE.md`: no prompt strings outside `lib/ai-prompts.ts`. That applies to the script too.

**Files:**
- Modify: `lib/ai-prompts.ts`

- [ ] **Step 1: Add the prompt builder**

Append to `lib/ai-prompts.ts`:

```ts
/**
 * Extra example sentences for Essential Words entries. Batched: one call covers
 * many words to keep the offline generation job cheap. Consumed by
 * scripts/essential-words/generate-example-sentences.mjs.
 */
export function essentialWordSentencesPrompt(
  words: { word: string; pos: string; cefr_level: string; example_sentence: string }[],
  perWord: number,
): string {
  const list = words
    .map((w) => `- ${w.word} (${w.pos}, ${w.cefr_level}) — ya tiene: "${w.example_sentence}"`)
    .join("\n");

  return `Eres un redactor de material didáctico de inglés para hispanohablantes.

Para cada palabra de la lista, escribe ${perWord} oraciones de ejemplo NUEVAS.

Reglas estrictas:
- Cada oración DEBE contener la palabra objetivo (una forma flexionada es válida: "works" para "work").
- Entre 6 y 12 palabras. Suficiente contexto para que un estudiante adivine la palabra si se borra.
- Inglés americano natural y cotidiano. Sin nombres propios raros, sin jerga, sin frases hechas oscuras.
- Vocabulario apropiado al nivel CEFR indicado o más simple.
- NO repitas la oración que ya tiene, ni la parafrasees mínimamente.
- Las ${perWord} oraciones de una misma palabra deben diferir en estructura y contexto entre sí.

Palabras:
${list}

Responde SOLO con JSON válido, sin texto alrededor, con esta forma exacta:
{"words":{"<palabra>":["oración 1","oración 2"]}}`;
}
```

- [ ] **Step 2: Verify the hard-rule audit still passes**

```powershell
pnpm audit:ai-prompts
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/ai-prompts.ts
git commit -m "feat(ai-prompts): add essential-words example-sentence generation prompt"
```

---

## Task 9: The generation script

Writes to a **staging file**, never directly to the chunks. Generation and application are separate so the output is reviewable in a diff before it touches the dataset — the same discipline `backfill-meaning.mjs` uses with `meaning-overrides.json`.

**Files:**
- Create: `scripts/essential-words/generate-example-sentences.mjs`
- Create (by running it): `scripts/essential-words/data/example-sentences.json`
- Modify: `package.json`

- [ ] **Step 1: Write the script**

```js
/**
 * Generate extra example sentences for Essential Words entries.
 *
 * Writes to data/example-sentences.json (staging, committed and reviewable).
 * It does NOT touch the chunk files — run apply-example-sentences.mjs for that.
 *
 * Resumable: existing entries in the staging file are skipped, so an
 * interrupted run continues where it stopped and a re-run costs nothing.
 *
 * Usage:
 *   node scripts/essential-words/generate-example-sentences.mjs --limit 50
 *   node scripts/essential-words/generate-example-sentences.mjs --all
 *   node scripts/essential-words/generate-example-sentences.mjs --dry-run
 *
 * Requires GEMINI_API_KEY in the environment.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { essentialWordSentencesPrompt } from "../../lib/ai-prompts.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../..");
const OUT_DIR = path.join(ROOT, "public/essential-words");
const STAGING = path.join(__dirname, "data/example-sentences.json");

const BATCH_SIZE = 20;
const PER_WORD = 2;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const all = args.includes("--all");
const limitArg = args.indexOf("--limit");
const limit = limitArg >= 0 ? Number(args[limitArg + 1]) : all ? Infinity : 20;

function loadStaging() {
  if (!fs.existsSync(STAGING)) return { version: 1, words: {} };
  return JSON.parse(fs.readFileSync(STAGING, "utf-8"));
}

function loadAllEntries() {
  const file = path.join(OUT_DIR, "words-all.json");
  return JSON.parse(fs.readFileSync(file, "utf-8")).entries;
}

async function generateBatch(ai, batch) {
  const prompt = essentialWordSentencesPrompt(batch, PER_WORD);
  const res = await ai.models.generateContent({
    model: "gemini-2.0-flash-lite",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });
  const parsed = JSON.parse(res.text);
  return parsed.words ?? {};
}

async function main() {
  const staging = loadStaging();
  const entries = loadAllEntries();
  const pending = entries
    .filter((e) => !staging.words[e.word.toLowerCase()])
    .slice(0, limit === Infinity ? undefined : limit);

  console.log(`${entries.length} entries total, ${pending.length} pending this run.`);
  if (dryRun) {
    console.log("Dry run — nothing generated.");
    return;
  }
  if (pending.length === 0) return;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");
  const ai = new GoogleGenAI({ apiKey });

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);
    try {
      const result = await generateBatch(ai, batch);
      for (const [word, sentences] of Object.entries(result)) {
        if (!Array.isArray(sentences)) continue;
        staging.words[word.toLowerCase()] = sentences
          .filter((s) => typeof s === "string" && s.trim().length > 0)
          .map((s) => s.trim());
      }
      // Persist after every batch so an interrupted run keeps its progress.
      fs.writeFileSync(STAGING, JSON.stringify(staging, null, 2) + "\n");
      console.log(`Batch ${i / BATCH_SIZE + 1}: +${Object.keys(result).length} words`);
    } catch (err) {
      console.error(`Batch starting at ${i} failed: ${err.message}`);
    }
  }

  console.log(`\nStaged words: ${Object.keys(staging.words).length}`);
  console.log(`Review ${path.relative(ROOT, STAGING)}, then run apply-example-sentences.mjs.`);
}

main();
```

**Note on the `.ts` import:** Node cannot import `lib/ai-prompts.ts` directly. Run the script through `tsx` (already a dependency — `audit:sound-content` uses it). If `tsx` chokes on the mixed graph, the fallback is to run the prompt through `tsx` only, or add `--import tsx` to the node invocation. Use whichever the repo's existing `tsx` scripts already do.

- [ ] **Step 2: Add the npm scripts**

In `package.json`, next to the other `essential-words:` entries:

```json
    "essential-words:gen-sentences": "tsx scripts/essential-words/generate-example-sentences.mjs",
    "essential-words:apply-sentences": "node scripts/essential-words/apply-example-sentences.mjs",
```

- [ ] **Step 3: Smoke-test with a dry run**

```powershell
pnpm essential-words:gen-sentences -- --dry-run
```

Expected: prints the total and pending counts, generates nothing.

- [ ] **Step 4: Generate a small real batch**

```powershell
pnpm essential-words:gen-sentences -- --limit 20
```

Expected: `scripts/essential-words/data/example-sentences.json` appears with ~20 words × 2 sentences. **Read the output.** Check that sentences contain the target word, are natural, and are not near-duplicates of the base sentence. If quality is poor, tune the prompt in Task 8 before scaling up.

- [ ] **Step 5: Commit the script and the sample**

```bash
git add scripts/essential-words/generate-example-sentences.mjs scripts/essential-words/data/example-sentences.json package.json
git commit -m "feat(scripts): generate staged example sentences for essential words"
```

---

## Task 10: The apply script

Reads the staging file, computes `sentence_ipa` for each variant with the same CMU pipeline `backfill-sentence-ipa.mjs` uses, drops anything that fails validation, and patches the chunks.

**Files:**
- Create: `scripts/essential-words/apply-example-sentences.mjs`

- [ ] **Step 1: Write the script**

```js
/**
 * Apply staged example sentences (data/example-sentences.json) to the chunk
 * files as `example_sentences[]`, computing sentence_ipa for each variant with
 * the same CMU pipeline as backfill-sentence-ipa.mjs.
 *
 * Skips any variant that:
 *   - does not contain the target word,
 *   - duplicates the base sentence or an earlier variant,
 *   - is shorter than 4 tokens (no context for cloze).
 *
 * Idempotent: rewrites example_sentences from staging every run, so fixing the
 * staging file and re-running converges. Rebuilds words-all.json.
 *
 * Usage:
 *   node scripts/essential-words/apply-example-sentences.mjs
 *   node scripts/essential-words/apply-example-sentences.mjs --dry-run
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { arpabetStringToIpa } from "../lib/arpabet-to-ipa.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const ROOT = path.join(__dirname, "../..");
const OUT_DIR = path.join(ROOT, "public/essential-words");
const STAGING = path.join(__dirname, "data/example-sentences.json");

const mod = require("cmu-pronouncing-dictionary");
const dict = mod.dictionary ?? mod.default ?? mod;

const dryRun = process.argv.includes("--dry-run");
const MIN_TOKENS = 4;

function lookupIpa(word) {
  const key = word.toLowerCase().replace(/[^a-z0-9']/g, "");
  if (!key) return null;
  const entry =
    dict[key] ??
    dict[key.replace(/-/g, "")] ??
    (key.endsWith("s") && key.length > 3 ? dict[key.slice(0, -1)] : undefined);
  return entry ? `/${arpabetStringToIpa(entry)}/` : null;
}

function sentenceIpa(sentence, targetWord, weakIpa) {
  const tokens = sentence.match(/\b[\w']+\b/g) ?? [];
  const parts = tokens.map((tok) => {
    if (tok.toLowerCase() === targetWord.toLowerCase() && weakIpa) {
      return weakIpa.replace(/^\/|\/$/g, "");
    }
    const ipa = lookupIpa(tok);
    return ipa ? ipa.replace(/^\/|\/$/g, "") : tok.toLowerCase();
  });
  return `/${parts.join(" ")}/`;
}

/** Loose lemma check: the word, or the word plus a common inflection. */
function containsWord(sentence, word) {
  const w = word.toLowerCase();
  const tokens = (sentence.toLowerCase().match(/\b[\w']+\b/g) ?? []);
  return tokens.some(
    (t) => t === w || t === `${w}s` || t === `${w}es` || t === `${w}d` ||
           t === `${w}ed` || t === `${w}ing` || (w.endsWith("e") && t === `${w.slice(0, -1)}ing`)
  );
}

function acceptable(sentence, word, seen) {
  const text = sentence.trim();
  if ((text.match(/\b[\w']+\b/g) ?? []).length < MIN_TOKENS) return false;
  if (!containsWord(text, word)) return false;
  if (seen.has(text.toLowerCase())) return false;
  return true;
}

function patchChunk(chunkNum, staged, stats) {
  const file = path.join(OUT_DIR, `words-${String(chunkNum).padStart(3, "0")}.json`);
  if (!fs.existsSync(file)) return false;

  const data = JSON.parse(fs.readFileSync(file, "utf-8"));
  let changed = 0;

  for (const entry of data.entries) {
    const candidates = staged[entry.word.toLowerCase()];
    if (!candidates || candidates.length === 0) continue;

    const seen = new Set([entry.example_sentence.trim().toLowerCase()]);
    const variants = [];
    for (const sentence of candidates) {
      const text = sentence.trim();
      if (!acceptable(text, entry.word, seen)) {
        stats.rejected.push(`${entry.word}: "${text}"`);
        continue;
      }
      seen.add(text.toLowerCase());
      variants.push({
        sentence: text,
        sentence_ipa: sentenceIpa(text, entry.word, entry.ipa_weak ?? null),
      });
    }

    if (variants.length > 0) {
      entry.example_sentences = variants;
      changed++;
      stats.accepted += variants.length;
    } else {
      delete entry.example_sentences;
    }
  }

  if (!dryRun && changed > 0) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  }
  return true;
}

function rebuildWordsAll() {
  const all = [];
  for (let n = 1; n <= 50; n++) {
    const file = path.join(OUT_DIR, `words-${String(n).padStart(3, "0")}.json`);
    if (!fs.existsSync(file)) break;
    all.push(...JSON.parse(fs.readFileSync(file, "utf-8")).entries);
  }
  if (!dryRun) {
    fs.writeFileSync(
      path.join(OUT_DIR, "words-all.json"),
      JSON.stringify({ version: 1, entries: all }, null, 2) + "\n"
    );
  }
  return all.length;
}

function main() {
  if (dryRun) console.log("Dry run — no files written.\n");
  if (!fs.existsSync(STAGING)) throw new Error(`Missing staging file: ${STAGING}`);

  const staged = JSON.parse(fs.readFileSync(STAGING, "utf-8")).words ?? {};
  const stats = { accepted: 0, rejected: [] };

  for (let n = 1; n <= 50; n++) {
    if (!patchChunk(n, staged, stats)) break;
  }

  const allCount = rebuildWordsAll();
  console.log(`variants applied: ${stats.accepted}`);
  console.log(`variants rejected: ${stats.rejected.length}`);
  if (stats.rejected.length > 0) {
    console.log(`\nRejected:\n${stats.rejected.slice(0, 40).join("\n")}`);
    if (stats.rejected.length > 40) console.log(`… and ${stats.rejected.length - 40} more`);
  }
  console.log(`\nwords-all.json entries: ${allCount}`);
  console.log(dryRun ? "Dry run done." : "Done.");
}

main();
```

- [ ] **Step 2: Dry-run it**

```powershell
pnpm essential-words:apply-sentences -- --dry-run
```

Expected: reports accepted/rejected counts for the ~20 words staged in Task 9. A high rejection rate means the prompt needs work — go back to Task 8 rather than loosening `acceptable()`.

- [ ] **Step 3: Apply for real**

```powershell
pnpm essential-words:apply-sentences
```

- [ ] **Step 4: Run the dataset gate**

```powershell
pnpm validate:essential-words
```

Expected: PASS. This exercises the Task 3 validator and the Task 4 IPA gate against real generated content. If it fails, fix the staging file or the prompt and re-run apply — do not weaken the gates.

- [ ] **Step 5: Commit**

```bash
git add scripts/essential-words/apply-example-sentences.mjs public/essential-words/
git commit -m "feat(essential-words): apply staged example-sentence variants to chunks"
```

---

## Task 11: Scale up and verify end to end

- [ ] **Step 1: Generate the full dataset**

```powershell
pnpm essential-words:gen-sentences -- --all
```

2800 words at 20 per batch is 140 calls. The script is resumable, so an interruption is safe to re-run. Expect this to take a while and to cost real API budget — confirm the sample quality from Task 9 first.

- [ ] **Step 2: Apply and validate**

```powershell
pnpm essential-words:apply-sentences
pnpm validate:essential-words
```

- [ ] **Step 3: Spot-check the diff**

Read a handful of entries across different CEFR levels in `public/essential-words/words-001.json` and `words-028.json`. Confirm the variants are natural, contain the word, and differ meaningfully from the base sentence.

- [ ] **Step 4: Full verification**

```powershell
pnpm type-check
pnpm lint
pnpm vitest run lib/essential-words components/practice/essential-words components/practice/session
pnpm validate:essential-words
pnpm validate:essential-words-generators
```

Expected: all green. `lint` should show only the 6 pre-existing warnings.

- [ ] **Step 5: Commit**

```bash
git add public/essential-words/ scripts/essential-words/data/example-sentences.json
git commit -m "content(essential-words): add example-sentence variants across the dataset"
```

---

## Open decisions

Two things this plan deliberately does not settle, because they are content judgments rather than engineering ones:

1. **How many variants per word.** The plan uses `PER_WORD = 2` (so 3 sentences total per word). More variety costs proportionally more generation budget and JSON size — `words-all.json` roughly doubles at 2 variants. Decide before Task 11.

2. **Whether to generate for all 2800 words or only the lower CEFR levels.** A C1 word reviewed six times is rarer than an A1 word; the variety payoff is concentrated at A1/A2. Restricting to those levels would cut generation cost substantially. The script's `--limit` makes a staged rollout easy either way.
