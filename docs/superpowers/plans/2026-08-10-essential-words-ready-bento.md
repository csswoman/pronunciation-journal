# Essential Words Ready Bento Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Essential Words `ready` as a data-backed two-column bento (size + route controls, forecast, vocabulary distribution, streak/retention/leeches/vault, heatmap, last-session recap) and fix session duration so recap can show real time.

**Architecture:** Pure Dexie adapters in `lib/essential-words/ready-*` feed presentational widgets. `SessionReady` becomes a bento shell (desktop 2-col, mobile order B). Session size preference + wall-clock timing live in the existing session hook. No Supabase calls from UI; no vanity metrics.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Dexie, Vitest + Testing Library, Tailwind v4 tokens.

**Reference spec:** `docs/superpowers/specs/2026-08-10-essential-words-ready-bento-design.md`

## Global Constraints

- Offline-first: widgets read Dexie only (`learningItems`, `attemptLogs`, `srsData`, local last-session blob).
- Skill-first dual path: prefer skill tables when present; fall back to legacy `srsData`.
- Omit widgets with insufficient signal (no decorative zeros except forecast day buckets).
- Forbidden ready copy: “Te faltan N palabras para completar el nivel…”.
- No XP, badges, lifetime totals, app-wide heatmap.
- Tokens only; one primary CTA (hero); no nested cards; no side stripes / gradient text.
- Keep page archetype `session` at `--layout-session-max` (45rem / 720px).
- UI copy Spanish; learning words English.
- Components ≤250 lines; queries stay in `lib/*/queries.ts`.

### Spec open items (locked here)

| Item | Decision |
| --- | --- |
| Vocabulary universe | **Touched words only** — distinct `wordId`s in `learningItems` or Essential Words `srsData` for the user |
| Leech CTA | `startLeechReview()` — review-only session from leech `wordId`s (no new cards); reuse plan/runtime path with forced word set |
| Page width | Keep `session` / 720px; denser rail (~38–42%) |
| Retention predicate | Prefer `eventType === "scheduled-review"`; if fewer than 10 such attempts in 30d, fall back to all EW attempts with `assessment.correct`; hide if still &lt; 10 |
| Session size | Total word budget: Corta **5** / Recomendada **9** / Larga **15**; map new-card ceiling `2 / 3 / 5` |
| Recap storage | On `finishSession`, write local last-session summary (Dexie `learningState` or dedicated key); ready reads that blob (outbox `activity_sessions` is not a Dexie read model) |
| Duration | Wall-clock from `sessionStartedAt` overrides `totalTimeMs` at finish; also stop hardcoding per-exercise `timeMs: 0` |

---

## File Structure

