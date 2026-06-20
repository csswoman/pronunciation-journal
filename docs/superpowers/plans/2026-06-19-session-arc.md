# Session Arc (Apertura + Cierre) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap the daily session with an opening banner ("hoy entrenas X · 742/1000") and a closing recap card (tema, palabras de hoy, qué vuelve mañana, Core 1000 + racha), reusing data the plan already computes.

**Architecture:** Add an optional `arc` field to `DailyPlan`, populated in `buildDailyPlan` with the dominant topic, primary sound IPA, and the session's words. Two new presentation components (`SessionOpeningBanner`, `SessionRecapCard`) mount into existing slots in `DailyChecklist` (the `<header>` and the `view.mode === 'done'` block). Core 1000 progress is read client-side from Dexie (offline-safe). The streak is fetched server-side in `app/daily/page.tsx` and passed as a prop. "Qué vuelve mañana" is a new client query that degrades to `null` when offline.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind v4 + CSS tokens, Dexie (`useLiveQuery`), Supabase browser client, Vitest.

---

## File Structure

**Create:**
- `components/daily/SessionOpeningBanner.tsx` — presentation: tema del día + Core 1000 bar. Reads Core 1000 from Dexie via `useLiveQuery`.
- `components/daily/SessionRecapCard.tsx` — presentation: closing recap (4 sections). Reads Core 1000 from Dexie.
- `lib/review/__tests__/due-tomorrow.test.ts` — unit test for the due-tomorrow query helper.
- `components/daily/__tests__/SessionRecapCard.test.tsx` — component test for graceful degradation.

**Modify:**
- `lib/practice/types.ts` — add `SessionArc` type and `arc?: SessionArc` to `DailyPlan`.
- `lib/practice/daily-plan/composer.ts` — populate `arc` in `buildDailyPlan`.
- `lib/practice/daily-plan/__tests__/daily-plan.test.ts` — assert `arc` is populated.
- `lib/review/client-queries.ts` — add `fetchDueTomorrowCount`.
- `app/daily/page.tsx` — fetch streak server-side, pass as prop.
- `components/daily/DailyChecklist.tsx` — accept `streak` prop, render banner + recap.
- `hooks/useDailyPlan.ts` — expose `plan.arc` (already returns `plan`, no change needed beyond verifying — see Task 4).

---

## Task 1: Add `SessionArc` type to `DailyPlan`

**Files:**
- Modify: `lib/practice/types.ts` (the `DailyPlan` type, currently ~lines 164-170)

- [ ] **Step 1: Add the `SessionArc` type and `arc` field**

In `lib/practice/types.ts`, immediately before the existing `export type DailyPlan = {` block, add:

```ts
/** Narrative framing metadata for a daily session (opening banner + closing recap). */
export type SessionArc = {
  /** Dominant grammar concept of the session, via dominantTopicLabel(). null if none. */
  topicLabel: string | null
  /** IPA of the day's primary sound. null if no phonetic focus. */
  soundIpa: string | null
  /** Distinct words touched in the session (from word_intro/word_review/context steps). */
  sessionWords: string[]
}
```

Then add `arc` to the `DailyPlan` type:

