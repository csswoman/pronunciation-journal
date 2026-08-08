# Essential Words — Fase 0: Contenido (high/offer) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a cloze-viable example sentence variant to `high` and `offer` — the only 2 words in the 2800-entry Essential Words dataset without a viable `cloze_sentence` — so `cloze_sentence` coverage reaches 100% and the Fase A/B session design never needs a `define_to_word` fallback component.

**Architecture:** A tiny one-off Node script (not a reusable library module — this fixes exactly 2 hand-picked entries) reads the two target chunk files, appends a new `SentenceVariant` to each entry's `example_sentences[]`, computes `sentence_ipa` for the new sentence using the same CMU-dictionary + ARPAbet-to-IPA pipeline `apply-example-sentences.mjs` already uses, writes the chunk files back, and rebuilds `words-all.json`. The dataset test suite (`validate:essential-words`) is the acceptance gate.

**Tech Stack:** Node ESM script, `cmu-pronouncing-dictionary`, Vitest for verification. No app code changes — this phase touches only `public/essential-words/*.json`.

**Spec:** `docs/superpowers/specs/2026-08-04-essential-words-learning-sessions-design.md`, §5.

---

## Context the engineer needs

- `high` is rank 148 in `public/essential-words/words-002.json`. Its current entry:
  ```json
  {
    "rank": 148,
    "word": "high",
    "pos": "adjective",
    "ipa_strong": "/ˈhaɪ/",
    "example_sentence": "The wall is very high.",
    "cefr_level": "A1",
    "sentence_ipa": "/ðə ˈwɔl ˈɪz ˈvɛɹiː ˈhaɪ/",
    "meaning": "far from the ground",
    "translation": "alto",
    "example_sentences": [
      {
        "sentence": "The prices are too high for me.",
        "sentence_ipa": "/ðə ˈpɹaɪsəz ˈɑɹ ˈtuː ˈhaɪ ˈfɔɹ ˈmiː/"
      }
    ]
  }
  ```
  Neither its base sentence nor its one existing variant produces a viable cloze
  (`lib/essential-words/cloze.ts` → `hasEnoughContext` from `lib/exercises/eligibility.ts`
  rejects both — too short after blanking).

- `offer` is rank 237 in `public/essential-words/words-003.json`.

- The spec (§5) specifies the exact replacement sentences, already checked against
  `clozeFor` and against the guideline in §5.1 (concrete, everyday vocabulary, no
  words rarer than necessary):
  - `high` → `"The wall in the garden is very high."`
  - `offer` → `"They offer free coffee every morning."`

- `sentence_ipa` **must not be hand-typed**. The dataset gate
  (`lib/essential-words/__tests__/dataset.test.ts`) checks every variant's
  `sentence_ipa` is slash-wrapped and non-empty, and downstream cards read it
  directly for TTS pacing — a wrong transcription would silently mis-teach
  pronunciation. Reuse the same CMU-dictionary lookup + `arpabetStringToIpa`
  conversion already used in `scripts/essential-words/apply-example-sentences.mjs`
  (functions `lookupIpa` / `sentenceIpa` there, lines 39–59) and
  `scripts/essential-words/backfill-sentence-ipa.mjs`. Do not reimplement the
  phoneme mapping — import `arpabetStringToIpa` from `scripts/lib/arpabet-to-ipa.mjs`.

- `words-all.json` is a flat concatenation of all `words-NNN.json` chunks (see
  `rebuildWordsAll()` in `apply-example-sentences.mjs`, lines 125–139) — it must be
  rebuilt after editing the chunk files, or `lib/essential-words/client-fetch.ts`
  (which reads `words-all.json` at runtime) will serve stale data.

---

## File Structure

| File | Responsibility |
| - | - |
| `scripts/essential-words/fix-phase0-cloze.mjs` (create, one-off) | Adds the 2 variants with computed IPA, patches the 2 chunk files, rebuilds `words-all.json` |
| `public/essential-words/words-002.json` (modify) | `high` entry gains a 2nd variant |
| `public/essential-words/words-003.json` (modify) | `offer` entry gains a variant |
| `public/essential-words/words-all.json` (modify, generated) | Rebuilt from chunks — not hand-edited |

