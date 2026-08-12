# Learning Focus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a canonical learning focus (CEFR + optional theory/sound thread) with Home control, plus theory “ya sé” claims that enter deferred review without granting mastery.

**Architecture:** Pure focus helpers in `lib/learning-focus/`; persist focus on existing `UserLearningState` (reuses Dexie `learningState` + `user_learning_state` outbox — resolves spec open detail #2 without a new table). Theory claims extend `ConceptSignal` with optional `verificationDueAt` and merge via `persistAssessmentConceptProfile` / `persistLearningState`. Home renders `LearningFocusCard`; profile only adds gentle copy. No catalog lens, no content suggestions, no progress rewrite on level change.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Dexie, Supabase outbox (`persistLearningState`), Vitest + Testing Library, Tailwind v4 tokens, `pnpm`.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-12-learning-focus-design.md`
- Level change never auto-completes lessons / never wipes SRS / never bulk-claims topics
- Focus level edits on Home do **not** write `user_profiles.cefr_level` (v1)
- Self-report never sets `ConceptStatus` to `mastered`
- Claim storage stays on `learningState.theory.concepts` (no `topic_srs` bridge in v1)
- UI chrome copy in Spanish; no business logic in `/app` pages
- Components ≤250 lines; Tailwind tokens only; offline via Dexie + outbox
- Theory thread id = course `lessonSlug` (matches `ConceptSignal`); sound thread key = IPA / weak-sound key used on Home

---

## File Structure

| File | Responsibility |
| --- | --- |
| `lib/learning-focus/types.ts` | `FocusLevel`, `FocusThread`, `FocusSource`, `LearningFocus`, `EffectiveFocus` |
| `lib/learning-focus/effective-focus.ts` | Pure `getEffectiveFocus(record)` |
| `lib/learning-focus/derive-suggested-focus.ts` | Pure `deriveSuggestedFocus(inputs)` priority chain |
| `lib/learning-focus/claims.ts` | Pure `buildTheoryClaimSignal(...)` + `claimNeverMasters` helpers |
| `lib/learning-focus/queries.ts` | Read/write focus on learning state; list claims; pin/release/suggest refresh |
| `lib/learning-focus/cefr.ts` | Normalize profile `A1` ↔ focus `a1` |
| `lib/learning-focus/__tests__/*.test.ts` | Unit coverage for pure + claim rules |
| `lib/courses/concept-profile.ts` | Add optional `verificationDueAt?: string` |
| `lib/practice/daily-plan/study-deck.ts` | Skip `review` signals until `verificationDueAt` is due |
| `lib/ai-practice/learning-state.ts` | Optional `focus?: LearningFocus \| null` on state |
| `components/home/LearningFocusCard.tsx` | Home “Tu foco” control |
| `components/home/LearningFocusTopicsSheet.tsx` | Checkbox sheet for claims |
| `components/home/__tests__/LearningFocusCard.test.tsx` | Pin / release / claim UI |
| `components/home/HomeCommandGrid.tsx` | Mount focus card above plan |
| `components/profile/ProfilePreferencesPanel.tsx` | Gentle level helper copy |
| `components/ui/ProfileSettings.tsx` | Pass updated hint into preferences panel |

---

### Task 1: Pure focus types + effective + derive

**Files:**
- Create: `lib/learning-focus/types.ts`
- Create: `lib/learning-focus/cefr.ts`
- Create: `lib/learning-focus/effective-focus.ts`
- Create: `lib/learning-focus/derive-suggested-focus.ts`
- Create: `lib/learning-focus/__tests__/effective-focus.test.ts`
- Create: `lib/learning-focus/__tests__/derive-suggested-focus.test.ts`

**Interfaces:**
- Produces: `LearningFocus`, `EffectiveFocus`, `getEffectiveFocus`, `deriveSuggestedFocus`, `toFocusLevel`, `toProfileCefr`

- [ ] **Step 1: Write failing tests**

```ts
// lib/learning-focus/__tests__/effective-focus.test.ts
import { describe, it, expect } from 'vitest'
import { getEffectiveFocus } from '../effective-focus'
import type { LearningFocus } from '../types'

const base: LearningFocus = {
  level: 'b1',
  thread: { kind: 'theory', topicId: 'present-simple' },
  pinned: false,
  suggested: {
    level: 'a2',
    thread: { kind: 'sound', key: 'ɪ' },
    source: 'assessment',
  },
  source: 'manual',
  updatedAt: '2026-08-12T12:00:00.000Z',
}

describe('getEffectiveFocus', () => {
  it('uses suggested when unpinned', () => {
    expect(getEffectiveFocus(base)).toEqual({
      level: 'a2',
      thread: { kind: 'sound', key: 'ɪ' },
      pinned: false,
      source: 'assessment',
    })
  })

  it('uses override level/thread when pinned', () => {
    expect(getEffectiveFocus({ ...base, pinned: true })).toEqual({
      level: 'b1',
      thread: { kind: 'theory', topicId: 'present-simple' },
      pinned: true,
      source: 'manual',
    })
  })
})
```

```ts
// lib/learning-focus/__tests__/derive-suggested-focus.test.ts
import { describe, it, expect } from 'vitest'
import { deriveSuggestedFocus } from '../derive-suggested-focus'

describe('deriveSuggestedFocus', () => {
  it('prefers assessment/profile CEFR over route', () => {
    const result = deriveSuggestedFocus({
      profileLevel: 'B1',
      routeLevel: 'a1',
      recentTheoryLessonSlug: 'articles-a-an-the',
      weakSoundKey: 'θ',
    })
    expect(result).toEqual({
      level: 'b1',
      thread: null,
      source: 'profile',
    })
  })

  it('uses route level when profile missing, with theory thread from recent practice', () => {
    const result = deriveSuggestedFocus({
      profileLevel: null,
      routeLevel: 'a2',
      recentTheoryLessonSlug: 'some-any',
      weakSoundKey: null,
    })
    expect(result).toEqual({
      level: 'a2',
      thread: { kind: 'theory', topicId: 'some-any' },
      source: 'route',
    })
  })

  it('falls back to a1 with weak sound thread', () => {
    const result = deriveSuggestedFocus({
      profileLevel: null,
      routeLevel: null,
      recentTheoryLessonSlug: null,
      weakSoundKey: 'ɪ',
    })
    expect(result.level).toBe('a1')
    expect(result.thread).toEqual({ kind: 'sound', key: 'ɪ' })
    expect(result.source).toBe('sound_weak')
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
pnpm exec vitest run lib/learning-focus/__tests__/effective-focus.test.ts lib/learning-focus/__tests__/derive-suggested-focus.test.ts
```

Expected: FAIL (modules not found)

- [ ] **Step 3: Implement types + helpers**

```ts
// lib/learning-focus/types.ts
export type FocusLevel = 'a1' | 'a2' | 'b1' | 'b2' | 'c1'

export type FocusThread =
  | { kind: 'theory'; topicId: string }
  | { kind: 'sound'; key: string }

export type FocusSource =
  | 'assessment'
  | 'manual'
  | 'route'
  | 'recent_practice'
  | 'sound_weak'
  | 'profile'

export type LearningFocus = {
  level: FocusLevel
  thread: FocusThread | null
  pinned: boolean
  suggested: {
    level: FocusLevel
    thread: FocusThread | null
    source: FocusSource
  }
  source: FocusSource
  updatedAt: string
}

export type EffectiveFocus = {
  level: FocusLevel
  thread: FocusThread | null
  pinned: boolean
  source: FocusSource
}
```

```ts
// lib/learning-focus/cefr.ts
import type { FocusLevel } from './types'

const FOCUS_LEVELS = new Set<FocusLevel>(['a1', 'a2', 'b1', 'b2', 'c1'])

export function toFocusLevel(raw: string | null | undefined): FocusLevel | null {
  if (!raw) return null
  const normalized = raw.trim().toLowerCase() as FocusLevel
  return FOCUS_LEVELS.has(normalized) ? normalized : null
}

export function toProfileCefr(level: FocusLevel): string {
  return level.toUpperCase()
}
```

```ts
// lib/learning-focus/effective-focus.ts
import type { EffectiveFocus, LearningFocus } from './types'

export function getEffectiveFocus(focus: LearningFocus): EffectiveFocus {
  if (focus.pinned) {
    return {
      level: focus.level,
      thread: focus.thread,
      pinned: true,
      source: focus.source,
    }
  }
  return {
    level: focus.suggested.level,
    thread: focus.suggested.thread,
    pinned: false,
    source: focus.suggested.source,
  }
}
```

```ts
// lib/learning-focus/derive-suggested-focus.ts
import { toFocusLevel } from './cefr'
import type { FocusLevel, FocusSource, FocusThread } from './types'

export type DeriveSuggestedFocusInput = {
  profileLevel: string | null
  routeLevel: string | null
  recentTheoryLessonSlug: string | null
  weakSoundKey: string | null
}

export type SuggestedFocus = {
  level: FocusLevel
  thread: FocusThread | null
  source: FocusSource
}

export function deriveSuggestedFocus(input: DeriveSuggestedFocusInput): SuggestedFocus {
  const profile = toFocusLevel(input.profileLevel)
  if (profile) {
    return { level: profile, thread: null, source: 'profile' }
  }

  const route = toFocusLevel(input.routeLevel)
  if (route) {
    const thread: FocusThread | null = input.recentTheoryLessonSlug
      ? { kind: 'theory', topicId: input.recentTheoryLessonSlug }
      : null
    return {
      level: route,
      thread,
      source: thread ? 'recent_practice' : 'route',
    }
  }

  if (input.recentTheoryLessonSlug) {
    return {
      level: 'a1',
      thread: { kind: 'theory', topicId: input.recentTheoryLessonSlug },
      source: 'recent_practice',
    }
  }

  if (input.weakSoundKey) {
    return {
      level: 'a1',
      thread: { kind: 'sound', key: input.weakSoundKey },
      source: 'sound_weak',
    }
  }

  return { level: 'a1', thread: null, source: 'profile' }
}
```

Note on priority vs spec wording: profile/assessment CEFR wins for **level**; route fills when profile absent; recent theory / weak sound attach as **thread** when available on later steps. Keep tests as written above (locked contract).

- [ ] **Step 4: Re-run tests — expect PASS**

```bash
pnpm exec vitest run lib/learning-focus/__tests__/effective-focus.test.ts lib/learning-focus/__tests__/derive-suggested-focus.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/learning-focus
git commit -m "feat(learning-focus): add pure focus types and derive helpers"
```

---

### Task 2: Theory claims + deferred review in study-deck

**Files:**
- Modify: `lib/courses/concept-profile.ts`
- Create: `lib/learning-focus/claims.ts`
- Create: `lib/learning-focus/__tests__/claims.test.ts`
- Modify: `lib/practice/daily-plan/study-deck.ts`
- Modify: `lib/practice/daily-plan/__tests__/study-deck.test.ts`

**Interfaces:**
- Consumes: `ConceptSignal`, `AssessmentConcept`, `deriveConceptSignal`
- Produces: `CLAIM_VERIFICATION_MS`, `buildTheoryClaimSignal(concept, nowIso)`, study-deck respects `verificationDueAt`

- [ ] **Step 1: Write failing claim + study-deck tests**

```ts
// lib/learning-focus/__tests__/claims.test.ts
import { describe, it, expect } from 'vitest'
import { buildTheoryClaimSignal, CLAIM_VERIFICATION_MS } from '../claims'

describe('buildTheoryClaimSignal', () => {
  it('marks review with deferred due and never mastered', () => {
    const now = '2026-08-12T12:00:00.000Z'
    const signal = buildTheoryClaimSignal(
      {
        lessonSlug: 'articles-a-an-the',
        level: 'a1',
        title: 'Artículos',
      },
      now,
    )
    expect(signal.status).toBe('review')
    expect(signal.selfRating).toBe('familiar')
    expect(signal.correct).toBe(0)
    expect(signal.total).toBe(0)
    expect(signal.verificationDueAt).toBe(
      new Date(Date.parse(now) + CLAIM_VERIFICATION_MS).toISOString(),
    )
  })
})
```

Add to `study-deck.test.ts`:

```ts
it('ignores review signals until verificationDueAt', () => {
  const future = new Date(Date.now() + 86_400_000).toISOString()
  const concepts = [
    concept('a1', 'review'), // helper already in file — extend to accept verificationDueAt
  ]
  // Prefer extending the local `concept()` helper:
  // concept(level, status, { lessonSlug, verificationDueAt })
})
```

Concrete addition (adjust helper in that file):

```ts
it('does not prioritize review claims that are not due yet', () => {
  const future = new Date(Date.now() + 86_400_000).toISOString()
  const concepts: ConceptSignal[] = [{
    lessonSlug: 'articles-a-an-the',
    level: 'a1',
    title: 'Articles',
    selfRating: 'familiar',
    status: 'review',
    correct: 0,
    total: 0,
    assessedAt: new Date().toISOString(),
    verificationDueAt: future,
  }]
  const completed = new Set<string>()
  const target = selectStudyDeckTarget(completed, 'a1', concepts)
  // Must not pick the not-due claim via signaledTarget; falls through to route current
  expect(target?.lesson.slug).not.toBe('articles-a-an-the')
})
```

(If `articles-a-an-the` is also the route “current”, pick a lesson slug that exists in curriculum but is not first-current — or assert `signaledTarget` path by ensuring completed set leaves another current. Prefer asserting via exporting a test of due filter: only include a not-due review signal and a due review signal for a later lesson, and expect the due one.)

Simpler locked assertion:

```ts
it('prioritizes due review claims over learn', () => {
  const past = new Date(Date.now() - 1000).toISOString()
  const concepts: ConceptSignal[] = [
    {
      lessonSlug: 'frequency-adverbs', // must exist in a1 curriculum
      level: 'a1',
      title: 'Adverbs',
      selfRating: 'familiar',
      status: 'review',
      correct: 0,
      total: 0,
      assessedAt: past,
      verificationDueAt: past,
    },
  ]
  const target = selectStudyDeckTarget(new Set(), 'a1', concepts)
  expect(target?.lesson.slug).toBe('frequency-adverbs')
})
```

Verify `frequency-adverbs` (or actual slug) exists in `COURSE_PATH_CURRICULUM` before locking the string — use a real `lesson.slug` from A1.

- [ ] **Step 2: Run tests — expect FAIL**

```bash
pnpm exec vitest run lib/learning-focus/__tests__/claims.test.ts lib/practice/daily-plan/__tests__/study-deck.test.ts
```

- [ ] **Step 3: Implement**

In `concept-profile.ts`, add to `ConceptSignal`:

```ts
  /** When set, Daily study_deck ignores this review signal until due. */
  verificationDueAt?: string
```

```ts
// lib/learning-focus/claims.ts
import type { AssessmentConcept, ConceptSignal } from '@/lib/courses/concept-profile'

/** 1 day — aligned with lexicon “known” verification. */
export const CLAIM_VERIFICATION_MS = 24 * 60 * 60 * 1000

export function buildTheoryClaimSignal(
  concept: Pick<AssessmentConcept, 'lessonSlug' | 'level' | 'title'>,
  nowIso: string,
): ConceptSignal {
  const due = new Date(Date.parse(nowIso) + CLAIM_VERIFICATION_MS).toISOString()
  return {
    lessonSlug: concept.lessonSlug,
    level: concept.level,
    title: concept.title,
    selfRating: 'familiar',
    status: 'review',
    correct: 0,
    total: 0,
    assessedAt: nowIso,
    verificationDueAt: due,
  }
}

export function isConceptSignalDue(
  signal: ConceptSignal,
  nowMs: number = Date.now(),
): boolean {
  if (signal.status !== 'review') return true
  if (!signal.verificationDueAt) return true
  return Date.parse(signal.verificationDueAt) <= nowMs
}
```

In `study-deck.ts` `signaledTarget`, change the find predicate to:

```ts
.find((candidate) => {
  const signal = signalBySlug.get(candidate.slug ?? '')
  if (!signal || signal.status !== status) return false
  if (status === 'review' && signal.verificationDueAt) {
    if (Date.parse(signal.verificationDueAt) > Date.now()) return false
  }
  return !completedIds.has(lessonProgressKey(level.id, candidate.id))
})
```

For `mastered` skip loop: unchanged (claims never set mastered).

- [ ] **Step 4: Re-run tests — expect PASS**

```bash
pnpm exec vitest run lib/learning-focus/__tests__/claims.test.ts lib/practice/daily-plan/__tests__/study-deck.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/courses/concept-profile.ts lib/learning-focus/claims.ts lib/learning-focus/__tests__/claims.test.ts lib/practice/daily-plan/study-deck.ts lib/practice/daily-plan/__tests__/study-deck.test.ts
git commit -m "feat(learning-focus): deferred theory claims for study_deck review"
```

---

### Task 3: Persist focus on UserLearningState + claim write API

**Files:**
- Modify: `lib/ai-practice/learning-state.ts`
- Create: `lib/learning-focus/queries.ts`
- Create: `lib/learning-focus/__tests__/queries.test.ts` (mock Dexie / persistLearningState)

**Interfaces:**
- Consumes: `persistLearningState`, `getUserLearningState` / `db.learningState`, `mergeConceptSignals`, `buildTheoryClaimSignal`, `deriveSuggestedFocus`, `getEffectiveFocus`
- Produces:
  - `async function loadLearningFocus(userId: string): Promise<LearningFocus | null>`
  - `async function saveLearningFocus(userId: string, focus: LearningFocus): Promise<void>`
  - `async function refreshSuggestedFocus(userId: string, input: DeriveSuggestedFocusInput): Promise<LearningFocus>`
  - `async function pinFocus(userId: string, override: { level: FocusLevel; thread: FocusThread | null }): Promise<LearningFocus>`
  - `async function releaseFocusPin(userId: string, input: DeriveSuggestedFocusInput): Promise<LearningFocus>`
  - `async function claimTheoryTopics(userId: string, concepts: AssessmentConcept[]): Promise<void>`
  - `async function listClaimedTheoryTopics(userId: string): Promise<ConceptSignal[]>`
  - `async function getEffectiveFocusForUser(userId: string): Promise<EffectiveFocus | null>`

- [ ] **Step 1: Write failing queries tests**

```ts
// lib/learning-focus/__tests__/queries.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const persistMock = vi.fn()
const getStateMock = vi.fn()

vi.mock('@/lib/ai-practice/queries', () => ({
  persistLearningState: (...args: unknown[]) => persistMock(...args),
}))

vi.mock('@/lib/ai-practice/load-state', () => ({
  getUserLearningState: (...args: unknown[]) => getStateMock(...args),
}))

vi.mock('@/lib/db', () => ({
  db: { learningState: { get: vi.fn() } },
}))

import { db } from '@/lib/db'
import { pinFocus, releaseFocusPin, claimTheoryTopics } from '../queries'

describe('learning-focus queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getStateMock.mockResolvedValue({
      userId: 'u1',
      updatedAt: '2026-08-12T00:00:00.000Z',
      deviceId: 'd1',
      level: { cefrEstimate: 'A1', confidence: 0.5 },
      vocabulary: { knownCount: 0, strugglingWords: [], savedWords: [] },
      grammar: { weakTopics: [] },
      theory: { concepts: [] },
      pronunciation: { averageAccuracy: 0, strugglingSounds: [] },
      lastSessions: [],
      focus: null,
    })
    ;(db.learningState.get as ReturnType<typeof vi.fn>).mockResolvedValue(null)
  })

  it('pinFocus sets pinned override without wiping suggested', async () => {
    const focus = await pinFocus('u1', {
      level: 'b1',
      thread: { kind: 'theory', topicId: 'articles-a-an-the' },
    })
    expect(focus.pinned).toBe(true)
    expect(focus.level).toBe('b1')
    expect(persistMock).toHaveBeenCalled()
    const saved = persistMock.mock.calls[0][1]
    expect(saved.focus.pinned).toBe(true)
    expect(saved.focus.source).toBe('manual')
  })

  it('claimTheoryTopics writes review signals that are not mastered', async () => {
    await claimTheoryTopics('u1', [
      { lessonSlug: 'articles-a-an-the', level: 'a1', title: 'Artículos' },
    ])
    const saved = persistMock.mock.calls.at(-1)?.[1]
    const signal = saved.theory.concepts.find(
      (c: { lessonSlug: string }) => c.lessonSlug === 'articles-a-an-the',
    )
    expect(signal.status).toBe('review')
    expect(signal.verificationDueAt).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm exec vitest run lib/learning-focus/__tests__/queries.test.ts
```

- [ ] **Step 3: Implement**

Add to `UserLearningState`:

```ts
  focus?: import('@/lib/learning-focus/types').LearningFocus | null
```

(Prefer a direct type import at top of `learning-state.ts` to avoid inline import.)

Implement `queries.ts`:

```ts
'use client'

import { getUserLearningState } from '@/lib/ai-practice/load-state'
import { persistLearningState } from '@/lib/ai-practice/queries'
import type { UserLearningState } from '@/lib/ai-practice/learning-state'
import { mergeConceptSignals } from '@/lib/courses/assessment-profile'
import type { AssessmentConcept, ConceptSignal } from '@/lib/courses/concept-profile'
import { db } from '@/lib/db'
import { buildTheoryClaimSignal } from './claims'
import { deriveSuggestedFocus, type DeriveSuggestedFocusInput } from './derive-suggested-focus'
import { getEffectiveFocus } from './effective-focus'
import type { FocusLevel, FocusThread, LearningFocus } from './types'

async function readState(userId: string): Promise<UserLearningState> {
  const local = await db.learningState.get(userId)
  return local?.state ?? (await getUserLearningState(userId))
}

function ensureFocus(state: UserLearningState, nowIso: string): LearningFocus {
  if (state.focus) return state.focus
  const suggested = deriveSuggestedFocus({
    profileLevel: state.level.cefrEstimate,
    routeLevel: null,
    recentTheoryLessonSlug: null,
    weakSoundKey: null,
  })
  return {
    level: suggested.level,
    thread: null,
    pinned: false,
    suggested,
    source: suggested.source,
    updatedAt: nowIso,
  }
}

export async function loadLearningFocus(userId: string): Promise<LearningFocus | null> {
  const state = await readState(userId)
  return state.focus ?? null
}

export async function saveLearningFocus(userId: string, focus: LearningFocus): Promise<void> {
  const state = await readState(userId)
  await persistLearningState(userId, {
    ...state,
    userId,
    focus,
    updatedAt: focus.updatedAt,
  })
}

export async function pinFocus(
  userId: string,
  override: { level: FocusLevel; thread: FocusThread | null },
): Promise<LearningFocus> {
  const nowIso = new Date().toISOString()
  const state = await readState(userId)
  const current = ensureFocus(state, nowIso)
  const next: LearningFocus = {
    ...current,
    level: override.level,
    thread: override.thread,
    pinned: true,
    source: 'manual',
    updatedAt: nowIso,
  }
  await persistLearningState(userId, { ...state, userId, focus: next, updatedAt: nowIso })
  return next
}

export async function releaseFocusPin(
  userId: string,
  input: DeriveSuggestedFocusInput,
): Promise<LearningFocus> {
  const nowIso = new Date().toISOString()
  const state = await readState(userId)
  const current = ensureFocus(state, nowIso)
  const suggested = deriveSuggestedFocus(input)
  const next: LearningFocus = {
    ...current,
    pinned: false,
    suggested,
    source: suggested.source,
    updatedAt: nowIso,
  }
  await persistLearningState(userId, { ...state, userId, focus: next, updatedAt: nowIso })
  return next
}

export async function refreshSuggestedFocus(
  userId: string,
  input: DeriveSuggestedFocusInput,
): Promise<LearningFocus> {
  const nowIso = new Date().toISOString()
  const state = await readState(userId)
  const current = ensureFocus(state, nowIso)
  const suggested = deriveSuggestedFocus(input)
  const next: LearningFocus = {
    ...current,
    suggested,
    source: current.pinned ? current.source : suggested.source,
    updatedAt: nowIso,
  }
  await persistLearningState(userId, { ...state, userId, focus: next, updatedAt: nowIso })
  return next
}

export async function claimTheoryTopics(
  userId: string,
  concepts: AssessmentConcept[],
): Promise<void> {
  const nowIso = new Date().toISOString()
  const state = await readState(userId)
  const incoming = concepts.map((concept) => buildTheoryClaimSignal(concept, nowIso))
  const next: UserLearningState = {
    ...state,
    userId,
    updatedAt: nowIso,
    theory: {
      concepts: mergeConceptSignals(state.theory?.concepts ?? [], incoming),
    },
  }
  await persistLearningState(userId, next)
}

export async function listClaimedTheoryTopics(userId: string): Promise<ConceptSignal[]> {
  const state = await readState(userId)
  return (state.theory?.concepts ?? []).filter(
    (c) => c.selfRating === 'familiar' || c.selfRating === 'confident' || c.status === 'review',
  )
}

export async function getEffectiveFocusForUser(userId: string) {
  const focus = await loadLearningFocus(userId)
  if (!focus) return null
  return getEffectiveFocus(focus)
}
```

Preserve evidence mastery on claim: in `claimTheoryTopics`, before merge, skip incoming for any existing signal with `status === 'mastered'` (do not downgrade).

```ts
  const existing = state.theory?.concepts ?? []
  const mastered = new Set(existing.filter((c) => c.status === 'mastered').map((c) => c.lessonSlug))
  const incoming = concepts
    .filter((c) => !mastered.has(c.lessonSlug))
    .map((concept) => buildTheoryClaimSignal(concept, nowIso))
```

- [ ] **Step 4: Re-run — expect PASS**

```bash
pnpm exec vitest run lib/learning-focus/__tests__/queries.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/ai-practice/learning-state.ts lib/learning-focus/queries.ts lib/learning-focus/__tests__/queries.test.ts
git commit -m "feat(learning-focus): persist focus and theory claims on learning state"
```

---

### Task 4: Home UI — LearningFocusCard + topics sheet

**Files:**
- Create: `components/home/LearningFocusTopicsSheet.tsx`
- Create: `components/home/LearningFocusCard.tsx`
- Create: `components/home/__tests__/LearningFocusCard.test.tsx`
- Modify: `components/home/HomeCommandGrid.tsx`

**Interfaces:**
- Consumes: `pinFocus`, `releaseFocusPin`, `refreshSuggestedFocus`, `claimTheoryTopics`, `getEffectiveFocus`, curriculum lessons for level
- Produces: Home card with pin/release, level select, topics sheet

- [ ] **Step 1: Write failing component test**

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LearningFocusCard from '../LearningFocusCard'

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}))

