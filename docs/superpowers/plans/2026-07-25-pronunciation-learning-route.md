# Pronunciation Learning Route Implementation Plan (Plan 068 — thin vertical)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Spec:** `docs/superpowers/specs/2026-07-25-plan-068-pronunciation-learning-route-design.md`

**Goal:** Ship `/courses/pronunciation` as a five-stage transfer path orchestrating registry 066 + completion 059 + spoken evidence 063 + diagnostic 067 priorities, with honest unit states and one clear next action — without cloning Course Path CSS or inventing a new progress store.

**Architecture:** Pure modules under `lib/pronunciation/path/` derive curriculum grouping, unit learning states, and recommendations. A thin client page composes tokenized UI components, reading Dexie completions + latest local diagnostic via adapters. Outcome phrasing is gated by `pronunciationPathCopy`. Diagnostic results and the Courses aside deep-link into `?target=`. Daily / Sound Lab next / content audit remain out of scope.

**Tech Stack:** TypeScript, React 19, Next.js App Router, Dexie (`completedLessons`, `pronunciationAssessments`), Vitest + Testing Library, Tailwind v4 semantic tokens, `PageLayout` / `PageHeader`.

## Global Constraints

- No Supabase calls from UI; use `lib/*/queries.ts` or Dexie helpers already in `lib/pronunciation/assessment/persistence.ts` / `lib/db`.
- No `any` without a justifying comment.
- Components ≤250 lines; list planned sub-components as a comment block before implementing.
- Tailwind tokens only — no `course-path.css` clone, no hardcoded colors/radii.
- Spanish UI chrome; IPA via `font-ipa`; reuse `getLearnerTargetCopy` from assessment.
- Never invent target ids; always `contrastTargetId` / `phonemeTargetId` / `targetId` from registry.
- 071 NO-SHIP: no acoustic vowel/prosody scores; no “native accent” / phoneme-accuracy claims.
- Visit ≠ mastery; unscored SpokenAttempt ≠ progress.
- Sidebar: do **not** add a new primary nav item.

---

## File Structure

| Path | Responsibility |
|---|---|
| `lib/pronunciation/path/types.ts` | Shared path types (`PathStageId`, `PathUnit`, `UnitLearningState`, recommendation result). |
| `lib/pronunciation/path/curriculum.ts` | Deterministic 5-stage grouping from registry + content-map + practice href. |
| `lib/pronunciation/path/unit-state.ts` | Pure `deriveUnitLearningState` + `needsEvidenceBadge`. |
| `lib/pronunciation/path/recommend.ts` | Pure `recommendNextPathAction`. |
| `lib/pronunciation/path/copy-flag.ts` | `isPronunciationPathCopyEnabled()`. |
| `lib/pronunciation/path/load-evidence.ts` | Client adapters: completions → content keys; spoken attempts (may be `[]`); latest diagnostic. |
| `lib/pronunciation/path/__tests__/*.test.ts` | Pure unit tests. |
| `components/courses/pronunciation-path/PronunciationPathPage.tsx` | Client orchestrator. |
| `components/courses/pronunciation-path/PronunciationPathNextAction.tsx` | Single primary CTA + reason. |
| `components/courses/pronunciation-path/PronunciationPathStageNav.tsx` | Five-stage nav. |
| `components/courses/pronunciation-path/PronunciationPathActiveUnit.tsx` | Active unit detail. |
| `components/courses/pronunciation-path/PronunciationPathExplore.tsx` | Progressive disclosure of other units. |
| `components/courses/pronunciation-path/__tests__/*.test.tsx` | Component tests. |
| `app/(authenticated)/courses/pronunciation/page.tsx` | Server page → client shell + searchParams. |
| `components/pronunciation-assessment/PronunciationResults.tsx` | CTA → path with `?target=`. |
| `components/courses/CoursePathPage.tsx` | Aside link → `/courses/pronunciation`. |
| `docs/architecture/pronunciation-learning-route.md` | Short architecture note. |
| `plans/README.md` | Row 068 status. |

---

### Task 1: Path types + five-stage curriculum

**Files:**
- Create: `lib/pronunciation/path/types.ts`
- Create: `lib/pronunciation/path/curriculum.ts`
- Test: `lib/pronunciation/path/__tests__/curriculum.test.ts`

**Interfaces:**
- Produces: `PathStageId`, `PATH_STAGE_ORDER`, `buildPronunciationPathCurriculum()`, `getPathUnit(targetId)`, `listPathUnitsInOrder()`

