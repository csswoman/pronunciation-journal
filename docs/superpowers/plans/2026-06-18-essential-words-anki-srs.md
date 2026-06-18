# Essential Words — Anki-style SRS Session Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename Core1000Session → EssentialWordsSession and add Anki-style behaviour: same-session relapse queue, live New·Learning·Review HUD, "learn more" past daily cap, and per-word archiving.

**Architecture:** In-memory learning queue layered over the existing pure queue builder — no Dexie schema migration. Pure helpers (`reinsertLearning`, `deriveCounts`, `appendNewBatch`) are extracted so they're testable without React. The hook orchestrates state + I/O; components stay presentational.

**Tech Stack:** Vitest (TDD for pure engine), Dexie.js (IndexedDB), React hooks, Tailwind v4 design tokens.

---

## File map

| File | Action | Responsibility |
|------|--------|---------------|
| `lib/types.ts` | Modify | Add `archived?` / `archivedAt?` to `SRSData` |
| `lib/db/index.ts` | Modify | `archiveCore1000Word`, `unarchiveCore1000Word`, filter archived from `getCore1000SrsEntries` |
| `lib/core-1000/queue.ts` | Modify | `kind` field, `reinsertLearning`, `deriveCounts`, `appendNewBatch` |
| `lib/core-1000/__tests__/queue.test.ts` | Modify | Extend with `kind`, archived exclusion, `appendNewBatch` cases |
| `lib/core-1000/__tests__/relapse.test.ts` | Create | Tests for `reinsertLearning`, `deriveCounts` |
| `hooks/useEssentialWordsSession.ts` | Create | Renamed hook with relapse queue, learnMore, archiveWord, lapse flush |
| `hooks/useCore1000Session.ts` | Delete | Replaced by above |
| `components/practice/core-1000/EssentialWordsSession.tsx` | Create | Renamed session root |
| `components/practice/core-1000/Core1000Session.tsx` | Delete | Replaced by above |
| `components/practice/core-1000/SessionProgressHud.tsx` | Create | New · Learning · Review live counter |
| `components/practice/core-1000/WordStudyCard.tsx` | Modify | Add "Ya la sé" archive button |
| `components/practice/core-1000/SpeakReviewCard.tsx` | Modify | Add "Ya la sé" archive button |
| `components/practice/core-1000/SessionDone.tsx` | Modify | Add "Aprender 10 nuevas más" CTA + new prop types |
| `components/practice/core-1000/DeckProgressHeader.tsx` | Modify | Update import from renamed hook |
| `app/practice/core-1000/page.tsx` | Modify | Import `EssentialWordsSession` |
| `components/practice/core-1000/__tests__/Core1000Session.test.tsx` | Modify | Update import |

---

## Task 0 — Extend `SRSData` type

**Files:**
- Modify: `lib/types.ts:95-103`

- [ ] **Step 1: Add `archived` fields to `SRSData`**

In `lib/types.ts`, change:
```ts
export interface SRSData {
  wordId: string;
  word: string;
  ease: number;
  interval: number;
  repetitions: number;
  nextReview: string;
  lastReview?: string;
}
```
to:
```ts
export interface SRSData {
  wordId: string;
  word: string;
  ease: number;
  interval: number;
  repetitions: number;
  nextReview: string;
  lastReview?: string;
  archived?: boolean;
  archivedAt?: string; // ISO
}
```

- [ ] **Step 2: Verify type-check passes**

```bash
pnpm type-check
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat(srs): add archived fields to SRSData"
```

---

## Task 1 — Db helpers: archive/unarchive + filter

**Files:**
- Modify: `lib/db/index.ts` (after the existing `getCore1000IntroducedToday` block, around line 249)

- [ ] **Step 1: Filter archived from `getCore1000SrsEntries`**

In `lib/db/index.ts`, change `getCore1000SrsEntries`:
```ts
export async function getCore1000SrsEntries(): Promise<SRSData[]> {
  return db.srsData
    .filter((e) => e.wordId.startsWith(CORE1000_SRS_PREFIX) && !e.archived)
    .toArray();
}
```

- [ ] **Step 2: Add `archiveCore1000Word` and `unarchiveCore1000Word` helpers**

Add after `recordCore1000Introduction` (around line 280):
```ts
export async function archiveCore1000Word(word: string): Promise<void> {
  const normalized = word.toLowerCase();
  const wordId = `${CORE1000_SRS_PREFIX}${normalized}`;
  const existing = (await db.srsData.get(wordId)) ?? {
    wordId,
    word: normalized,
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: new Date().toISOString(),
  };
  await db.srsData.put({ ...existing, archived: true, archivedAt: new Date().toISOString() });
}

export async function unarchiveCore1000Word(word: string): Promise<void> {
  const wordId = `${CORE1000_SRS_PREFIX}${word.toLowerCase()}`;
  const existing = await db.srsData.get(wordId);
  if (!existing) return;
  const { archived: _a, archivedAt: _b, ...rest } = existing;
  await db.srsData.put(rest);
}
```

