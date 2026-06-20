# Free-Practice Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/practice`'s redirect with a real practice hub that offers all practice modes, leads with a contextual recommended card, and shows a contextual header depending on whether the user just finished their daily.

**Architecture:** A Server Component page reads `searchParams.from`. A client component reads the cached daily plan's `arc` (from localStorage, same source the recap uses) and the last-used practice mode (new Dexie key/value store) to resolve a recommended card via a pure function. The recap's "Free practice" button points to `/practice?from=daily`. Entering any practice mode writes `lastPracticeMode` to Dexie via one helper.

**Tech Stack:** Next.js 15 App Router, React 19, Dexie.js, Tailwind v4, Vitest.

---

## File Structure

- `lib/practice/practice-modes.ts` — **new.** Static registry of practice modes (id, label, description, href, icon name) + the pure `resolveRecommendedMode()` function. Single source of truth for "what modes exist".
- `lib/db/index.ts` — **modify.** Add Dexie v14 `practicePrefs` key/value store + `setLastPracticeMode()` / `getLastPracticeMode()` helpers.
- `lib/practice/__tests__/practice-modes.test.ts` — **new.** Unit tests for `resolveRecommendedMode()`.
- `app/practice/page.tsx` — **modify.** Replace `redirect('/daily')` with the hub (Server Component reading `searchParams`).
- `components/practice/hub/PracticeHubClient.tsx` — **new.** Client component: reads arc + last mode, renders header + recommended + grid.
- `components/practice/hub/PracticeHubHeader.tsx` — **new.** Contextual header (`from=daily` vs neutral).
- `components/practice/hub/RecommendedPracticeCard.tsx` — **new.** The highlighted card.
- `components/practice/hub/PracticeOptionsGrid.tsx` — **new.** Remaining modes as cells (excludes the recommended one).
- `components/daily/SessionRecapCard.tsx` — **modify.** Change `/practice/sounds` → `/practice?from=daily`.

---

## Task 1: Practice mode registry + recommendation resolver

**Files:**
- Create: `lib/practice/practice-modes.ts`
- Test: `lib/practice/__tests__/practice-modes.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/practice/__tests__/practice-modes.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { resolveRecommendedMode, PRACTICE_MODES } from '../practice-modes'

describe('resolveRecommendedMode', () => {
  it('from daily with a sound → sound lab, with custom copy', () => {
    const r = resolveRecommendedMode({
      fromDaily: true,
      arc: { soundIpa: 'æ', topicLabel: null, sessionWords: [] },
      lastModeId: null,
    })
    expect(r.mode.id).toBe('sounds')
    expect(r.reason).toBe('daily-sound')
    expect(r.headline).toContain('/æ/')
  })

  it('from daily without a sound → essential words', () => {
    const r = resolveRecommendedMode({
      fromDaily: true,
      arc: { soundIpa: null, topicLabel: 'Food', sessionWords: [] },
      lastModeId: null,
    })
    expect(r.mode.id).toBe('core-1000')
    expect(r.reason).toBe('daily-words')
  })

  it('not from daily, last mode known → continue that mode', () => {
    const r = resolveRecommendedMode({
      fromDaily: false,
      arc: undefined,
      lastModeId: 'decks',
    })
    expect(r.mode.id).toBe('decks')
    expect(r.reason).toBe('last-mode')
  })

  it('not from daily, unknown last mode id → falls back to essential words', () => {
    const r = resolveRecommendedMode({
      fromDaily: false,
      arc: undefined,
      lastModeId: 'nonsense',
    })
    expect(r.mode.id).toBe('core-1000')
    expect(r.reason).toBe('fallback')
  })

  it('nothing known → fallback to essential words', () => {
    const r = resolveRecommendedMode({
      fromDaily: false,
      arc: undefined,
      lastModeId: null,
    })
    expect(r.mode.id).toBe('core-1000')
    expect(r.reason).toBe('fallback')
  })

  it('every mode has a unique id and a route', () => {
    const ids = PRACTICE_MODES.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const m of PRACTICE_MODES) expect(m.href.startsWith('/')).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/practice/__tests__/practice-modes.test.ts`
