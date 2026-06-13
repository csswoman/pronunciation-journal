# Plan 008: Centralize all Gemini prompt strings into `lib/ai-prompts.ts`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat b543c9a..HEAD -- lib/ai-prompts.ts app/api/gemini/phrases/route.ts app/api/gemini/deck-suggest/route.ts app/api/sentences/generate/route.ts app/api/gemini/transcribe/route.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt / dx
- **Planned at**: commit `b543c9a`, 2026-06-11

## Why this matters

`CLAUDE.md` states "No Gemini prompts inside components. All prompts -> lib/ai-prompts.ts".
Four API route files contain inline `SYSTEM_PROMPT` or `prompt` string constants
instead of importing from the canonical module. Prompt strings scattered across
route files are harder to audit, test, or tune centrally. Centralising them
makes it possible to grep the full prompt surface in one file, diff prompt
changes in isolation, and mock them in tests without touching route logic.

## Current state

**Canonical module** — `lib/ai-prompts.ts` (full file, 39 lines as of `b543c9a`):

```typescript
// -- Interview --
export const INTERVIEW_SYSTEM_PROMPT = `You are an interview script generator ...`;

const INTERVIEW_SCENARIO_LABELS: Record<string, string> = { ... };

export function buildInterviewPrompt(scenario: string, level: string): string { ... }
```

Pattern: named `export const` for fixed system prompts, named `export function build*Prompt`
for dynamic prompts that take parameters. Match this style for all new exports.

**Inline prompts found in API routes** (confirmed as Gemini prompt strings):

| File | Line | Symbol | Excerpt |
|------|------|--------|---------|
| `app/api/gemini/phrases/route.ts` | 10 | `SYSTEM_PROMPT` | `You are an English pronunciation coach. Generate 10 natural...` |
| `app/api/gemini/deck-suggest/route.ts` | 23 | `SYSTEM_PROMPT` | `You are an English vocabulary coach. When given a deck name...` |
| `app/api/sentences/generate/route.ts` | 27 | `SYSTEM_PROMPT` | `You are an English language teacher for Spanish speakers...` |
| `app/api/gemini/transcribe/route.ts` | 200-202 | inline `prompt` (inside function body) | `Transcribe this short English pronunciation attempt. Target word: ...` |

Note: `lib/word-bank/gemini.ts:15` contains `SYSTEM_PROMPT` but is already inside `lib/`
(not `app/api/`). `lib/ai-practice/modes/roleplay.ts` and `lib/ai-practice/prompts.ts`
are also already in `lib/`. CLAUDE.md's rule targets routes/components — those lib files
are fine as-is and are out of scope.

**Route-to-export mapping** (what to create and where to import):

1. `app/api/gemini/phrases/route.ts` — `SYSTEM_PROMPT` (static) → new export `PHRASES_SYSTEM_PROMPT` in `lib/ai-prompts.ts`
2. `app/api/gemini/deck-suggest/route.ts` — `SYSTEM_PROMPT` (static) → new export `DECK_SUGGEST_SYSTEM_PROMPT` in `lib/ai-prompts.ts`
3. `app/api/sentences/generate/route.ts` — `SYSTEM_PROMPT` (static) + inline user prompt (line 46: dynamic, takes `count`/`topic`/`level`) → new exports `SENTENCE_GENERATE_SYSTEM_PROMPT` and `buildSentenceGeneratePrompt(count, topic, level)` in `lib/ai-prompts.ts`
4. `app/api/gemini/transcribe/route.ts` — inline `prompt` inside `transcribeWithFallback` (lines 200-202; dynamic, takes optional `targetWord`) → new export `buildTranscribePrompt(targetWord?: string)` in `lib/ai-prompts.ts`

## Commands you will need

| Purpose    | Command           | Expected on success |
|------------|-------------------|---------------------|
| Type-check | `pnpm type-check` | exit 0, no errors   |
| Lint       | `pnpm lint`       | exit 0              |
| Tests      | `pnpm test`       | all pass            |

## Scope