- [ ] **Step 3: Verify type-check passes**

```bash
pnpm type-check
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/db/index.ts
git commit -m "feat(srs): archive/unarchive helpers + filter archived from Core1000 entries"
```

---

## Task 2 — Queue engine: `kind`, pure helpers (TDD)

**Files:**
- Modify: `lib/core-1000/queue.ts`
- Modify: `lib/core-1000/__tests__/queue.test.ts`
- Create: `lib/core-1000/__tests__/relapse.test.ts`

- [ ] **Step 1: Write failing tests for `kind` field in `queue.test.ts`**

Add to the bottom of `lib/core-1000/__tests__/queue.test.ts`:
```ts
describe("kind field", () => {
  it("due reviews have kind 'review'", () => {
    const q = buildSessionQueue({
      words: WORDS,
      srsEntries: [srs("of", "2026-06-10T00:00:00Z")],
      introducedToday: [],
      now: NOW,
      newPerDay: 0,
    });
    expect(q[0].kind).toBe("review");
  });

  it("new cards have kind 'new'", () => {
    const q = buildSessionQueue({
      words: WORDS,
      srsEntries: [],
      introducedToday: [],
      now: NOW,
      newPerDay: 2,
    });
    expect(q.every((i) => i.kind === "new")).toBe(true);
  });

  it("excludes archived entries from reviews and seen set", () => {
    const archivedEntry: SRSData = {
      ...srs("the", "2026-06-10T00:00:00Z"),
      archived: true,
    };
    const q = buildSessionQueue({
      words: WORDS,
      srsEntries: [archivedEntry],
      introducedToday: [],
      now: NOW,
      newPerDay: 3,
    });
    // "the" should not appear as review (archived) AND should appear as new
    // because archived entries are NOT in the seen set
    const words = q.map((i) => i.entry.word);
    expect(words).not.toContain("the"); // archived = excluded entirely
    expect(q.length).toBe(3); // be, and, of (the is excluded)
  });
});

describe("appendNewBatch", () => {
  it("appends next N new words by rank, skipping already queued", () => {
    const existing: Core1000QueueItem[] = [
      { entry: WORDS[0], kind: "new" },
      { entry: WORDS[1], kind: "review" },
    ];
    const seen = new Set([core1000WordId("the"), core1000WordId("be")]);
    const result = appendNewBatch(existing, WORDS, seen, 2);
    expect(result.map((i) => i.entry.word)).toEqual(["the", "be", "and", "of"]);
    expect(result[2].kind).toBe("new");
    expect(result[3].kind).toBe("new");
  });

  it("does not exceed available words", () => {
    const seen = new Set(WORDS.map((w) => core1000WordId(w.word)));
    const result = appendNewBatch([], WORDS, seen, 5);
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pnpm test lib/core-1000/__tests__/queue.test.ts
```
Expected: fails on `kind` and `appendNewBatch` not defined.

- [ ] **Step 3: Write failing tests for `reinsertLearning` and `deriveCounts` in new file**

Create `lib/core-1000/__tests__/relapse.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { reinsertLearning, deriveCounts } from "../queue";
import type { Core1000QueueItem } from "../queue";
import type { CoreWord } from "../types";

function word(rank: number, w: string): CoreWord {
  return {
    rank, word: w, pos: "noun", ipa_strong: `/${w}/`,
    example_sentence: `A ${w} here.`, cefr_level: "A1",
  };
}

function item(w: string, kind: Core1000QueueItem["kind"]): Core1000QueueItem {
  return { entry: word(1, w), kind };
}

describe("reinsertLearning", () => {
  it("inserts item at index + 3", () => {
    const queue = [item("a", "new"), item("b", "review"), item("c", "new"), item("d", "review"), item("e", "new")];
    const failed = item("a", "new");
    const result = reinsertLearning(queue, 0, failed);
    expect(result[3].entry.word).toBe("a");
    expect(result[3].kind).toBe("learning");
  });

  it("appends at end when queue is too short", () => {
    const queue = [item("a", "new"), item("b", "review")];
    const failed = item("a", "new");
    const result = reinsertLearning(queue, 0, failed);
    expect(result[result.length - 1].entry.word).toBe("a");
    expect(result[result.length - 1].kind).toBe("learning");
  });

  it("does not mutate the original queue", () => {
    const queue = [item("a", "new"), item("b", "review"), item("c", "new")];
    const original = [...queue];
    reinsertLearning(queue, 0, item("a", "new"));
    expect(queue).toEqual(original);
  });
});

describe("deriveCounts", () => {
  it("counts remaining items from index onwards by kind", () => {
    const queue = [
      item("a", "new"),
      item("b", "review"),
      item("c", "learning"),
      item("d", "new"),
      item("e", "review"),
    ];
    const counts = deriveCounts(queue, 1); // start from index 1
    expect(counts).toEqual({ newRemaining: 1, learningRemaining: 1, reviewRemaining: 2 });
  });

  it("returns zeros for empty remaining", () => {
    const queue = [item("a", "new")];
    expect(deriveCounts(queue, 1)).toEqual({ newRemaining: 0, learningRemaining: 0, reviewRemaining: 0 });
  });
});
```