Expected: FAIL — cannot resolve `../practice-modes`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/practice/practice-modes.ts`:

```ts
import type { SessionArc } from './types'

/** A practice mode the user can jump into from the hub. */
export interface PracticeMode {
  id: string
  label: string
  description: string
  href: string
  /** lucide-react icon name, resolved in the component layer. */
  icon: string
}

/** Single source of truth for the free-practice hub. */
export const PRACTICE_MODES: readonly PracticeMode[] = [
  {
    id: 'sounds',
    label: 'Sound Lab',
    description: 'Pronunciation and minimal pairs',
    href: '/practice/sounds',
    icon: 'MicVocal',
  },
  {
    id: 'core-1000',
    label: 'Essential Words',
    description: 'The 1000 most useful words',
    href: '/practice/core-1000',
    icon: 'ListOrdered',
  },
  {
    id: 'decks',
    label: 'Decks',
    description: 'Your vocabulary decks',
    href: '/practice/decks',
    icon: 'Layers',
  },
  {
    id: 'review',
    label: 'Review',
    description: 'Words due for spaced repetition',
    href: '/practice/review',
    icon: 'RotateCcw',
  },
  {
    id: 'courses',
    label: 'Courses',
    description: 'Continue a guided course',
    href: '/courses',
    icon: 'BookOpen',
  },
] as const

const FALLBACK_MODE_ID = 'core-1000'

export type RecommendationReason =
  | 'daily-sound'
  | 'daily-words'
  | 'last-mode'
  | 'fallback'

export interface RecommendedResult {
  mode: PracticeMode
  reason: RecommendationReason
  /** Card heading, e.g. "Keep going with /æ/". */
  headline: string
  /** Supporting line under the heading. */
  subtext: string
}

/** Minimal arc shape the resolver needs (subset of SessionArc). */
type ArcLike = Pick<SessionArc, 'soundIpa' | 'topicLabel' | 'sessionWords'>

export interface ResolveInput {
  fromDaily: boolean
  arc: ArcLike | undefined
  lastModeId: string | null
}

function modeById(id: string): PracticeMode | undefined {
  return PRACTICE_MODES.find((m) => m.id === id)
}

/**
 * Pick the highlighted card for the hub. Priority:
 * 1. from daily + arc has a sound → Sound Lab
 * 2. from daily (no sound) → Essential Words
 * 3. last practiced mode is known → continue it
 * 4. fallback → Essential Words
 */