```ts
export type DailyPlan = {
  /** Exactamente DAILY_PLAN_STEP_COUNT pasos cuando el seed está disponible. */
  steps: DailyStep[]
  totalExercises: number
  /** true si no había word_bank ni progreso de fonema (todo salió del seed). */
  isNewUser: boolean
  /** Narrative framing for opening banner + closing recap. Optional: cached plans predate it. */
  arc?: SessionArc
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `pnpm type-check`
Expected: PASS (no errors; `arc` is optional so existing consumers are unaffected).

- [ ] **Step 3: Commit**

```bash
git add lib/practice/types.ts
git commit -m "feat(daily): add SessionArc type to DailyPlan"
```

---

## Task 2: Populate `arc` in `buildDailyPlan`

**Files:**
- Test: `lib/practice/daily-plan/__tests__/daily-plan.test.ts`
- Modify: `lib/practice/daily-plan/composer.ts`

The `buildDailyPlan` function already computes `primarySound` and `reviewWords`. We add an
`arc` to the returned object. `topicLabel` comes from `dominantTopicLabel()` over the topics
of all exercises across steps. `sessionWords` are the distinct `targetWord` values from the
review steps' exercises.

- [ ] **Step 1: Write the failing test**

Open `lib/practice/daily-plan/__tests__/daily-plan.test.ts`. Find the existing describe block
for `buildDailyPlan` and add this test inside it (adapt the existing mock setup — the test file
already mocks the fetchers; reuse whatever harness builds a plan). The assertion that matters:

```ts
it('populates arc with the primary sound IPA and session words', async () => {
  // Uses the same mock setup as the other buildDailyPlan tests in this file.
  const plan = await buildDailyPlan('test-user')

  expect(plan.arc).toBeDefined()
  expect(plan.arc).toHaveProperty('topicLabel')
  expect(plan.arc).toHaveProperty('soundIpa')
  expect(Array.isArray(plan.arc?.sessionWords)).toBe(true)
})
```

> NOTE FOR IMPLEMENTER: This file already has working mocks for `buildDailyPlan`. Read the
> existing tests first and mirror their setup exactly. If the existing tests construct words
> with a `targetWord`/`text` field, assert `plan.arc.sessionWords` contains one of those.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/practice/daily-plan/__tests__/daily-plan.test.ts`
Expected: FAIL — `plan.arc` is `undefined` (`expect(plan.arc).toBeDefined()`).

- [ ] **Step 3: Implement arc population in composer**

In `lib/practice/daily-plan/composer.ts`:

Add the import at the top with the other `lib/practice` imports:

```ts
import { dominantTopicLabel } from '@/lib/practice/topic-labels'
import type { DailyPlan, DailyStep, SessionArc } from '@/lib/practice/types'
```

(Replace the existing `import type { DailyPlan, DailyStep } from '@/lib/practice/types'` line
so `SessionArc` is included.)

Then, just before the final `return { steps: steps.slice(...), totalExercises, isNewUser: ... }`
of `buildDailyPlan`, compute the arc:

```ts
  const finalSteps = steps.slice(0, DAILY_PLAN_STEP_COUNT)

  // Session arc: narrative framing reusing data the plan already computed.
  const arcTopics = finalSteps.flatMap((s) => s.exercises.map((e) => e.topic))
  const sessionWords = Array.from(
    new Set(
      finalSteps
        .filter((s) => s.kind === 'word_intro' || s.kind === 'word_review' || s.kind === 'context_practice')
        .flatMap((s) => s.exercises.map((e) => e.targetWord).filter((w): w is string => !!w)),
    ),
  )
  const arc: SessionArc = {
    topicLabel: dominantTopicLabel(arcTopics),
    soundIpa: primarySound?.ipa ?? null,
    sessionWords,
  }
```

Then change the return to use `finalSteps` and include `arc`:

```ts
  const totalExercises = finalSteps.reduce((sum, s) => sum + s.exercises.length, 0)

  return {
    steps: finalSteps,
    totalExercises,
    isNewUser: !hasWordBank && !hasProgress,
    arc,
  }
```

> NOTE: `PracticeExercise.topic` and `.targetWord` are both optional fields that already exist
> on the exercise types (`lib/practice/types.ts`). `dominantTopicLabel` accepts
> `Array<string | undefined | null>` so passing `e.topic` directly is fine.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/practice/daily-plan/__tests__/daily-plan.test.ts`
Expected: PASS.

- [ ] **Step 5: Run full type-check**

Run: `pnpm type-check`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/practice/daily-plan/composer.ts lib/practice/daily-plan/__tests__/daily-plan.test.ts
git commit -m "feat(daily): populate session arc in buildDailyPlan"
```