**In scope** (only files you should modify):
- `lib/ai-prompts.ts` (add new exports)
- `app/api/gemini/phrases/route.ts` (replace `SYSTEM_PROMPT` const with import)
- `app/api/gemini/deck-suggest/route.ts` (replace `SYSTEM_PROMPT` const with import)
- `app/api/sentences/generate/route.ts` (replace `SYSTEM_PROMPT` const and inline user prompt with imports)
- `app/api/gemini/transcribe/route.ts` (replace inline `prompt` variable with import call)

**Out of scope** (do NOT touch):
- `lib/word-bank/gemini.ts` — already in `lib/`, not an API route; out of scope for this plan.
- `lib/ai-practice/modes/roleplay.ts` — already in `lib/`.
- `lib/ai-practice/prompts.ts` — already in `lib/`.
- `lib/api/prompts.ts` — already in `lib/`.
- Any component file.
- Test files (no prompt-specific tests are required by this plan).

## Git workflow

- Branch: `advisor/008-centralize-ai-prompts`
- One commit per route, or one combined commit — either is fine.
- Commit message style: `refactor(ai): move inline Gemini prompts to lib/ai-prompts.ts`
- Do NOT push or open a PR unless the operator instructs it.

## Steps

### Step 1: Add new exports to `lib/ai-prompts.ts`

Append the following to the end of `lib/ai-prompts.ts`. Preserve every existing export unchanged.

```typescript
// -- Phrases --

export const PHRASES_SYSTEM_PROMPT = `You are an English pronunciation coach. Generate 10 natural English sentences for pronunciation practice. Requirements:
- Conversational, not textbook-stiff
- Mix of everyday, professional, and social contexts
- Vary sentence length (5-12 words each)
- Include phonetically challenging sounds: TH, R, W, V, SH, vowel reductions
- Never generate the same sentence twice across calls

Return ONLY valid JSON, no markdown, no code fences:
{"phrases":["sentence one","sentence two",...]}`;

// -- Deck suggest --

export const DECK_SUGGEST_SYSTEM_PROMPT = `You are an English vocabulary coach. When given a deck name and optional description, suggest 8 relevant English words or short phrases that fit the theme. Return ONLY valid JSON with no markdown, no code fences, no extra text — just raw JSON.

Format:
{"suggestions":[{"word":"example","meaning":"brief definition or usage context"}]}`;

// -- Sentence generation --

export const SENTENCE_GENERATE_SYSTEM_PROMPT = `You are an English language teacher for Spanish speakers.
Generate natural English sentences for sentence-reordering exercises.

Rules:
- Each sentence must be 4-12 words long
- Use clear, natural English (no slang unless requested)
- Sentences should relate to the given topic/level
- Return ONLY a JSON array of strings — no markdown, no extra text
- Vary sentence structures (statements, questions, negatives)`;

export function buildSentenceGeneratePrompt(count: number, topic: string, level: string): string {
  return `Generate ${count} English sentences for a ${level} learner about: "${topic}".
Return a JSON array of strings only. Example: ["The cat sat on the mat.", "She goes to school every day."]`;
}

// -- STT transcription --

export function buildTranscribePrompt(targetWord?: string): string {
  return targetWord
    ? `Transcribe this short English pronunciation attempt. Target word: "${targetWord}". Return ONLY the recognized words in plain text. If unintelligible, return an empty string.`
    : "Transcribe this short English pronunciation attempt. Return ONLY the recognized words in plain text. If unintelligible, return an empty string.";
}
```

**Verify**: `pnpm type-check` exits 0.

### Step 2: Update `app/api/gemini/phrases/route.ts`

1. Remove the local `const SYSTEM_PROMPT = ...` block (lines 10-18).
2. Add the import at the top of the file (after existing imports):
   ```typescript
   import { PHRASES_SYSTEM_PROMPT } from "@/lib/ai-prompts";
   ```
3. Replace every usage of `SYSTEM_PROMPT` in the file with `PHRASES_SYSTEM_PROMPT`.

**Verify**: `pnpm type-check` exits 0.

### Step 3: Update `app/api/gemini/deck-suggest/route.ts`