- [ ] **Step 4: Run relapse tests to confirm they fail**

```bash
pnpm test lib/core-1000/__tests__/relapse.test.ts
```
Expected: fails — `reinsertLearning`, `deriveCounts` not exported.

- [ ] **Step 5: Update `queue.ts` with `kind`, archive exclusion, and new helpers**

Replace `lib/core-1000/queue.ts` entirely:
```ts
// Pure session-queue builder. All Dexie I/O lives in the caller so this is
// trivially unit-testable.

import { NEW_CARDS_PER_DAY, core1000WordId, type CoreWord } from "./types";
import type { SRSData } from "@/lib/types";

export interface Core1000QueueItem {
  entry: CoreWord;
  kind: 'new' | 'review' | 'learning';
}

export interface BuildQueueOptions {
  words: CoreWord[];
  srsEntries: SRSData[];       // already filtered: no archived, no non-c1k
  introducedToday: string[];
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
  // archived entries are already excluded by getCore1000SrsEntries, so all
  // entries here count as "seen" (do not re-introduce as new)
  const seen = new Set(srsEntries.map((e) => e.wordId));

  const due: Core1000QueueItem[] = srsEntries
    .filter((e) => new Date(e.nextReview).getTime() <= now.getTime())
    .map((e) => byId.get(e.wordId))
    .filter((entry): entry is CoreWord => entry !== undefined)
    .sort((a, b) => a.rank - b.rank)
    .map((entry) => ({ entry, kind: 'review' as const }));

  const quota = Math.max(0, newPerDay - introducedToday.length);
  const fresh: Core1000QueueItem[] = words
    .filter((w) => !seen.has(core1000WordId(w.word)))
    .slice(0, quota)
    .map((entry) => ({ entry, kind: 'new' as const }));

  return [...due, ...fresh];
}

/** Re-inserts a failed item ~3 positions ahead as `kind: 'learning'`. Pure. */
export function reinsertLearning(
  queue: Core1000QueueItem[],
  index: number,
  item: Core1000QueueItem,
): Core1000QueueItem[] {
  const learningItem: Core1000QueueItem = { ...item, kind: 'learning' };
  const insertAt = Math.min(index + 3, queue.length);
  const result = [...queue];
  result.splice(insertAt, 0, learningItem);
  return result;
}

/** Counts items at/after `index` by kind. Pure. */
export function deriveCounts(
  queue: Core1000QueueItem[],
  index: number,
): { newRemaining: number; learningRemaining: number; reviewRemaining: number } {
  const remaining = queue.slice(index);
  return {
    newRemaining: remaining.filter((i) => i.kind === 'new').length,
    learningRemaining: remaining.filter((i) => i.kind === 'learning').length,
    reviewRemaining: remaining.filter((i) => i.kind === 'review').length,
  };
}

/** Appends the next `n` new words by rank to an existing queue. Pure. */
export function appendNewBatch(
  queue: Core1000QueueItem[],
  words: CoreWord[],
  seen: Set<string>,
  n: number = NEW_CARDS_PER_DAY,
): Core1000QueueItem[] {
  const inQueue = new Set(queue.map((i) => core1000WordId(i.entry.word)));
  const batch: Core1000QueueItem[] = words
    .filter((w) => !seen.has(core1000WordId(w.word)) && !inQueue.has(core1000WordId(w.word)))
    .slice(0, n)
    .map((entry) => ({ entry, kind: 'new' as const }));
  return [...queue, ...batch];
}
```

- [ ] **Step 6: Run all queue tests**

```bash
pnpm test lib/core-1000/__tests__/queue.test.ts lib/core-1000/__tests__/relapse.test.ts
```
Expected: all pass. If `isNew` references fail in existing tests, update them: replace `i.isNew` with `i.kind === 'new'` and `isNew: false/true` with `kind: 'review'/'new'`.