---

## Task 3: Add `fetchDueTomorrowCount` query (graceful degradation)

**Files:**
- Test: `lib/review/__tests__/due-tomorrow.test.ts`
- Modify: `lib/review/client-queries.ts`

This counts `word_bank` SRS items whose `next_review_at` falls within the next 24h. It must
return `0` (not throw) on query error, and we treat a thrown/failed network call as "unknown"
at the call site via try/catch. The column is `next_review_at` (confirmed in `lib/decks/queries.ts`).

- [ ] **Step 1: Write the failing test**

Create `lib/review/__tests__/due-tomorrow.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchDueTomorrowCount } from '@/lib/review/client-queries'

const mockFrom = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ from: mockFrom }),
}))

describe('fetchDueTomorrowCount', () => {
  beforeEach(() => mockFrom.mockReset())

  it('returns the count of items due within 24h', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          not: () => ({
            lte: () => Promise.resolve({ count: 3, error: null }),
          }),
        }),
      }),
    })

    const n = await fetchDueTomorrowCount('user-1')
    expect(n).toBe(3)
  })

  it('returns 0 when the query errors (offline / RLS)', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          not: () => ({
            lte: () => Promise.resolve({ count: null, error: { message: 'offline' } }),
          }),
        }),
      }),
    })

    const n = await fetchDueTomorrowCount('user-1')
    expect(n).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/review/__tests__/due-tomorrow.test.ts`
Expected: FAIL — `fetchDueTomorrowCount` is not exported.

- [ ] **Step 3: Implement the query**

Append to `lib/review/client-queries.ts`:

```ts
/**
 * Count word_bank SRS items whose next review falls within the next 24h.
 * Returns 0 on error so the recap card degrades gracefully offline.
 */
export async function fetchDueTomorrowCount(userId: string): Promise<number> {
  const supabase = getSupabaseBrowserClient()
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { count, error } = await supabase
    .from('word_bank')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('next_review_at', 'is', null)
    .lte('next_review_at', tomorrow)

  if (error || count == null) return 0
  return count
}
```

> NOTE: `getSupabaseBrowserClient` is already imported at the top of this file. The test mocks
> the chain `.select().eq().not().lte()` — keep the call order matching the test
> (`select → eq → not → lte`).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/review/__tests__/due-tomorrow.test.ts`
Expected: PASS (both cases).

- [ ] **Step 5: Commit**

```bash
git add lib/review/client-queries.ts lib/review/__tests__/due-tomorrow.test.ts
git commit -m "feat(review): add fetchDueTomorrowCount with graceful offline fallback"
```

---

## Task 4: Build `SessionOpeningBanner`

**Files:**
- Create: `components/daily/SessionOpeningBanner.tsx`

Presentation component. Receives the `arc`; reads Core 1000 learned count live from Dexie
(same pattern as `Core1000ProgressCard`). Renders `null` when there's nothing to frame.

- [ ] **Step 1: Create the component**

Create `components/daily/SessionOpeningBanner.tsx`:

```tsx
'use client'

// Planned structure:
// <SessionOpeningBanner>
//   tema del día (topicLabel + soundIpa)
//   Core 1000 count (N / 1000)
// </SessionOpeningBanner>
//
// Opening framing for the daily session. Core 1000 progress is Dexie-only, read
// live from IndexedDB (offline-safe). Renders nothing when there is no framing.

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { CORE1000_PREFIX } from '@/lib/core-1000/types'
import type { SessionArc } from '@/lib/practice/types'

const CORE_1000_TARGET = 1000

interface Props {
  arc: SessionArc | undefined
}