| File | Responsibility |
| --- | --- |
| `lib/essential-words/session-size.ts` | Size ids, budgets, new-card ceilings, read/write preference |
| `lib/essential-words/ready-date.ts` | Shared `localDateKey` (extract from `due-tomorrow.ts` or re-export) |
| `lib/essential-words/ready-forecast.ts` | Pure 7-day due buckets |
| `lib/essential-words/ready-vocabulary.ts` | Pure 4-bucket tally over touched words |
| `lib/essential-words/ready-retention.ts` | Pure 30d retention % + hide threshold |
| `lib/essential-words/ready-leeches.ts` | Pure leech rollup (`lapses >= 3`) |
| `lib/essential-words/ready-heatmap.ts` | Pure 12-week day intensities |
| `lib/essential-words/ready-streak-marks.ts` | Pure last-7-days EW activity marks |
| `lib/essential-words/ready-last-session.ts` | Save/load last-session recap blob |
| `lib/essential-words/ready-dashboard.ts` | Async Dexie gather → dashboard DTO for ready |
| `lib/essential-words/session-model.ts` | Accept `timeMs` in `buildEssentialWordExerciseResult` |
| `hooks/useEssentialWordsSession.ts` | Size preference, wall-clock, leech start, pass dashboard inputs |
| `hooks/useEssentialWordsReadyDashboard.ts` | LiveQuery/load dashboard DTO |
| `components/practice/essential-words/SessionReady.tsx` | Bento shell composition |
| `components/practice/essential-words/SessionReadyHero.tsx` | Size + route + CTA (primary) |
| `components/practice/essential-words/SessionReadySizePicker.tsx` | Segmented 5/9/15 |
| `components/practice/essential-words/SessionReadyRouteChips.tsx` | Visible route control (replace buried `details`) |
| `components/practice/essential-words/SessionReadyRecap.tsx` | Last session line |
| `components/practice/essential-words/SessionReadyForecast.tsx` | 7-day bars |
| `components/practice/essential-words/SessionReadyVocabulary.tsx` | Replaces LevelProgress on ready |
| `components/practice/essential-words/SessionReadyStreak.tsx` | Streak + marks |
| `components/practice/essential-words/SessionReadyRetention.tsx` | Retention % |
| `components/practice/essential-words/SessionReadyLeeches.tsx` | Chips + CTA |
| `components/practice/essential-words/SessionReadyVaultRow.tsx` | Word chips + modal |
| `components/practice/essential-words/SessionReadyHeatmap.tsx` | 12-week grid |
| `components/practice/essential-words/SessionReadyInsights.tsx` | **Remove** from ready composition (superseded) |
| `components/practice/essential-words/SessionReadyLevelProgress.tsx` | **Stop using on ready** (keep file if Home still needs helpers; do not render on ready) |
| `components/practice/essential-words/session-chrome.tsx` | Optional `SessionSurface` variant `primary` \| `compact` |
| Tests alongside each `lib/.../__tests__` and `components/.../__tests__` | TDD per task |

---

### Task 1: Session size preference + budgets

**Files:**
- Create: `lib/essential-words/session-size.ts`
- Test: `lib/essential-words/__tests__/session-size.test.ts`

**Interfaces:**
- Produces:
  - `export type SessionSizeId = "short" | "recommended" | "long"`
  - `export const SESSION_SIZES: readonly { id: SessionSizeId; label: string; wordBudget: number; newCardCeiling: number }[]`
  - `export function sessionSizeById(id: SessionSizeId): { wordBudget: number; newCardCeiling: number }`
  - `export function readSessionSizePreference(): SessionSizeId`
  - `export function writeSessionSizePreference(id: SessionSizeId): void`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, beforeEach } from "vitest";
import {
  SESSION_SIZES,
  sessionSizeById,
  readSessionSizePreference,
  writeSessionSizePreference,
} from "../session-size";

describe("session-size", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("maps budgets 5/9/15 and new ceilings 2/3/5", () => {
    expect(sessionSizeById("short")).toEqual({ wordBudget: 5, newCardCeiling: 2 });
    expect(sessionSizeById("recommended")).toEqual({ wordBudget: 9, newCardCeiling: 3 });
    expect(sessionSizeById("long")).toEqual({ wordBudget: 15, newCardCeiling: 5 });
    expect(SESSION_SIZES.map((s) => s.label)).toEqual(["Corta · 5", "Recomendada · 9", "Larga · 15"]);
  });

  it("persists preference in localStorage", () => {
    expect(readSessionSizePreference()).toBe("recommended");
    writeSessionSizePreference("long");
    expect(readSessionSizePreference()).toBe("long");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/essential-words/__tests__/session-size.test.ts`  
Expected: FAIL (module not found)

- [ ] **Step 3: Implement**

```ts
// lib/essential-words/session-size.ts
const STORAGE_KEY = "ej:essential-words:session-size";

export type SessionSizeId = "short" | "recommended" | "long";

export const SESSION_SIZES = [
  { id: "short" as const, label: "Corta · 5", wordBudget: 5, newCardCeiling: 2 },
  { id: "recommended" as const, label: "Recomendada · 9", wordBudget: 9, newCardCeiling: 3 },
  { id: "long" as const, label: "Larga · 15", wordBudget: 15, newCardCeiling: 5 },
] as const;

export function sessionSizeById(id: SessionSizeId) {
  const row = SESSION_SIZES.find((s) => s.id === id) ?? SESSION_SIZES[1];
  return { wordBudget: row.wordBudget, newCardCeiling: row.newCardCeiling };
}

export function readSessionSizePreference(): SessionSizeId {
  if (typeof localStorage === "undefined") return "recommended";
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === "short" || raw === "recommended" || raw === "long") return raw;
  return "recommended";
}

export function writeSessionSizePreference(id: SessionSizeId): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, id);
}
```

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add lib/essential-words/session-size.ts lib/essential-words/__tests__/session-size.test.ts
git commit -m "feat(essential-words): add session size preference budgets"
```