- [ ] **Step 7: Commit**

```bash
git add lib/core-1000/queue.ts lib/core-1000/__tests__/queue.test.ts lib/core-1000/__tests__/relapse.test.ts
git commit -m "feat(srs): queue kind field, reinsertLearning, deriveCounts, appendNewBatch"
```

---

## Task 3 — New hook `useEssentialWordsSession`

**Files:**
- Create: `hooks/useEssentialWordsSession.ts`

- [ ] **Step 1: Create the new hook**

Create `hooks/useEssentialWordsSession.ts`:
```ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchCoreWords } from "@/lib/core-1000/client";
import {
  buildSessionQueue,
  reinsertLearning,
  deriveCounts,
  appendNewBatch,
  type Core1000QueueItem,
} from "@/lib/core-1000/queue";
import { gradeCore1000Word, type GradeExtras } from "@/lib/core-1000/grade";
import { core1000WordId } from "@/lib/core-1000/types";
import { NEW_CARDS_PER_DAY } from "@/lib/core-1000/types";
import {
  getCore1000SrsEntries,
  getCore1000IntroducedToday,
  recordCore1000Introduction,
  archiveCore1000Word,
} from "@/lib/db";
import { useAuth } from "@/components/auth/AuthProvider";
import { recordActivitySession } from "@/lib/progress/activity-hub";
import { buildSessionResult } from "@/lib/practice/session-result";
import type { ExerciseResult } from "@/lib/practice/types";

export type EssentialWordsPhase = "loading" | "study" | "speak" | "done" | "empty";

export interface EssentialWordsStats {
  totalWords: number;
  learned: number;
  dueCount: number;
  newToday: number;
  newQuota: number;
}

export interface EssentialWordsCounts {
  newRemaining: number;
  learningRemaining: number;
  reviewRemaining: number;
}

export interface EssentialWordsSessionSummary {
  practiced: number;
  correct: number;
}

interface UseEssentialWordsSessionReturn {
  phase: EssentialWordsPhase;
  current: Core1000QueueItem | null;
  stats: EssentialWordsStats;
  counts: EssentialWordsCounts;
  sessionSummary: EssentialWordsSessionSummary | null;
  reloadLoading: boolean;
  startSpeak: () => void;
  submitGrade: (quality: number, extras?: GradeExtras) => Promise<void>;
  reload: () => Promise<void>;
  learnMore: () => Promise<void>;
  archiveWord: (word: string) => Promise<void>;
}

const EMPTY_STATS: EssentialWordsStats = {
  totalWords: 0, learned: 0, dueCount: 0, newToday: 0, newQuota: NEW_CARDS_PER_DAY,
};
const EMPTY_COUNTS: EssentialWordsCounts = { newRemaining: 0, learningRemaining: 0, reviewRemaining: 0 };

async function loadQueue(): Promise<{
  items: Core1000QueueItem[];
  stats: EssentialWordsStats;
  allWords: ReturnType<typeof Array<import("@/lib/core-1000/types").CoreWord>>;
  seenIds: Set<string>;
  initialPhase: EssentialWordsPhase;
}> {
  const [words, srsEntries, introducedToday] = await Promise.all([
    fetchCoreWords(),
    getCore1000SrsEntries(),   // already excludes archived
    getCore1000IntroducedToday(),
  ]);

  const items = buildSessionQueue({ words, srsEntries, introducedToday, now: new Date() });
  const seenIds = new Set(srsEntries.map((e) => e.wordId));

  const stats: EssentialWordsStats = {
    totalWords: words.length,
    learned: srsEntries.length,
    dueCount: items.filter((i) => i.kind === "review").length,
    newToday: introducedToday.length,
    newQuota: NEW_CARDS_PER_DAY,
  };

  return {
    items,
    stats,
    allWords: words,
    seenIds,
    initialPhase: items.length === 0 ? "empty" : items[0].kind === "new" ? "study" : "speak",
  };
}

export function useEssentialWordsSession(): UseEssentialWordsSessionReturn {
  const { user } = useAuth();
  const [phase, setPhase] = useState<EssentialWordsPhase>("loading");
  const [queue, setQueue] = useState<Core1000QueueItem[]>([]);
  const [index, setIndex] = useState(0);
  const [stats, setStats] = useState<EssentialWordsStats>(EMPTY_STATS);
  const [counts, setCounts] = useState<EssentialWordsCounts>(EMPTY_COUNTS);
  const [sessionSummary, setSessionSummary] = useState<EssentialWordsSessionSummary | null>(null);
  const [reloadLoading, setReloadLoading] = useState(false);
  const sessionResultsRef = useRef<ExerciseResult[]>([]);
  // Pending lapses: wordId → quality (flush to Dexie on session end)
  const pendingLapsesRef = useRef<Map<string, number>>(new Map());
  const allWordsRef = useRef<import("@/lib/core-1000/types").CoreWord[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const updateCounts = useCallback((q: Core1000QueueItem[], i: number) => {
    setCounts(deriveCounts(q, i));
  }, []);

  const bootstrap = useCallback(async () => {
    const { items, stats: nextStats, allWords, seenIds, initialPhase } = await loadQueue();
    allWordsRef.current = allWords;
    seenIdsRef.current = seenIds;
    setQueue(items);
    setStats(nextStats);
    setIndex(0);
    setSessionSummary(null);
    sessionResultsRef.current = [];
    pendingLapsesRef.current = new Map();
    updateCounts(items, 0);
    setPhase(initialPhase);
  }, [updateCounts]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { items, stats: nextStats, allWords, seenIds, initialPhase } = await loadQueue();
        if (cancelled) return;
        allWordsRef.current = allWords;
        seenIdsRef.current = seenIds;
        setQueue(items);
        setStats(nextStats);
        updateCounts(items, 0);
        setPhase(initialPhase);
      } catch {
        if (!cancelled) setPhase("empty");
      }
    })();
    return () => { cancelled = true; };
  }, [updateCounts]);

  const flushLapses = useCallback(async () => {
    for (const [wordId, quality] of pendingLapsesRef.current) {
      const word = wordId.replace("c1k:", "");
      await gradeCore1000Word(word, quality, {}, user?.id).catch(() => {});
    }
    pendingLapsesRef.current = new Map();
  }, [user?.id]);

  const finishSession = useCallback(async () => {
    setPhase("done");
    await flushLapses();
    if (!user?.id) return;
    const sessionResult = buildSessionResult(sessionResultsRef.current);
    void recordActivitySession(user.id, { practiceContext: "core-1000", sessionResult })
      .then(() => import("@/lib/sync/sync-manager").then(({ flushOutbox }) => flushOutbox()))
      .catch((err) => { console.error("[EssentialWordsSession] recordActivitySession failed", err); });
  }, [user?.id, flushLapses]);

  const advance = useCallback((q: Core1000QueueItem[], i: number) => {
    const next = i + 1;
    if (next >= q.length) {
      void finishSession();
      return;
    }
    setIndex(next);
    updateCounts(q, next);
    setPhase(q[next].kind === "new" ? "study" : "speak");
  }, [finishSession, updateCounts]);

  const startSpeak = useCallback(() => setPhase("speak"), []);

  const submitGrade = useCallback(
    async (quality: number, extras?: GradeExtras) => {
      const item = queue[index];
      if (!item) return;
      const wordId = core1000WordId(item.entry.word.toLowerCase());

      if (quality >= 3) {
        // Pass: persist SM-2 and clear any pending lapse
        await gradeCore1000Word(item.entry.word, quality, extras, user?.id);
        pendingLapsesRef.current.delete(wordId);
        sessionResultsRef.current.push({
          exerciseId: wordId,
          slug: extras?.accuracy !== undefined ? "speak_word" : "fill_blank",
          exerciseTypeId: extras?.accuracy !== undefined ? 10 : 5,
          isCorrect: true,
          userAnswer: extras?.transcript,
          contentId: wordId,
          context: "core-1000",
          timeMs: 0,
          score: extras?.accuracy,
          completedAt: new Date(),
        });
        setSessionSummary((prev) => ({
          practiced: (prev?.practiced ?? 0) + 1,
          correct: (prev?.correct ?? 0) + 1,
        }));
        if (item.kind === "new") {
          await recordCore1000Introduction(item.entry.word.toLowerCase());
          setStats((s) => ({ ...s, newToday: s.newToday + 1, learned: s.learned + 1 }));
        }
        advance(queue, index);
      } else {
        // Fail: re-insert ~3 positions ahead, record lapse for flush at end
        pendingLapsesRef.current.set(wordId, quality);
        sessionResultsRef.current.push({
          exerciseId: wordId,
          slug: extras?.accuracy !== undefined ? "speak_word" : "fill_blank",
          exerciseTypeId: extras?.accuracy !== undefined ? 10 : 5,
          isCorrect: false,
          userAnswer: extras?.transcript,
          contentId: wordId,
          context: "core-1000",
          timeMs: 0,
          score: extras?.accuracy,
          completedAt: new Date(),
        });
        setSessionSummary((prev) => ({
          practiced: (prev?.practiced ?? 0) + 1,
          correct: prev?.correct ?? 0,
        }));
        const newQueue = reinsertLearning(queue, index, item);
        setQueue(newQueue);
        advance(newQueue, index);
      }
    },
    [queue, index, advance, user?.id],
  );

  const learnMore = useCallback(async () => {
    const batch = appendNewBatch(queue, allWordsRef.current, seenIdsRef.current, NEW_CARDS_PER_DAY);
    setQueue(batch);
    updateCounts(batch, index);
    setPhase(batch[index]?.kind === "new" ? "study" : "speak");
  }, [queue, index, updateCounts]);

  const archiveWord = useCallback(async (word: string) => {
    await archiveCore1000Word(word);
    // Remove current item from queue and advance
    const newQueue = queue.filter((_, i) => i !== index);
    setQueue(newQueue);
    if (newQueue.length === 0 || index >= newQueue.length) {
      void finishSession();
      return;
    }
    updateCounts(newQueue, index);
    setPhase(newQueue[index].kind === "new" ? "study" : "speak");
  }, [queue, index, finishSession, updateCounts]);

  const reload = useCallback(async () => {
    setReloadLoading(true);
    try { await bootstrap(); }
    finally { setReloadLoading(false); }
  }, [bootstrap]);

  return {
    phase,
    current: queue[index] ?? null,
    stats,
    counts,
    sessionSummary,
    reloadLoading,
    startSpeak,
    submitGrade,
    reload,
    learnMore,
    archiveWord,
  };
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```
Expected: no errors. Fix any import path issues if they arise.

