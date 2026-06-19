# Home Review Queue Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the home "Due for review" section with a unified, honest review queue that represents vocabulary + essential (Core-1000) + sounds, fixes empty states, and removes the disabled-button anti-pattern and hardcoded `/ð/` fallback.

**Architecture:** Server aggregates vocabulary + sounds into a `ReviewQueueSummary` in a new query module; a single client island (`ReviewQueueIsland` + `useMergedReviewQueue`) reads Dexie once to merge the Core-1000 essential count and preview. Two-tier IA: an actionable queue card (client) and a progress card (server). `ReviewQueueCard` is a pure renderer; the page's data layer owns the fetch.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind v4, Supabase (server queries), Dexie.js, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-06-18-home-review-queue-redesign-design.md`

---

## File Structure

**Create:**
- `lib/home/review-queue.ts` — `getReviewQueueSummary()` server aggregator; `ReviewSource`/`ReviewQueueSummary` types; tone derivation.
- `lib/home/__tests__/review-queue.test.ts` — unit tests for the aggregator shape/ordering/tone/semantics.
- `lib/core-1000/essential-due.ts` — pure `deriveEssentialSource(queueItems, introducedToday)` → `{ count, newAvailable, previewWords }`.
- `lib/core-1000/__tests__/essential-due.test.ts` — unit tests for essential derivation.
- `hooks/useMergedReviewQueue.ts` — client hook: reads Dexie via existing accessors, merges essential into server summary, returns final summary + merged preview.
- `components/home/ReviewQueueIsland.tsx` — `'use client'` wrapper owning the hook; renders `ReviewQueueCard`.
- `components/home/ReviewQueueCard.tsx` — pure renderer: headline, CTA state machine.
- `components/home/ReviewQueueBreakdown.tsx` — tappable per-source rows.
- `components/home/ReviewQueuePreview.tsx` — merged 3-item preview (extracted from current card).
- `components/home/ReviewProgressCard.tsx` — Tier 2 (retention + weakest sound, honest empty state); supersedes `HomeRetentionCard`.
- `components/home/__tests__/ReviewQueueCard.test.tsx`
- `components/home/__tests__/ReviewProgressCard.test.tsx`

**Modify:**
- `lib/home/constants.ts` — add `REVIEW_URGENCY_THRESHOLD` + `ReviewSource`/`ReviewQueueSummary` interfaces.
- `lib/home/queries.ts:222-263` — `getSoundsDueForHome` must exclude `next_review.is.null` from the due count.
- `app/page.tsx:35-77` — call `getReviewQueueSummary`, pass `reviewQueue` prop, drop redundant `words`/`dueCount`/`soundsDue` plumbing into the section.
- `components/home/HomeLayout.tsx` — thread `reviewQueue` to `HomeReviewsSection`.
- `components/home/HomeReviewsSection.tsx` — render `ReviewQueueIsland` + `ReviewProgressCard`.

**Delete (after migration):**
- `components/home/HomeReviewQueueCard.tsx`, `components/home/HomeRetentionCard.tsx`.

---

## Task 1: Constants + types

**Files:**
- Modify: `lib/home/constants.ts`

- [ ] **Step 1: Add threshold + queue types**

Append to `lib/home/constants.ts`:

```ts
/** A source's count feels urgent at or above this many scheduled reviews. */
export const REVIEW_URGENCY_THRESHOLD = 10;

export type ReviewSourceId = "vocabulary" | "essential" | "sounds";

export interface ReviewSource {
  id: ReviewSourceId;
  label: string;
  /** Strictly scheduled-due: next_review <= now (never new/null). */
  count: number;
  href: string;
  /** warning when count >= REVIEW_URGENCY_THRESHOLD */
  tone: "primary" | "warning";
}

export interface ReviewPreviewItem {
  id: string;
  text: string;
  ipa: string | null;
  translation: string | null;
  sourceId: ReviewSourceId;
}

export interface ReviewQueueSummary {
  /** Sum of server-known source counts (essential merged client-side). */
  total: number;
  /** New/unseen items available — powers the forward CTA, NOT part of total. */
  newAvailable: number;
  /** Only sources with count > 0, ordered by count desc. */
  sources: ReviewSource[];
  preview: ReviewPreviewItem[];
}

/** Maps a source id to its session route. */
export const REVIEW_SOURCE_HREF: Record<ReviewSourceId, string> = {
  vocabulary: "/practice/review",
  essential: "/practice/core-1000",
  sounds: "/practice/sounds",
};

export const REVIEW_SOURCE_LABEL: Record<ReviewSourceId, string> = {
  vocabulary: "Vocabulary",
  essential: "Essential words",
  sounds: "Sounds",
};

/** Derives tone from a count. Keeps presentation logic out of components. */
export function reviewToneForCount(count: number): "primary" | "warning" {
  return count >= REVIEW_URGENCY_THRESHOLD ? "warning" : "primary";
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: PASS (no usages yet).

- [ ] **Step 3: Commit**

```bash
git add lib/home/constants.ts
git commit -m "feat(home): review queue constants and types"
```

---

## Task 2: Fix sounds-due semantics

**Files:**
- Modify: `lib/home/queries.ts:222-232`
- Test: `lib/home/__tests__/sounds-due-semantics.test.ts` (create)

The current query counts never-practiced sounds (`next_review.is.null`) as due, inflating the number. The queue count must be scheduled-only.

- [ ] **Step 1: Write the failing test**

Create `lib/home/__tests__/sounds-due-semantics.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const orMock = vi.fn().mockReturnThis();
const supabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  or: orMock,
  lte: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
  in: vi.fn().mockResolvedValue({ data: [], error: null }),
};

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => supabase),
}));