---

### Task 2: Fix exercise + session timer

**Files:**
- Modify: `lib/essential-words/session-model.ts`
- Modify: `hooks/useEssentialWordsSession.ts` (`beginSession`, grade path, `finishSession`)
- Modify: `lib/essential-words/ready-last-session.ts` (create in this task or Task 3 — prefer create here for save on finish)
- Test: `lib/essential-words/__tests__/session-model.test.ts` (create or extend)
- Test: cover finish path if an existing hook test can assert `timeMs` / saved recap

**Interfaces:**
- Produces:
  - `buildEssentialWordExerciseResult(..., timeMs: number)` — required arg or options bag; **no default 0 silent**
  - `saveLastEssentialWordsSession(userId, summary)` / `loadLastEssentialWordsSession(userId)`
  - Hook records `sessionStartedAtRef` on `beginSession`; on finish sets `totalTimeMs = Date.now() - started`

- [ ] **Step 1: Failing tests for `buildEssentialWordExerciseResult` timeMs**

```ts
it("forwards timeMs into the exercise result", () => {
  const result = buildEssentialWordExerciseResult(item, 4, undefined, "cloze_sentence", 12_500);
  expect(result.timeMs).toBe(12_500);
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Change signature**

```ts
export function buildEssentialWordExerciseResult(
  item: EssentialWordQueueItem,
  quality: number,
  extras?: GradeExtras,
  mode: EssentialWordMode = "speak_sentence",
  timeMs = 0,
): ExerciseResult {
  // ...
  return { /* ... */ timeMs: Math.max(0, Math.round(timeMs)), /* ... */ };
}
```

Update every call site in `useEssentialWordsSession` to pass elapsed ms since step presented (`stepPresentedAtRef`).

- [ ] **Step 4: Wall-clock + last-session save in `finishSession`**

```ts
const wallMs = sessionStartedAtRef.current
  ? Math.max(0, Date.now() - sessionStartedAtRef.current)
  : 0;