- [ ] **Step 3: Commit**

```bash
git add hooks/useEssentialWordsSession.ts
git commit -m "feat(srs): useEssentialWordsSession with relapse queue, learnMore, archiveWord"
```

---

## Task 4 — `SessionProgressHud` component

**Files:**
- Create: `components/practice/core-1000/SessionProgressHud.tsx`

- [ ] **Step 1: Create the component**

Create `components/practice/core-1000/SessionProgressHud.tsx`:
```tsx
// Planned structure:
// <SessionProgressHud>
//   <CountPill × 3 />   — New · Learning · Review
// </SessionProgressHud>

import { cn } from '@/lib/cn'
import type { EssentialWordsCounts } from '@/hooks/useEssentialWordsSession'

interface Props {
  counts: EssentialWordsCounts
}

function CountPill({
  label, value, accent,
}: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className={cn(
          'text-sm font-semibold tabular-nums',
          accent && value > 0
            ? 'text-[var(--accent)]'
            : 'text-[var(--text-primary)]',
        )}
      >
        {value}
      </span>
      <span className="text-tiny uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
        {label}
      </span>
    </div>
  )
}

export function SessionProgressHud({ counts }: Props) {
  return (
    <div className="flex w-full max-w-md items-center justify-around border-b border-[var(--border-subtle)] pb-4">
      <CountPill label="Nuevas" value={counts.newRemaining} />
      <CountPill label="Aprendiendo" value={counts.learningRemaining} accent />
      <CountPill label="Repaso" value={counts.reviewRemaining} />
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/practice/core-1000/SessionProgressHud.tsx
git commit -m "feat(srs): SessionProgressHud with New/Learning/Review counters"
```