- [ ] **Step 1: Write the failing test**

```ts
// lib/pronunciation/path/__tests__/curriculum.test.ts
import { describe, expect, it } from 'vitest'
import { listTargets, resolvePrerequisiteChain } from '@/lib/pronunciation/targets/registry'
import {
  PATH_STAGE_ORDER,
  buildPronunciationPathCurriculum,
  listPathUnitsInOrder,
} from '../curriculum'

describe('buildPronunciationPathCurriculum', () => {
  it('exposes exactly five stages in stable order', () => {
    const curriculum = buildPronunciationPathCurriculum()
    expect(curriculum.stages.map((s) => s.id)).toEqual([...PATH_STAGE_ORDER])
    expect(curriculum.stages).toHaveLength(5)
  })

  it('includes every registry target exactly once', () => {
    const units = listPathUnitsInOrder()
    const ids = units.map((u) => u.targetId)
    expect(new Set(ids).size).toBe(ids.length)
    for (const target of listTargets()) {
      expect(ids).toContain(target.id)
    }
  })

  it('every unit resolves in the registry and has acyclic prerequisites', () => {
    for (const unit of listPathUnitsInOrder()) {
      expect(() => resolvePrerequisiteChain(unit.targetId)).not.toThrow()
      const chain = resolvePrerequisiteChain(unit.targetId)
      expect(chain.includes(unit.targetId)).toBe(false)
    }
  })

  it('attaches content-map refs when authored', () => {
    const schwa = listPathUnitsInOrder().find((u) => u.targetId.includes('./ə/'))
    expect(schwa?.contentRefs.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/pronunciation/path/__tests__/curriculum.test.ts`  
Expected: FAIL (module not found)

- [ ] **Step 3: Implement types + curriculum**

```ts
// lib/pronunciation/path/types.ts
import type { ContentMapEntry } from '@/lib/pronunciation/targets/content-map'
import type { PronunciationTargetId } from '@/lib/pronunciation/targets/types'

export const PATH_STAGE_ORDER = [
  'sounds',
  'word-stress',
  'sentence-prosody',
  'connected',
  'intonation-transfer',
] as const

export type PathStageId = (typeof PATH_STAGE_ORDER)[number]

export type UnitLearningState =
  | 'not_started'
  | 'learning'
  | 'ready_for_transfer'
  | 'retained'

export interface PathUnit {
  targetId: PronunciationTargetId
  stageId: PathStageId
  contentRefs: readonly ContentMapEntry[]
  /** Direct practice route when one exists; otherwise null. */
  practiceHref: string | null
}

export interface PathStage {
  id: PathStageId
  titleEs: string
  units: readonly PathUnit[]
}

export interface PronunciationPathCurriculum {
  stages: readonly PathStage[]
}

export type RecommendReasonKind =
  | 'diagnostic_priority'
  | 'canonical_next'
  | 'all_retained'

export interface PathRecommendation {
  targetId: PronunciationTargetId | null
  stageId: PathStageId | null
  reasonKind: RecommendReasonKind
  /** Learner-facing Spanish; may be outcome-flavored — gate behind copy flag in UI. */
  reasonEs: string
}
```