beforeEach(() => {
  orMock.mockClear();
});

describe("getSoundsDueForHome", () => {
  it("excludes never-practiced (next_review is null) from the due query", async () => {
    const { getSoundsDueForHome } = await import("@/lib/home/queries");
    await getSoundsDueForHome("user-1");
    // No filter clause may opt-in next_review.is.null
    const orCalls = orMock.mock.calls.flat().join(" ");
    expect(orCalls).not.toContain("next_review.is.null");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/home/__tests__/sounds-due-semantics.test.ts`
Expected: FAIL — current `.or` contains `next_review.is.null`.

- [ ] **Step 3: Make the change**

In `lib/home/queries.ts`, replace the filter on the `getSoundsDueForHome` query:

```ts
// before:
//   .or(`next_review.lte.${now},next_review.is.null`)
// after:
    .lte("next_review", now)
```

Remove the now-unused `.or(...)` line. Keep `.eq("user_id", userId)`, `.order`, `.limit`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/home/__tests__/sounds-due-semantics.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/home/queries.ts lib/home/__tests__/sounds-due-semantics.test.ts
git commit -m "fix(home): exclude never-practiced sounds from due count"
```

---

## Task 3: Essential (Core-1000) derivation — pure function

**Files:**
- Create: `lib/core-1000/essential-due.ts`
- Test: `lib/core-1000/__tests__/essential-due.test.ts`

Reuses the queue builder's output. `kind: "review"` items are due; `kind: "new"` items in the queue are the available new (quota-limited). Preview takes the first due words.

- [ ] **Step 1: Write the failing test**

Create `lib/core-1000/__tests__/essential-due.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { deriveEssentialSource } from "@/lib/core-1000/essential-due";
import type { Core1000QueueItem } from "@/lib/core-1000/queue";

function item(word: string, kind: Core1000QueueItem["kind"]): Core1000QueueItem {
  return {
    kind,
    entry: {
      word, rank: 1, cefr_level: "A1", ipa_strong: `/${word}/`,
      example_sentence: `An ${word}.`,
    } as Core1000QueueItem["entry"],
  };
}

describe("deriveEssentialSource", () => {
  it("counts only review items as due and new items as available", () => {
    const queue = [item("apple", "review"), item("bread", "review"), item("cat", "new")];
    const r = deriveEssentialSource(queue);
    expect(r.count).toBe(2);
    expect(r.newAvailable).toBe(1);
  });

  it("builds preview from due items, capped at limit", () => {
    const queue = [
      item("a", "review"), item("b", "review"),
      item("c", "review"), item("d", "review"),
    ];
    const r = deriveEssentialSource(queue, 3);
    expect(r.previewWords).toHaveLength(3);
    expect(r.previewWords[0]).toMatchObject({ text: "a", sourceId: "essential" });
  });

  it("returns zeros for an empty queue", () => {
    const r = deriveEssentialSource([]);
    expect(r).toEqual({ count: 0, newAvailable: 0, previewWords: [] });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/core-1000/__tests__/essential-due.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `lib/core-1000/essential-due.ts`:

```ts
import type { Core1000QueueItem } from "./queue";
import type { ReviewPreviewItem } from "@/lib/home/constants";

const DEFAULT_PREVIEW_LIMIT = 3;

export interface EssentialSourceData {
  count: number;
  newAvailable: number;
  previewWords: ReviewPreviewItem[];
}

/** Pure: derives the essential review source from a built session queue. */
export function deriveEssentialSource(
  queue: Core1000QueueItem[],
  previewLimit = DEFAULT_PREVIEW_LIMIT,
): EssentialSourceData {
  const dueItems = queue.filter((i) => i.kind === "review");
  const newAvailable = queue.filter((i) => i.kind === "new").length;

  const previewWords: ReviewPreviewItem[] = dueItems
    .slice(0, previewLimit)
    .map((i) => ({
      id: `core1k:${i.entry.word.toLowerCase()}`,
      text: i.entry.word,
      ipa: i.entry.ipa_strong ?? null,
      translation: null,
      sourceId: "essential" as const,
    }));

  return { count: dueItems.length, newAvailable, previewWords };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/core-1000/__tests__/essential-due.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/core-1000/essential-due.ts lib/core-1000/__tests__/essential-due.test.ts
git commit -m "feat(core-1000): pure essential-due derivation"
```

---

## Task 4: Server aggregator `getReviewQueueSummary`

**Files:**
- Create: `lib/home/review-queue.ts`
- Test: `lib/home/__tests__/review-queue.test.ts`

Aggregates server-known sources (vocabulary + sounds) only. Essential is merged later client-side, so it is absent here.

- [ ] **Step 1: Write the failing test**

Create `lib/home/__tests__/review-queue.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildServerSummary } from "@/lib/home/review-queue";
import type { WordBankEntry } from "@/lib/word-bank/types";
import type { SoundDueHome } from "@/lib/home/constants";

const word = (id: string, text: string): WordBankEntry =>
  ({ id, text, ipa: `/${text}/`, translation: "x" } as WordBankEntry);
const sound = (id: number, ipa: string): SoundDueHome =>
  ({ soundId: id, ipa, example: null, accuracy: 50, daysOverdue: 0 });

describe("buildServerSummary", () => {
  it("includes only sources with count > 0, ordered by count desc", () => {
    const s = buildServerSummary({
      dueWords: [word("1", "a"), word("2", "b")],
      dueWordCount: 12,
      soundsDue: [sound(1, "/ð/")],
      newWordAvailable: 5,
    });
    expect(s.sources.map((x) => x.id)).toEqual(["vocabulary", "sounds"]);
    expect(s.total).toBe(13);
  });

  it("sets warning tone at or above the threshold", () => {
    const s = buildServerSummary({
      dueWords: [], dueWordCount: 10, soundsDue: [], newWordAvailable: 0,
    });
    expect(s.sources[0]).toMatchObject({ id: "vocabulary", tone: "warning" });
  });

  it("omits zero-count sources and builds vocabulary preview", () => {
    const s = buildServerSummary({
      dueWords: [word("1", "a")], dueWordCount: 1, soundsDue: [], newWordAvailable: 0,
    });
    expect(s.sources.map((x) => x.id)).toEqual(["vocabulary"]);
    expect(s.preview[0]).toMatchObject({ text: "a", sourceId: "vocabulary" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/home/__tests__/review-queue.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `lib/home/review-queue.ts`:

```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getWordsDueForReview,
  countWordsDueForReview,
} from "@/lib/word-bank/server-queries";
import { getSoundsDueForHome } from "@/lib/home/queries";
import {
  reviewToneForCount,
  REVIEW_SOURCE_HREF,
  REVIEW_SOURCE_LABEL,
  type ReviewSource,
  type ReviewQueueSummary,
  type ReviewPreviewItem,
  type SoundDueHome,
} from "@/lib/home/constants";
import type { WordBankEntry } from "@/lib/word-bank/types";

const PREVIEW_LIMIT = 3;

interface ServerInputs {
  dueWords: WordBankEntry[];
  dueWordCount: number;
  soundsDue: SoundDueHome[];
  newWordAvailable: number;
}

/** Pure: assembles the server-known summary (vocabulary + sounds). */
export function buildServerSummary(input: ServerInputs): ReviewQueueSummary {
  const candidates: ReviewSource[] = [
    {
      id: "vocabulary",
      label: REVIEW_SOURCE_LABEL.vocabulary,
      count: input.dueWordCount,
      href: REVIEW_SOURCE_HREF.vocabulary,
      tone: reviewToneForCount(input.dueWordCount),
    },
    {
      id: "sounds",
      label: REVIEW_SOURCE_LABEL.sounds,
      count: input.soundsDue.length,
      href: REVIEW_SOURCE_HREF.sounds,
      tone: reviewToneForCount(input.soundsDue.length),
    },
  ];

  const sources = candidates
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);

  const preview: ReviewPreviewItem[] = input.dueWords
    .slice(0, PREVIEW_LIMIT)
    .map((w) => ({
      id: w.id,
      text: w.text,
      ipa: w.ipa ?? null,
      translation: w.translation ?? null,
      sourceId: "vocabulary" as const,
    }));

  return {
    total: input.dueWordCount + input.soundsDue.length,
    newAvailable: input.newWordAvailable,
    sources,
    preview,
  };
}

/** Server entry: fetches sources and returns the server-known summary. */
export async function getReviewQueueSummary(
  userId: string | null,
): Promise<ReviewQueueSummary> {
  if (!userId) {
    return { total: 0, newAvailable: 0, sources: [], preview: [] };
  }
  const [dueWords, dueWordCount, soundsDue] = await Promise.all([
    getWordsDueForReview(userId, PREVIEW_LIMIT),
    countWordsDueForReview(),
    getSoundsDueForHome(userId),
  ]);
  return buildServerSummary({
    dueWords,
    dueWordCount,
    soundsDue,
    newWordAvailable: 0,
  });
}
```

Note: add `SoundDueHome` to the imports in `lib/home/constants.ts` exports if not already exported (it is — interface is defined there).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/home/__tests__/review-queue.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/home/review-queue.ts lib/home/__tests__/review-queue.test.ts
git commit -m "feat(home): server review-queue aggregator"
```

---

## Task 5: Client merge hook `useMergedReviewQueue`

**Files:**
- Create: `hooks/useMergedReviewQueue.ts`
- Test: `hooks/__tests__/mergeEssential.test.ts`

The hook reads Dexie (via existing `getCore1000SrsEntries` / `getCore1000IntroducedToday` / `fetchCoreWords` / `buildSessionQueue`, the same as `useEssentialWordsSession.loadQueue`), then merges. The merge itself is a pure function (tested); the hook is the thin effect wrapper.

- [ ] **Step 1: Write the failing test**

Create `hooks/__tests__/mergeEssential.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { mergeEssential } from "@/hooks/useMergedReviewQueue";
import type { ReviewQueueSummary } from "@/lib/home/constants";

const base: ReviewQueueSummary = {
  total: 3,
  newAvailable: 0,
  sources: [
    { id: "vocabulary", label: "Vocabulary", count: 3, href: "/practice/review", tone: "primary" },
  ],
  preview: [{ id: "w1", text: "alpha", ipa: null, translation: null, sourceId: "vocabulary" }],
};

describe("mergeEssential", () => {
  it("adds essential count to total and inserts a sorted source", () => {
    const merged = mergeEssential(base, {
      count: 8, newAvailable: 4,
      previewWords: [{ id: "core1k:run", text: "run", ipa: "/rʌn/", translation: null, sourceId: "essential" }],
    });
    expect(merged.total).toBe(11);
    expect(merged.newAvailable).toBe(4);
    expect(merged.sources.map((s) => s.id)).toEqual(["essential", "vocabulary"]);
    expect(merged.preview.some((p) => p.sourceId === "essential")).toBe(true);
  });

  it("omits the essential source when count is 0 but keeps newAvailable", () => {
    const merged = mergeEssential(base, { count: 0, newAvailable: 2, previewWords: [] });
    expect(merged.sources.map((s) => s.id)).toEqual(["vocabulary"]);
    expect(merged.newAvailable).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test hooks/__tests__/mergeEssential.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `hooks/useMergedReviewQueue.ts`:

```ts
"use client";

import { useEffect, useState } from "react";
import { fetchCoreWords } from "@/lib/core-1000/client";
import { buildSessionQueue } from "@/lib/core-1000/queue";
import { getCore1000SrsEntries, getCore1000IntroducedToday } from "@/lib/db";
import { deriveEssentialSource, type EssentialSourceData } from "@/lib/core-1000/essential-due";
import {
  reviewToneForCount,
  REVIEW_SOURCE_HREF,
  REVIEW_SOURCE_LABEL,
  type ReviewQueueSummary,
  type ReviewSource,
} from "@/lib/home/constants";

/** Pure: merges the essential source into the server summary. */
export function mergeEssential(
  server: ReviewQueueSummary,
  essential: EssentialSourceData,
): ReviewQueueSummary {
  const sources: ReviewSource[] = [...server.sources];
  if (essential.count > 0) {
    sources.push({
      id: "essential",
      label: REVIEW_SOURCE_LABEL.essential,
      count: essential.count,
      href: REVIEW_SOURCE_HREF.essential,
      tone: reviewToneForCount(essential.count),
    });
  }
  sources.sort((a, b) => b.count - a.count);

  return {
    total: server.total + essential.count,
    newAvailable: server.newAvailable + essential.newAvailable,
    sources,
    preview: [...server.preview, ...essential.previewWords].slice(0, 4),
  };
}

/**
 * Reads Core-1000 SRS from Dexie once and merges it into the server summary.
 * Returns the server summary unchanged until hydration completes (no layout jump).
 */
export function useMergedReviewQueue(server: ReviewQueueSummary): ReviewQueueSummary {
  const [merged, setMerged] = useState<ReviewQueueSummary>(server);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [words, srsEntries, introducedToday] = await Promise.all([
          fetchCoreWords(),
          getCore1000SrsEntries(),
          getCore1000IntroducedToday(),
        ]);
        const queue = buildSessionQueue({ words, srsEntries, introducedToday, now: new Date() });
        if (cancelled) return;
        setMerged(mergeEssential(server, deriveEssentialSource(queue)));
      } catch {
        // Offline / Dexie unavailable: keep server summary as-is.
        if (!cancelled) setMerged(server);
      }
    })();
    return () => { cancelled = true; };
  }, [server]);

  return merged;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test hooks/__tests__/mergeEssential.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add hooks/useMergedReviewQueue.ts hooks/__tests__/mergeEssential.test.ts
git commit -m "feat(home): client merge hook for essential review source"
```

---

## Task 6: `ReviewQueueBreakdown` + `ReviewQueuePreview`

**Files:**
- Create: `components/home/ReviewQueueBreakdown.tsx`
- Create: `components/home/ReviewQueuePreview.tsx`

- [ ] **Step 1: Write `ReviewQueueBreakdown`**

Create `components/home/ReviewQueueBreakdown.tsx`:

```tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ReviewSource } from "@/lib/home/constants";

interface ReviewQueueBreakdownProps {
  sources: ReviewSource[];
}

export default function ReviewQueueBreakdown({ sources }: ReviewQueueBreakdownProps) {
  if (sources.length === 0) return null;
  return (
    <ul className="mt-4 flex flex-col gap-1.5">
      {sources.map((s) => (
        <li key={s.id}>
          <Link
            href={s.href}
            className="focus-ring group flex items-center justify-between rounded-[var(--radius-md)] px-2 py-1.5 transition-colors hover:bg-surface-sunken"
          >
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  s.tone === "warning" ? "bg-[var(--warning)]" : "bg-[var(--primary)]",
                )}
                aria-hidden
              />
              <span className="font-body-sm text-[var(--text-secondary)]">
                <span className="tabular-nums font-medium text-[var(--text-primary)]">{s.count}</span>{" "}
                {s.label.toLowerCase()}
              </span>
            </span>
            <ArrowRight
              size={14}
              className="shrink-0 text-[var(--text-tertiary)] transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: Write `ReviewQueuePreview`**

Create `components/home/ReviewQueuePreview.tsx`:

```tsx
import { cn } from "@/lib/cn";
import type { ReviewPreviewItem } from "@/lib/home/constants";

interface ReviewQueuePreviewProps {
  items: ReviewPreviewItem[];
}

function formatIpa(ipa: string | null): string {
  if (!ipa) return "";
  return ipa.startsWith("/") ? ipa : `/${ipa.replace(/^\/|\/$/g, "")}/`;
}

export default function ReviewQueuePreview({ items }: ReviewQueuePreviewProps) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4 flex flex-col gap-2 border-t border-border-subtle pt-4">
      {items.map((item) => (
        <div key={`${item.sourceId}:${item.id}`} className="flex items-baseline gap-2">
          <p className={cn("font-display text-base font-medium leading-tight text-[var(--text-primary)]")}>
            {item.text}
            {item.ipa ? (
              <span className="font-ipa ml-2 text-sm font-normal text-[var(--primary)]">
                {formatIpa(item.ipa)}
              </span>
            ) : null}
          </p>
          {item.translation ? (
            <span className="font-caption text-[var(--text-tertiary)]">{item.translation}</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `pnpm type-check`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/home/ReviewQueueBreakdown.tsx components/home/ReviewQueuePreview.tsx
git commit -m "feat(home): review queue breakdown and preview"
```

---

## Task 7: `ReviewQueueCard` (pure renderer + CTA state machine)

**Files:**
- Create: `components/home/ReviewQueueCard.tsx`
- Test: `components/home/__tests__/ReviewQueueCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/home/__tests__/ReviewQueueCard.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ReviewQueueCard from "@/components/home/ReviewQueueCard";
import type { ReviewQueueSummary } from "@/lib/home/constants";

const summary = (over: Partial<ReviewQueueSummary>): ReviewQueueSummary => ({
  total: 0, newAvailable: 0, sources: [], preview: [], ...over,
});

describe("ReviewQueueCard", () => {
  it("shows Start review when items are due", () => {
    render(<ReviewQueueCard summary={summary({ total: 5 })} />);
    expect(screen.getByRole("link", { name: /start review/i })).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("shows Learn new words when nothing due but new available", () => {
    render(<ReviewQueueCard summary={summary({ total: 0, newAvailable: 4 })} />);
    expect(screen.getByRole("link", { name: /learn new words/i })).toBeInTheDocument();
  });

  it("shows caught-up state when nothing due and nothing new", () => {
    render(<ReviewQueueCard summary={summary({ total: 0, newAvailable: 0 })} />);
    expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /start review/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test components/home/__tests__/ReviewQueueCard.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `components/home/ReviewQueueCard.tsx`:

```tsx
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import ReviewQueueBreakdown from "./ReviewQueueBreakdown";
import ReviewQueuePreview from "./ReviewQueuePreview";
import type { ReviewQueueSummary } from "@/lib/home/constants";

interface ReviewQueueCardProps {
  summary: ReviewQueueSummary;
}

export default function ReviewQueueCard({ summary }: ReviewQueueCardProps) {
  const { total, newAvailable, sources, preview } = summary;
  const hasDue = total > 0;

  return (
    <div className="flex flex-col rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-6">
      <div className="flex items-baseline gap-2">
        <span className="type-stat text-2xl tabular-nums">{total}</span>
        <span className="font-body-sm text-[var(--text-secondary)]">to review</span>
      </div>

      {hasDue ? (
        <ReviewQueueBreakdown sources={sources} />
      ) : (
        <p className="font-body-sm mt-1 text-[var(--text-tertiary)]">
          {newAvailable > 0
            ? "Nothing scheduled — keep momentum with new words."
            : "You're all caught up ✓"}
        </p>
      )}

      <ReviewQueuePreview items={preview} />

      <div className="mt-6">
        {hasDue ? (
          <Link
            href="/practice/review"
            className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-4 py-2.5 font-body-sm font-medium text-[var(--on-primary)] transition-opacity hover:opacity-90"
          >
            Start review <ArrowRight size={15} aria-hidden />
          </Link>
        ) : newAvailable > 0 ? (
          <Link
            href="/practice/core-1000"
            className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-4 py-2.5 font-body-sm font-medium text-[var(--on-primary)] transition-opacity hover:opacity-90"
          >
            Learn new words <ArrowRight size={15} aria-hidden />
          </Link>
        ) : (
          <Link
            href="/words"
            className="focus-ring inline-flex items-center gap-1.5 font-caption font-medium text-[var(--primary)] transition-opacity hover:opacity-80"
          >
            <Check size={13} aria-hidden /> Browse vocabulary
          </Link>
        )}
      </div>
    </div>
  );
}
```

Note: confirm the on-primary token name matches the codebase (`--on-primary`); if the Button component uses a different token, use that one. Check `components/ui/Button.tsx`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test components/home/__tests__/ReviewQueueCard.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add components/home/ReviewQueueCard.tsx components/home/__tests__/ReviewQueueCard.test.tsx
git commit -m "feat(home): review queue card with CTA state machine"
```

---

## Task 8: `ReviewQueueIsland` (client boundary)

**Files:**
- Create: `components/home/ReviewQueueIsland.tsx`

- [ ] **Step 1: Write the island**

Create `components/home/ReviewQueueIsland.tsx`:

```tsx
"use client";

import { useMergedReviewQueue } from "@/hooks/useMergedReviewQueue";
import ReviewQueueCard from "./ReviewQueueCard";
import type { ReviewQueueSummary } from "@/lib/home/constants";

interface ReviewQueueIslandProps {
  serverSummary: ReviewQueueSummary;
}

export default function ReviewQueueIsland({ serverSummary }: ReviewQueueIslandProps) {
  const summary = useMergedReviewQueue(serverSummary);
  return <ReviewQueueCard summary={summary} />;
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/home/ReviewQueueIsland.tsx
git commit -m "feat(home): review queue client island"
```

---

## Task 9: `ReviewProgressCard` (Tier 2, honest empty state)

**Files:**
- Create: `components/home/ReviewProgressCard.tsx`
- Test: `components/home/__tests__/ReviewProgressCard.test.tsx`

Carries over the retention bar and weakest-sound block from `HomeRetentionCard`, but the no-data branch shows a real discovery CTA — no hardcoded `/ð/`.

- [ ] **Step 1: Write the failing test**

Create `components/home/__tests__/ReviewProgressCard.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ReviewProgressCard from "@/components/home/ReviewProgressCard";

describe("ReviewProgressCard", () => {
  it("does NOT render a hardcoded /ð/ when there is no phoneme data", () => {
    render(<ReviewProgressCard lexicon={null} weakestPhoneme={null} />);
    expect(screen.queryByText("/ð/")).not.toBeInTheDocument();
    expect(screen.getByText(/find your weakest sound/i)).toBeInTheDocument();
  });

  it("renders the weakest sound when data is present", () => {
    render(
      <ReviewProgressCard
        lexicon={{ learned: 10, total: 100, percent: 10 }}
        weakestPhoneme={{ ipa: "ð", accuracy: 40, totalAttempts: 12, label: "voiced dental fricative" }}
      />,
    );
    expect(screen.getByText("/ð/")).toBeInTheDocument();
    expect(screen.getByText(/voiced dental fricative/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test components/home/__tests__/ReviewProgressCard.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `components/home/ReviewProgressCard.tsx` (adapt the existing `HomeRetentionCard` markup; replace the hardcoded fallback branch):

```tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProgressBar from "@/components/ui/ProgressBar";
import type { WeakestPhonemeHome } from "@/lib/home/constants";
import type { LexiconRetentionStats } from "@/lib/lexicon/server-progress";

interface ReviewProgressCardProps {
  lexicon?: LexiconRetentionStats | null;
  weakestPhoneme?: WeakestPhonemeHome | null;
}

function formatIpaDisplay(ipa: string): string {
  return ipa.startsWith("/") ? ipa : `/${ipa}/`;
}

export default function ReviewProgressCard({ lexicon, weakestPhoneme }: ReviewProgressCardProps) {
  const learned = lexicon?.learned ?? 0;
  const total = lexicon?.total ?? 0;
  const pct = lexicon?.percent ?? 0;
  const hasPhoneme = weakestPhoneme != null && weakestPhoneme.accuracy != null;

  return (
    <div className="flex flex-col rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-6">
      <p className="type-overline">Vocabulary</p>
      <ProgressBar value={pct} color="var(--primary)" height="sm" className="mt-3" />
      <p className="font-body-sm mt-1.5 text-[var(--text-secondary)]">
        {total > 0
          ? `${learned.toLocaleString()} / ${total.toLocaleString()} words · ${pct}%`
          : "Explore the Lexicon to start learning"}
      </p>

      <div className="my-4 border-t border-border-subtle" />

      <p className="type-overline">Weakest sound</p>
      {hasPhoneme ? (
        <Link
          href="/practice/sounds"
          className="focus-ring group mt-3 flex items-center gap-4 rounded-[var(--radius-md)]"
        >
          <span className="animate-symbol-in font-display shrink-0 text-display-ipa font-bold leading-none text-[var(--warning)]">
            {formatIpaDisplay(weakestPhoneme!.ipa)}
          </span>
          <div className="min-w-0 flex-1">
            {weakestPhoneme!.label ? (
              <p className="font-body-sm text-[var(--text-secondary)]">{weakestPhoneme!.label}</p>
            ) : null}
            <div className="mt-1.5 flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <ProgressBar value={weakestPhoneme!.accuracy} color="var(--warning)" height="sm" />
              </div>
              <span className="font-caption shrink-0 tabular-nums text-[var(--warning-value)]">
                {weakestPhoneme!.accuracy}%
              </span>
            </div>
            <p className="font-caption mt-1.5 inline-flex items-center gap-1 text-[var(--primary)] group-hover:underline">
              Practice this sound <ArrowRight size={11} aria-hidden />
            </p>
          </div>
        </Link>
      ) : (
        <Link
          href="/practice/sounds"
          className="focus-ring mt-3 inline-flex items-center gap-1.5 font-body-sm text-[var(--primary)] hover:underline"
        >
          Find your weakest sound <ArrowRight size={13} aria-hidden />
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test components/home/__tests__/ReviewProgressCard.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add components/home/ReviewProgressCard.tsx components/home/__tests__/ReviewProgressCard.test.tsx
git commit -m "feat(home): progress card with honest empty state"
```

---

## Task 10: Wire `HomeReviewsSection` + `HomeLayout` + page

**Files:**
- Modify: `components/home/HomeReviewsSection.tsx`
- Modify: `components/home/HomeLayout.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Rewrite `HomeReviewsSection`**

Replace `components/home/HomeReviewsSection.tsx` with:

```tsx
import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import ReviewQueueIsland from "@/components/home/ReviewQueueIsland";
import ReviewProgressCard from "@/components/home/ReviewProgressCard";
import type { ReviewQueueSummary, WeakestPhonemeHome } from "@/lib/home/constants";
import type { LexiconRetentionStats } from "@/lib/lexicon/server-progress";

interface HomeReviewsSectionProps {
  reviewQueue: ReviewQueueSummary;
  lexicon?: LexiconRetentionStats | null;
  weakestPhoneme?: WeakestPhonemeHome | null;
}

export default function HomeReviewsSection({
  reviewQueue,
  lexicon,
  weakestPhoneme,
}: HomeReviewsSectionProps) {
  return (
    <section className="mt-14">
      <HomeSectionHeader
        number="02"
        title="Due for review"
        subtitle="spaced repetition · don't let it go cold"
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.7fr_1fr]">
        <ReviewQueueIsland serverSummary={reviewQueue} />
        <ReviewProgressCard lexicon={lexicon} weakestPhoneme={weakestPhoneme} />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Update `HomeLayout`**

In `components/home/HomeLayout.tsx`: add `reviewQueue: ReviewQueueSummary` to props (import the type from `@/lib/home/constants`), remove the now-unused `words`/`dueCount`/`soundsDue`/`lexicon` passthrough **to `HomeReviewsSection`**, and render:

```tsx
<HomeReviewsSection
  reviewQueue={reviewQueue}
  lexicon={lexiconRetention}
  weakestPhoneme={weakestPhoneme}
/>
```

Keep `wordsDueCount`/`soundsDueCount` for `HomeStatusHero` (unchanged). Derive them from `reviewQueue` if convenient, or keep existing props.

- [ ] **Step 3: Update `app/page.tsx`**

Add the import and fetch. In the `Promise.all`, add `getReviewQueueSummary(userId)`; capture it; pass `reviewQueue` into `HomeLayout`. Concretely:

```tsx
import { getReviewQueueSummary } from "@/lib/home/review-queue";
import type { ReviewQueueSummary } from "@/lib/home/constants";

// in the component body:
let reviewQueue: ReviewQueueSummary = { total: 0, newAvailable: 0, sources: [], preview: [] };

// add to Promise.all array:
getReviewQueueSummary(userId),

// destructure it, then assign: reviewQueue = queue;

// pass to HomeLayout:
reviewQueue={reviewQueue}
```

- [ ] **Step 4: Type-check + full test run**

Run: `pnpm type-check && pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/home/HomeReviewsSection.tsx components/home/HomeLayout.tsx app/page.tsx
git commit -m "feat(home): wire unified review queue into home"
```

---

## Task 11: Remove dead components

**Files:**
- Delete: `components/home/HomeReviewQueueCard.tsx`, `components/home/HomeRetentionCard.tsx`

- [ ] **Step 1: Confirm no remaining references**

Run: `grep -rn "HomeReviewQueueCard\|HomeRetentionCard" --include=*.tsx --include=*.ts .`
Expected: no matches (outside the files themselves).

- [ ] **Step 2: Delete**

```bash
git rm components/home/HomeReviewQueueCard.tsx components/home/HomeRetentionCard.tsx
```

- [ ] **Step 3: Type-check + test + lint**

Run: `pnpm type-check && pnpm test && pnpm lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(home): remove legacy review/retention cards"
```

---

## Task 12: Manual verification

- [ ] **Step 1: Run dev server**

Run: `pnpm dev`, open the home page.

- [ ] **Step 2: Verify states**

- With due items: headline count includes essential (appears shortly after load); breakdown rows route correctly; "Start review" enabled.
- Empty (nothing due, new available): "Learn new words" CTA, no disabled button.
- Fully empty: "You're all caught up ✓", no dead button.
- No phoneme data: "Find your weakest sound →", no fake `/ð/`.
- Offline (DevTools offline): server summary still renders; no crash.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A && git commit -m "fix(home): review queue verification follow-ups"
```
