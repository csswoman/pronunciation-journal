# Coach starter: guardar la lección + sugerencias acordes al tema — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the first teaching turn of the coach's `learn`, `pronunciation` and `world` starters offer a "Guardar explicación" chip and 3 topical reply suggestions, purely by changing the starter prompt builders.

**Architecture:** All client infrastructure already exists — `concept` in the `annotate_turn` tool schema, `extractTurnConcept()`, `SaveConceptChip` rendering in `AIBubble`, and `extractSuggestions()` parsing a `suggestions:` block. The only change is prompt text in `lib/ai-prompts.ts`: relax the turn-1 "no tools" rule to allow `annotate_turn`, and instruct the model to emit a `concept` and a `suggestions:` block on the teaching turn. `buildReviewStarterPrompt` is untouched (it goes straight to an exercise, teaches no discrete concept).

**Tech Stack:** TypeScript, Vitest.

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `lib/ai-prompts.ts` | Prompt string builders for coach starters | Modify `buildLearnStarterPrompt`, `buildPronunciationStarterPrompt`, `buildWorldStarterPrompt` |
| `lib/ai-practice/starters/__tests__/registry.test.ts` | Behavioural tests for the starter registry (already exercises `.build(ctx).prompt`) | Add assertions for the new prompt instructions + a negative assertion for `review` |

No new files. No runtime logic changes outside prompt strings.

---

## Reference: current text of the three builders (in `lib/ai-prompts.ts`)

`buildLearnStarterPrompt` returns (roughly lines 209-215):

```
Teach this ${input.level} student ONE new thing right now: ${input.angle}.
Structure: name it, explain it in at most three lines, give two examples, then
ask one short question in plain text to check they followed.
Do NOT call any exercise tool on this first turn — wait until they reply, then
run one exercise via the exercise tools.
Pick something genuinely useful at ${input.level} — not trivia, not something
far above their level.${syllabus}${avoid}
```

`buildPronunciationStarterPrompt` returns (roughly lines 230-237):

```
You are a friendly English pronunciation coach for a native Spanish speaker at level ${input.level}.
Focus on sounds that are genuinely tricky for Spanish speakers at this level.${targets}
First turn: pick ONE sound, describe it clearly in plain text (mouth position, airflow),
give two example words, and a short phrase to say. Ask them to type the phrase back
with notes on how it felt. Do NOT call any tool on this first turn.
From their reply on, coach from what they report and use minimal pairs, tongue
twisters, and real words — running exercises via the exercise tools when useful.
Keep it encouraging — pronunciation is vulnerable work.
```

`buildWorldStarterPrompt` returns (roughly lines 248-254):

```
Practice English around ${input.interest}, which the student told us they care about.
Approach it through ${input.angle}.
Open with one or two plain-text sentences and a single question — do NOT call any
tool on this first turn. Once the conversation is going, introduce 1-2 useful
words naturally and offer them via annotate_turn saveables rather than stopping
to define them.
Keep it conversational: one thing at a time, and let them do most of the talking.${known}
```

The shared block to append to all three (call it **TEACH_TURN_EXTRAS**):

```
After your teaching text, call annotate_turn with a concept whose title is a
short Spanish label for what you just taught (e.g. 'Adjetivos posesivos — my,
your, his'). This lets the student save the lesson.
End your message with a suggestions: block — exactly 3 short first-person replies
the student could send right now, each on its own line prefixed with "- ". Make
them fit this topic: one an attempt at the task you asked for, one a request for
another example, one a request to explain it more simply. Write them in English
at the student's level.
```

---

## Task 1: Add the teaching-turn instructions to `buildLearnStarterPrompt`

**Files:**
- Modify: `lib/ai-prompts.ts` (function `buildLearnStarterPrompt`, ~lines 196-216)
- Test: `lib/ai-practice/starters/__tests__/registry.test.ts` (`describe("learn starter")`, ~lines 45-71)

- [ ] **Step 1: Write the failing tests**

Add these `it` blocks inside `describe("learn starter", () => { ... })` in `lib/ai-practice/starters/__tests__/registry.test.ts`:

```ts
  it("still forbids exercise tools on the first turn but allows annotate_turn", () => {
    const prompt = getStarter("learn").build(ctx()).prompt;
    expect(prompt).toContain("Do NOT call any exercise tool on this first turn");
    expect(prompt).not.toMatch(/Do NOT call any tool on this first turn/i);
  });

  it("tells the coach to emit a concept so the lesson can be saved", () => {
    const prompt = getStarter("learn").build(ctx()).prompt;
    expect(prompt).toMatch(/call annotate_turn with a concept/i);
  });

  it("tells the coach to end with a topical suggestions: block", () => {
    const prompt = getStarter("learn").build(ctx()).prompt;
    expect(prompt).toMatch(/end your message with a suggestions: block/i);
    expect(prompt).toContain("exactly 3 short first-person replies");
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test -- lib/ai-practice/starters/__tests__/registry.test.ts`
Expected: the 3 new `learn starter` tests FAIL (`call annotate_turn with a concept` etc. not found in prompt). The existing `learn` test that already asserts `"Do NOT call any exercise tool on this first turn"` — note the current text actually says exactly that, so `not.toMatch(/Do NOT call any tool on this first turn/i)` already passes; the concept/suggestions assertions are the ones that must fail.

- [ ] **Step 3: Edit `buildLearnStarterPrompt`**

In `lib/ai-prompts.ts`, replace the returned template literal of `buildLearnStarterPrompt` with:

```ts
  return `Teach this ${input.level} student ONE new thing right now: ${input.angle}.