```ts
// lib/pronunciation/path/curriculum.ts
import { getContentForTarget } from '@/lib/pronunciation/targets/content-map'
import {
  contrastTargetId,
  getTarget,
  phonemeTargetId,
  targetId,
} from '@/lib/pronunciation/targets/registry'
import { targetIdToPracticeRoute } from '@/lib/pronunciation/target-route'
import type { PronunciationTargetId } from '@/lib/pronunciation/targets/types'
import {
  PATH_STAGE_ORDER,
  type PathStage,
  type PathStageId,
  type PathUnit,
  type PronunciationPathCurriculum,
} from './types'

const STAGE_TITLES: Record<PathStageId, string> = {
  sounds: 'Sonidos y contrastes',
  'word-stress': 'Sílabas y word stress',
  'sentence-prosody': 'Sentence stress, ritmo y weak forms',
  connected: 'Linking, reductions, elision y assimilation',
  'intonation-transfer': 'Intonation y transferencia',
}

/** Canonical target order per stage — single source for grouping. */
const STAGE_TARGET_IDS: Record<PathStageId, readonly PronunciationTargetId[]> = {
  sounds: [
    contrastTargetId('/θ/', '/ð/'),
    contrastTargetId('/iː/', '/ɪ/'),
    phonemeTargetId('/ə/'),
  ],
  'word-stress': [targetId('prosody.word-stress')],
  'sentence-prosody': [targetId('prosody.sentence-stress'), targetId('prosody.rhythm')],
  connected: [
    targetId('connected.reduction.gonna'),
    targetId('connected.linking'),
    targetId('connected.elision'),
    targetId('connected.assimilation'),
  ],
  'intonation-transfer': [targetId('prosody.intonation.rising-question')],
}

function buildUnit(targetIdValue: PronunciationTargetId, stageId: PathStageId): PathUnit {
  const lookup = getTarget(targetIdValue)
  if (!lookup.ok) {
    throw new Error(`path curriculum: unknown target "${targetIdValue}"`)
  }
  return {
    targetId: targetIdValue,
    stageId,
    contentRefs: getContentForTarget(targetIdValue),
    practiceHref: targetIdToPracticeRoute(targetIdValue),
  }
}

export function buildPronunciationPathCurriculum(): PronunciationPathCurriculum {
  const stages: PathStage[] = PATH_STAGE_ORDER.map((id) => ({
    id,
    titleEs: STAGE_TITLES[id],
    units: STAGE_TARGET_IDS[id].map((tid) => buildUnit(tid, id)),
  }))
  return { stages }
}

export function listPathUnitsInOrder(): PathUnit[] {
  return buildPronunciationPathCurriculum().stages.flatMap((s) => [...s.units])
}

export function getPathUnit(targetIdValue: string): PathUnit | null {
  return listPathUnitsInOrder().find((u) => u.targetId === targetIdValue) ?? null
}

export { PATH_STAGE_ORDER }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/pronunciation/path/__tests__/curriculum.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/pronunciation/path/types.ts lib/pronunciation/path/curriculum.ts lib/pronunciation/path/__tests__/curriculum.test.ts
git commit -m "feat(pronunciation): add five-stage path curriculum from registry 066"
```

---

### Task 2: Unit learning states (pure)

**Files:**
- Create: `lib/pronunciation/path/unit-state.ts`
- Test: `lib/pronunciation/path/__tests__/unit-state.test.ts`

**Interfaces:**
- Consumes: `PathUnit`, `UnitLearningState`, `SpokenAttempt`, `TargetResult`
- Produces: `deriveUnitLearningState(input)`, `showNeedsEvidenceBadge(diagnostic?)`

Content completion keys use `${kind}:${slug}` matching `ContentMapEntry` (e.g. `public_lesson:schwa-sound`).

Retention rule (document in code): ≥2 scorable attempts whose UTC calendar days differ. If fewer than 2 scorables → never `retained`.

- [ ] **Step 1: Write the failing test**