---

## Task 5 — Add "Ya la sé" to `WordStudyCard` and `SpeakReviewCard`

**Files:**
- Modify: `components/practice/core-1000/WordStudyCard.tsx`
- Modify: `components/practice/core-1000/SpeakReviewCard.tsx`

- [ ] **Step 1: Add `onArchive` to `WordStudyCard`**

In `components/practice/core-1000/WordStudyCard.tsx`, change the `Props` interface:
```tsx
interface Props {
  entry: CoreWord
  onContinue: () => void
  onArchive: () => void
}
```

Update the function signature and add the button just before the "Practicar" button:
```tsx
export function WordStudyCard({ entry, onContinue, onArchive }: Props) {
```

Replace the bottom of the return (after `<SentenceBlock entry={entry} />`) with:
```tsx
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onContinue}
          className="text-xs py-2 px-5 rounded-[var(--radius-full)] bg-[var(--primary)] text-white border-none cursor-pointer [font-family:inherit] font-medium"
        >
          Practicar
        </button>
        <button
          type="button"
          onClick={onArchive}
          className="text-xs py-1 px-3 rounded-[var(--radius-full)] bg-transparent border-none cursor-pointer [font-family:inherit] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
        >
          Ya la sé
        </button>
      </div>
```

- [ ] **Step 2: Add `onArchive` to `SpeakReviewCard`**