1. Remove the local `const SYSTEM_PROMPT = ...` block (lines 23-26).
2. Add the import:
   ```typescript
   import { DECK_SUGGEST_SYSTEM_PROMPT } from "@/lib/ai-prompts";
   ```
3. Replace every usage of `SYSTEM_PROMPT` in the file with `DECK_SUGGEST_SYSTEM_PROMPT`.

**Verify**: `pnpm type-check` exits 0.

### Step 4: Update `app/api/sentences/generate/route.ts`

1. Remove the local `const SYSTEM_PROMPT = ...` block (lines 27-35).
2. Remove the inline user prompt string inside `generateSentencesWithGemini` (line 46: the template literal starting with `"Generate ${count} English sentences..."`).
3. Add the import:
   ```typescript
   import { SENTENCE_GENERATE_SYSTEM_PROMPT, buildSentenceGeneratePrompt } from "@/lib/ai-prompts";
   ```
4. Replace `SYSTEM_PROMPT` usages with `SENTENCE_GENERATE_SYSTEM_PROMPT`.
5. Replace the removed inline user prompt with `buildSentenceGeneratePrompt(count, topic, level)`.

**Verify**: `pnpm type-check` exits 0.

### Step 5: Update `app/api/gemini/transcribe/route.ts`

1. In the `transcribeWithFallback` function (around lines 199-202), remove the local `const prompt = targetWord ? ... : ...` block.
2. Add the import at the top of the file (after existing imports):
   ```typescript
   import { buildTranscribePrompt } from "@/lib/ai-prompts";
   ```
3. Replace the removed `prompt` variable reference with `buildTranscribePrompt(targetWord)` at the call site inside `contents: [{ text: buildTranscribePrompt(targetWord) }, ...]`.

**Verify**: `pnpm type-check` exits 0.

### Step 6: Final verification

**Verify (zero inline prompts remain in routes)**:
```
grep -rn "You are" app/api
```
Expected output: **no matches** (exit 0 with empty output).

**Verify (all prompts imported from lib)**:
```
grep -rn "ai-prompts" app/api
```
Expected: at least 4 matches (one per updated route file).

**Verify tests**: `pnpm test` — all pass.
**Verify lint**: `pnpm lint` — exit 0.

## Test plan

No new test files are required — this is a pure refactor with no behaviour
change. The existing test suite (`pnpm test`) confirms nothing regressed.

If you want to add tests, model them after `lib/ai-prompts.ts`; a simple unit
test asserting `buildTranscribePrompt("hello")` contains the string `"hello"`
and `buildTranscribePrompt()` does not contain `"Target word"` would be
sufficient.

## Done criteria

- [ ] `grep -rn "You are" app/api` returns no matches
- [ ] `grep -rn "const SYSTEM_PROMPT" app/api` returns no matches
- [ ] `grep -rn "ai-prompts" app/api` returns matches in all 4 updated route files
- [ ] `pnpm type-check` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0, all tests pass
- [ ] `plans/README.md` status row for 008 updated to DONE

## STOP conditions

Stop and report back (do not improvise) if:

- The prompt text in any route file does not match the excerpt in this plan (the
  route may have been updated since this plan was written); copy the live text
  verbatim rather than guessing.
- Removing a local `SYSTEM_PROMPT` breaks the TypeScript build because it is
  referenced in more places than listed — audit all usages before deleting.
- `pnpm type-check` fails after any step with an error that is not an obvious
  import-name typo.
- Any existing test breaks after the refactor.

## Maintenance notes

- All future Gemini prompts for API routes must be added to `lib/ai-prompts.ts`
  (CLAUDE.md rule). Add a comment to any new route file as a reminder.
- The exports added here follow the same naming convention already in
  `lib/ai-prompts.ts`: `SCREAMING_SNAKE_CASE` for static strings, `build*Prompt`
  for factory functions.
- `lib/word-bank/gemini.ts` has its own `SYSTEM_PROMPT` constant. It is already
  inside `lib/` so it is compliant, but it could be migrated to `lib/ai-prompts.ts`
  in a follow-up if the team wants full centralisation.