```ts
// lib/pronunciation/path/__tests__/unit-state.test.ts
import { describe, expect, it } from 'vitest'
import { phonemeTargetId, targetId } from '@/lib/pronunciation/targets/registry'
import type { SpokenAttempt } from '@/lib/pronunciation/spoken-attempt'
import type { TargetResult } from '@/lib/pronunciation/assessment/types'
import { getPathUnit } from '../curriculum'
import { deriveUnitLearningState, showNeedsEvidenceBadge } from '../unit-state'

const SCHWA = phonemeTargetId('/ə/')

function attempt(overrides: Partial<SpokenAttempt> = {}): SpokenAttempt {
  return {
    userId: 'u1',
    targetText: 'a banana',
    transcript: 'a banana',
    evaluatorVersion: 'stt-v1',
    scoreKind: 'stt_intelligibility',
    overallScore: 70,
    targetId: SCHWA,
    durationMs: 1000,
    outcome: 'scored',
    createdAt: '2026-07-20T12:00:00.000Z',
    ...overrides,
  }
}

describe('deriveUnitLearningState', () => {
  const unit = getPathUnit(SCHWA)!

  it('is not_started with no completion and no scorables', () => {
    expect(
      deriveUnitLearningState({
        unit,
        completedContentKeys: new Set(),
        spokenAttempts: [],
      })
    ).toBe('not_started')
  })

  it('is learning when content is complete but no objective production yet', () => {
    expect(
      deriveUnitLearningState({
        unit,
        completedContentKeys: new Set(['public_lesson:schwa-sound']),
        spokenAttempts: [],
      })
    ).toBe('learning')
  })

  it('ignores unscored attempts', () => {
    expect(
      deriveUnitLearningState({
        unit,
        completedContentKeys: new Set(),
        spokenAttempts: [attempt({ outcome: 'unscored' })],
      })
    ).toBe('not_started')
  })

  it('is ready_for_transfer when content done and one scorable exists', () => {
    expect(
      deriveUnitLearningState({
        unit,
        completedContentKeys: new Set(['public_lesson:schwa-sound']),
        spokenAttempts: [attempt()],
      })
    ).toBe('ready_for_transfer')
  })

  it('is retained with scorables on two distinct UTC days when masteryEligible', () => {
    expect(
      deriveUnitLearningState({
        unit,
        completedContentKeys: new Set(['public_lesson:schwa-sound']),
        spokenAttempts: [
          attempt({ createdAt: '2026-07-20T12:00:00.000Z' }),
          attempt({ createdAt: '2026-07-22T12:00:00.000Z' }),
        ],
      })
    ).toBe('retained')
  })

  it('does not retain masteryEligible:false targets from STT alone', () => {
    const rhythm = getPathUnit(targetId('prosody.rhythm'))!
    expect(
      deriveUnitLearningState({
        unit: rhythm,
        completedContentKeys: new Set(),
        spokenAttempts: [
          attempt({
            targetId: rhythm.targetId,
            createdAt: '2026-07-20T12:00:00.000Z',
          }),
          attempt({
            targetId: rhythm.targetId,
            createdAt: '2026-07-22T12:00:00.000Z',
          }),
        ],
      })
    ).not.toBe('retained')
  })
})

describe('showNeedsEvidenceBadge', () => {
  it('is true only for needs_evidence diagnostic rows', () => {
    const row: TargetResult = {
      targetId: SCHWA,
      status: 'needs_evidence',
      signalType: 'stt_intelligibility',
      confidence: 0,
      evaluatorKind: null,
      evaluatorVersion: null,
      measurement: { kind: 'not_measured', abstentionReason: 'skipped_by_user' },
    }
    expect(showNeedsEvidenceBadge(row)).toBe(true)
    expect(showNeedsEvidenceBadge({ ...row, status: 'observed' })).toBe(false)
  })
})
```

> If `SpokenAttempt` has no `createdAt` field in the codebase, use whatever timestamp field exists (check `spoken-attempt.ts`) or add an optional `attemptedAt?: string` to the path input wrapper type `PathSpokenEvidence` instead of extending the spine contract. Prefer a path-local type:

```ts
export interface PathSpokenEvidence {
  targetId: string
  outcome: SpokenAttempt['outcome']
  attemptedAt: string // ISO
}
```

and have tests/adapters map into that — **do not widen `SpokenAttempt` unless the field already exists**.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/pronunciation/path/__tests__/unit-state.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement `unit-state.ts`**

```ts
// lib/pronunciation/path/unit-state.ts
import { getTarget } from '@/lib/pronunciation/targets/registry'
import type { TargetResult } from '@/lib/pronunciation/assessment/types'
import type { SpokenAttemptOutcome } from '@/lib/pronunciation/spoken-attempt'
import type { PathUnit, UnitLearningState } from './types'

export interface PathSpokenEvidence {
  targetId: string
  outcome: SpokenAttemptOutcome
  attemptedAt: string
}

export interface DeriveUnitLearningStateInput {
  unit: PathUnit
  completedContentKeys: ReadonlySet<string>
  spokenAttempts: readonly PathSpokenEvidence[]
  /** Optional scored diagnostic perception/STT row — counts as one objective sample for readiness, never for retention alone. */
  diagnosticScored?: boolean
}

function contentDone(unit: PathUnit, completed: ReadonlySet<string>): boolean {
  if (unit.contentRefs.length === 0) return false
  return unit.contentRefs.some((ref) => completed.has(`${ref.kind}:${ref.slug}`))
}

function scorablesFor(unit: PathUnit, attempts: readonly PathSpokenEvidence[]): PathSpokenEvidence[] {
  return attempts.filter((a) => a.targetId === unit.targetId && a.outcome === 'scored')
}

function distinctUtcDays(isoDates: readonly string[]): number {
  const days = new Set(isoDates.map((iso) => iso.slice(0, 10)))
  return days.size
}

export function deriveUnitLearningState(input: DeriveUnitLearningStateInput): UnitLearningState {
  const { unit, completedContentKeys, spokenAttempts, diagnosticScored = false } = input
  const lookup = getTarget(unit.targetId)
  const masteryEligible = lookup.ok ? lookup.target.masteryEligible : false
  const done = contentDone(unit, completedContentKeys)
  const scorables = scorablesFor(unit, spokenAttempts)
  const hasObjective = scorables.length > 0 || diagnosticScored

  if (!done && !hasObjective) return 'not_started'
  if (masteryEligible && done && distinctUtcDays(scorables.map((s) => s.attemptedAt)) >= 2) {
    return 'retained'
  }
  if (done && hasObjective) return 'ready_for_transfer'
  return 'learning'
}

export function showNeedsEvidenceBadge(diagnostic: TargetResult | undefined): boolean {
  return diagnostic?.status === 'needs_evidence'
}
```