const sessionResult = {
  ...buildSessionResult(sessionResultsRef.current),
  totalTimeMs: wallMs > 0 ? wallMs : buildSessionResult(sessionResultsRef.current).totalTimeMs,
};
await recordActivitySession(user.id, { practiceContext: "essential-words", sessionResult });
await saveLastEssentialWordsSession(user.id, {
  practiced: sessionResult.results.length,
  correct: sessionResult.results.filter((r) => r.isCorrect).length,
  durationMs: sessionResult.totalTimeMs,
  completedAt: new Date().toISOString(),
});
```

`saveLastEssentialWordsSession` key: `ej:essential-words:last-session:${userId}` in `localStorage` (same family as session size; offline, no Dexie migration). Shape:

```ts
export interface LastEssentialWordsSession {
  practiced: number;
  correct: number;
  durationMs: number;
  completedAt: string;
}
```

- [ ] **Step 5: Tests for save/load last session + model timeMs — PASS**

- [ ] **Step 6: Commit**

```bash
git add lib/essential-words/session-model.ts lib/essential-words/ready-last-session.ts hooks/useEssentialWordsSession.ts lib/essential-words/__tests__/session-model.test.ts lib/essential-words/__tests__/ready-last-session.test.ts
git commit -m "fix(essential-words): record real session and exercise duration"
```

---

### Task 3: Pure adapters — forecast, vocabulary, retention, leeches, heatmap, streak marks

**Files:**
- Create: `lib/essential-words/ready-forecast.ts`
- Create: `lib/essential-words/ready-vocabulary.ts`
- Create: `lib/essential-words/ready-retention.ts`
- Create: `lib/essential-words/ready-leeches.ts`
- Create: `lib/essential-words/ready-heatmap.ts`
- Create: `lib/essential-words/ready-streak-marks.ts`
- Create: matching `__tests__/*`

**Interfaces:**
- Produces (all pure):

```ts
// forecast
export function bucketDueForecast(
  dueAts: string[], // ISO
  now: Date,
): { dayKey: string; label: string; count: number }[]; // length 7, labels L M X J V S D

// vocabulary — word-level rollup using meaning skill when present
export type VocabBucket = "nuevas" | "aprendiendo" | "en_repaso" | "dominadas";
export function tallyVocabularyBuckets(
  words: { wordId: string; bucket: VocabBucket }[],
): Record<VocabBucket, number>;

export function classifyTouchedWord(args: {
  meaningStatus: "unseen" | "learning" | "provisional" | "review" | null;
  legacyState?: number; // FSRS state if no skill
  vaultStatus?: "active" | "snoozed" | "mastered";
  mature?: boolean;
}): VocabBucket;

// retention
export function computeRetention30d(
  attempts: { occurredAt: string; correct: boolean; eventType: string }[],
  now: Date,
  minAttempts?: number, // default 10
): { pct: number; sampleSize: number } | null;

// leeches
export function collectLeeches(
  items: { wordId: string; word: string; lapses: number }[],
  threshold?: number, // default 3
): { wordId: string; word: string; lapses: number }[];

// heatmap
export function buildHeatmap12w(
  occurredAts: string[],
  now: Date,
): { dayKey: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[];

// streak marks
export function buildStreakMarks(
  occurredAts: string[],
  now: Date,
): boolean[]; // length 7, oldest→newest ending today
```

Classification rules for `classifyTouchedWord`:

1. `vaultStatus === "mastered"` OR `mature === true` → `dominadas`
2. `meaningStatus === "review"` → `en_repaso`
3. `meaningStatus === "learning" | "provisional"` → `aprendiendo`
4. else → `nuevas`

Legacy fallback without skill: `mastered` vault → dominadas; FSRS Review → en_repaso; Learning/Relearning → aprendiendo; else nuevas.

- [ ] **Step 1: Write failing tests for each pure module** (forecast empty days, vocab mapping, retention hide &lt;10, leeches threshold, heatmap levels, streak marks length 7)

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement pure functions**

Reuse local date key logic from `due-tomorrow.ts` — extract `localDateKey` to `ready-date.ts` and update `due-tomorrow.ts` to import it (avoid duplication).

- [ ] **Step 4: PASS + commit**

```bash
git commit -m "feat(essential-words): add ready dashboard pure adapters"
```

---

### Task 4: `ready-dashboard` Dexie gatherer + hook

**Files:**
- Create: `lib/essential-words/ready-dashboard.ts`
- Create: `hooks/useEssentialWordsReadyDashboard.ts`
- Test: `lib/essential-words/__tests__/ready-dashboard.test.ts` (mock queries)

**Interfaces:**
- Produces:

```ts
export interface EssentialWordsReadyDashboard {
  forecast: { dayKey: string; label: string; count: number }[];
  vocabulary: Record<VocabBucket, number> | null; // null if no touched words
  retention: { pct: number; sampleSize: number } | null;
  leeches: { wordId: string; word: string; lapses: number }[];
  streakMarks: boolean[];
  heatmap: { dayKey: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[] | null;
  lastSession: LastEssentialWordsSession | null;
}

export async function loadEssentialWordsReadyDashboard(
  userId: string,
  now?: Date,
): Promise<EssentialWordsReadyDashboard>;
```

Implementation sketch:

1. `getLearningItems(userId)`, `getAttemptLogs(userId, { from: twelveWeeksAgo })`, EW `srsData` filter.
2. Build due list from `dueAt` / `nextReview`.
3. Roll up touched wordIds → classify → tally.
4. Retention + heatmap + streak marks from attempts.
5. Leeches: group by wordId, `max(lapses)`, strip `c1k:` for display word via `srsData.word` or wordId.
6. `loadLastEssentialWordsSession(userId)`.

Hook: `useEssentialWordsReadyDashboard(userId)` — `useEffect` + state, or `useLiveQuery` if practical; show nothing until loaded (widgets omit themselves).

- [ ] **Step 1–4: TDD gatherer with mocked Dexie/query layer — PASS — commit**

```bash
git commit -m "feat(essential-words): load ready dashboard from Dexie"
```

---

### Task 5: Wire session size + leech start into `useEssentialWordsSession`

**Files:**
- Modify: `hooks/useEssentialWordsSession.ts`
- Modify: session loader / runtime `buildSession` call sites to pass `newCardCeiling` / truncate to `wordBudget`
- Test: extend existing session hook or loader tests

**Interfaces:**
- Produces from hook:
  - `sessionSize: SessionSizeId`
  - `setSessionSize(id: SessionSizeId)`
  - `startLeechReview(wordIds: string[]): Promise<void>`
  - `beginSession` respects size budgets

Behavior:

- On bootstrap/begin, read preference; pass `newCardCeiling` into queue/plan construction (replace hard `GUIDED_SESSION_NEW_CARDS` at the session entry boundary only — do not change global constant meaning for unrelated callers).
- After plan built, truncate scheduled unique words / steps to `wordBudget` using existing `truncateToTimeBudget` **or** a small `truncateToWordBudget(plan, n)` if time truncation is the wrong axis — prefer word-count truncation for this control.
- `startLeechReview`: set forced wordIds, `newCardCeiling: 0`, build review-only plan, jump past ready into speak/study as appropriate.

- [ ] **Step 1: Failing test — recommended size yields new ceiling 3; long yields 5**

- [ ] **Step 2–4: Implement + PASS + commit**

```bash
git commit -m "feat(essential-words): apply session size and leech review entry"
```

---

### Task 6: Hero controls UI (size + route chips)

**Files:**
- Create: `components/practice/essential-words/SessionReadySizePicker.tsx`
- Create: `components/practice/essential-words/SessionReadyRouteChips.tsx`
- Modify: `components/practice/essential-words/SessionReadyHero.tsx`
- Modify/remove usage of `SessionReadyRouteHint` on ready (keep file if used elsewhere; unused → delete in cleanup task)
- Test: `SessionReadyHero.test.tsx`, new picker tests

**UI rules:**

- Size segmented **above** CTA, full width, selected = `primary-soft` / `primary` text.
- Route chips row under size (or compact wrap): “Sesión recomendada” + route labels from existing `RoutePicker` data.
- Breakdown line: `3 nuevas · 6 repasos` (middle dot), minutes still top-right.
- Hero uses `SessionSurface` with slightly looser pad (`gap-layout-stack-loose` ok); do not redesign exercise cards.

- [ ] **Step 1: Failing UI tests — size buttons call `onSessionSizeChange`; route chip calls `onRouteChange`; no `details`/“Sesión recomendada” buried summary-only**

- [ ] **Step 2–4: Implement + PASS + commit**

```bash
git commit -m "feat(essential-words): elevate session size and route controls on ready hero"
```

---

### Task 7: Bento widgets + shell

**Files:**
- Create widget components listed in File Structure
- Modify: `SessionReady.tsx`, `SessionReadyVaultRow.tsx`
- Modify: `EssentialWordsSession.tsx` to pass dashboard + size/leech handlers
- Remove ready usage of `SessionReadyInsights`, `SessionReadyLevelProgress`
- Tests per widget + `SessionReady.test.tsx` composition/order

**Layout:**

```tsx
// Desktop: grid with main + rail; mobile: flex-col order via contents/order utilities
<section className="flex flex-col gap-space-6">
  <SessionReadyHero ... />
  {lastSession ? <SessionReadyRecap ... /> : null}
  <div className="flex flex-col gap-space-4 md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(12rem,0.9fr)] md:gap-space-4 md:items-start">
    <div className="flex flex-col gap-space-4 order-1">
      <SessionReadyForecast ... />
      <SessionReadyVocabulary ... />
    </div>
    <aside className="flex flex-col gap-space-3 order-2">
      <SessionReadyStreak streak={streak} marks={marks} />
      {retention ? <SessionReadyRetention ... /> : null}
      {leeches.length ? <SessionReadyLeeches ... onReview={startLeechReview} /> : null}
      <SessionReadyVaultRow /> {/* chips */}
    </aside>
  </div>
  {heatmap ? <SessionReadyHeatmap days={heatmap} /> : null}