export function resolveRecommendedMode(input: ResolveInput): RecommendedResult {
  const fallback = modeById(FALLBACK_MODE_ID)!

  if (input.fromDaily && input.arc?.soundIpa) {
    const mode = modeById('sounds')!
    return {
      mode,
      reason: 'daily-sound',
      headline: `Keep going with /${input.arc.soundIpa}/`,
      subtext: 'Reinforce the sound from today’s daily.',
    }
  }

  if (input.fromDaily) {
    return {
      mode: fallback,
      reason: 'daily-words',
      headline: 'Keep building your core vocabulary',
      subtext: 'Pick up where today’s daily left off.',
    }
  }

  if (input.lastModeId) {
    const mode = modeById(input.lastModeId)
    if (mode) {
      return {
        mode,
        reason: 'last-mode',
        headline: `Continue ${mode.label}`,
        subtext: 'Pick up where you left off.',
      }
    }
  }

  return {
    mode: fallback,
    reason: 'fallback',
    headline: 'Start with the essentials',
    subtext: 'The 1000 most useful words.',
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/practice/__tests__/practice-modes.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/practice/practice-modes.ts lib/practice/__tests__/practice-modes.test.ts
git commit -m "feat(practice): practice-mode registry + recommendation resolver"
```

---

## Task 2: Dexie `practicePrefs` store + last-mode helpers

**Files:**
- Modify: `lib/db/index.ts`

- [ ] **Step 1: Add the interface and table declaration**

In `lib/db/index.ts`, add this interface near the other record interfaces (e.g. after `IpaExplorationRecord`, around line 81):

```ts
/** Key/value store for lightweight practice UI prefs (e.g. last mode used). */
export interface PracticePrefRecord {
  key: string;   // PK, e.g. "lastPracticeMode"
  value: string;
  updatedAt: string; // ISO
}
```

Add the table field to the `PronunciationDB` class, after `readerPassages` (line 99):

```ts
  practicePrefs!: Table<PracticePrefRecord, string>;
```

- [ ] **Step 2: Add the v14 schema block**

In the constructor, after the v13 block (line 180), add:

```ts
    // v14: lightweight key/value prefs for the practice hub (last mode used)
    this.version(14).stores({
      practicePrefs: "key",
    });
```

- [ ] **Step 3: Add the helpers**

At the end of `lib/db/index.ts`, after the IPA Exploration helpers, add:

```ts
// ── Practice Prefs Helpers ──

const LAST_PRACTICE_MODE_KEY = "lastPracticeMode";

/** Remember the last practice mode the user entered (for the hub recommendation). */
export async function setLastPracticeMode(modeId: string): Promise<void> {
  await db.practicePrefs.put({
    key: LAST_PRACTICE_MODE_KEY,
    value: modeId,
    updatedAt: new Date().toISOString(),
  });
}

/** The last practice mode id the user entered, or null if none recorded. */
export async function getLastPracticeMode(): Promise<string | null> {
  const row = await db.practicePrefs.get(LAST_PRACTICE_MODE_KEY);
  return row?.value ?? null;
}
```

- [ ] **Step 4: Type-check**

Run: `pnpm type-check`
Expected: PASS (no errors).

- [ ] **Step 5: Commit**

```bash
git add lib/db/index.ts
git commit -m "feat(db): v14 practicePrefs store + last-practice-mode helpers"
```

---

## Task 3: Record last mode when entering a practice mode

The hub itself writes `lastPracticeMode` when the user clicks a mode — this keeps the write in one place (the hub link handler) rather than scattered across each mode page. Modes reached from elsewhere (sidebar) don't need it for the recommendation to work; the hub is the only reader and the most common entry point.

**Files:**
- (No new file — this is wired in Task 5's `PracticeOptionsGrid` / `RecommendedPracticeCard` via an `onSelect` callback. No separate task needed.)

- [ ] **Step 1: Confirm scope**

No action. The write is implemented inside Task 5 components (`onSelect={() => setLastPracticeMode(mode.id)}`). This task exists only to document the decision: last-mode is written at hub-click time, not on each mode page.

---

## Task 4: Contextual header component

**Files:**
- Create: `components/practice/hub/PracticeHubHeader.tsx`

- [ ] **Step 1: Implement the header**

Create `components/practice/hub/PracticeHubHeader.tsx`:

```tsx
// Planned structure:
// <PracticeHubHeader>  — title + subtitle, contextual on `fromDaily`
interface Props {
  fromDaily: boolean
}

export default function PracticeHubHeader({ fromDaily }: Props) {
  return (
    <header className="flex flex-col gap-2">
      <h1
        className="text-3xl font-medium text-[var(--text-primary)]"
        style={{ fontFamily: 'var(--font-display), serif' }}
      >
        {fromDaily ? 'Nicely done — keep going' : 'Free practice'}
      </h1>
      <p className="font-body-sm text-[var(--text-secondary)]">
        {fromDaily
          ? 'You just finished today’s daily. Choose what to reinforce next.'
          : 'Choose what you want to reinforce.'}
      </p>
    </header>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/practice/hub/PracticeHubHeader.tsx
git commit -m "feat(practice): contextual practice hub header"
```

---

## Task 5: Recommended card + options grid

**Files:**
- Create: `components/practice/hub/RecommendedPracticeCard.tsx`
- Create: `components/practice/hub/PracticeOptionsGrid.tsx`

- [ ] **Step 1: Shared icon resolver + recommended card**

Create `components/practice/hub/RecommendedPracticeCard.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { ArrowRight, MicVocal, ListOrdered, Layers, RotateCcw, BookOpen } from 'lucide-react'
import type { ElementType } from 'react'
import { setLastPracticeMode } from '@/lib/db'
import type { RecommendedResult } from '@/lib/practice/practice-modes'

// Planned structure:
// <RecommendedPracticeCard> — single highlighted CTA to the recommended mode

export const MODE_ICONS: Record<string, ElementType> = {
  MicVocal,
  ListOrdered,
  Layers,
  RotateCcw,
  BookOpen,
}

interface Props {
  recommendation: RecommendedResult
}

export default function RecommendedPracticeCard({ recommendation }: Props) {
  const { mode, headline, subtext } = recommendation
  const Icon = MODE_ICONS[mode.icon] ?? MicVocal

  return (
    <Link
      href={mode.href}
      onClick={() => void setLastPracticeMode(mode.id)}
      className="flex items-center gap-4 rounded-[var(--radius-xl)] border border-border-subtle bg-[var(--hue-icon-bg)] p-5 transition-colors hover:bg-surface-sunken focus-ring"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-lg)] bg-surface-raised text-[var(--primary)]">
        <Icon size={22} aria-hidden />
      </span>
      <div className="flex-1">
        <p className="font-body-sm font-semibold text-[var(--text-primary)]">{headline}</p>
        <p className="font-caption text-[var(--text-tertiary)]">{subtext}</p>
      </div>
      <ArrowRight size={18} className="text-[var(--text-tertiary)]" aria-hidden />
    </Link>
  )
}
```

- [ ] **Step 2: Options grid (excludes recommended)**

Create `components/practice/hub/PracticeOptionsGrid.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { setLastPracticeMode } from '@/lib/db'
import { PRACTICE_MODES } from '@/lib/practice/practice-modes'
import { MODE_ICONS } from './RecommendedPracticeCard'

// Planned structure:
// <PracticeOptionsGrid> — all modes except the recommended one, as cells

interface Props {
  excludeModeId: string
}

export default function PracticeOptionsGrid({ excludeModeId }: Props) {
  const modes = PRACTICE_MODES.filter((m) => m.id !== excludeModeId)

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {modes.map((mode) => {
        const Icon = MODE_ICONS[mode.icon] ?? MODE_ICONS.MicVocal
        return (
          <Link
            key={mode.id}
            href={mode.href}
            onClick={() => void setLastPracticeMode(mode.id)}
            className="flex flex-col gap-2.5 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-4 transition-colors hover:bg-surface-sunken focus-ring"
          >
            <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-lg)] bg-[var(--hue-icon-bg)] text-[var(--primary)]">
              <Icon size={18} aria-hidden />
            </span>
            <div>
              <p className="font-body-sm font-semibold text-[var(--text-primary)]">{mode.label}</p>
              <p className="font-caption text-[var(--text-tertiary)]">{mode.description}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

Run: `pnpm type-check`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/practice/hub/RecommendedPracticeCard.tsx components/practice/hub/PracticeOptionsGrid.tsx
git commit -m "feat(practice): recommended card + options grid for hub"
```

---

## Task 6: Hub client (reads arc + last mode, resolves recommendation)

**Files:**
- Create: `components/practice/hub/PracticeHubClient.tsx`

- [ ] **Step 1: Implement the client component**

Create `components/practice/hub/PracticeHubClient.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import PageLayout from '@/components/layout/PageLayout'
import { loadCachedDailyPlan } from '@/lib/daily/plan-storage'
import { getLastPracticeMode } from '@/lib/db'
import { resolveRecommendedMode, type RecommendedResult } from '@/lib/practice/practice-modes'
import PracticeHubHeader from './PracticeHubHeader'
import RecommendedPracticeCard from './RecommendedPracticeCard'
import PracticeOptionsGrid from './PracticeOptionsGrid'

// Planned structure:
// <PracticeHubClient>
//   <PracticeHubHeader />
//   <RecommendedPracticeCard />
//   <PracticeOptionsGrid />

interface Props {
  fromDaily: boolean
}

export default function PracticeHubClient({ fromDaily }: Props) {
  const { user } = useAuth()
  const [recommendation, setRecommendation] = useState<RecommendedResult | null>(null)

  useEffect(() => {
    let cancelled = false
    async function resolve() {
      const arc = fromDaily && user ? (loadCachedDailyPlan(user.id)?.arc ?? undefined) : undefined
      // Dexie may be unavailable (private mode / no IndexedDB) — fall back to null.
      const lastModeId = fromDaily ? null : await getLastPracticeMode().catch(() => null)
      // `fromDaily` but the cached plan is gone (e.g. fresh tab): treat as neutral.
      const effectiveFromDaily = fromDaily && !!arc
      const result = resolveRecommendedMode({
        fromDaily: effectiveFromDaily,
        arc,
        lastModeId,
      })
      if (!cancelled) setRecommendation(result)
    }
    void resolve()
    return () => {
      cancelled = true
    }
  }, [fromDaily, user])

  return (
    <PageLayout className="mx-auto flex max-w-[640px] flex-col gap-6">
      <PracticeHubHeader fromDaily={fromDaily} />
      {recommendation && (
        <>
          <RecommendedPracticeCard recommendation={recommendation} />
          <PracticeOptionsGrid excludeModeId={recommendation.mode.id} />
        </>
      )}
    </PageLayout>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: PASS.

Note: confirm `PageLayout` accepts a `className` prop (it does — used the same way in `SessionRecapCard.tsx:45`). Confirm `DailyPlan.arc` is optional (`SessionArc | undefined`) — it is (`lib/practice/types.ts:181`).

- [ ] **Step 3: Commit**

```bash
git add components/practice/hub/PracticeHubClient.tsx
git commit -m "feat(practice): hub client resolving contextual recommendation"
```

---

## Task 7: Wire the page + repoint the recap button

**Files:**
- Modify: `app/practice/page.tsx`
- Modify: `components/daily/SessionRecapCard.tsx:101`

- [ ] **Step 1: Replace the redirect page**

Replace the entire contents of `app/practice/page.tsx` with:

```tsx
import PracticeHubClient from '@/components/practice/hub/PracticeHubClient'

interface PageProps {
  searchParams: Promise<{ from?: string }>
}

export default async function PracticePage({ searchParams }: PageProps) {
  const { from } = await searchParams
  return <PracticeHubClient fromDaily={from === 'daily'} />
}
```

(Next.js 15: `searchParams` is a Promise and must be awaited.)

- [ ] **Step 2: Repoint the recap "Free practice" button**

In `components/daily/SessionRecapCard.tsx`, change line 101:

```tsx
          <Link href="/practice/sounds">
```

to:

```tsx
          <Link href="/practice?from=daily">
```

- [ ] **Step 3: Type-check + run full test suite**

Run: `pnpm type-check && pnpm test`
Expected: PASS, including `practice-modes.test.ts`.

- [ ] **Step 4: Manual smoke (optional but recommended)**

Run: `pnpm dev`, then:
- Visit `/practice` → neutral header, recommended card = last mode or Essential Words.
- Visit `/practice?from=daily` after completing a daily → "keep going" header; if today's daily had a sound, recommended = Sound Lab with `/x/` headline.

- [ ] **Step 5: Commit**

```bash
git add app/practice/page.tsx components/daily/SessionRecapCard.tsx
git commit -m "feat(practice): hub page + repoint daily recap to /practice?from=daily"
```

---

## Self-Review Notes

- **Spec coverage:** hub (Tasks 4–7), recommended card priority incl. `from=daily`/sound/last-mode/fallback (Task 1), last-mode persistence in Dexie (Tasks 2, 5), contextual header (Task 4), grid excludes recommended (Task 5), edge cases — arc absent treated as neutral (Task 6), Dexie-unavailable: `getLastPracticeMode` rejects → recommendation stays null → header + nothing renders; acceptable (header still shows). Recap repoint (Task 7).
- **Type consistency:** `resolveRecommendedMode` / `RecommendedResult` / `PRACTICE_MODES` / `MODE_ICONS` / `setLastPracticeMode` / `getLastPracticeMode` names are consistent across tasks.
- **No placeholders:** all code shown.