Adjust tests to use `PathSpokenEvidence` if you introduced it.

- [ ] **Step 4: Run tests — expect PASS**

Run: `pnpm exec vitest run lib/pronunciation/path/__tests__/unit-state.test.ts`

- [ ] **Step 5: Commit**

```bash
git add lib/pronunciation/path/unit-state.ts lib/pronunciation/path/__tests__/unit-state.test.ts
git commit -m "feat(pronunciation): derive path unit learning states from evidence"
```

---

### Task 3: Recommendation helper

**Files:**
- Create: `lib/pronunciation/path/recommend.ts`
- Test: `lib/pronunciation/path/__tests__/recommend.test.ts`

**Interfaces:**
- Consumes: `listPathUnitsInOrder`, `UnitLearningState`, `TargetResult[]`
- Produces: `recommendNextPathAction({ unitStates, diagnosticPriorities })`

- [ ] **Step 1: Write the failing test**

```ts
// lib/pronunciation/path/__tests__/recommend.test.ts
import { describe, expect, it } from 'vitest'
import { contrastTargetId, phonemeTargetId } from '@/lib/pronunciation/targets/registry'
import { listPathUnitsInOrder } from '../curriculum'
import { recommendNextPathAction } from '../recommend'
import type { UnitLearningState } from '../types'

const TH = contrastTargetId('/θ/', '/ð/')
const SCHWA = phonemeTargetId('/ə/')

function allStates(fill: UnitLearningState): Map<string, UnitLearningState> {
  return new Map(listPathUnitsInOrder().map((u) => [u.targetId, fill]))
}

describe('recommendNextPathAction', () => {
  it('prefers a non-retained diagnostic priority', () => {
    const states = allStates('not_started')
    const rec = recommendNextPathAction({
      unitStates: states,
      diagnosticPriorityIds: [SCHWA, TH],
    })
    expect(rec.targetId).toBe(SCHWA)
    expect(rec.reasonKind).toBe('diagnostic_priority')
  })

  it('skips retained priorities and falls through', () => {
    const states = allStates('not_started')
    states.set(SCHWA, 'retained')
    const rec = recommendNextPathAction({
      unitStates: states,
      diagnosticPriorityIds: [SCHWA, TH],
    })
    expect(rec.targetId).toBe(TH)
  })

  it('uses canonical stage-1 order when no diagnostic priorities', () => {
    const states = allStates('not_started')
    const rec = recommendNextPathAction({
      unitStates: states,
      diagnosticPriorityIds: [],
    })
    expect(rec.targetId).toBe(TH)
    expect(rec.reasonKind).toBe('canonical_next')
  })

  it('returns all_retained when every unit is retained', () => {
    const rec = recommendNextPathAction({
      unitStates: allStates('retained'),
      diagnosticPriorityIds: [TH],
    })
    expect(rec.targetId).toBeNull()
    expect(rec.reasonKind).toBe('all_retained')
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**

```ts
// lib/pronunciation/path/recommend.ts
import { getLearnerTargetCopy } from '@/lib/pronunciation/assessment/learner-copy'
import { getPathUnit, listPathUnitsInOrder } from './curriculum'
import type { PathRecommendation, UnitLearningState } from './types'

export interface RecommendNextPathActionInput {
  unitStates: ReadonlyMap<string, UnitLearningState>
  /** Priority target ids in diagnostic order (already capped ≤3 upstream). */
  diagnosticPriorityIds: readonly string[]
}

