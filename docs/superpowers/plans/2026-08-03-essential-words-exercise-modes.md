# Essential Words Exercise Modes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single record-and-score review card with five exercise modes selected by SRS maturity, so repeated reviews of the same word stop feeling identical.

**Architecture:** A new pure module `lib/essential-words/exercise-modes.ts` maps a queue item plus its SRS `repetitions` count to one of five modes. `srsEntries` is already loaded in `session-loader.ts` and discarded — we attach `repetitions` to each queue item, so no new queries are needed. The session hook exposes the selected mode; the session component renders one small component per mode. `SpeakReviewCard` is untouched and becomes the universal fallback.

**Tech Stack:** TypeScript, React 19, Vitest, Next.js App Router. Tests live in `__tests__/` subdirs alongside source.

**Spec:** `docs/superpowers/specs/2026-08-03-essential-words-exercise-modes-design.md`

---

## File Structure

| File | Responsibility |
| - | - |
| `lib/essential-words/exercise-modes.ts` (create) | Pure mode selection. No I/O, no randomness. |
| `lib/essential-words/__tests__/exercise-modes.test.ts` (create) | Table tests + the missing-data invariant. |
| `lib/essential-words/queue.ts` (modify) | Add `repetitions` to `EssentialWordQueueItem`. |
| `lib/essential-words/session-loader.ts` (modify) | Populate `repetitions` from the already-loaded `srsEntries`. |
| `lib/essential-words/session-model.ts` (modify) | Record which mode was practiced in the result. |
| `components/practice/essential-words/RecognizeCard.tsx` (create) | Prompt + multiple choice (translation or meaning). |
| `components/practice/essential-words/DictationCard.tsx` (create) | Listen + type the sentence. |
| `components/practice/essential-words/WeakFormCard.tsx` (create) | Weak-form contrast for function words. |
| `components/practice/essential-words/EssentialWordsSession.tsx` (modify) | Render the component for the selected mode. |
| `hooks/useEssentialWordsSession.ts` (modify) | Expose `currentMode` alongside `current`. |

Tasks 1–3 are pure logic and land independently. Tasks 4–6 add one component each. Task 7 wires it together. Each task ends green and committed.

---

### Task 1: Mode selection module

**Files:**
- Create: `lib/essential-words/exercise-modes.ts`
- Test: `lib/essential-words/__tests__/exercise-modes.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/essential-words/__tests__/exercise-modes.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { selectMode, MODE_REQUIRED_FIELD } from "../exercise-modes";
import type { EssentialWordQueueItem } from "../queue";
import type { EssentialWord } from "../types";

function entry(overrides: Partial<EssentialWord> = {}): EssentialWord {
  return {
    rank: 1,
    word: "through",
    pos: "preposition",
    ipa_strong: "θruː",
    example_sentence: "We walked through the park.",
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

describe("selectMode", () => {
  it("sends new words to study", () => {
    expect(selectMode(item("new"))).toBe("study");
  });

  it("gives learning items recognition, never full production", () => {
    expect(selectMode(item("learning"))).not.toBe("speak_sentence");
  });

  it("uses recognition for tender reviews (repetitions <= 2)", () => {
    const mode = selectMode(item("review", entry(), 2));
    expect(["recognize_translation", "recognize_meaning"]).toContain(mode);
  });

  it("uses dictation or weak form for middle reviews (3-5)", () => {
    const mode = selectMode(item("review", entry(), 4));
    expect(["dictation_sentence", "weak_form"]).toContain(mode);
  });

  it("uses speech for mature reviews (>= 6)", () => {
    expect(selectMode(item("review", entry(), 6))).toBe("speak_sentence");
  });

  it("falls back to speech when the required field is missing", () => {
    const noText = entry({ meaning: undefined, translation: undefined });
    expect(selectMode(item("review", noText, 1))).toBe("speak_sentence");
  });

  // The core invariant from the spec.
  it("never returns a mode whose backing data is absent", () => {
    const variants: EssentialWord[] = [
      entry(),
      entry({ translation: undefined }),
      entry({ meaning: undefined }),
      entry({ meaning: undefined, translation: undefined }),
      entry({ ipa_weak: "ðə", sentence_ipa: "wiː wɔːkt ðə pɑːrk" }),
    ];
    const kinds: EssentialWordQueueItem["kind"][] = ["review", "learning"];

    for (const e of variants) {
      for (const kind of kinds) {
        for (let reps = 0; reps <= 10; reps++) {
          const mode = selectMode(item(kind, e, reps));
          const field = MODE_REQUIRED_FIELD[mode];
          if (field) expect(e[field]).toBeTruthy();
        }
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/essential-words/__tests__/exercise-modes.test.ts`
Expected: FAIL — cannot resolve `../exercise-modes`.