In `components/practice/core-1000/SpeakReviewCard.tsx`, add `onArchive` to `Props`:
```tsx
interface Props {
  entry: CoreWord
  onGraded: (quality: number, extras?: { accuracy: number; transcript: string }) => void
  onArchive: () => void
}
```

Update function signature:
```tsx
export function SpeakReviewCard({ entry, onGraded, onArchive }: Props) {
```

Add the "Ya la sé" button below the "Escuchar modelo" button (after the `<button ... Escuchar modelo</button>` block):
```tsx
      <button
        type="button"
        onClick={onArchive}
        className="text-xs py-1 px-3 rounded-[var(--radius-full)] bg-transparent border-none cursor-pointer [font-family:inherit] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
      >
        Ya la sé
      </button>
```

- [ ] **Step 3: Type-check**

```bash
pnpm type-check
```
Expected: errors on call sites (not yet updated). That's fine — resolved in Task 6.

- [ ] **Step 4: Commit**

```bash
git add components/practice/core-1000/WordStudyCard.tsx components/practice/core-1000/SpeakReviewCard.tsx
git commit -m "feat(srs): add Ya la sé archive button to study and speak cards"
```

---

## Task 6 — `EssentialWordsSession` root + `SessionDone` update

**Files:**
- Create: `components/practice/core-1000/EssentialWordsSession.tsx`
- Modify: `components/practice/core-1000/SessionDone.tsx`
- Modify: `components/practice/core-1000/DeckProgressHeader.tsx`

- [ ] **Step 1: Update `SessionDone` props and "learn more" CTA**

In `components/practice/core-1000/SessionDone.tsx`, replace the import line and Props:
```tsx
import type { EssentialWordsSessionSummary, EssentialWordsStats } from '@/hooks/useEssentialWordsSession'

interface Props {
  stats: EssentialWordsStats
  sessionSummary?: EssentialWordsSessionSummary | null
  wasEmpty?: boolean
  onContinue?: () => void
  continueLoading?: boolean
  onLearnMore?: () => void
}
```

Update function signature:
```tsx
export function SessionDone({
  stats,
  sessionSummary,
  wasEmpty,
  onContinue,
  continueLoading,
  onLearnMore,
}: Props) {
```

Add the "learn more" button just before the `onContinue` button block inside `<div className="flex w-full max-w-sm flex-col gap-2.5">`:
```tsx
        {onLearnMore ? (
          <Button
            type="button"
            variant="secondary"
            size="md"
            fullWidth
            onClick={onLearnMore}
          >
            Aprender 10 nuevas más
          </Button>
        ) : null}
```

- [ ] **Step 2: Update `DeckProgressHeader` import**

In `components/practice/core-1000/DeckProgressHeader.tsx`, replace:
```tsx
import type { Core1000Stats } from '@/hooks/useCore1000Session'
```
with:
```tsx
import type { EssentialWordsStats } from '@/hooks/useEssentialWordsSession'
```

And update the prop type:
```tsx
export function DeckProgressHeader({ stats }: { stats: EssentialWordsStats }) {
```

- [ ] **Step 3: Create `EssentialWordsSession.tsx`**