Structure: name it, explain it in at most three lines, give two examples, then
ask one short question in plain text to check they followed.
Do NOT call any exercise tool on this first turn — wait until they reply, then
run one exercise via the exercise tools. You MAY call annotate_turn on this turn.
Pick something genuinely useful at ${input.level} — not trivia, not something
far above their level.${syllabus}${avoid}
After your teaching text, call annotate_turn with a concept whose title is a
short Spanish label for what you just taught (e.g. 'Adjetivos posesivos — my,
your, his'). This lets the student save the lesson.
End your message with a suggestions: block — exactly 3 short first-person replies
the student could send right now, each on its own line prefixed with "- ". Make
them fit this topic: one an attempt at the task you asked for, one a request for
another example, one a request to explain it more simply. Write them in English
at the student's level.`;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test -- lib/ai-practice/starters/__tests__/registry.test.ts`
Expected: all `learn starter` tests PASS. `review starter` and `world starter` tests still PASS (unchanged so far).

- [ ] **Step 5: Commit**

```bash
git add lib/ai-prompts.ts lib/ai-practice/starters/__tests__/registry.test.ts
git commit -m "feat(ai-coach): learn starter offers save-lesson chip + topical suggestions"
```

---

## Task 2: Add the same instructions to `buildPronunciationStarterPrompt`

**Files:**
- Modify: `lib/ai-prompts.ts` (function `buildPronunciationStarterPrompt`, ~lines 223-238)
- Test: `lib/ai-practice/starters/__tests__/registry.test.ts`

Note: there is no `describe("pronunciation starter")` block and no `pronunciation` id in the `STARTERS` registry — `buildPronunciationStarterPrompt` is called elsewhere (adaptive starter path). Test it directly by importing the builder.

- [ ] **Step 1: Write the failing tests**

At the top of `lib/ai-practice/starters/__tests__/registry.test.ts`, extend the existing import from `@/lib/ai-prompts` (or add one) so `buildPronunciationStarterPrompt` and `buildWorldStarterPrompt` are in scope:

```ts
import {
  buildPronunciationStarterPrompt,
  buildWorldStarterPrompt,
  buildReviewStarterPrompt,
} from "@/lib/ai-prompts";
```

Then add a new `describe` block at the end of the file, before `describe("STARTERS registry")`:

```ts
describe("pronunciation starter prompt", () => {
  it("no longer forbids all tools on the first turn", () => {
    const prompt = buildPronunciationStarterPrompt({ level: "A2" });
    expect(prompt).not.toMatch(/Do NOT call any tool on this first turn/i);
    expect(prompt).toContain("Do NOT call any exercise tool on this first turn");
  });

  it("tells the coach to emit a concept for the sound it taught", () => {
    const prompt = buildPronunciationStarterPrompt({ level: "A2" });
    expect(prompt).toMatch(/call annotate_turn with a concept/i);
  });

  it("tells the coach to end with a topical suggestions: block", () => {
    const prompt = buildPronunciationStarterPrompt({ level: "A2" });
    expect(prompt).toMatch(/end your message with a suggestions: block/i);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test -- lib/ai-practice/starters/__tests__/registry.test.ts`
Expected: all 3 `pronunciation starter prompt` tests FAIL — current text says `"Do NOT call any tool on this first turn"` and has no concept/suggestions instruction.

- [ ] **Step 3: Edit `buildPronunciationStarterPrompt`**

In `lib/ai-prompts.ts`, replace the returned template literal of `buildPronunciationStarterPrompt` with:

```ts
  return `You are a friendly English pronunciation coach for a native Spanish speaker at level ${input.level}.
Focus on sounds that are genuinely tricky for Spanish speakers at this level.${targets}
First turn: pick ONE sound, describe it clearly in plain text (mouth position, airflow),
give two example words, and a short phrase to say. Ask them to type the phrase back
with notes on how it felt. Do NOT call any exercise tool on this first turn — you
MAY call annotate_turn.
From their reply on, coach from what they report and use minimal pairs, tongue
twisters, and real words — running exercises via the exercise tools when useful.
Keep it encouraging — pronunciation is vulnerable work.
After your teaching text, call annotate_turn with a concept whose title is a
short Spanish label for the sound you just taught (e.g. 'Sonido /æ/ vs /ʌ/').
This lets the student save the lesson.
End your message with a suggestions: block — exactly 3 short first-person replies
the student could send right now, each on its own line prefixed with "- ". Make
them fit this sound: one an attempt at saying the phrase with a note on how it
felt, one a request for another example word, one a request to explain the mouth
position more simply. Write them in English at the student's level.`;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test -- lib/ai-practice/starters/__tests__/registry.test.ts`
Expected: all `pronunciation starter prompt` tests PASS. Everything else still PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/ai-prompts.ts lib/ai-practice/starters/__tests__/registry.test.ts
git commit -m "feat(ai-coach): pronunciation starter offers save-lesson chip + topical suggestions"
```

---

## Task 3: Add the same instructions to `buildWorldStarterPrompt`

**Files:**
- Modify: `lib/ai-prompts.ts` (function `buildWorldStarterPrompt`, ~lines 240-255)
- Test: `lib/ai-practice/starters/__tests__/registry.test.ts` (`describe("world starter")`, ~lines 96-119 — the registry-level one; also add a builder-level block)

- [ ] **Step 1: Write the failing tests**

Add a new `describe` block at the end of `lib/ai-practice/starters/__tests__/registry.test.ts`, before `describe("STARTERS registry")` (imports for `buildWorldStarterPrompt` were added in Task 2):

```ts
describe("world starter prompt", () => {
  const base = { interest: "gaming", knownWords: [], angle: "a real situation they would face" } as const;

  it("no longer forbids all tools on the first turn", () => {
    const prompt = buildWorldStarterPrompt({ ...base });
    expect(prompt).not.toMatch(/do NOT call any\s+tool on this first turn/i);
    expect(prompt).toContain("Do NOT call any exercise tool on this first turn");
  });

  it("tells the coach to emit a concept so the point can be saved", () => {
    const prompt = buildWorldStarterPrompt({ ...base });
    expect(prompt).toMatch(/call annotate_turn with a concept/i);
  });

  it("tells the coach to end with a topical suggestions: block", () => {
    const prompt = buildWorldStarterPrompt({ ...base });
    expect(prompt).toMatch(/end your message with a suggestions: block/i);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test -- lib/ai-practice/starters/__tests__/registry.test.ts`
Expected: all 3 `world starter prompt` tests FAIL — current text says `"do NOT call any\ntool on this first turn"` (the phrase wraps across two lines: `"do NOT call any"` then `"tool on this first turn"`), has no `"exercise tool"` phrasing, and no concept/suggestions instruction.

- [ ] **Step 3: Edit `buildWorldStarterPrompt`**

In `lib/ai-prompts.ts`, replace the returned template literal of `buildWorldStarterPrompt` with:

```ts
  return `Practice English around ${input.interest}, which the student told us they care about.
Approach it through ${input.angle}.
Open with one or two plain-text sentences and a single question. Do NOT call any
exercise tool on this first turn — you MAY call annotate_turn. Once the
conversation is going, introduce 1-2 useful words naturally and offer them via
annotate_turn saveables rather than stopping to define them.
Keep it conversational: one thing at a time, and let them do most of the talking.${known}
After your opening, call annotate_turn with a concept whose title is a short
Spanish label for the vocabulary point or expression you introduced (e.g.
'Vocabulario de videojuegos — to grind, to respawn'). This lets the student save
it. Skip the concept only if this turn introduced nothing teachable.
End your message with a suggestions: block — exactly 3 short first-person replies
the student could send right now, each on its own line prefixed with "- ". Make
them fit this topic: one an answer to your question, one a request for another
example, one a request to explain it more simply. Write them in English at the
student's level.`;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test -- lib/ai-practice/starters/__tests__/registry.test.ts`
Expected: all `world starter prompt` tests PASS. Existing `describe("world starter")` registry tests (rotation by seed, availability) still PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/ai-prompts.ts lib/ai-practice/starters/__tests__/registry.test.ts
git commit -m "feat(ai-coach): world starter offers save-lesson chip + topical suggestions"
```

---

## Task 4: Lock in that `review` starter is unchanged

**Files:**
- Test: `lib/ai-practice/starters/__tests__/registry.test.ts` (`describe("review starter")`, ~lines 73-94)

- [ ] **Step 1: Write the guard test**

Add this `it` block inside `describe("review starter", () => { ... })`:

```ts
  it("does not ask for a concept or a suggestions: block", () => {
    const state = stateWithWeakTopic("past-simple", 0.62);
    const prompt = getStarter("review").build(ctx({ state })).prompt;
    expect(prompt).not.toMatch(/call annotate_turn with a concept/i);
    expect(prompt).not.toMatch(/end your message with a suggestions: block/i);
  });
```

- [ ] **Step 2: Run the test to verify it passes immediately**

Run: `pnpm test -- lib/ai-practice/starters/__tests__/registry.test.ts`
Expected: PASS on the first run (no code change needed — this is a regression guard proving Tasks 1-3 did not leak into `review`).

- [ ] **Step 3: Commit**

```bash
git add lib/ai-practice/starters/__tests__/registry.test.ts
git commit -m "test(ai-coach): guard review starter against save-lesson/suggestions leakage"
```

---

## Task 5: Full verification

- [ ] **Step 1: Type-check**

Run: `pnpm type-check`
Expected: no errors. (Only string literals changed; no signature changes.)

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: no new warnings. Watch for max-line-length on the edited functions in `lib/ai-prompts.ts` — if a template-literal line trips the linter, rewrap the prose across more lines (content unchanged).

- [ ] **Step 3: Full unit test run**

Run: `pnpm test -- lib/ai-practice`
Expected: all pass. If the full suite is needed: `pnpm test` (note: the full suite has been observed to time out at 120s in this repo — scoping to `lib/ai-practice` is acceptable for this change).

- [ ] **Step 4: Manual smoke check (browser)**

Run: `pnpm dev`, open the AI Coach, tap the "Enséñame algo nuevo" starter.
Expected in the first coach bubble:
  - A "Guardar explicación" chip below the bubble (from `SaveConceptChip`).
  - 3 reply suggestion chips that relate to the taught concept (not the generic "Could you give me an example? / Can you rephrase that simpler? / How do I answer this in English?" trio).
  - Tapping "Guardar explicación" shows "Guardada"; the item appears in "Mi inglés" under the Explicaciones filter.
If the model omits the `suggestions:` block, the generic fallback still renders — acceptable, not a regression.

- [ ] **Step 5: Commit any lint rewrap**

```bash
git add lib/ai-prompts.ts
git commit -m "style(ai-prompts): rewrap starter prompt prose for line length"
```

(Skip if Step 2 produced no changes.)

---

## Self-Review

**Spec coverage:**
- Spec §A "Relajar la regla del turno 1" → Task 1 Step 3, Task 2 Step 3, Task 3 Step 3 (all change "any tool" → "any exercise tool … MAY call annotate_turn"). `review` untouched → Task 4 guard. ✅
- Spec §B "Instruir a emitir `concept`" → Task 1/2/3 Step 3 append the concept instruction; Task 1/2/3 Step 1 assert it. ✅
- Spec §C "cerrar con un bloque `suggestions:`" → Task 1/2/3 Step 3 append the suggestions instruction; Step 1 asserts it. ✅
- Spec "Componentes tocados: only `lib/ai-prompts.ts`" → no other source file modified; only the test file. ✅
- Spec "Pruebas": builder contains concept instruction ✅, contains suggestions instruction ✅, no longer contains "Do NOT call any tool" / does contain "exercise tool" ✅ (Task 1/2/3 Step 1), `review` has neither ✅ (Task 4).

**Placeholder scan:** No "TBD"/"TODO"/"handle edge cases". Every code step shows the full replacement template literal. ✅

**Type consistency:** No types or signatures touched. `buildPronunciationStarterPrompt({ level })` and `buildWorldStarterPrompt({ interest, knownWords, angle })` call shapes in the tests match their existing definitions in `lib/ai-prompts.ts` (verified against lines 223-227 and 240-247). ✅

**Note on the `world` builder's existing string:** the current phrase is split as `"...single question — do NOT call any\ntool on this first turn."`. Task 3 Step 3 replaces the whole literal, so the split is removed; the Task 3 Step 2 "expected fail" reason accounts for this wrapping.