- [ ] **Step 3: Write the implementation**

Create `lib/essential-words/exercise-modes.ts`:

```ts
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
  | "weak_form"
  | "speak_sentence";

/**
 * The optional `EssentialWord` field each mode needs. Modes backed by a
 * mandatory field map to null. Exported so tests can assert the invariant that
 * a mode is never chosen without its data.
 */
export const MODE_REQUIRED_FIELD: Record<
  EssentialWordMode,
  keyof EssentialWord | null
> = {
  study: null,
  recognize_translation: "translation",
  recognize_meaning: "meaning",
  dictation_sentence: null, // example_sentence is mandatory
  weak_form: "ipa_weak",
  speak_sentence: null, // example_sentence is mandatory
};

/** Maturity tiers, driven by SM-2 consecutive-correct count. */
const TENDER_MAX = 2;
const MIDDLE_MAX = 5;

function hasData(entry: EssentialWord, mode: EssentialWordMode): boolean {
  const field = MODE_REQUIRED_FIELD[mode];
  if (!field) return true;
  return Boolean(entry[field]);
}

/** First mode whose backing data is present, else `speak_sentence`. */
function firstUsable(
  entry: EssentialWord,
  candidates: EssentialWordMode[],
): EssentialWordMode {
  return candidates.find((mode) => hasData(entry, mode)) ?? "speak_sentence";
}

/**
 * Pick how to practice this item.
 *
 * New words study. Otherwise the SRS maturity tier decides: recognition while
 * the word is tender, dictation/weak-form in the middle, full production once
 * it is mature. `learning` items (a lapse re-inserted mid-session) always get
 * recognition — they just failed, so production would only fail again.
 *
 * Never returns a mode whose backing data is missing; falls back to
 * `speak_sentence`, which is always renderable.
 */
export function selectMode(item: EssentialWordQueueItem): EssentialWordMode {
  if (item.kind === "new") return "study";

  const { entry } = item;
  const recognition: EssentialWordMode[] = [
    "recognize_translation",
    "recognize_meaning",
  ];

  if (item.kind === "learning") return firstUsable(entry, recognition);

  const reps = item.repetitions ?? 0;
  if (reps <= TENDER_MAX) return firstUsable(entry, recognition);
  if (reps <= MIDDLE_MAX) {
    return firstUsable(entry, ["weak_form", "dictation_sentence"]);
  }
  return "speak_sentence";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/essential-words/__tests__/exercise-modes.test.ts`
Expected: PASS — 7 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/essential-words/exercise-modes.ts lib/essential-words/__tests__/exercise-modes.test.ts
git commit -m "feat(essential-words): add SRS-maturity mode selection"
```

---

### Task 2: Carry `repetitions` onto queue items

**Files:**
- Modify: `lib/essential-words/queue.ts:8-12`
- Modify: `lib/essential-words/session-loader.ts:37-40`
- Test: `lib/essential-words/__tests__/queue.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `lib/essential-words/__tests__/queue.test.ts` (inside the existing top-level `describe`, or as a new one):

```ts
describe("buildSessionQueue repetitions", () => {
  it("carries SM-2 repetitions onto due review items", () => {
    const word = {
      rank: 1,
      word: "through",
      pos: "preposition" as const,
      ipa_strong: "θruː",
      example_sentence: "We walked through the park.",
      cefr_level: "A1" as const,
    };
    const queue = buildSessionQueue({
      words: [word],
      srsEntries: [
        {
          wordId: "c1k:through",
          word: "through",
          ease: 2.5,
          interval: 10,
          repetitions: 7,
          nextReview: "2020-01-01T00:00:00.000Z",
        },
      ],
      introducedToday: [],
      now: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(queue[0].kind).toBe("review");
    expect(queue[0].repetitions).toBe(7);
  });

  it("leaves repetitions undefined for new words", () => {
    const word = {
      rank: 1,
      word: "apple",
      pos: "noun" as const,
      ipa_strong: "ˈæpəl",
      example_sentence: "I ate an apple.",
      cefr_level: "A1" as const,
    };
    const queue = buildSessionQueue({
      words: [word],
      srsEntries: [],
      introducedToday: [],
      now: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(queue[0].kind).toBe("new");
    expect(queue[0].repetitions).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/essential-words/__tests__/queue.test.ts`