export function recommendNextPathAction(
  input: RecommendNextPathActionInput
): PathRecommendation {
  for (const id of input.diagnosticPriorityIds) {
    const state = input.unitStates.get(id) ?? 'not_started'
    if (state === 'retained') continue
    const unit = getPathUnit(id)
    if (!unit) continue
    const { title } = getLearnerTargetCopy(unit.targetId)
    return {
      targetId: unit.targetId,
      stageId: unit.stageId,
      reasonKind: 'diagnostic_priority',
      reasonEs: `Tu diagnóstico señaló ${title} como foco. Sigamos ahí.`,
    }
  }

  for (const unit of listPathUnitsInOrder()) {
    const state = input.unitStates.get(unit.targetId) ?? 'not_started'
    if (state === 'retained') continue
    const { title } = getLearnerTargetCopy(unit.targetId)
    return {
      targetId: unit.targetId,
      stageId: unit.stageId,
      reasonKind: 'canonical_next',
      reasonEs: `Empezamos por ${title}, el siguiente paso de la ruta.`,
    }
  }

  return {
    targetId: null,
    stageId: null,
    reasonKind: 'all_retained',
    reasonEs: 'Ya cubriste esta ruta. Puedes explorar de nuevo o repetir el diagnóstico.',
  }
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add lib/pronunciation/path/recommend.ts lib/pronunciation/path/__tests__/recommend.test.ts
git commit -m "feat(pronunciation): recommend next path action from diagnostic then canonical order"
```

---

### Task 4: Copy flag + evidence loaders

**Files:**
- Create: `lib/pronunciation/path/copy-flag.ts`
- Create: `lib/pronunciation/path/load-evidence.ts`
- Test: `lib/pronunciation/path/__tests__/copy-flag.test.ts`
- Test: `lib/pronunciation/path/__tests__/load-evidence.test.ts` (fake-indexeddb)

**Interfaces:**
- Produces: `isPronunciationPathCopyEnabled()`, `loadPathEvidence(userId)` → `{ completedContentKeys, spokenAttempts, diagnosticPriorityIds, diagnosticByTargetId }`

Spoken attempts v1: return `[]` unless a clear `targetId`-bearing source already exists; document in file header. Do **not** invent rows.

- [ ] **Step 1: Write copy-flag test**

```ts
// lib/pronunciation/path/__tests__/copy-flag.test.ts
import { afterEach, describe, expect, it } from 'vitest'
import { isPronunciationPathCopyEnabled } from '../copy-flag'

describe('isPronunciationPathCopyEnabled', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_PRONUNCIATION_PATH_COPY
  })

  it('defaults to enabled', () => {
    delete process.env.NEXT_PUBLIC_PRONUNCIATION_PATH_COPY
    expect(isPronunciationPathCopyEnabled()).toBe(true)
  })

  it('disables when env is the string false', () => {
    process.env.NEXT_PUBLIC_PRONUNCIATION_PATH_COPY = 'false'
    expect(isPronunciationPathCopyEnabled()).toBe(false)
  })
})
```

- [ ] **Step 2: Implement copy-flag (mirror diagnostic pattern)**

```ts
// lib/pronunciation/path/copy-flag.ts
export function isPronunciationPathCopyEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PRONUNCIATION_PATH_COPY !== 'false'
}
```

- [ ] **Step 3: Implement load-evidence**

```ts
// lib/pronunciation/path/load-evidence.ts
'use client'

import { db } from '@/lib/db'
import { getLocalPronunciationAssessments } from '@/lib/pronunciation/assessment/persistence'
import { validateDiagnosticResult } from '@/lib/pronunciation/assessment/schema'
import type { TargetResult } from '@/lib/pronunciation/assessment/types'
import { CONTENT_MAP } from '@/lib/pronunciation/targets/content-map'
import type { PathSpokenEvidence } from './unit-state'

export interface PathEvidenceBundle {
  completedContentKeys: Set<string>
  spokenAttempts: PathSpokenEvidence[]
  diagnosticPriorityIds: string[]
  diagnosticByTargetId: Map<string, TargetResult>
}

/**
 * Loads offline-first inputs for the pronunciation path.
 * SpokenAttempt projection is intentionally empty until a targetId-keyed
 * store is queryable — states then rely on completions + diagnostic.
 */
