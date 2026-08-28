# Plan E — Conversación en la ruta y métricas de capacidad

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Llevar la conversación multi-turno al plan diario (no escondida en un botón flotante), medir latencia de habla y variedad de tiempos verbales, bajar el peso de pronunciación a un paso, y mostrar un panel "Ahora puedo decir…" que pruebe el progreso real.

**Architecture:** Las misiones orales ya existen y son buenas (`lib/ai-practice/missions/`: multi-turno, `requiredIntents`, `maxTurns: 8`), pero el compositor solo las incluye como `missionStep` opcional con capability gate. Este plan les da cadencia fija 3×/semana, añade dos métricas de capacidad calculadas desde `answer_history` (que ya persiste `time_ms` y `exercise_payload`), y construye el panel de logros sobre la cola de patrones reparados del Plan C.

**Tech Stack:** TypeScript, Vitest, Next.js Server Components, Supabase (lectura), Dexie.

**Cubre los problemas #7, #8, #9 y #11 de la auditoría.** Depende de los **Planes A y C**.

---

## File Structure

| Archivo | Responsabilidad |
| - | - |
| `lib/practice/daily-plan/mission-cadence.ts` (nuevo) | Función pura: ¿toca conversación hoy? |
| `lib/practice/daily-plan/composer.ts` (modificar) | Cadencia fija de misión + bajar pronunciación a 1 paso. |
| `lib/practice/daily-plan/constants.ts` (modificar) | `MAX_PRONUNCIATION_STEPS = 1`. |
| `lib/progress/speech-metrics.ts` (nuevo) | Latencia de habla y variedad de tiempos, puras. |
| `lib/progress/can-say-now.ts` (nuevo) | Estructuras dominadas en los últimos 30 días. |
| `components/progress/CanSayNowCard.tsx` (nuevo) | Panel "Ahora puedo decir…". |
| `app/(authenticated)/progress/page.tsx` (modificar) | Montar el panel nuevo. |

---

## Task 1: Cadencia fija para la conversación

**Files:**
- Create: `lib/practice/daily-plan/mission-cadence.ts`
- Test: `lib/practice/daily-plan/__tests__/mission-cadence.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/practice/daily-plan/__tests__/mission-cadence.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  shouldOfferMission,
  MISSION_DAYS_OF_WEEK,
} from '@/lib/practice/daily-plan/mission-cadence'

describe('shouldOfferMission', () => {
  it('runs three times a week', () => {
    expect(MISSION_DAYS_OF_WEEK).toHaveLength(3)
  })

  it('offers a mission on its scheduled days', () => {
    for (const day of MISSION_DAYS_OF_WEEK) {
      expect(shouldOfferMission(day, true)).toBe(true)
    }
  })

  it('skips days that are not scheduled', () => {
    const offDays = [0, 1, 2, 3, 4, 5, 6].filter(
      (d) => !MISSION_DAYS_OF_WEEK.includes(d),
    )
    for (const day of offDays) {
      expect(shouldOfferMission(day, true)).toBe(false)
    }
  })

  it('never offers a mission without speech recognition', () => {
    for (const day of MISSION_DAYS_OF_WEEK) {
      expect(shouldOfferMission(day, false)).toBe(false)
    }
  })

  it('spreads the days out instead of clustering them', () => {
    const sorted = [...MISSION_DAYS_OF_WEEK].sort((a, b) => a - b)
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]! - sorted[i - 1]!).toBeGreaterThanOrEqual(2)
    }
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run lib/practice/daily-plan/__tests__/mission-cadence.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `lib/practice/daily-plan/mission-cadence.ts`:

```ts
/**
 * When the daily plan offers a multi-turn oral mission.
 *
 * Previously missions were an optional candidate the selector could drop
 * entirely, so a learner whose core problem is freezing mid-conversation
 * could go weeks without ever holding one. A fixed cadence guarantees the
 * rehearsal without making every session long.
 */

/** Monday, Wednesday, Friday (JS getDay(): Sunday = 0). */
export const MISSION_DAYS_OF_WEEK: readonly number[] = [1, 3, 5]