---

### Task 1: One-off script to add the two variants

**Files:**
- Create: `scripts/essential-words/fix-phase0-cloze.mjs`

- [ ] **Step 1: Write the script**

Create `scripts/essential-words/fix-phase0-cloze.mjs`:

```js
/**
 * One-off fix for Essential Words Fase 0 (see
 * docs/superpowers/specs/2026-08-04-essential-words-learning-sessions-design.md §5).
 *
 * `high` and `offer` are the only 2 of 2800 entries with no cloze-viable sentence
 * in any existing variant. This adds one new variant to each, computes its
 * sentence_ipa with the same CMU-dictionary pipeline apply-example-sentences.mjs
 * uses, and rebuilds words-all.json.
 *
 * Not meant to be reused — the two sentences are hardcoded because this fixes
 * exactly these two hand-picked entries. Delete this file after running it once.
 *
 * Usage:
 *   node scripts/essential-words/fix-phase0-cloze.mjs --dry-run
 *   node scripts/essential-words/fix-phase0-cloze.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { arpabetStringToIpa } from "./lib/arpabet-to-ipa.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const ROOT = path.join(__dirname, "../..");
const OUT_DIR = path.join(ROOT, "public/essential-words");

const mod = require("cmu-pronouncing-dictionary");
const dict = mod.dictionary ?? mod.default ?? mod;

const dryRun = process.argv.includes("--dry-run");

const FIXES = [
  { chunk: "words-002.json", word: "high", sentence: "The wall in the garden is very high." },
  { chunk: "words-003.json", word: "offer", sentence: "They offer free coffee every morning." },
];

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
      JSON.stringify({ version: 1, entries: all }, null, 2) + "\n",
    );
  }
  return all.length;
}

function main() {
  if (dryRun) console.log("Dry run — no files written.\n");

  for (const fix of FIXES) {
    const file = path.join(OUT_DIR, fix.chunk);
    const data = JSON.parse(fs.readFileSync(file, "utf-8"));
    const entry = data.entries.find((e) => e.word === fix.word);
    if (!entry) throw new Error(`${fix.word} not found in ${fix.chunk}`);

    const variant = {
      sentence: fix.sentence,
      sentence_ipa: sentenceIpa(fix.sentence, entry.word, entry.ipa_weak ?? null),
    };
    entry.example_sentences = [...(entry.example_sentences ?? []), variant];

    console.log(`${fix.word}: +"${variant.sentence}" [${variant.sentence_ipa}]`);

    if (!dryRun) {
      fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
    }
  }

  const count = rebuildWordsAll();
  console.log(`\nwords-all.json entries: ${count}`);
  console.log(dryRun ? "Dry run done." : "Done.");
}

main();
```

- [ ] **Step 2: Dry-run it**

Run: `node scripts/essential-words/fix-phase0-cloze.mjs --dry-run`

Expected output (IPA may differ slightly depending on CMU dictionary version, but
must be non-empty and slash-wrapped for every token):

```
high: +"The wall in the garden is very high." [/ðə wɔl ɪn ðə ˈɡɑːrdən ɪz ˈvɛri haɪ/]
offer: +"They offer free coffee every morning." [/ðeɪ ˈɔːfər friː ˈkɒfi ˈɛvri ˈmɔːrnɪŋ/]

words-all.json entries: 2800
Dry run done.
```

If either line prints a bare lowercase word instead of an IPA transcription (e.g.
`garden` instead of `/ˈɡɑːrdən/`), that token is missing from the CMU dictionary —
stop and check `scripts/essential-words/data/ipa-exceptions.json` for the pattern
used to add manual overrides; do not proceed with an incomplete transcription.

- [ ] **Step 3: Run it for real**

Run: `node scripts/essential-words/fix-phase0-cloze.mjs`

Expected: same output as the dry run, without "Dry run" text, and
`public/essential-words/words-002.json`, `words-003.json`, and `words-all.json` are
modified on disk.

- [ ] **Step 4: Verify the new variants produce viable cloze**

Run:
```bash
npx vitest run --reporter=verbose -t "nonexistent" lib/essential-words/__tests__/cloze.test.ts
```