Expected: FAIL — `repetitions` is not a property on the queue item (TS error and/or undefined assertion).

- [ ] **Step 3: Add the field to the type**

In `lib/essential-words/queue.ts`, replace the `EssentialWordQueueItem` interface:

```ts
export interface EssentialWordQueueItem {
  entry: EssentialWord;
  kind: 'new' | 'review' | 'learning';
  fromSnooze?: boolean;
  /**
   * SM-2 consecutive-correct count for this word, when it has SRS history.
   * Undefined for new words. Drives exercise-mode maturity tiers.
   */
  repetitions?: number;
}
```

- [ ] **Step 4: Populate it when building due items**

In `lib/essential-words/queue.ts`, the `due` pipeline currently drops the SRS
row after looking up the entry. Replace the `due` block inside
`buildSessionQueue` with a version that keeps `repetitions`:

```ts
  const due: EssentialWordQueueItem[] = srsEntries
    .filter((e) => isDueForQueue(e, now))
    .map((e) => ({ srs: e, entry: byId.get(e.wordId) }))
    .filter((pair): pair is { srs: SRSData; entry: EssentialWord } =>
      pair.entry !== undefined,
    )
    .filter((pair) => matchesFilter(pair.entry, levels, pos))
    .sort((a, b) => a.entry.rank - b.entry.rank)
    .map(({ entry, srs }) => ({
      entry,
      kind: 'review' as const,
      repetitions: srs.repetitions,
    }));
```

- [ ] **Step 5: Preserve `repetitions` through learning re-insertion**

`reinsertLearning` already spreads the item (`{ ...item, kind: 'learning' }`),
so `repetitions` carries over. No change needed — verify by reading
`lib/essential-words/queue.ts:86-96`.

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run lib/essential-words/__tests__/queue.test.ts`
Expected: PASS — including the two new tests.

- [ ] **Step 7: Verify the loader needs no change**

`session-loader.ts:37-40` spreads each item (`{ ...item, fromSnooze }`), so
`repetitions` flows through untouched. Confirm by running:

Run: `npx vitest run lib/essential-words/__tests__/session-loader.test.ts`
Expected: PASS — no regressions.

- [ ] **Step 8: Commit**

```bash
git add lib/essential-words/queue.ts lib/essential-words/__tests__/queue.test.ts
git commit -m "feat(essential-words): carry SM-2 repetitions onto queue items"
```

---

### Task 3: Record the practiced mode in results

**Files:**
- Modify: `lib/essential-words/session-model.ts:17-37`
- Test: `lib/essential-words/__tests__/session-model.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `lib/essential-words/__tests__/session-model.test.ts`:

```ts
describe("exercise result mode tagging", () => {
  it("records the practiced mode in the payload", () => {
    const result = buildEssentialWordExerciseResult(
      item,
      4,
      { accuracy: 88, transcript: "test" },
      "speak_sentence",
    );
    expect(result.exercisePayload).toMatchObject({ mode: "speak_sentence" });
  });

  it("keeps slug and exerciseTypeId stable for speech and text", () => {
    const speech = buildEssentialWordExerciseResult(
      item, 4, { accuracy: 88, transcript: "test" }, "speak_sentence",
    );
    expect(speech).toMatchObject({ slug: "speak_word", exerciseTypeId: 10 });

    const text = buildEssentialWordExerciseResult(
      item, 2, undefined, "recognize_translation",
    );
    expect(text).toMatchObject({ slug: "fill_blank", exerciseTypeId: 5 });
  });

  it("defaults to speak_sentence when no mode is passed", () => {
    const result = buildEssentialWordExerciseResult(item, 4);
    expect(result.exercisePayload).toMatchObject({ mode: "speak_sentence" });
  });
});
```