export function shouldOfferMission(
  dayOfWeek: number,
  hasSpeechRecognition: boolean,
): boolean {
  if (!hasSpeechRecognition) return false
  return MISSION_DAYS_OF_WEEK.includes(dayOfWeek)
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run lib/practice/daily-plan/__tests__/mission-cadence.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 5: Wire it into the composer**

In `lib/practice/daily-plan/composer.ts`, add the import:

```ts
import { shouldOfferMission } from './mission-cadence'
```

Find where `missionStep` is added to `candidates` and give it a guaranteed slot on its days. Change its selection metadata from `variety` to a dedicated reason by adding this to `reasonForStep`:

```ts
    if (step.kind === 'mission') return 'grammar_slot' as const
```

(Reusing the `grammar_slot` priority tier from Plan B is deliberate: both are "protected practice that phonetics must not evict". If Plan B was not executed, add `'mission_slot': 1` to `REASON_PRIORITY` in `policy.ts` and use that instead.)

Then gate the mission's construction on the cadence:

```ts
  const missionAllowedToday = shouldOfferMission(
    new Date().getDay(),
    true, // capability is re-checked by selectDailyCandidates
  )
```

and only include `missionStep` in `candidates` when `missionAllowedToday` is true.

- [ ] **Step 6: Verify**

Run: `npx vitest run lib/practice/daily-plan/__tests__/ && npx tsc --noEmit`
Expected: PASS and exit 0.

- [ ] **Step 7: Commit**

```bash
git add lib/practice/daily-plan/mission-cadence.ts lib/practice/daily-plan/composer.ts lib/practice/daily-plan/__tests__/mission-cadence.test.ts
git commit -m "feat(daily): give oral missions a fixed three-day cadence"
```

---

## Task 2: Bajar pronunciación a un solo paso

**Files:**
- Modify: `lib/practice/daily-plan/constants.ts`
- Modify: `lib/practice/daily-plan/composer.ts`
- Test: `lib/practice/daily-plan/__tests__/pronunciation-cap.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/practice/daily-plan/__tests__/pronunciation-cap.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { selectDailyCandidates, candidate } from '@/lib/practice/daily-plan/policy'
import { capPronunciationSteps, MAX_PRONUNCIATION_STEPS } from '@/lib/practice/daily-plan/constants'
import type { DailyStep } from '@/lib/practice/types'

function step(id: string, kind: DailyStep['kind']): DailyStep {
  return {
    kind, id, title: id, subtitle: '', icon: 'Sparkles', exercises: [], estMinutes: 2,
  } as DailyStep
}

describe('pronunciation cap', () => {
  it('allows only one pronunciation step per session', () => {
    expect(MAX_PRONUNCIATION_STEPS).toBe(1)
  })

  it('drops pronunciation steps beyond the cap', () => {
    const steps = [
      step('phoneme_focus', 'phoneme_focus'),
      step('minimal_pairs', 'minimal_pairs'),
      step('listening', 'listening'),
      step('word_review', 'word_review'),
    ]
    const capped = capPronunciationSteps(steps)
    const pronunciation = capped.filter((s) =>
      ['phoneme_focus', 'minimal_pairs', 'listening', 'connected_speech'].includes(s.kind),
    )
    expect(pronunciation).toHaveLength(1)
  })

  it('keeps every non-pronunciation step', () => {
    const steps = [
      step('phoneme_focus', 'phoneme_focus'),
      step('word_review', 'word_review'),
      step('grammar_focus', 'grammar_focus'),
    ]
    const capped = capPronunciationSteps(steps)
    expect(capped.map((s) => s.kind)).toContain('word_review')
    expect(capped.map((s) => s.kind)).toContain('grammar_focus')
  })

  it('preserves the original order', () => {
    const steps = [
      step('word_review', 'word_review'),
      step('phoneme_focus', 'phoneme_focus'),
      step('grammar_focus', 'grammar_focus'),
    ]
    expect(capPronunciationSteps(steps).map((s) => s.id))
      .toEqual(['word_review', 'phoneme_focus', 'grammar_focus'])
  })

  it('is a no-op when nothing exceeds the cap', () => {
    const steps = [step('word_review', 'word_review')]
    expect(capPronunciationSteps(steps)).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run lib/practice/daily-plan/__tests__/pronunciation-cap.test.ts`
Expected: FAIL — `capPronunciationSteps` is not exported.

- [ ] **Step 3: Add the cap**

In `lib/practice/daily-plan/constants.ts`, append:

```ts
import type { DailyStep } from '@/lib/practice/types'

/**
 * Pronunciation steps allowed per session.
 *
 * The pronunciation work in this app is good, but it was taking two or three
 * of five slots while grammar took none. An imperfect accent with fluent
 * sentences communicates; a perfect accent with freezes does not.
 */
export const MAX_PRONUNCIATION_STEPS = 1

const PRONUNCIATION_KINDS: readonly DailyStep['kind'][] = [
  'phoneme_focus',
  'minimal_pairs',
  'listening',
  'connected_speech',
]

/** Keep at most MAX_PRONUNCIATION_STEPS pronunciation steps, order preserved. */
export function capPronunciationSteps(steps: DailyStep[]): DailyStep[] {
  let seen = 0
  return steps.filter((step) => {
    if (!PRONUNCIATION_KINDS.includes(step.kind)) return true
    seen += 1
    return seen <= MAX_PRONUNCIATION_STEPS
  })
}
```

Verify the kind names match the real union:

Run: `grep -n "phoneme_focus\|minimal_pairs\|connected_speech" lib/practice/types.ts | head -5`

- [ ] **Step 4: Apply it in the composer**

In `lib/practice/daily-plan/composer.ts`, add `capPronunciationSteps` to the `./constants` import, then apply it right after `selectDailyCandidates` returns:

```ts
  let finalSteps = capPronunciationSteps(
    selectDailyCandidates(candidates, {
      limit: DAILY_PLAN_STEP_COUNT,
      availableCapabilities: new Set(['network', 'microphone', 'speech_recognition']),
    }),
  )
```

- [ ] **Step 5: Verify**

Run: `npx vitest run lib/practice/daily-plan/__tests__/ && npx tsc --noEmit`
Expected: PASS and exit 0.

- [ ] **Step 6: Commit**

```bash
git add lib/practice/daily-plan/constants.ts lib/practice/daily-plan/composer.ts lib/practice/daily-plan/__tests__/pronunciation-cap.test.ts
git commit -m "feat(daily): cap pronunciation at one step per session"
```

---

## Task 3: Métricas de capacidad — latencia y variedad de tiempos

**Files:**
- Create: `lib/progress/speech-metrics.ts`
- Test: `lib/progress/__tests__/speech-metrics.test.ts`

**Contexto:** `savePracticeAnswer` (`lib/practice/queries.ts`) ya persiste `time_ms` y `exercise_payload` en `answer_history`. Estas métricas se calculan de esas filas — **sin migración**.

- [ ] **Step 1: Write the failing test**

Create `lib/progress/__tests__/speech-metrics.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  averageSpeechLatencyMs,
  tenseVarietyScore,
  latencyTrend,
  type SpeechAnswerRow,
} from '@/lib/progress/speech-metrics'

function row(overrides: Partial<SpeechAnswerRow> = {}): SpeechAnswerRow {
  return {
    slug: 'spoken_production',
    timeMs: 5000,
    constraintId: 'past_simple_narrative',
    isCorrect: true,
    answeredAt: '2026-08-24T10:00:00.000Z',
    ...overrides,
  }
}

describe('averageSpeechLatencyMs', () => {
  it('averages spoken attempts', () => {
    expect(averageSpeechLatencyMs([
      row({ timeMs: 4000 }),
      row({ timeMs: 6000 }),
    ])).toBe(5000)
  })

  it('ignores non-spoken exercises', () => {
    expect(averageSpeechLatencyMs([
      row({ timeMs: 4000 }),
      row({ slug: 'fill_blank', timeMs: 60000 }),
    ])).toBe(4000)
  })

  it('returns null with no spoken data', () => {
    expect(averageSpeechLatencyMs([])).toBeNull()
    expect(averageSpeechLatencyMs([row({ slug: 'fill_blank' })])).toBeNull()
  })

  it('discards implausible outliers', () => {
    // A five-minute "attempt" is a walked-away session, not thinking time.
    expect(averageSpeechLatencyMs([
      row({ timeMs: 4000 }),
      row({ timeMs: 300000 }),
    ])).toBe(4000)
  })
})

describe('tenseVarietyScore', () => {
  it('counts distinct constraints answered correctly', () => {
    const score = tenseVarietyScore([
      row({ constraintId: 'past_simple_narrative' }),
      row({ constraintId: 'present_perfect_experience' }),
      row({ constraintId: 'future_plan' }),
    ])
    expect(score.distinct).toBe(3)
  })

  it('does not credit failed attempts', () => {
    const score = tenseVarietyScore([
      row({ constraintId: 'past_simple_narrative', isCorrect: false }),
    ])
    expect(score.distinct).toBe(0)
  })

  it('does not double-count a repeated constraint', () => {
    const score = tenseVarietyScore([
      row({ constraintId: 'past_simple_narrative' }),
      row({ constraintId: 'past_simple_narrative' }),
    ])
    expect(score.distinct).toBe(1)
  })

  it('lists which constraints are still unused', () => {
    const score = tenseVarietyScore([row({ constraintId: 'past_simple_narrative' })])
    expect(score.missing).toContain('present_perfect_experience')
    expect(score.missing).not.toContain('past_simple_narrative')
  })

  it('handles rows with no constraint', () => {
    expect(tenseVarietyScore([row({ constraintId: null })]).distinct).toBe(0)
  })
})

describe('latencyTrend', () => {
  it('reports improvement when recent attempts are faster', () => {
    const older = [row({ timeMs: 9000, answeredAt: '2026-07-01T10:00:00.000Z' })]
    const recent = [row({ timeMs: 4000, answeredAt: '2026-08-20T10:00:00.000Z' })]
    const trend = latencyTrend([...older, ...recent], new Date('2026-08-24').getTime())
    expect(trend?.improvedMs).toBeGreaterThan(0)
  })

  it('returns null without both windows', () => {
    expect(latencyTrend([row()], new Date('2026-08-24').getTime())).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run lib/progress/__tests__/speech-metrics.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `lib/progress/speech-metrics.ts`:

```ts
import { SPEECH_CONSTRAINTS } from '@/lib/exercises/speech-constraints'

/**
 * Capability metrics for speaking.
 *
 * These answer "what can I do now that I could not do before", which streaks
 * and lesson counts cannot. Latency is the direct measure of freezing: it is
 * the number that moves when hesitation turns into automaticity.
 */

export interface SpeechAnswerRow {
  slug: string
  timeMs: number | null
  /** Constraint the exercise required, when it had one. */
  constraintId: string | null
  isCorrect: boolean
  answeredAt: string
}

/** Above this an "attempt" is a walked-away session, not thinking time. */
const MAX_PLAUSIBLE_LATENCY_MS = 120_000

const SPOKEN_SLUGS = new Set(['spoken_production', 'speak_word', 'cs_shadow_phrase'])

function spokenRows(rows: readonly SpeechAnswerRow[]): SpeechAnswerRow[] {
  return rows.filter(
    (r) =>
      SPOKEN_SLUGS.has(r.slug) &&
      typeof r.timeMs === 'number' &&
      r.timeMs > 0 &&
      r.timeMs <= MAX_PLAUSIBLE_LATENCY_MS,
  )
}

/** Mean time-to-answer on spoken items, or null when there is no data. */
export function averageSpeechLatencyMs(rows: readonly SpeechAnswerRow[]): number | null {
  const spoken = spokenRows(rows)
  if (spoken.length === 0) return null
  const total = spoken.reduce((sum, r) => sum + (r.timeMs ?? 0), 0)
  return Math.round(total / spoken.length)
}

export interface TenseVariety {
  /** Distinct constraints the learner has produced correctly. */
  distinct: number
  /** Total constraints available. */
  total: number
  /** Constraint ids not yet produced correctly. */
  missing: string[]
}

/** Which structures the learner can actually produce, not just recognise. */
export function tenseVarietyScore(rows: readonly SpeechAnswerRow[]): TenseVariety {
  const produced = new Set(
    rows
      .filter((r) => r.isCorrect && r.constraintId)
      .map((r) => r.constraintId as string),
  )
  const all = SPEECH_CONSTRAINTS.map((c) => c.id as string)
  return {
    distinct: produced.size,
    total: all.length,
    missing: all.filter((id) => !produced.has(id)),
  }
}

export interface LatencyTrend {
  recentMs: number
  olderMs: number
  /** Positive means the learner got faster. */
  improvedMs: number
}

const WINDOW_MS = 14 * 86_400_000

/**
 * Compare the last two weeks against the two before them.
 * Null when either window has no spoken data.
 */
export function latencyTrend(
  rows: readonly SpeechAnswerRow[],
  now: number = Date.now(),
): LatencyTrend | null {
  const recentRows: SpeechAnswerRow[] = []
  const olderRows: SpeechAnswerRow[] = []

  for (const row of rows) {
    const at = Date.parse(row.answeredAt)
    if (Number.isNaN(at)) continue
    const age = now - at
    if (age <= WINDOW_MS) recentRows.push(row)
    else if (age <= WINDOW_MS * 2) olderRows.push(row)
  }

  const recentMs = averageSpeechLatencyMs(recentRows)
  const olderMs = averageSpeechLatencyMs(olderRows)
  if (recentMs === null || olderMs === null) return null

  return { recentMs, olderMs, improvedMs: olderMs - recentMs }
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run lib/progress/__tests__/speech-metrics.test.ts`
Expected: PASS — 12 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/progress/speech-metrics.ts lib/progress/__tests__/speech-metrics.test.ts
git commit -m "feat(progress): add speech latency and tense variety metrics"
```

---

## Task 4: "Ahora puedo decir…"

**Files:**
- Create: `lib/progress/can-say-now.ts`
- Test: `lib/progress/__tests__/can-say-now.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/progress/__tests__/can-say-now.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildCanSayNow, type CanSayInput } from '@/lib/progress/can-say-now'

const NOW = new Date('2026-08-24T10:00:00.000Z').getTime()
const DAY = 86_400_000

function attempt(
  constraintId: string,
  isCorrect: boolean,
  daysAgo: number,
  sentence = 'I visited my family last weekend.',
): CanSayInput['attempts'][number] {
  return {
    constraintId,
    isCorrect,
    answeredAt: new Date(NOW - daysAgo * DAY).toISOString(),
    sentence,
  }
}

describe('buildCanSayNow', () => {
  it('lists a structure produced correctly at least twice', () => {
    const result = buildCanSayNow({
      attempts: [
        attempt('past_simple_narrative', true, 5),
        attempt('past_simple_narrative', true, 2),
      ],
    }, NOW)
    expect(result.mastered.map((m) => m.constraintId)).toContain('past_simple_narrative')
  })

  it('does not list a structure produced correctly only once', () => {
    const result = buildCanSayNow({
      attempts: [attempt('past_simple_narrative', true, 2)],
    }, NOW)
    expect(result.mastered).toHaveLength(0)
  })

  it('ignores attempts older than the window', () => {
    const result = buildCanSayNow({
      attempts: [
        attempt('past_simple_narrative', true, 45),
        attempt('past_simple_narrative', true, 40),
      ],
    }, NOW)
    expect(result.mastered).toHaveLength(0)
  })

  it('keeps one example sentence per mastered structure', () => {
    const result = buildCanSayNow({
      attempts: [
        attempt('past_simple_narrative', true, 5, 'I went to Madrid.'),
        attempt('past_simple_narrative', true, 2, 'I bought a new laptop.'),
      ],
    }, NOW)
    expect(result.mastered[0]!.example).toBeTruthy()
  })

  it('lists structures still in progress separately', () => {
    const result = buildCanSayNow({
      attempts: [
        attempt('second_conditional', false, 3),
        attempt('second_conditional', true, 1),
      ],
    }, NOW)
    expect(result.inProgress.map((m) => m.constraintId)).toContain('second_conditional')
    expect(result.mastered.map((m) => m.constraintId)).not.toContain('second_conditional')
  })

  it('returns empty lists with no attempts', () => {
    const result = buildCanSayNow({ attempts: [] }, NOW)
    expect(result.mastered).toEqual([])
    expect(result.inProgress).toEqual([])
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run lib/progress/__tests__/can-say-now.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `lib/progress/can-say-now.ts`:

```ts
import { constraintById } from '@/lib/exercises/speech-constraints'

/**
 * "A month ago I couldn't do this, now I can."
 *
 * Built from production attempts rather than completions: a structure counts
 * as available only when the learner produced it correctly, unprompted, more
 * than once — which is the difference between recognising a form and owning it.
 */

/** How far back a correct production still counts as current ability. */
const WINDOW_DAYS = 30
/** Correct productions needed before a structure is called mastered. */
const MASTERY_THRESHOLD = 2

export interface CanSayAttempt {
  constraintId: string
  isCorrect: boolean
  answeredAt: string
  /** What the learner actually said — the evidence shown back to them. */
  sentence?: string
}

export interface CanSayInput {
  attempts: readonly CanSayAttempt[]
}

export interface CanSayEntry {
  constraintId: string
  label: string
  correctCount: number
  /** The learner's own most recent correct sentence. */
  example?: string
}

export interface CanSayNow {
  mastered: CanSayEntry[]
  inProgress: CanSayEntry[]
}

export function buildCanSayNow(input: CanSayInput, now: number = Date.now()): CanSayNow {
  const cutoff = now - WINDOW_DAYS * 86_400_000

  const byConstraint = new Map<string, CanSayAttempt[]>()
  for (const attempt of input.attempts) {
    const at = Date.parse(attempt.answeredAt)
    if (Number.isNaN(at) || at < cutoff) continue
    const list = byConstraint.get(attempt.constraintId) ?? []
    list.push(attempt)
    byConstraint.set(attempt.constraintId, list)
  }

  const mastered: CanSayEntry[] = []
  const inProgress: CanSayEntry[] = []

  for (const [constraintId, attempts] of byConstraint) {
    const correct = attempts.filter((a) => a.isCorrect)
    if (correct.length === 0) continue

    const latest = [...correct].sort(
      (a, b) => Date.parse(b.answeredAt) - Date.parse(a.answeredAt),
    )[0]!

    const entry: CanSayEntry = {
      constraintId,
      label: constraintById(constraintId)?.label ?? constraintId,
      correctCount: correct.length,
      example: latest.sentence,
    }

    if (correct.length >= MASTERY_THRESHOLD) mastered.push(entry)
    else inProgress.push(entry)
  }

  const byCount = (a: CanSayEntry, b: CanSayEntry) => b.correctCount - a.correctCount
  return { mastered: mastered.sort(byCount), inProgress: inProgress.sort(byCount) }
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run lib/progress/__tests__/can-say-now.test.ts`
Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/progress/can-say-now.ts lib/progress/__tests__/can-say-now.test.ts
git commit -m "feat(progress): compute structures the learner can now produce"
```

---

## Task 5: El panel "Ahora puedo decir…"

**Files:**
- Create: `components/progress/CanSayNowCard.tsx`
- Modify: `app/(authenticated)/progress/page.tsx`
- Modify: `lib/progress/queries.ts` (fetch the attempts)

- [ ] **Step 1: Match the existing card conventions**

Run: `sed -n '1,50p' components/progress/SkillProfileCard.tsx`

Note how it takes its data as a prop and whether it is a Server Component. Follow that shape exactly.

- [ ] **Step 2: Write the component**

Create `components/progress/CanSayNowCard.tsx`:

```tsx
// Planned structure:
// <CanSayNowCard>
//   <MasteredList />    — structures owned, with the learner's own sentence
//   <InProgressList />  — structures appearing but not yet consolidated

import type { CanSayNow } from "@/lib/progress/can-say-now";

interface Props {
  data: CanSayNow;
}

export function CanSayNowCard({ data }: Props) {
  const hasAny = data.mastered.length > 0 || data.inProgress.length > 0;

  return (
    <section
      aria-labelledby="can-say-now-heading"
      className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5"
    >
      <header className="flex flex-col gap-1">
        <h2 id="can-say-now-heading" className="text-title-sm font-semibold text-fg">
          Ahora puedo decir…
        </h2>
        <p className="text-body-sm text-fg-muted">
          Estructuras que has producido tú, sin que te las dieran hechas.
        </p>
      </header>

      {!hasAny && (
        <p className="text-body-sm text-fg-muted">
          Todavía no hay datos. Completa unas cuantas sesiones de habla y aquí verás
          lo que ya puedes producir.
        </p>
      )}

      {data.mastered.length > 0 && (
        <ul className="flex flex-col gap-3">
          {data.mastered.map((entry) => (
            <li key={entry.constraintId} className="flex flex-col gap-1">
              <span className="text-body-sm font-medium text-fg">{entry.label}</span>
              {entry.example && (
                <span className="text-body-sm italic text-fg-muted">
                  “{entry.example}”
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {data.inProgress.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border-subtle pt-3">
          <h3 className="text-label-sm font-medium text-fg-muted">Casi</h3>
          <ul className="flex flex-wrap gap-2">
            {data.inProgress.map((entry) => (
              <li
                key={entry.constraintId}
                className="rounded-full border border-border-subtle px-3 py-1 text-label-sm text-fg-muted"
              >
                {entry.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
```

Verify tokens as in earlier tasks:

Run: `grep -rn "text-title-sm\|border-border-subtle\|bg-surface" components/progress/ | head -3`

- [ ] **Step 3: Fetch the attempts**

In `lib/progress/queries.ts`, add a function that reads spoken production rows. Follow the file's existing query style (it already reads `answer_history`):

```ts
export async function getCanSayNowAttempts(userId: string): Promise<CanSayAttempt[]> {
  const supabase = await createSupabaseServerClient()
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const { data, error } = await supabase
    .from('answer_history')
    .select('is_correct, user_answer, created_at, exercise_payload')
    .eq('user_id', userId)
    .eq('exercise_type_id', 16) // spoken_production — see EXERCISE_TYPE_IDS
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(500)

  if (error || !data) return []

  return data.flatMap((row) => {
    const payload = row.exercise_payload as { constraintId?: unknown } | null
    const constraintId = typeof payload?.constraintId === 'string' ? payload.constraintId : null
    if (!constraintId) return []
    return [{
      constraintId,
      isCorrect: Boolean(row.is_correct),
      answeredAt: String(row.created_at),
      sentence: typeof row.user_answer === 'string' ? row.user_answer : undefined,
    }]
  })
}
```

Confirm the column name for the timestamp first — the codebase may use `answered_at` rather than `created_at`:

Run: `grep -rn "answer_history" supabase/migrations/*.sql | head -5`

**Prerequisite:** the `constraintId` must be written into `exercise_payload` when the answer is saved. In `lib/practice/adapters.ts`, where a `spoken_production` exercise becomes a `PracticeExercise`, include `constraintId: exercise.constraint?.id` in the payload it builds. Without this the query returns nothing.

- [ ] **Step 4: Mount the card**

In `app/(authenticated)/progress/page.tsx`, add the fetch alongside the existing ones and render:

```tsx
      <CanSayNowCard data={buildCanSayNow({ attempts: canSayAttempts })} />
```

placing it directly above `<SkillProfileCard />` — it is the answer to the question the learner actually asks.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npx next lint --dir components/progress && npx vitest run lib/progress/__tests__/`
Expected: exit 0 and PASS.

- [ ] **Step 6: Commit**

```bash
git add components/progress/CanSayNowCard.tsx "app/(authenticated)/progress/page.tsx" lib/progress/queries.ts lib/practice/adapters.ts
git commit -m "feat(progress): show which structures the learner can now produce"
```

---

## Task 6: Verificación completa

- [ ] **Step 1: Full suite**

Run: `npx vitest run && npx tsc --noEmit && npx next lint`
Expected: all green, exit 0.

- [ ] **Step 2: Manual check**

Run `pnpm dev` and confirm:
- On a Monday/Wednesday/Friday, `/daily` includes a conversation mission step; on other days it does not.
- No session contains more than one pronunciation step.
- `/progress` shows "Ahora puedo decir…". With no history it shows the empty state, not a broken card.
- After completing spoken items with different constraint badges, those structures appear in the card with your own sentences.

- [ ] **Step 3: Commit fixes**

```bash
git add -A
git commit -m "test(progress): stabilize capability metric expectations"
```

---

## Notas de riesgo

- **`constraintId` en el payload es un prerrequisito silencioso.** El panel "Ahora puedo decir…" devuelve vacío hasta que `lib/practice/adapters.ts` escriba el `constraintId` en `exercise_payload`. Hazlo en la Task 5 Step 3 o el panel parecerá roto sin serlo. Los datos anteriores a ese cambio nunca aparecerán — es esperado.
- **La latencia mide tiempo total, no tiempo hasta el primer sonido.** `time_ms` cubre el ejercicio entero (incluida la grabación y el grading). Sirve como proxy de tendencia, pero no es la métrica de bloqueo pura que describía la auditoría. Medir el primer sonido de verdad requiere instrumentar `useSpeechInput` con una marca al detectar voz; es trabajo aparte y merece su propia tarea.
- **Cadencia fija vs. capacidad.** `shouldOfferMission` pasa `true` como capacidad y delega la comprobación real a `selectDailyCandidates`. Si el navegador no soporta reconocimiento de voz, el día de misión simplemente pierde ese paso. Considera un fallback escrito si la usuaria usa a menudo un navegador sin Web Speech API.
- **Las misiones existentes son de pronunciación.** `lib/ai-practice/missions/registry.ts` define `targets` fonéticos. Cumplen el objetivo multi-turno de la auditoría, pero no ejercitan tiempos verbales. Añadir misiones con `requiredIntents` gramaticales (contar una anécdota en pasado, defender una opinión) es el siguiente paso natural y no está en este plan.
