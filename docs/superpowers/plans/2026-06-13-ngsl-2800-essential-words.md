# NGSL 2800 — Essential Words Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing Core 1000 vocabulary feature to cover ranks 1001–2800 from the NGSL, and rename the feature "Essential Words" in all user-visible text.

**Architecture:** Raise `MAX_CHUNKS` from 10 to 28 and update the Zod rank ceiling from 1000 to 2800 — the existing loader, SRS queue, and session engine already handle any dataset size. UI string changes are purely cosmetic and isolated to three files.

**Tech Stack:** TypeScript, Zod, Vitest, Next.js App Router, Tailwind v4

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `lib/core-1000/types.ts` | Raise `MAX_CHUNKS` to 28 |
| Modify | `lib/core-1000/schema.ts` | Raise Zod rank ceiling to 2800 |
| Modify | `lib/core-1000/__tests__/schema.test.ts` | Update test that asserts rank 1001 is rejected |
| Modify | `app/practice/core-1000/page.tsx` | Rename "Core 1000" → "Essential Words" in title/heading |
| Modify | `components/theme/sidebar/navConfig.ts` | Rename nav label |

---

## Task 1: Update Zod schema and its test

**Files:**
- Modify: `lib/core-1000/schema.ts:11`
- Modify: `lib/core-1000/__tests__/schema.test.ts:31`

- [ ] **Step 1: Update the failing test first**

In `lib/core-1000/__tests__/schema.test.ts`, update the `"rejects rank out of range"` test (line 29–32):

```ts
it("rejects rank out of range", () => {
  expect(CoreWordSchema.safeParse({ ...base, rank: 0 }).success).toBe(false);
  expect(CoreWordSchema.safeParse({ ...base, rank: 2801 }).success).toBe(false);
});
```

- [ ] **Step 2: Run the test — confirm it fails**

```bash
pnpm test lib/core-1000/__tests__/schema.test.ts
```

Expected: FAIL — `rank: 2801` is now being tested but the ceiling is still 1000, so it passes Zod incorrectly (wait — 2801 > 1000 so it still fails, meaning the test may pass by coincidence). Run to confirm baseline before touching schema.

- [ ] **Step 3: Raise the Zod rank ceiling**

In `lib/core-1000/schema.ts` line 11, change:

```ts
rank: z.number().int().min(1).max(1000),
```

to:

```ts
rank: z.number().int().min(1).max(2800),
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
pnpm test lib/core-1000/__tests__/schema.test.ts
```

Expected: all 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/core-1000/schema.ts lib/core-1000/__tests__/schema.test.ts
git commit -m "feat(core-1000): raise Zod rank ceiling to 2800"
```

---

## Task 2: Raise MAX_CHUNKS constant

**Files:**
- Modify: `lib/core-1000/types.ts:36`

- [ ] **Step 1: Update the constant**

In `lib/core-1000/types.ts` line 36, change:

```ts
export const MAX_CHUNKS = 10;
```

to:

```ts
export const MAX_CHUNKS = 28;
```

- [ ] **Step 2: Run the full core-1000 test suite**

```bash
pnpm test lib/core-1000
```

Expected: all tests PASS. The loader breaks out of the loop when a chunk file doesn't exist, so raising `MAX_CHUNKS` with only 10 chunks present causes no failures.

- [ ] **Step 3: Commit**

```bash
git add lib/core-1000/types.ts
git commit -m "feat(core-1000): raise MAX_CHUNKS to 28 to support NGSL 2800"
```

---

## Task 3: Rename "Core 1000" → "Essential Words" in UI

**Files:**
- Modify: `app/practice/core-1000/page.tsx`
- Modify: `components/theme/sidebar/navConfig.ts`

The `DeckProgressHeader` already uses `stats.totalWords` dynamically — no hardcoded "1000" there.

- [ ] **Step 1: Update the page metadata title**

In `app/practice/core-1000/page.tsx` line 4, change:

```ts
export const metadata = { title: 'Core 1000' }
```

to:

```ts
export const metadata = { title: 'Essential Words' }
```

- [ ] **Step 2: Update the page heading**

In `app/practice/core-1000/page.tsx` line 15, change the JSX text from `Core 1000` to `Essential Words`.

- [ ] **Step 3: Update the sidebar nav label**

In `components/theme/sidebar/navConfig.ts` line 27, change:

```ts
{ name: "Core 1000", href: "/practice/core-1000", icon: ListOrdered },
```

to:

```ts
{ name: "Essential Words", href: "/practice/core-1000", icon: ListOrdered },
```

- [ ] **Step 4: Verify no other hardcoded "Core 1000" strings remain in visible UI**

```bash
grep -r "Core 1000" app/ components/ --include="*.tsx" --include="*.ts"
```

Expected: no matches (or only in comments). Fix any remaining occurrences.

- [ ] **Step 5: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/practice/core-1000/page.tsx components/theme/sidebar/navConfig.ts
git commit -m "feat(core-1000): rename 'Core 1000' to 'Essential Words' in UI"
```