> **Why `exercisePayload` and not a new top-level field:** `ExerciseResult` is
> `PracticeAnswer & { completedAt: Date }` (`lib/practice/types.ts:150`), a
> closed type consumed by `sessionResultsRef` and the answer-history writer.
> Adding a top-level `mode` would fail excess-property checks. `exercisePayload`
> already exists on `PracticeAnswer` for exactly this kind of per-exercise
> detail.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/essential-words/__tests__/session-model.test.ts`
Expected: FAIL — `result.mode` is undefined.

- [ ] **Step 3: Write the implementation**

In `lib/essential-words/session-model.ts`, add the import and replace
`buildEssentialWordExerciseResult`:

```ts
import type { EssentialWordMode } from "@/lib/essential-words/exercise-modes";
```

```ts
export function buildEssentialWordExerciseResult(
  item: EssentialWordQueueItem,
  quality: number,
  extras?: GradeExtras,
  mode: EssentialWordMode = "speak_sentence",
): ExerciseResult {
  const wordId = essentialWordId(item.entry.word.toLowerCase());
  const isSpeech = extras?.accuracy !== undefined;

  return {
    exerciseId: wordId,
    // slug/exerciseTypeId stay keyed on speech-vs-text so historical rows in
    // answer_history remain comparable; `mode` in the payload carries the
    // finer detail without widening the shared PracticeAnswer type.
    slug: isSpeech ? "speak_word" : "fill_blank",
    exerciseTypeId: isSpeech ? 10 : 5,
    isCorrect: quality >= 3,
    userAnswer: extras?.transcript,
    contentId: wordId,
    context: "essential-words",
    timeMs: 0,
    score: extras?.accuracy,
    completedAt: new Date(),
    exercisePayload: { mode },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/essential-words/__tests__/session-model.test.ts`
Expected: PASS — existing tests plus the three new ones.

- [ ] **Step 5: Commit**

```bash
git add lib/essential-words/session-model.ts lib/essential-words/__tests__/session-model.test.ts
git commit -m "feat(essential-words): record practiced mode in exercise results"
```

---

### Task 4: RecognizeCard component

**Files:**
- Create: `components/practice/essential-words/RecognizeCard.tsx`
- Test: `components/practice/essential-words/__tests__/RecognizeCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/practice/essential-words/__tests__/RecognizeCard.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecognizeCard } from "../RecognizeCard";
import type { EssentialWord } from "@/lib/essential-words/types";

function word(overrides: Partial<EssentialWord> = {}): EssentialWord {
  return {
    rank: 1,
    word: "through",
    pos: "preposition",
    ipa_strong: "θruː",
    example_sentence: "We walked through the park.",
    cefr_level: "A1",
    translation: "a través de",
    ...overrides,
  };
}

const distractors = [word({ word: "under" }), word({ word: "over" }), word({ word: "into" })];

describe("RecognizeCard", () => {
  it("shows the prompt and four options", () => {
    render(
      <RecognizeCard
        entry={word()}
        prompt="a través de"
        distractors={distractors}
        onGraded={vi.fn().mockResolvedValue(undefined)}
      />,
    );
    expect(screen.getByText("a través de")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /through|under|over|into/ })).toHaveLength(4);
  });

  it("grades 5 when the correct word is chosen", async () => {
    const onGraded = vi.fn().mockResolvedValue(undefined);
    render(
      <RecognizeCard
        entry={word()}
        prompt="a través de"
        distractors={distractors}
        onGraded={onGraded}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "through" }));
    expect(onGraded).toHaveBeenCalledWith(5);
  });

  it("grades 2 when a wrong word is chosen", async () => {
    const onGraded = vi.fn().mockResolvedValue(undefined);
    render(
      <RecognizeCard
        entry={word()}
        prompt="a través de"
        distractors={distractors}
        onGraded={onGraded}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "under" }));
    expect(onGraded).toHaveBeenCalledWith(2);
  });

  it("never renders a duplicate option label", () => {
    render(
      <RecognizeCard
        entry={word()}
        prompt="a través de"
        distractors={[word({ word: "through" }), word({ word: "over" }), word({ word: "into" })]}
        onGraded={vi.fn().mockResolvedValue(undefined)}
      />,
    );
    const labels = screen.getAllByRole("button").map((b) => b.textContent);
    expect(new Set(labels).size).toBe(labels.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/practice/essential-words/__tests__/RecognizeCard.test.tsx`
Expected: FAIL — cannot resolve `../RecognizeCard`.

- [ ] **Step 3: Write the implementation**

Create `components/practice/essential-words/RecognizeCard.tsx`:

```tsx
'use client'

// Planned structure:
// <RecognizeCard>
//   <Prompt />
//   <OptionGrid />
// </RecognizeCard>

import { useMemo, useState } from 'react'
import { PillButton } from '@/components/ui/PillButton'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { cn } from '@/lib/cn'
import type { EssentialWord } from '@/lib/essential-words/types'

interface Props {
  entry: EssentialWord
  /** Translation or meaning — whichever mode selected this card. */
  prompt: string
  /** Other session words used as wrong answers. */
  distractors: EssentialWord[]
  onGraded: (quality: number) => Promise<void>
}

const OPTION_COUNT = 4

/** Quality scores: a clean recognition is a 5, a miss is a lapse (2). */
const CORRECT_QUALITY = 5
const WRONG_QUALITY = 2

export function RecognizeCard({ entry, prompt, distractors, onGraded }: Props) {
  const [chosen, setChosen] = useState<string | null>(null)

  // Dedupe by surface form so the answer never appears twice — same rule as
  // lib/lexicon/exercises.ts.
  const options = useMemo(() => {
    const seen = new Set([entry.word.toLowerCase()])
    const wrong: EssentialWord[] = []
    for (const d of distractors) {
      const key = d.word.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      wrong.push(d)
      if (wrong.length === OPTION_COUNT - 1) break
    }
    const all = [entry, ...wrong].map((w) => w.word)
    // Deterministic-enough shuffle; order only needs to vary per render.
    return all.sort(() => Math.random() - 0.5)
  }, [entry, distractors])

  const handleChoose = (choice: string) => {
    if (chosen) return
    setChosen(choice)
    const isCorrect = choice.toLowerCase() === entry.word.toLowerCase()
    playUiCue(isCorrect ? 'correct' : 'wrong')
    void onGraded(isCorrect ? CORRECT_QUALITY : WRONG_QUALITY)
  }

  return (
    <div className="flex w-full flex-col items-center gap-space-5 rounded-lg border border-border-subtle bg-surface-raised layout-card-pad">
      <div className="flex max-w-[42ch] flex-col items-center gap-1 text-center">
        <p className="font-kicker m-0 text-fg-muted">¿Qué palabra es?</p>
        <p className="m-0 text-body-lg font-medium leading-relaxed text-balance text-fg">
          {prompt}
        </p>
      </div>

      <div className="grid w-full max-w-sm grid-cols-2 gap-2">
        {options.map((option) => (
          <PillButton
            key={option}
            type="button"
            variant={chosen === option ? 'primary' : 'outline'}
            onClick={() => handleChoose(option)}
            disabled={Boolean(chosen)}
            className={cn(
              chosen &&
                option.toLowerCase() === entry.word.toLowerCase() &&
                'bg-success hover:bg-success',
            )}
          >
            {option}
          </PillButton>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/practice/essential-words/__tests__/RecognizeCard.test.tsx`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add components/practice/essential-words/RecognizeCard.tsx components/practice/essential-words/__tests__/RecognizeCard.test.tsx
git commit -m "feat(essential-words): add RecognizeCard for translation/meaning recall"
```

---

### Task 5: DictationCard component

**Files:**
- Create: `components/practice/essential-words/DictationCard.tsx`
- Test: `components/practice/essential-words/__tests__/DictationCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/practice/essential-words/__tests__/DictationCard.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DictationCard } from "../DictationCard";
import type { EssentialWord } from "@/lib/essential-words/types";

vi.mock("@/lib/phoneme-practice/tts", () => ({ speak: vi.fn() }));

const entry: EssentialWord = {
  rank: 1,
  word: "through",
  pos: "preposition",
  ipa_strong: "θruː",
  example_sentence: "We walked through the park.",
  cefr_level: "A1",
};

describe("DictationCard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not reveal the sentence before answering", () => {
    render(<DictationCard entry={entry} onGraded={vi.fn().mockResolvedValue(undefined)} />);
    expect(screen.queryByText(entry.example_sentence)).not.toBeInTheDocument();
  });

  it("grades 5 for an exact match ignoring case and punctuation", () => {
    const onGraded = vi.fn().mockResolvedValue(undefined);
    render(<DictationCard entry={entry} onGraded={onGraded} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "we walked through the park" },
    });
    fireEvent.click(screen.getByRole("button", { name: /comprobar/i }));
    expect(onGraded).toHaveBeenCalledWith(5);
  });

  it("grades 2 for a wrong answer and reveals the sentence", () => {
    const onGraded = vi.fn().mockResolvedValue(undefined);
    render(<DictationCard entry={entry} onGraded={onGraded} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "totally wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /comprobar/i }));
    expect(onGraded).toHaveBeenCalledWith(2);
    expect(screen.getByText(entry.example_sentence)).toBeInTheDocument();
  });

  it("does not submit an empty answer", () => {
    const onGraded = vi.fn().mockResolvedValue(undefined);
    render(<DictationCard entry={entry} onGraded={onGraded} />);
    fireEvent.click(screen.getByRole("button", { name: /comprobar/i }));
    expect(onGraded).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/practice/essential-words/__tests__/DictationCard.test.tsx`
Expected: FAIL — cannot resolve `../DictationCard`.

- [ ] **Step 3: Write the implementation**

Create `components/practice/essential-words/DictationCard.tsx`:

```tsx
'use client'

// Planned structure:
// <DictationCard>
//   <ListenButton />
//   <AnswerInput />
//   <Reveal />
// </DictationCard>

import { useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import { PillButton } from '@/components/ui/PillButton'
import { ListenButton } from '@/components/ui/ListenButton'
import { playUiCue } from '@/lib/ui-sounds/cues'
import type { EssentialWord } from '@/lib/essential-words/types'

interface Props {
  entry: EssentialWord
  onGraded: (quality: number) => Promise<void>
}

const CORRECT_QUALITY = 5
const WRONG_QUALITY = 2

/** Compare ignoring case, punctuation, and repeated whitespace. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function DictationCard({ entry, onGraded }: Props) {
  const [answer, setAnswer] = useState('')
  const [revealed, setRevealed] = useState(false)

  const handleCheck = () => {
    if (revealed || answer.trim() === '') return
    const isCorrect = normalize(answer) === normalize(entry.example_sentence)
    setRevealed(true)
    playUiCue(isCorrect ? 'correct' : 'wrong')
    void onGraded(isCorrect ? CORRECT_QUALITY : WRONG_QUALITY)
  }

  return (
    <div className="flex w-full flex-col items-center gap-space-5 rounded-lg border border-border-subtle bg-surface-raised layout-card-pad">
      <p className="font-kicker m-0 text-fg-muted">Escucha y escribe la oración</p>

      <ListenButton
        onPlay={() => speak(entry.example_sentence, { rate: 0.95 })}
        label="Escuchar de nuevo"
      />

      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
        disabled={revealed}
        aria-label="Escribe lo que escuchaste"
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

Run: `npx vitest run components/practice/essential-words/__tests__/DictationCard.test.tsx`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add components/practice/essential-words/DictationCard.tsx components/practice/essential-words/__tests__/DictationCard.test.tsx
git commit -m "feat(essential-words): add DictationCard listen-and-type mode"
```

---

### Task 6: WeakFormCard component

**Files:**
- Create: `components/practice/essential-words/WeakFormCard.tsx`
- Test: `components/practice/essential-words/__tests__/WeakFormCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/practice/essential-words/__tests__/WeakFormCard.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WeakFormCard } from "../WeakFormCard";
import type { EssentialWord } from "@/lib/essential-words/types";
import { speak } from "@/lib/phoneme-practice/tts";

vi.mock("@/lib/phoneme-practice/tts", () => ({ speak: vi.fn() }));

const entry: EssentialWord = {
  rank: 1,
  word: "to",
  pos: "preposition",
  ipa_strong: "tuː",
  ipa_weak: "tə",
  sentence_ipa: "aɪ wɒnt tə goʊ",
  example_sentence: "I want to go.",
  cefr_level: "A1",
};

describe("WeakFormCard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows both the strong and weak pronunciations", () => {
    render(<WeakFormCard entry={entry} onGraded={vi.fn().mockResolvedValue(undefined)} />);
    expect(screen.getByText(/tuː/)).toBeInTheDocument();
    expect(screen.getByText(/tə/)).toBeInTheDocument();
  });

  it("plays the weak form in its phrase context", () => {
    render(<WeakFormCard entry={entry} onGraded={vi.fn().mockResolvedValue(undefined)} />);
    fireEvent.click(screen.getByRole("button", { name: /escuchar/i }));
    expect(speak).toHaveBeenCalled();
  });

  it("submits the learner self-grade", () => {
    const onGraded = vi.fn().mockResolvedValue(undefined);
    render(<WeakFormCard entry={entry} onGraded={onGraded} />);
    fireEvent.click(screen.getByRole("button", { name: /lo dije bien/i }));
    expect(onGraded).toHaveBeenCalledWith(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/practice/essential-words/__tests__/WeakFormCard.test.tsx`
Expected: FAIL — cannot resolve `../WeakFormCard`.

- [ ] **Step 3: Write the implementation**

Create `components/practice/essential-words/WeakFormCard.tsx`:

```tsx
'use client'

// Planned structure:
// <WeakFormCard>
//   <FormContrast />   strong vs weak IPA
//   <ListenButton />
//   <SelfGradeBar />
// </WeakFormCard>

import { speak } from '@/lib/phoneme-practice/tts'
import { ListenButton } from '@/components/ui/ListenButton'
import { PillButton } from '@/components/ui/PillButton'
import { weakFormPhrase } from '@/lib/practice/study-card/model'
import type { EssentialWord } from '@/lib/essential-words/types'

interface Props {
  /** Caller guarantees `ipa_weak` is present (selectMode checks it). */
  entry: EssentialWord
  onGraded: (quality: number) => Promise<void>
}

const GOT_IT_QUALITY = 5
const MISSED_QUALITY = 2

export function WeakFormCard({ entry, onGraded }: Props) {
  const phrase = weakFormPhrase(entry.example_sentence, entry.word)

  return (
    <div className="flex w-full flex-col items-center gap-space-5 rounded-lg border border-border-subtle bg-surface-raised layout-card-pad">
      <div className="flex max-w-[42ch] flex-col items-center gap-1 text-center">
        <p className="font-kicker m-0 text-fg-muted">Forma débil</p>
        <p className="m-0 text-body-lg font-medium text-fg">{entry.word}</p>
        <p className="ipa m-0 text-body text-fg-muted">
          fuerte /{entry.ipa_strong}/ · débil /{entry.ipa_weak}/
        </p>
      </div>

      <p className="m-0 max-w-[42ch] text-center text-body-lg text-fg">{phrase}</p>

      <ListenButton
        onPlay={() => speak(phrase, { rate: 0.95 })}
        label="Escuchar la forma débil"
      />

      <div className="flex gap-2">
        <PillButton variant="outline" size="sm" onClick={() => void onGraded(MISSED_QUALITY)}>
          Me costó
        </PillButton>
        <PillButton variant="primary" size="sm" onClick={() => void onGraded(GOT_IT_QUALITY)}>
          Lo dije bien
        </PillButton>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/practice/essential-words/__tests__/WeakFormCard.test.tsx`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add components/practice/essential-words/WeakFormCard.tsx components/practice/essential-words/__tests__/WeakFormCard.test.tsx
git commit -m "feat(essential-words): add WeakFormCard for function-word reduction"
```

---

### Task 7: Wire modes into the session

**Files:**
- Modify: `hooks/useEssentialWordsSession.ts`
- Modify: `components/practice/essential-words/EssentialWordsSession.tsx:142`
- Test: `components/practice/essential-words/__tests__/EssentialWordsSession.test.tsx`

- [ ] **Step 1: Expose the selected mode from the hook**

In `hooks/useEssentialWordsSession.ts`, import `selectMode` and derive the mode
from the current item:

```ts
import { selectMode, type EssentialWordMode } from "@/lib/essential-words/exercise-modes";
```

Add near the other derived values (after `const item = queue[index]` is
available in the returned object scope — compute it from `queue` and `index`):

```ts
  const current = queue[index];
  const currentMode: EssentialWordMode = current
    ? selectMode(current)
    : "speak_sentence";
```

Add `currentMode` to the hook's returned object, and pass it when building the
result inside `submitGrade`:

```ts
      const result = buildEssentialWordExerciseResult(item, quality, extras, selectMode(item));
```

- [ ] **Step 2: Provide session distractors for RecognizeCard**

Still in `hooks/useEssentialWordsSession.ts`, expose other queue entries so the
recognition card has wrong answers:

```ts
  // Other words in this session, used as recognition distractors.
  const distractorPool = queue
    .filter((_, i) => i !== index)
    .map((qi) => qi.entry);
```

Add `distractorPool` to the returned object.

- [ ] **Step 3: Render the mode in the session component**

In `components/practice/essential-words/EssentialWordsSession.tsx`, pull the new
values from the hook:

```tsx
  const {
    phase, current, currentMode, distractorPool, stats, counts, sessionSummary,
    reloadLoading, levels, activeRouteId, setRoute,
    startSpeak, submitGrade, reload, learnMore, archiveWord,
    keepSnooze, masterWord,
  } = useEssentialWordsSession()
```

Add the imports:

```tsx
import { RecognizeCard } from './RecognizeCard'
import { DictationCard } from './DictationCard'
import { WeakFormCard } from './WeakFormCard'
```

Replace the `{phase === 'speak' && current && (...)}` block at line 142 with a
mode switch. `SpeakReviewCard` keeps the props it has today:

```tsx
          {phase === 'speak' && current && (
            <>
              {currentMode === 'recognize_translation' && (
                <RecognizeCard
                  entry={current.entry}
                  prompt={current.entry.translation!}
                  distractors={distractorPool}
                  onGraded={submitGrade}
                />
              )}
              {currentMode === 'recognize_meaning' && (
                <RecognizeCard
                  entry={current.entry}
                  prompt={current.entry.meaning!}
                  distractors={distractorPool}
                  onGraded={submitGrade}
                />
              )}
              {currentMode === 'dictation_sentence' && (
                <DictationCard entry={current.entry} onGraded={submitGrade} />
              )}
              {currentMode === 'weak_form' && (
                <WeakFormCard entry={current.entry} onGraded={submitGrade} />
              )}
              {currentMode === 'speak_sentence' && (
                <SpeakReviewCard
                  entry={current.entry}
                  onGraded={submitGrade}
                  onArchive={archiveWord}
                  fromSnooze={current.fromSnooze}
                  onKeepSnooze={keepSnooze}
                  onMaster={masterWord}
                />
              )}
            </>
          )}
```

The `!` assertions on `translation` / `meaning` are safe because `selectMode`
only returns those modes when the field is present (Task 1 invariant).

- [ ] **Step 4: Run the full essential-words suite**

Run: `npx vitest run lib/essential-words components/practice/essential-words`
Expected: PASS — all existing tests plus the new component tests.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: exit 0, no output.

- [ ] **Step 6: Lint the changed files**

Run: `npx eslint lib/essential-words components/practice/essential-words hooks/useEssentialWordsSession.ts`
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add hooks/useEssentialWordsSession.ts components/practice/essential-words/EssentialWordsSession.tsx
git commit -m "feat(essential-words): render exercise mode by SRS maturity"
```

---

### Task 8: Verify end to end

**Files:** none (verification only)

- [ ] **Step 1: Run the whole suite**

Run: `npx vitest run`
Expected: PASS. One pre-existing unrelated failure is known in
`components/journal/__tests__/JournalSupportRail.test.tsx` — it fails on `main`
too and is out of scope. Every other test must pass.

- [ ] **Step 2: Confirm file sizes stay within convention**

Run: `npx eslint components/practice/essential-words --rule '{"max-lines":["warn",300]}'`
Expected: no new warnings. `EssentialWordsSession.tsx` grows by ~30 lines; if it
crosses 300, extract the mode switch into a `ReviewModeRenderer.tsx` component
and re-run.

- [ ] **Step 3: Manual check in the browser**

Run: `pnpm dev`, open `/practice/essential-words`.

Verify: a word with `repetitions >= 6` shows the speak card; a freshly failed
word (grade it wrong once) comes back as a recognition card rather than another
speak card. That second check is the visible proof the `learning` collapse bug
is fixed.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "test(essential-words): verify exercise-mode variety end to end"
```