export async function loadPathEvidence(userId: string): Promise<PathEvidenceBundle> {
  const [lessons, assessments] = await Promise.all([
    db.completedLessons.where('userId').equals(userId).toArray(),
    getLocalPronunciationAssessments(userId),
  ])

  const completedSlugs = new Set(lessons.map((row) => row.lessonSlug))
  const completedContentKeys = new Set<string>()
  for (const entry of CONTENT_MAP) {
    if (completedSlugs.has(entry.slug)) {
      completedContentKeys.add(`${entry.kind}:${entry.slug}`)
    }
  }

  const diagnosticByTargetId = new Map<string, TargetResult>()
  let diagnosticPriorityIds: string[] = []
  const latest = assessments[0]
  if (latest) {
    const validated = validateDiagnosticResult(latest.result)
    if (validated.ok) {
      for (const row of validated.result.targetResults) {
        diagnosticByTargetId.set(row.targetId, row)
      }
      diagnosticPriorityIds = validated.result.targetResults
        .filter((r) => r.status === 'priority')
        .map((r) => r.targetId)
    }
  }

  return {
    completedContentKeys,
    spokenAttempts: [],
    diagnosticPriorityIds,
    diagnosticByTargetId,
  }
}
```

- [ ] **Step 4: Test load-evidence maps lessonSlug → content keys and reads priorities** (use `fake-indexeddb/auto` like persistence tests)

- [ ] **Step 5: Commit**

```bash
git add lib/pronunciation/path/copy-flag.ts lib/pronunciation/path/load-evidence.ts lib/pronunciation/path/__tests__/copy-flag.test.ts lib/pronunciation/path/__tests__/load-evidence.test.ts
git commit -m "feat(pronunciation): add path copy flag and offline evidence loader"
```

---

### Task 5: Route UI components + page

**Files:**
- Create: `components/courses/pronunciation-path/PronunciationPathPage.tsx`
- Create: `components/courses/pronunciation-path/PronunciationPathNextAction.tsx`
- Create: `components/courses/pronunciation-path/PronunciationPathStageNav.tsx`
- Create: `components/courses/pronunciation-path/PronunciationPathActiveUnit.tsx`
- Create: `components/courses/pronunciation-path/PronunciationPathExplore.tsx`
- Create: `app/(authenticated)/courses/pronunciation/page.tsx`
- Test: `components/courses/pronunciation-path/__tests__/PronunciationPathPage.test.tsx`

**Interfaces:**
- Consumes: curriculum, recommend, unit-state, loadPathEvidence, copy-flag, `getLearnerTargetCopy`
- SearchParams: `target?: string`, `stage?: string` (stage id or `1`–`5`)

Planned structure (required comment in `PronunciationPathPage.tsx`):

```tsx
// Planned structure:
// <PronunciationPathPage>
//   <PageHeader />
//   <PronunciationPathNextAction />
//   <PronunciationPathStageNav />
//   <PronunciationPathActiveUnit />
//   <PronunciationPathExplore />
// </PronunciationPathPage>
```

UI rules:
- Spanish; `min-h-11` touch targets; semantic tokens (`bg-surface`, `text-fg`, `border-border`, `rounded-md`, etc.).
- Flag off: NextAction title = “Siguiente práctica”; no “prioridad/fortaleza/accuracy/nivel de pronunciación”.
- Stage 5 shows a muted line: “Misión contextual — próximamente” (plan 070).
- Active unit links: `practiceHref` if set, else first `public_lesson` / `grammar_deck` content URL if the app already has a lesson reader route — otherwise omit broken links (show “Contenido en la ruta” without href). Prefer existing mini-lesson / study routes only if a known pattern exists; do not invent URLs.

- [ ] **Step 1: Write component tests** covering:
  1. Empty evidence → canonical next action toward TH contrast (or first stage-1 unit).
  2. With mocked diagnostic priorities → that target is recommended.
  3. `copyEnabled={false}` → no outcome/accuracy phrasing.
  4. `?target=` selects that unit as active.

Mock `loadPathEvidence` in tests.

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement components + server page**

```tsx
// app/(authenticated)/courses/pronunciation/page.tsx
import { PronunciationPathPage } from '@/components/courses/pronunciation-path/PronunciationPathPage'

export default async function PronunciationLearningRoutePage({
  searchParams,
}: {
  searchParams: Promise<{ target?: string; stage?: string }>
}) {
  const params = await searchParams
  return <PronunciationPathPage initialTargetId={params.target} initialStage={params.stage} />
}
```

Resolve `userId` the same way other authenticated client pages do (pass from a small server wrapper via auth helper, or read from existing auth hook inside the client — **match the pattern used by CoursePathProgressClient / assessment pages**; do not invent a new auth path).

- [ ] **Step 4: Run component tests + `pnpm lint:design-tokens` — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add app/(authenticated)/courses/pronunciation/page.tsx components/courses/pronunciation-path
git commit -m "feat(courses): add pronunciation transfer path UI at /courses/pronunciation"
```