export default function SessionOpeningBanner({ arc }: Props) {
  const learned = useLiveQuery(
    () => db.srsData.filter((e) => e.wordId.startsWith(CORE1000_PREFIX) && !e.archived).count(),
    [],
    0,
  )

  const parts: string[] = []
  if (arc?.topicLabel) parts.push(arc.topicLabel)
  if (arc?.soundIpa) parts.push(`sonido /${arc.soundIpa}/`)

  const hasFraming = parts.length > 0 || learned > 0
  if (!hasFraming) return null

  return (
    <div className="mb-5 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-sunken px-4 py-3">
      {parts.length > 0 && (
        <p className="font-body-sm text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--text-primary)]">Hoy: </span>
          {parts.join(' · ')}
        </p>
      )}
      {learned > 0 && (
        <p className="font-caption mt-0.5 tabular-nums text-[var(--text-tertiary)]">
          {learned} / {CORE_1000_TARGET} palabras esenciales
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `pnpm type-check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/daily/SessionOpeningBanner.tsx
git commit -m "feat(daily): SessionOpeningBanner with topic + Core 1000 framing"
```

---

## Task 5: Build `SessionRecapCard`

**Files:**
- Create: `components/daily/SessionRecapCard.tsx`
- Test: `components/daily/__tests__/SessionRecapCard.test.tsx`

Replaces the current hardcoded `done` view. Shows the 4 sections. `dueTomorrow` is `number | null`
(null = unavailable/offline → omit that line). `streak` is `number | null` (passed down; omit if null).
Core 1000 count read from Dexie.

- [ ] **Step 1: Write the failing component test**

Create `components/daily/__tests__/SessionRecapCard.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SessionRecapCard from '@/components/daily/SessionRecapCard'
import type { SessionArc } from '@/lib/practice/types'

// Dexie useLiveQuery → return a fixed learned count.
vi.mock('dexie-react-hooks', () => ({ useLiveQuery: () => 748 }))
vi.mock('@/lib/db', () => ({ db: { srsData: {} } }))

const arc: SessionArc = {
  topicLabel: 'Presente simple',
  soundIpa: 'ɪ',
  sessionWords: ['ship', 'live', 'fish'],
}

describe('SessionRecapCard', () => {
  it('shows topic, words, and due-tomorrow when available', () => {
    render(<SessionRecapCard arc={arc} stepCount={5} dueTomorrow={3} streak={4} />)
    expect(screen.getByText(/Presente simple/)).toBeInTheDocument()
    expect(screen.getByText(/ship/)).toBeInTheDocument()
    expect(screen.getByText(/vuelven mañana/i)).toBeInTheDocument()
  })

  it('omits the due-tomorrow line when dueTomorrow is null (offline)', () => {
    render(<SessionRecapCard arc={arc} stepCount={5} dueTomorrow={null} streak={4} />)
    expect(screen.queryByText(/vuelven mañana/i)).not.toBeInTheDocument()
    // The rest still renders.
    expect(screen.getByText(/Presente simple/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test components/daily/__tests__/SessionRecapCard.test.tsx`
Expected: FAIL — module `SessionRecapCard` does not exist.

- [ ] **Step 3: Implement the component**

Create `components/daily/SessionRecapCard.tsx`:

```tsx
'use client'

// Planned structure:
// <SessionRecapCard>
//   heading + tema dominante
//   <RecapWords />        — palabras consolidadas hoy
//   <RecapDueTomorrow />  — qué vuelve mañana (omitido si null)
//   <RecapProgress />     — Core 1000 + racha
//   CTAs (home / free practice)
// </SessionRecapCard>

import Link from 'next/link'
import { ArrowRight, Flame } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import PageLayout from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import { db } from '@/lib/db'
import { CORE1000_PREFIX } from '@/lib/core-1000/types'
import type { SessionArc } from '@/lib/practice/types'

const CORE_1000_TARGET = 1000

interface Props {
  arc: SessionArc | undefined
  stepCount: number
  /** Items due within 24h, or null when unavailable (offline). */
  dueTomorrow: number | null
  /** Current streak in days, or null when unavailable. */
  streak: number | null
}

export default function SessionRecapCard({ arc, stepCount, dueTomorrow, streak }: Props) {
  const learned = useLiveQuery(
    () => db.srsData.filter((e) => e.wordId.startsWith(CORE1000_PREFIX) && !e.archived).count(),
    [],
    0,
  )

  const topicParts: string[] = []
  if (arc?.topicLabel) topicParts.push(arc.topicLabel)
  if (arc?.soundIpa) topicParts.push(`sonido /${arc.soundIpa}/`)
  const words = arc?.sessionWords ?? []

  return (
    <PageLayout className="mx-auto max-w-[640px]">
      <div className="mt-16 flex flex-col items-center gap-4 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--hue-icon-bg)] text-[var(--primary)]">
          <Flame size={30} />
        </div>
        <h1
          className="text-3xl font-medium text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-display), serif' }}
        >
          Daily complete!
        </h1>

        {topicParts.length > 0 && (
          <p className="max-w-sm text-[15px] text-[var(--text-secondary)]">
            Hoy reforzaste <span className="font-semibold text-[var(--text-primary)]">{topicParts.join(' · ')}</span>.
          </p>
        )}

        {words.length > 0 && (
          <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-border-subtle bg-surface-raised p-4 text-left">
            <p className="font-caption uppercase tracking-widest text-[var(--text-tertiary)]">
              Palabras de hoy
            </p>
            <p className="mt-1 font-body-sm text-[var(--text-secondary)]">{words.join(' · ')}</p>
          </div>
        )}

        {dueTomorrow != null && dueTomorrow > 0 && (
          <p className="font-body-sm text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)]">{dueTomorrow}</span>{' '}
            {dueTomorrow === 1 ? 'palabra vuelve mañana' : 'palabras vuelven mañana'} por repaso espaciado.
          </p>
        )}

        <p className="font-body-sm text-[var(--text-tertiary)]">
          {learned > 0 ? `${learned} / ${CORE_1000_TARGET} palabras esenciales` : `Completaste ${stepCount} pasos`}
          {streak != null && streak > 0 ? ` · ${streak} ${streak === 1 ? 'día' : 'días'} de racha` : ''}
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link href="/">
            <Button variant="primary" size="md">
              Go back home
            </Button>
          </Link>
          <Link href="/practice/sounds">
            <Button variant="secondary" size="md" icon={<ArrowRight size={15} />} iconPosition="right">
              Free practice
            </Button>
          </Link>
        </div>
      </div>
    </PageLayout>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test components/daily/__tests__/SessionRecapCard.test.tsx`
Expected: PASS (both cases).

- [ ] **Step 5: Run type-check**

Run: `pnpm type-check`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/daily/SessionRecapCard.tsx components/daily/__tests__/SessionRecapCard.test.tsx
git commit -m "feat(daily): SessionRecapCard with topic, words, due-tomorrow, progress"
```

---

## Task 6: Fetch streak server-side in `/daily` page

**Files:**
- Modify: `app/daily/page.tsx`

The recap needs the streak. `getDailyStreak` is server-only; the `/daily` page is already a
server component. Fetch it here and pass it down (mirrors how `conceptLesson` is passed).

- [ ] **Step 1: Add streak fetch and prop**

Edit `app/daily/page.tsx` to fetch the streak and pass it. Updated file:

```tsx
export const dynamic = 'force-dynamic'

import DailyChecklist, { type ConceptLesson } from '@/components/daily/DailyChecklist'
import { getTodaysMiniLesson } from '@/lib/content/lessons'
import { getDailyStreak } from '@/lib/daily/streak'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function DailyPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>
}) {
  const { step } = await searchParams

  let conceptLesson: ConceptLesson | null = null

  try {
    const lesson = await getTodaysMiniLesson()
    if (lesson) {
      conceptLesson = { slug: lesson.slug, title: lesson.title, subtitle: lesson.subtitle }
    }
  } catch {
    conceptLesson = null
  }

  let streak: number | null = null
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const result = await getDailyStreak(user.id)
      streak = result.currentStreak
    }
  } catch {
    streak = null
  }

  return <DailyChecklist conceptLesson={conceptLesson} initialStepId={step} streak={streak} />
}
```

> NOTE: `DailyStreakResult` has a `currentStreak` field (confirmed in
> `components/home/HomeStreakCard.tsx`: `streak?.currentStreak`). `createSupabaseServerClient`
> is the project's server client (used in `lib/daily/streak.ts`).

- [ ] **Step 2: Verify type-check (will fail until Task 7 adds the prop)**

Run: `pnpm type-check`
Expected: FAIL — `DailyChecklist` does not yet accept a `streak` prop. This is expected; Task 7
adds it. (If you prefer a green checkpoint, do Task 7 before re-running.)

- [ ] **Step 3: Commit**

```bash
git add app/daily/page.tsx
git commit -m "feat(daily): fetch streak server-side and pass to DailyChecklist"
```

---

## Task 7: Wire banner + recap into `DailyChecklist`

**Files:**
- Modify: `components/daily/DailyChecklist.tsx`

Add the `streak` prop, render `SessionOpeningBanner` in the checklist header, and replace the
hardcoded `view.mode === 'done'` block with `SessionRecapCard`. We also fetch `dueTomorrow`
when the session completes.

- [ ] **Step 1: Add imports**

At the top of `components/daily/DailyChecklist.tsx`, add:

```tsx
import SessionOpeningBanner from './SessionOpeningBanner'
import SessionRecapCard from './SessionRecapCard'
import { fetchDueTomorrowCount } from '@/lib/review/client-queries'
import { useAuth } from '@/components/auth/AuthProvider'
```

- [ ] **Step 2: Add the `streak` prop to the component signature**

Change the props interface and signature:

```tsx
interface DailyChecklistProps {
  conceptLesson: ConceptLesson | null
  initialStepId?: string
  streak?: number | null
}