</section>
```

Mobile order B matches DOM order above (forecast/vocab before rail). Heatmap last.

**Vault row:** show up to 3 `displayEnglishWord(entry.word)` chips; keep modal.

**Vocabulary:** segmented bar + legend counts; if `vocabulary === null`, omit component.

**Forecast:** always show 7 bars when dashboard loaded (zeros ok).

- [ ] **Step 1: Component tests for omit-when-null, vault chips, leech CTA, heatmap levels class tokens**

- [ ] **Step 2–4: Implement + PASS + commit**

```bash
git commit -m "feat(essential-words): ready bento widgets and two-column shell"
```

---

### Task 8: Recap line + polish dead ready pieces

**Files:**
- Create: `SessionReadyRecap.tsx`
- Delete or stop exporting unused ready-only dead code paths (`SessionReadyInsights` if unused; `SessionReadyRouteHint` if unused)
- Update tests that mocked old insights/level-progress

Recap copy: `Última: 8/9` + ` · 5:42` when `durationMs > 0` (format `m:ss`).

- [ ] **Step 1–4: TDD + cleanup + commit**

```bash
git commit -m "feat(essential-words): last-session recap and ready cleanup"
```

---

### Task 9: Integration verification

- [ ] **Step 1: Run focused tests**

```bash
pnpm exec vitest run lib/essential-words/__tests__/session-size.test.ts lib/essential-words/__tests__/ready-forecast.test.ts lib/essential-words/__tests__/ready-vocabulary.test.ts lib/essential-words/__tests__/ready-retention.test.ts lib/essential-words/__tests__/ready-leeches.test.ts lib/essential-words/__tests__/ready-heatmap.test.ts lib/essential-words/__tests__/ready-streak-marks.test.ts lib/essential-words/__tests__/ready-last-session.test.ts lib/essential-words/__tests__/ready-dashboard.test.ts lib/essential-words/__tests__/session-model.test.ts components/practice/essential-words/__tests__/SessionReady.test.tsx components/practice/essential-words/__tests__/SessionReadyHero.test.tsx
```

Expected: PASS

- [ ] **Step 2: `pnpm type-check`** — PASS

- [ ] **Step 3: Manual checklist**

1. Ready as new user: hero + size/route only; no fake retention/heatmap.
2. After practice: vocabulary bar moves; forecast/heatmap populate.
3. Complete a session: recap shows `correct/practiced` and non-zero time.
4. Vault shows words; leeches CTA starts review-only flow when lapses ≥ 3.
5. Mobile order: hero → forecast → vocab → rail → heatmap.
6. Light + dark + alternate `--hue`.

- [ ] **Step 4: Final commit if needed**

```bash
git commit -m "test(essential-words): ready bento verification pass"
```

---

## Spec coverage checklist

| Spec requirement | Task |
| --- | --- |
| Size + route both elevated | 1, 5, 6 |
| 4-bucket vocabulary; no 740 wall | 3, 4, 7 |
| Forecast 7d | 3, 4, 7 |
| Retention 30d + hide &lt;10 | 3, 4, 7 |
| Leeches + CTA | 3, 4, 5, 7 |
| Vault words | 7 |
| Streak + marks | 3, 4, 7 |
| Heatmap 12w | 3, 4, 7 |
| Recap + timer fix | 2, 8 |
| Mobile order B | 7 |
| Omit empty widgets | 4, 7 |
| Offline Dexie | 4 |
| Keep session width | 7 (no archetype change) |

## Self-review notes

- No TBD/placeholder steps; open spec items locked in Global Constraints.
- Types reused: `SessionSizeId`, `VocabBucket`, `EssentialWordsReadyDashboard`, `LastEssentialWordsSession`.
- Timer and recap storage are explicit (localStorage last-session) because outbox activity rows are not a Dexie read model.