---

### Task 6: Wire diagnostic CTA + Courses aside

**Files:**
- Modify: `components/pronunciation-assessment/PronunciationResults.tsx`
- Modify: `components/pronunciation-assessment/PronunciationFiveDayPlan.tsx` (if session links use `targetIdToPracticeRoute` only — point path units at `/courses/pronunciation?target=`)
- Modify: `lib/pronunciation/target-route.ts` **or** add `targetIdToPathRoute()` in `lib/pronunciation/path/routes.ts`
- Modify: `components/courses/CoursePathPage.tsx` aside pronunciation block
- Test: update `PronunciationResults.test.tsx` expectations for href
- Test: smoke assert CoursePath aside link if a test exists; else add a focused test

**Preferred routing helper:**

```ts
// lib/pronunciation/path/routes.ts
export function targetIdToPronunciationPathRoute(targetId: string): string {
  return `/courses/pronunciation?target=${encodeURIComponent(targetId)}`
}
```

Diagnostic primary CTA: use path route when `dayOneTargetId` is set; keep Sound Lab only as tertiary/fallback when there is no target id at all.

Courses aside: change primary link from only Sound Lab to “Abrir ruta de pronunciación” → `/courses/pronunciation`, and optionally keep a secondary text link to Sound Lab.

- [ ] **Step 1: Update/fail tests for new hrefs**

- [ ] **Step 2: Implement wiring**

- [ ] **Step 3: Run**

```bash
pnpm exec vitest run components/pronunciation-assessment/__tests__/PronunciationResults.test.tsx components/courses/pronunciation-path lib/pronunciation/path
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add lib/pronunciation/path/routes.ts components/pronunciation-assessment components/courses/CoursePathPage.tsx
git commit -m "feat(pronunciation): deep-link diagnostic and courses aside into pronunciation path"
```

---

### Task 7: Docs + plan status + verification gate

**Files:**
- Create: `docs/architecture/pronunciation-learning-route.md`
- Modify: `plans/README.md` (row 068 → DONE for thin vertical; note deferred Daily/Sound Lab/audit)
- Modify: `plans/068-build-pronunciation-learning-route.md` done criteria checkboxes that this vertical covers; note deferred items explicitly
- Modify: `docs/architecture/pronunciation-targets.md` — one paragraph pointing to the new route doc (non-goal → now partially owned by 068)

Doc must link: registry 066, diagnostic 067, completion 059, SpokenAttempt 063, five-stage loop, source-of-truth matrix (“path is orchestrator only”).

- [ ] **Step 1: Write architecture doc** (short: stages table, state machine, recommendation order, out-of-scope list)

- [ ] **Step 2: Update plan README rows**

- [ ] **Step 3: Full verification**

```bash
pnpm exec vitest run lib/pronunciation/path components/courses/pronunciation-path components/pronunciation-assessment/__tests__/PronunciationResults.test.tsx
pnpm type-check
pnpm lint:design-tokens
```

Expected: all pass / exit 0

- [ ] **Step 4: Manual check** — `/courses/pronunciation` light, dark, `--hue` ≠ default; with and without `?target=`; Courses aside + diagnostic CTA.

- [ ] **Step 5: Commit**

```bash
git add docs/architecture/pronunciation-learning-route.md docs/architecture/pronunciation-targets.md plans/README.md plans/068-build-pronunciation-learning-route.md
git commit -m "docs(plan-068): mark pronunciation path vertical done and document orchestrator"
```

---

## Self-review (author)

| Spec requirement | Task |
|---|---|
| 5-stage curriculum from registry | Task 1 |
| content-map reuse | Task 1 |
| 4 unit states + honesty rules | Task 2 |
| Diagnostic → then canonical recommend | Task 3 |
| Copy flag | Task 4 |
| Offline loaders | Task 4 |
| `/courses/pronunciation` UI | Task 5 |
| Deep links `target` / `stage` | Task 5 |
| Diagnostic CTA + Courses aside | Task 6 |
| No sidebar primary item | Task 6 (explicit non-change) |
| Docs + README | Task 7 |
| Deferred Daily / Sound Lab next / audit | Out of scope notes in Tasks 6–7 |

No TBD placeholders; types `PathSpokenEvidence` / `PathRecommendation` consistent across tasks.