---

## Task 4: Add NGSL data chunks (content work)

**Files:**
- Create: `public/core-1000/words-011.json` through `public/core-1000/words-028.json`

Each file must follow this exact structure (100 entries per file):

```json
{
  "version": 1,
  "entries": [
    {
      "rank": 1001,
      "word": "example",
      "pos": "noun",
      "ipa_strong": "/ɪɡˈzæmpəl/",
      "example_sentence": "This is an example sentence.",
      "cefr_level": "A2"
    }
  ]
}
```

Constraints enforced by the loader (violations throw in dev):
- Exactly 100 entries per file
- Ranks must be contiguous: entry at index `i` in chunk `n` must have `rank = (n-1)*100 + i + 1`
- `ipa_strong` must be wrapped in forward slashes: `/ɪɡˈzæmpəl/`
- `ipa_weak` is optional; if present, `sentence_ipa` is required
- `cefr_level`: one of `A1`, `A2`, `B1`, `B2`, `C1`
- `pos`: one of `noun`, `verb`, `adjective`, `adverb`, `pronoun`, `preposition`, `conjunction`, `determiner`, `article`, `modal`, `auxiliary`, `number`, `interjection`

Chunk → rank range:
| File | Ranks |
|------|-------|
| `words-011.json` | 1001–1100 |
| `words-012.json` | 1101–1200 |
| `words-013.json` | 1201–1300 |
| `words-014.json` | 1301–1400 |
| `words-015.json` | 1401–1500 |
| `words-016.json` | 1501–1600 |
| `words-017.json` | 1601–1700 |
| `words-018.json` | 1701–1800 |
| `words-019.json` | 1801–1900 |
| `words-020.json` | 1901–2000 |
| `words-021.json` | 2001–2100 |
| `words-022.json` | 2101–2200 |
| `words-023.json` | 2201–2300 |
| `words-024.json` | 2301–2400 |
| `words-025.json` | 2401–2500 |
| `words-026.json` | 2501–2600 |
| `words-027.json` | 2601–2700 |
| `words-028.json` | 2701–2800 |

- [ ] **Step 1: Author `words-011.json` (ranks 1001–1100)**

Create `public/core-1000/words-011.json` with 100 entries following NGSL frequency order.

- [ ] **Step 2: Validate the chunk**

```bash
pnpm test lib/core-1000/__tests__/dataset.test.ts
```

Expected: PASS.

- [ ] **Step 3: Commit the chunk**

```bash
git add public/core-1000/words-011.json
git commit -m "content(core-1000): add NGSL ranks 1001-1100"
```

- [ ] **Step 4: Repeat for chunks 012–028**

Repeat Steps 1–3 for each subsequent chunk, committing each one separately.

---

## Spec Coverage Check

| Spec requirement | Covered by |
|-----------------|------------|
| `MAX_CHUNKS` 10→28 | Task 2 |
| Zod rank ceiling 1000→2800 | Task 1 |
| UI rename "Core 1000" → "Essential Words" | Task 3 |
| Data chunks `words-011` … `words-028` | Task 4 |
| `c1k:` prefix unchanged | No code change needed |
| Progress text uses `stats.totalWords` (dynamic) | Already implemented in `DeckProgressHeader` |
| Loader auto-detects new chunks | Already implemented in `data.ts` |