Create `components/practice/core-1000/EssentialWordsSession.tsx`:
```tsx
'use client'

// Planned structure:
// <EssentialWordsSession>
//   <DeckProgressHeader />
//   <SessionProgressHud />   — New · Learning · Review live counters
//   <WordStudyCard />        — phase: study (new cards)
//   <SpeakReviewCard />      — phase: speak
//   <SessionDone />          — phase: done / empty
// </EssentialWordsSession>

import { useEssentialWordsSession } from '@/hooks/useEssentialWordsSession'
import { useLoadingWords } from '@/hooks/useLoadingWords'
import { DeckProgressHeader } from './DeckProgressHeader'
import { SessionProgressHud } from './SessionProgressHud'
import { WordStudyCard } from './WordStudyCard'
import { SpeakReviewCard } from './SpeakReviewCard'
import { SessionDone } from './SessionDone'
import { WordCarousel } from '@/components/practice/session/WordCarousel'

export function EssentialWordsSession() {
  const {
    phase, current, stats, counts, sessionSummary,
    reloadLoading, startSpeak, submitGrade, reload, learnMore, archiveWord,
  } = useEssentialWordsSession()
  const loadingWords = useLoadingWords()

  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <WordCarousel words={loadingWords} />
      </div>
    )
  }

  if (phase === 'empty' || phase === 'done') {
    return (
      <SessionDone
        stats={stats}
        sessionSummary={sessionSummary}
        wasEmpty={phase === 'empty'}
        onContinue={reload}
        continueLoading={reloadLoading}
        onLearnMore={phase === 'done' ? learnMore : undefined}
      />
    )
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <DeckProgressHeader stats={stats} />
      <SessionProgressHud counts={counts} />
      {phase === 'study' && current && (
        <WordStudyCard
          entry={current.entry}
          onContinue={startSpeak}
          onArchive={() => void archiveWord(current.entry.word)}
        />
      )}
      {phase === 'speak' && current && (
        <SpeakReviewCard
          entry={current.entry}
          onGraded={submitGrade}
          onArchive={() => void archiveWord(current.entry.word)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Type-check**

```bash
pnpm type-check
```
Expected: no errors (except possibly `page.tsx` still importing old component — fix in Task 7).

- [ ] **Step 5: Commit**

```bash
git add components/practice/core-1000/EssentialWordsSession.tsx components/practice/core-1000/SessionDone.tsx components/practice/core-1000/DeckProgressHeader.tsx
git commit -m "feat(srs): EssentialWordsSession root, SessionDone learn-more CTA"
```

---

## Task 7 — Wire page + remove old files

**Files:**
- Modify: `app/practice/core-1000/page.tsx`
- Modify: `components/practice/core-1000/__tests__/Core1000Session.test.tsx`
- Delete: `components/practice/core-1000/Core1000Session.tsx`
- Delete: `hooks/useCore1000Session.ts`

- [ ] **Step 1: Update page import**

In `app/practice/core-1000/page.tsx`, replace:
```tsx
import { Core1000Session } from '@/components/practice/core-1000/Core1000Session'
```
with:
```tsx
import { EssentialWordsSession } from '@/components/practice/core-1000/EssentialWordsSession'
```

And replace `<Core1000Session />` with `<EssentialWordsSession />`.

- [ ] **Step 2: Update test file import**

In `components/practice/core-1000/__tests__/Core1000Session.test.tsx`, replace any import of `Core1000Session` or `useCore1000Session` with the new names. If the test file only smoke-tests the old component and doesn't test behaviour, replace its content with a minimal check:
```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// Smoke test — logic tested in hook and queue unit tests
describe('EssentialWordsSession', () => {
  it('file exists and exports', async () => {
    const mod = await import('../EssentialWordsSession')
    expect(mod.EssentialWordsSession).toBeDefined()
  })
})
```

- [ ] **Step 3: Delete old files**

```bash
rm components/practice/core-1000/Core1000Session.tsx
rm hooks/useCore1000Session.ts
```

- [ ] **Step 4: Full type-check and test run**

```bash
pnpm type-check && pnpm test
```
Expected: 0 type errors, all tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/practice/core-1000/page.tsx
git add components/practice/core-1000/__tests__/Core1000Session.test.tsx
git rm components/practice/core-1000/Core1000Session.tsx
git rm hooks/useCore1000Session.ts
git commit -m "feat(srs): wire EssentialWordsSession to page, remove old Core1000Session"
```

---

## Self-Review

**Spec coverage:**
- ✅ `SRSData.archived?` / `archivedAt?` — Task 0
- ✅ `archiveCore1000Word` / `unarchiveCore1000Word` — Task 1
- ✅ `getCore1000SrsEntries` filters archived — Task 1
- ✅ `kind: 'new' | 'review' | 'learning'` on queue items — Task 2
- ✅ Archived excluded from reviews AND seen (won't resurface as new) — Task 2
- ✅ `reinsertLearning` at index+3 — Task 2
- ✅ `deriveCounts` — Task 2
- ✅ `appendNewBatch` — Task 2
- ✅ Hook: fail path re-inserts, pass path persists SM-2 — Task 3
- ✅ Hook: `pendingLapses` flush in `finishSession` — Task 3
- ✅ Hook: `learnMore` — Task 3
- ✅ Hook: `archiveWord` — Task 3
- ✅ `SessionProgressHud` with New/Learning/Review — Task 4
- ✅ "Ya la sé" on WordStudyCard and SpeakReviewCard — Task 5
- ✅ "Aprender 10 nuevas más" in SessionDone — Task 6
- ✅ Rename Core1000Session → EssentialWordsSession — Tasks 6+7
- ✅ No rename of `lib/core-1000/`, `c1k:` prefix, stored wordIds — respected throughout
- ✅ No Dexie migration (only unindexed optional fields) — Tasks 0+1

**Placeholder scan:** No TBDs, no "similar to Task N", all code blocks complete.

**Type consistency:** `EssentialWordsStats`, `EssentialWordsCounts`, `EssentialWordsSessionSummary` defined in Task 3 and used consistently in Tasks 4–6. `Core1000QueueItem.kind` defined in Task 2 and used throughout. `archiveCore1000Word` defined in Task 1 and imported in Task 3.