const pinFocus = vi.fn()
const releaseFocusPin = vi.fn()
const refreshSuggestedFocus = vi.fn()

vi.mock('@/lib/learning-focus/queries', () => ({
  loadLearningFocus: vi.fn(),
  pinFocus: (...a: unknown[]) => pinFocus(...a),
  releaseFocusPin: (...a: unknown[]) => releaseFocusPin(...a),
  refreshSuggestedFocus: (...a: unknown[]) => refreshSuggestedFocus(...a),
  claimTheoryTopics: vi.fn(),
  listClaimedTheoryTopics: vi.fn().mockResolvedValue([]),
}))

import { loadLearningFocus } from '@/lib/learning-focus/queries'

describe('LearningFocusCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(loadLearningFocus as ReturnType<typeof vi.fn>).mockResolvedValue({
      level: 'a1',
      thread: null,
      pinned: false,
      suggested: { level: 'a1', thread: null, source: 'profile' },
      source: 'profile',
      updatedAt: '2026-08-12T00:00:00.000Z',
    })
    refreshSuggestedFocus.mockResolvedValue({
      level: 'a1',
      thread: null,
      pinned: false,
      suggested: { level: 'a1', thread: null, source: 'profile' },
      source: 'profile',
      updatedAt: '2026-08-12T00:00:00.000Z',
    })
  })

  it('shows Sugerido and can pin a focus level', async () => {
    pinFocus.mockResolvedValue({
      level: 'a2',
      thread: null,
      pinned: true,
      suggested: { level: 'a1', thread: null, source: 'profile' },
      source: 'manual',
      updatedAt: '2026-08-12T01:00:00.000Z',
    })
    render(
      <LearningFocusCard
        profileLevel="A1"
        routeLevel={null}
        recentTheoryLessonSlug={null}
        weakSoundKey={null}
      />,
    )
    expect(await screen.findByText(/Sugerido/i)).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: /A2/i }))
    await waitFor(() => expect(pinFocus).toHaveBeenCalled())
    expect(await screen.findByText(/Fijado/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
pnpm exec vitest run components/home/__tests__/LearningFocusCard.test.tsx
```

- [ ] **Step 3: Implement UI**

`LearningFocusTopicsSheet.tsx` — props ≤8:

```tsx
// Planned structure:
// <LearningFocusTopicsSheet>
//   <header />
//   <topic checkbox list />
//   <footer actions />
// </LearningFocusTopicsSheet>

type Props = {
  open: boolean
  level: FocusLevel
  claimedSlugs: Set<string>
  onClose: () => void
  onClaim: (concepts: AssessmentConcept[]) => Promise<void>
}
```

List lessons from `COURSE_PATH_CURRICULUM.levels.find(l => l.id === level)` → units → lessons with `slug`. Checkbox toggles local selection; primary button “Guardar” calls `onClaim` with selected concepts `{ lessonSlug, level, title }`. Helper copy: “Lo veremos en el repaso; dominar se gana practicando.”

`LearningFocusCard.tsx` — load focus on mount; call `refreshSuggestedFocus` with props; render effective label; level chips A1–C1 call `pinFocus`; “Soltar” calls `releaseFocusPin`; “Temas que ya sé” opens sheet. Optional quiet line when `toFocusLevel(profileLevel) !== effective.level` linking to `/settings` or profile route used in the app (use existing profile href from sidebar — typically `/profile` or settings path already linked in `ProfileSettings`).

Wire into `HomeCommandGrid` **above** `HomeDailyCard` in the main column:

```tsx
<LearningFocusCard
  profileLevel={/* from preferences or placement — pass from page if needed */}
  routeLevel={null}
  recentTheoryLessonSlug={null}
  weakSoundKey={weakestPhoneme?.ipa ?? null}
/>
```

If profile CEFR is not already on `HomeCommandGrid`, extend props from the home page/server parent that already loads preferences — search `app/(authenticated)/page.tsx` / home runtime and pass `cefr_level` down. Do not fetch Supabase from the card; use props + Dexie queries only.

- [ ] **Step 4: Re-run — expect PASS**

```bash
pnpm exec vitest run components/home/__tests__/LearningFocusCard.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add components/home/LearningFocusCard.tsx components/home/LearningFocusTopicsSheet.tsx components/home/__tests__/LearningFocusCard.test.tsx components/home/HomeCommandGrid.tsx
# plus any home page prop wiring files
git commit -m "feat(home): add learning focus card and topic claims sheet"
```

---

### Task 5: Profile gentle copy (level ≠ progress)

**Files:**
- Modify: `components/profile/ProfilePreferencesPanel.tsx`
- Modify: `components/ui/ProfileSettings.tsx`
- Modify or create: `components/profile/__tests__/ProfilePreferencesPanel.test.tsx` (or extend existing profile test)

**Interfaces:**
- Consumes: existing `hint` prop
- Produces: Spanish helper that progress is preserved

- [ ] **Step 1: Write / extend failing test**

```tsx
it('explains that changing level keeps progress', () => {
  render(
    <ProfilePreferencesPanel
      level="A1"
      onLevelChange={vi.fn()}
      hint="Esto ajusta recomendaciones. Tu progreso se conserva; puedes seguir explorando cualquier contenido."
    />,
  )
  expect(screen.getByText(/Tu progreso se conserva/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run — expect FAIL** (if default hint still old)

- [ ] **Step 3: Update default `hint` in `ProfilePreferencesPanel` and/or the string passed from `ProfileSettings`:**

```ts
hint = "Esto ajusta recomendaciones. Tu progreso se conserva; puedes seguir explorando cualquier contenido."
```

Do **not** add a blocking confirm dialog. Do **not** mark content complete.

- [ ] **Step 4: Re-run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add components/profile/ProfilePreferencesPanel.tsx components/ui/ProfileSettings.tsx components/profile/__tests__/ProfilePreferencesPanel.test.tsx
git commit -m "fix(profile): clarify level change preserves progress"
```

---

### Task 6: Optional Daily bias — effective focus level for study_deck

**Files:**
- Modify: the client that builds the daily plan and calls `buildStudyDeckStep` / `selectStudyDeckTarget` (find via grep `buildStudyDeckStep` — typically under `lib/practice/daily-plan/` composer or `hooks/useDailyPlan.ts`)
- Test: existing daily-plan tests + one new case

**Interfaces:**
- Consumes: `getEffectiveFocusForUser(userId)`
- Produces: `activeLevel` for study_deck = effective focus level when available; else existing behavior

- [ ] **Step 1: Write failing test** in the composer/hook test file proving study_deck uses effective focus level `b1` when focus pinned to b1 even if profile is A2.

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Minimal hook** — when building the plan, if userId present, `const effective = await getEffectiveFocusForUser(userId)`; pass `effective?.level ?? existingActiveLevel` into `buildStudyDeckStep`. Do **not** rewrite the rest of the composer.

- [ ] **Step 4: Re-run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(daily): bias study_deck level from effective learning focus"
```

---

### Task 7: Manual verification checklist (no new code)

- [ ] **Step 1: Typecheck**

```bash
pnpm type-check
```

Expected: exit 0

- [ ] **Step 2: Unit suite for touched areas**

```bash
pnpm exec vitest run lib/learning-focus components/home/__tests__/LearningFocusCard.test.tsx lib/practice/daily-plan/__tests__/study-deck.test.ts
```

Expected: all PASS

- [ ] **Step 3: Manual smoke on `pnpm dev`**
  1. Home shows “Tu foco” with Sugerido
  2. Pin A2 → badge Fijado; profile CEFR unchanged
  3. Soltar → returns to suggested
  4. Temas que ya sé → claim → signal stored; study_deck does not jump to that topic until due
  5. Profile level change shows gentle copy; no completions cascade

- [ ] **Step 4: Commit only if smoke fixes were needed; otherwise done**

---

## Spec coverage self-check

| Spec requirement | Task |
| --- | --- |
| Canonical focus level + thread | 1, 3 |
| Hybrid pin / suggest | 1, 3, 4 |
| Home-only control UI | 4 |
| Theory + sound threads | 1, 4 |
| Claims → deferred review, never mastered | 2, 3 |
| Persist offline + sync | 3 (via `persistLearningState`) |
| Profile vs focus vs progress | 5 (+ constraints) |
| Gentle profile copy | 5 |
| Read API for later B/C | 3 (`getEffectiveFocusForUser`, `listClaimedTheoryTopics`) |
| Optional Daily bias | 6 |
| No catalog lens / suggestions / Essential Words thread | Non-goals — no tasks |
| No dedicated Supabase table | Resolved via learning state JSON (open detail #2) |

## Placeholder / consistency notes

- Theory `topicId` = course `lessonSlug` (not `theory:{deckSlug}`) so claims align with `ConceptSignal` / `study_deck`.
- `CLAIM_VERIFICATION_MS = 1 day`.
- Derive priority locked by Task 1 tests (profile level first).