export default function DailyChecklist({ conceptLesson, initialStepId, streak = null }: DailyChecklistProps) {
```

- [ ] **Step 3: Expose `plan` from the hook and add due-tomorrow state**

In the `useDailyPlan` destructure near the top of the component, add `plan`:

```tsx
  const { plan, status, steps, getStepStatus, completedCount, allDone, load, markDone, celebrate } = useDailyPlan({
    conceptLesson,
    autoLoad: true,
  })
  const { user } = useAuth()
  const [dueTomorrow, setDueTomorrow] = useState<number | null>(null)
```

> NOTE: `useDailyPlan` already returns `plan` (see `hooks/useDailyPlan.ts` return object). No
> hook change is needed.

- [ ] **Step 4: Fetch due-tomorrow when the session completes**

Replace the existing "Celebrate once" effect:

```tsx
  // Celebrate once when all steps are complete.
  useEffect(() => {
    if (allDone && view.mode === 'checklist') {
      setView({ mode: 'done' })
      celebrate()
    }
  }, [allDone, view.mode, celebrate])
```

with:

```tsx
  // Celebrate once when all steps are complete, and load the "due tomorrow" count.
  useEffect(() => {
    if (allDone && view.mode === 'checklist') {
      setView({ mode: 'done' })
      celebrate()
      if (user) {
        fetchDueTomorrowCount(user.id)
          .then(setDueTomorrow)
          .catch(() => setDueTomorrow(null))
      }
    }
  }, [allDone, view.mode, celebrate, user])
```

- [ ] **Step 5: Replace the `done` view block with `SessionRecapCard`**

Replace the entire `if (view.mode === 'done') { return ( ... ) }` block with:

```tsx
  // ── Render: pantalla de cierre ─────────────────────────────────────────────
  if (view.mode === 'done') {
    return (
      <SessionRecapCard
        arc={plan?.arc}
        stepCount={steps.length}
        dueTomorrow={dueTomorrow}
        streak={streak}
      />
    )
  }
```

- [ ] **Step 6: Render the opening banner in the checklist header**

In the final `return` (the checklist view), insert `<SessionOpeningBanner>` immediately after
the closing `</header>` and before `<DailyStepList ...>`:

```tsx
      </header>

      <SessionOpeningBanner arc={plan?.arc} />

      <DailyStepList
```

- [ ] **Step 7: Remove now-unused imports**

The old `done` block used `Flame` and `PageLayout` directly. Check whether they're still used
elsewhere in the file (the loading/error/checklist views use `PageLayout`; `Flame` was only in
the `done` block). Remove `Flame` from the `lucide-react` import if it is no longer referenced.
Keep `Sparkles`, `ArrowRight` if still used. Run type-check to catch unused-import lint.

- [ ] **Step 8: Run type-check and lint**

Run: `pnpm type-check && pnpm lint`
Expected: PASS. No unused imports.

- [ ] **Step 9: Run the full test suite**

Run: `pnpm test`
Expected: PASS (the existing `PracticeSession.test.tsx` and daily tests still green, plus the
two new test files).

- [ ] **Step 10: Commit**

```bash
git add components/daily/DailyChecklist.tsx
git commit -m "feat(daily): wire session opening banner and recap card into checklist"
```

---

## Task 8: Manual QA + final verification

**Files:** none (verification only)

- [ ] **Step 1: Type-check, lint, and full test run**

Run: `pnpm type-check && pnpm lint && pnpm test`
Expected: all PASS. Note the test count (should be ≥ 624 + new tests).

- [ ] **Step 2: Manual QA (dev server)**

Run: `pnpm dev`, sign in, open `/daily`. Verify:
- The opening banner appears above the checklist with the day's topic and/or Core 1000 count
  (banner is absent only when there is no topic, no sound, and 0 Core 1000 words).
- Complete all steps → the recap card shows: "Hoy reforzaste …", "Palabras de hoy …",
  Core 1000 + racha line, and (online) "N palabras vuelven mañana".
- Confetti still fires on completion.

- [ ] **Step 3: Offline check**

In DevTools, set network to Offline, complete a daily (or re-trigger the done view). Verify the
recap renders without the "vuelven mañana" line and does not crash.

- [ ] **Step 4: Update pedagogy backlog**

Mark plan 08 in `docs/pedagogy-plans/README.md` as implemented (add a row referencing this
plan), and note that the "hilo entre pasos" remains deferred as plan 09.

- [ ] **Step 5: Commit the doc update**

```bash
git add docs/pedagogy-plans/README.md
git commit -m "docs(pedagogy): mark session arc (plan 08) implemented; thread deferred to 09"
```

---

## Self-Review notes (resolved)

- **Spec coverage:** opening banner (Task 4, 7), closing recap with 4 sections (Task 5, 7),
  `DailyPlan.arc` (Task 1, 2), due-tomorrow query w/ graceful degradation (Task 3, 5, 7),
  streak sourcing (Task 6), offline behavior (Task 3, 5, Task 8 step 3). All covered.
- **Type consistency:** `SessionArc` fields (`topicLabel`, `soundIpa`, `sessionWords`) used
  identically in composer (Task 2), banner (Task 4), and recap (Task 5). `fetchDueTomorrowCount`
  signature `(userId: string) => Promise<number>` matches its call in Task 7. `streak: number | null`
  consistent across Tasks 5, 6, 7.
- **Verified against real code:** `dominantTopicLabel` signature, `CORE1000_PREFIX` + Dexie
  pattern, `next_review_at` column, `getSupabaseBrowserClient` chain, `currentStreak` field,
  `DailyChecklist` mount points, `useDailyPlan` already returns `plan`.
- **Note on Task 6/7 ordering:** Task 6 leaves type-check red until Task 7 adds the prop. Execute
  6 → 7 back-to-back, or swap order for a green checkpoint after each.
```