This is just to confirm the existing cloze test suite still passes (no assertion
changes needed yet — Task 2 adds the targeted check). Expected: PASS, no failures.

- [ ] **Step 5: Commit**

```bash
git add public/essential-words/words-002.json public/essential-words/words-003.json public/essential-words/words-all.json scripts/essential-words/fix-phase0-cloze.mjs
git commit -m "content(essential-words): add cloze-viable sentence for high and offer"
```

---

### Task 2: Verify 100% cloze coverage and the dataset gate

**Files:**
- Test: `lib/essential-words/__tests__/dataset.test.ts` (add one assertion)

- [ ] **Step 1: Write the failing test**

Append inside the existing `describe("Core 1000 dataset", ...)` block in
`lib/essential-words/__tests__/dataset.test.ts` (check the file first for the exact
describe name and existing imports — follow its established `words` fixture
pattern rather than reloading the JSON independently):

```ts
  it("every entry has at least one cloze-viable sentence", async () => {
    const { clozeFor } = await import("../cloze");
    const failing = words.filter((w) => {
      const pool = [w.example_sentence, ...(w.example_sentences ?? []).map((v) => v.sentence)];
      return !pool.some((s) => clozeFor(w, s) !== null);
    });
    const report = failing.map((w) => `#${w.rank} ${w.word}`).join(", ");
    expect(failing, `Words with no cloze-viable sentence: ${report}`).toEqual([]);
  });
```

- [ ] **Step 2: Run test to verify it fails before Task 1's fix is trusted blind**

This step is a safety check, not a strict TDD red — Task 1 already applied the
fix. Run:

```bash
npx vitest run lib/essential-words/__tests__/dataset.test.ts
```

Expected: PASS. If it fails, the failure message lists exactly which words still
lack a cloze-viable sentence — if it's only `high`/`offer`, Task 1's IPA generation
likely produced a sentence that still fails `hasEnoughContext` (too short after
blanking, or the CMU lookup silently produced an empty transcription for a token).
Re-check Task 1 Step 2's output before touching this test.

- [ ] **Step 3: Confirm no regressions in the full essential-words suite**

Run: `npx vitest run lib/essential-words`

Expected: PASS, all files. This is the invariant referenced in the spec (§7.1,
invariant 1) reaching 100% coverage for `cloze_sentence` — it was 99.93% (2798/2800)
before this phase.

- [ ] **Step 4: Run the full dataset validation gate**

Run: `pnpm validate:essential-words`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/essential-words/__tests__/dataset.test.ts
git commit -m "test(essential-words): gate 100% cloze-sentence coverage across dataset"
```

---

### Task 3: Remove the one-off script

**Files:**
- Delete: `scripts/essential-words/fix-phase0-cloze.mjs`

The script fixes exactly 2 hand-picked entries and has no reuse value — keeping it
around invites someone to run it again against a dataset where `high`/`offer` no
longer match its hardcoded assumptions.

- [ ] **Step 1: Delete it**

```bash
git rm scripts/essential-words/fix-phase0-cloze.mjs
```

- [ ] **Step 2: Confirm the dataset test still passes without the script present**

Run: `npx vitest run lib/essential-words/__tests__/dataset.test.ts`

Expected: PASS — the test in Task 2 checks the *data*, not the script that
produced it.

- [ ] **Step 3: Commit**

```bash
git commit -m "chore(essential-words): remove one-off Fase 0 content-fix script"
```

---

## Verification

- [ ] `pnpm validate:essential-words` passes
- [ ] `npx vitest run lib/essential-words` passes, no new failures
- [ ] `git log --oneline -3` shows the 3 commits above on the current branch
- [ ] Manual spot-check: read the `high` and `offer` entries in
      `public/essential-words/words-all.json` and confirm the new sentence appears
      in `example_sentences` with a non-empty `sentence_ipa`

This phase has **zero application-code changes** and no feature flag — it is safe
to merge independently of Fase A. It unblocks Fase A's §1.6 elegibility invariant
(every word has ≥1 modo elegible en cada nivel) by removing the last 2 dataset gaps.
