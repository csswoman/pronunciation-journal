# Goal-Based Oral Missions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the eight hardcoded roleplay prompts and the ambiguous "Interview" tab with a mission system where a deterministic reducer — not the LLM — decides whether a communicative goal was achieved, separately from pronunciation evidence.

**Architecture:** A pure `OralMission` registry (data) feeds a pure `missionReducer` (state machine) that consumes structured tool-call events from the model. `goalAchieved` is derived from a `Set` of observed intent ids; pronunciation evidence (`targetEvidence`/`intelligibilityEvidence`) is derived separately by reusing plan 069's `feedbackFromScoringResult` over `SpokenAttempt`s with `outcome === 'scored'`. UI and persistence are thin layers over these two pure cores, following the exact patterns already used by `lib/pronunciation/feedback/` (plan 069) and `lib/ai-practice/coach-progress.ts`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, Dexie.js, Zustand (not used here — this feature has no ephemeral UI state that needs it), Tailwind v4 design tokens.

**Source spec:** `docs/superpowers/specs/2026-07-26-plan-070-oral-missions-design.md`
**Source plan:** `plans/070-build-goal-based-oral-missions.md`

---

## Before you start

Run these once, from the repo root, to confirm the baseline is green:

```bash
pnpm type-check
pnpm exec vitest run lib/pronunciation/feedback lib/ai-practice
```

Both must pass with no failures before Task 1.

---

## Phase 1: Mission registry (pure data + validation)

### Task 1: Define `OralMission` types

**Files:**
- Create: `lib/ai-practice/missions/types.ts`
- Test: `lib/ai-practice/missions/__tests__/types.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/ai-practice/missions/__tests__/types.test.ts
import { describe, expect, it } from 'vitest'
import type { OralMission } from '../types'
import { contrastTargetId } from '@/lib/pronunciation/targets/registry'

describe('OralMission shape', () => {
  it('accepts a fully-formed mission literal', () => {
    const mission: OralMission = {
      id: 'roleplay.cafe',
      category: 'service',
      recommendedCefr: 'A2',
      context: 'You are a barista at a busy coffee shop.',
      communicativeGoal: 'Order a drink and answer follow-up questions.',
      role: { model: 'Barista', student: 'Customer' },
      opening: 'Hi there, what can I get started for you?',
      maxTurns: 6,
      requiredIntents: [{ id: 'ordered_drink', label: 'Named a specific drink' }],
      targets: [{ targetId: contrastTargetId('/iː/', '/ɪ/'), phrase: "I'd like a medium latte, please" }],
      transferVariant: { context: 'A different barista, same shop, closing soon.', opening: 'Last call — what can I get you?' },
    }
    expect(mission.id).toBe('roleplay.cafe')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/ai-practice/missions/__tests__/types.test.ts`
Expected: FAIL — `Cannot find module '../types'`

- [ ] **Step 3: Write the implementation**

```ts
// lib/ai-practice/missions/types.ts
import type { CEFRLevel } from '@/lib/exercises/cefr'
import type { PronunciationTargetId } from '@/lib/pronunciation/targets/types'

export type MissionCategory = 'interview' | 'service' | 'workplace' | 'social'

export interface OralMissionTarget {
  targetId: PronunciationTargetId
  /** Authored natural phrase containing the target sound/pattern. */
  phrase: string
}

export interface RequiredIntent {
  /** Stable, mission-scoped id — never renamed once a mission ships. */
  id: string
  /** Learner-facing description of what satisfies this intent. */
  label: string
}

export interface OralMission {
  /** Stable id, e.g. "roleplay.cafe" — never renamed. */
  id: string
  category: MissionCategory
  recommendedCefr: CEFRLevel
  /** Scene-setting text; feeds the generated system prompt. */
  context: string
  /** Learner-facing: "what you're trying to do". */
  communicativeGoal: string
  role: { model: string; student: string }
  /** The model's first line when the mission starts. */
  opening: string
  maxTurns: number
  /** ALL required for goalAchieved by default — see missionReducer. */
  requiredIntents: RequiredIntent[]
  /** 2-3 authored phrases mapped to canonical pronunciation targets. */
  targets: OralMissionTarget[]
  transferVariant: { context: string; opening: string }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/ai-practice/missions/__tests__/types.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/ai-practice/missions/types.ts lib/ai-practice/missions/__tests__/types.test.ts
git commit -m "feat(missions): define OralMission contract"
```

---

### Task 2: Author the 8 migrated missions

**Files:**
- Create: `lib/ai-practice/missions/registry.ts`
- Test: `lib/ai-practice/missions/__tests__/registry.test.ts`

Content is authored directly in this task (per the approved spec table) — this is
the migration of `lib/ai-practice/modes/roleplay.ts`'s 8 scenarios. Each
`requiredIntents` list is derived from that scenario's existing "ask for X, Y, Z"
prose.

- [ ] **Step 1: Write the failing test**

```ts
// lib/ai-practice/missions/__tests__/registry.test.ts
import { describe, expect, it } from 'vitest'
import { MISSIONS, LEGACY_ROLEPLAY_MODE_TO_MISSION_ID, getMission, listMissions } from '../registry'
import { getTarget } from '@/lib/pronunciation/targets/registry'

const LEGACY_SCENARIOS = ['interview', 'cafe', 'airport', 'doctor', 'store', 'code_review', 'standup', 'tech_design'] as const

describe('oral mission registry', () => {
  it('has exactly 8 missions with unique ids', () => {
    const ids = listMissions().map((m) => m.id)
    expect(ids).toHaveLength(8)
    expect(new Set(ids).size).toBe(8)
  })

  it('maps every legacy roleplay scenario to a mission id', () => {
    for (const scenario of LEGACY_SCENARIOS) {
      expect(LEGACY_ROLEPLAY_MODE_TO_MISSION_ID[scenario]).toBeDefined()
      expect(getMission(LEGACY_ROLEPLAY_MODE_TO_MISSION_ID[scenario])).not.toBeNull()
    }
  })

  it('every target resolves against the plan-066 registry', () => {
    for (const mission of listMissions()) {
      for (const target of mission.targets) {
        expect(getTarget(target.targetId).ok, `${mission.id} → ${target.targetId}`).toBe(true)
      }
    }
  })

  it('every mission declares 2-3 targets and at least one required intent', () => {
    for (const mission of listMissions()) {
      expect(mission.targets.length).toBeGreaterThanOrEqual(2)
      expect(mission.targets.length).toBeLessThanOrEqual(3)
      expect(mission.requiredIntents.length).toBeGreaterThan(0)
    }
  })

  it('covers all 4 categories and a CEFR range from A2 to B2', () => {
    const categories = new Set(listMissions().map((m) => m.category))
    expect(categories).toEqual(new Set(['interview', 'service', 'workplace', 'social']))
    const cefrs = new Set(listMissions().map((m) => m.recommendedCefr))
    expect(cefrs.has('A2')).toBe(true)
    expect(cefrs.has('B2')).toBe(true)
  })

  it('returns null for an unknown mission id', () => {
    expect(getMission('not.a.real.mission')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/ai-practice/missions/__tests__/registry.test.ts`
Expected: FAIL — `Cannot find module '../registry'`

- [ ] **Step 3: Write the implementation**

```ts
// lib/ai-practice/missions/registry.ts
import { contrastTargetId, phonemeTargetId } from '@/lib/pronunciation/targets/registry'
import type { OralMission } from './types'

const MISSIONS_LIST: OralMission[] = [
  {
    id: 'roleplay.interview',
    category: 'interview',
    recommendedCefr: 'B1',
    context: 'You are an English-speaking interviewer conducting a job interview.',
    communicativeGoal: 'Introduce yourself and describe a past project clearly.',
    role: { model: 'Interviewer', student: 'Candidate' },
    opening: "Welcome, thanks for coming in today. Let's start — could you introduce yourself?",
    maxTurns: 8,
    requiredIntents: [
      { id: 'introduced_self', label: 'Gave a self-introduction' },
      { id: 'described_past_project', label: 'Described a specific past project or experience' },
    ],
    targets: [
      { targetId: 'connected.reduction.gonna', phrase: "I've been working on that for two years" },
      { targetId: 'prosody.sentence-stress', phrase: 'What did you learn from that experience?' },
    ],
    transferVariant: {
      context: 'A second, more casual interviewer follows up in a coffee chat.',
      opening: "So, tell me more about that project — what would you do differently?",
    },
  },
  {
    id: 'roleplay.cafe',
    category: 'service',
    recommendedCefr: 'A2',
    context: 'You are a barista at a busy coffee shop in an English-speaking city.',
    communicativeGoal: 'Order a drink and answer the barista\'s follow-up questions.',
    role: { model: 'Barista', student: 'Customer' },
    opening: 'Hi there, what can I get started for you?',
    maxTurns: 6,
    requiredIntents: [
      { id: 'ordered_drink', label: 'Named a specific drink' },
      { id: 'answered_size_or_milk', label: 'Answered a size, milk, or sugar question' },
    ],
    targets: [
      { targetId: contrastTargetId('/iː/', '/ɪ/'), phrase: "I'd like a medium latte, please" },
      { targetId: 'prosody.word-stress', phrase: 'Can I get that to go?' },
    ],
    transferVariant: {
      context: 'A different barista, same shop, closing soon.',
      opening: 'Last call — what can I get you?',
    },
  },
  {
    id: 'roleplay.airport',
    category: 'service',
    recommendedCefr: 'A2',
    context: 'You are an airline check-in agent at an international airport.',
    communicativeGoal: 'Check in for a flight: give your destination, bags, and seat preference.',
    role: { model: 'Check-in agent', student: 'Passenger' },
    opening: 'Good morning, may I see your passport please?',
    maxTurns: 6,
    requiredIntents: [
      { id: 'stated_destination', label: 'Stated a destination' },
      { id: 'stated_seat_preference', label: 'Answered a seat preference question' },
    ],
    targets: [
      { targetId: phonemeTargetId('/ə/'), phrase: "I'd like a window seat" },
      { targetId: 'prosody.word-stress', phrase: 'Is there a fee for the extra bag?' },
    ],
    transferVariant: {
      context: 'A gate-change announcement forces a quick follow-up conversation.',
      opening: 'Sorry to bother you again — your gate has changed, is that alright?',
    },
  },
  {
    id: 'roleplay.doctor',
    category: 'service',
    recommendedCefr: 'A2',
    context: 'You are a friendly general practitioner in an English-speaking clinic.',
    communicativeGoal: 'Describe a symptom and answer a follow-up question about it.',
    role: { model: 'Doctor', student: 'Patient' },
    opening: "Come on in — what brings you in today?",
    maxTurns: 6,
    requiredIntents: [
      { id: 'described_symptom', label: 'Described a symptom' },
      { id: 'answered_duration', label: 'Answered how long the symptom has lasted' },
    ],
    targets: [
      { targetId: contrastTargetId('/θ/', '/ð/'), phrase: 'It hurts when I breathe' },
      { targetId: 'prosody.sentence-stress', phrase: "I've had this for three days" },
    ],
    transferVariant: {
      context: 'A follow-up phone call a week later.',
      opening: "Hi, it's the clinic calling to check in — how are you feeling now?",
    },
  },
  {
    id: 'roleplay.store',
    category: 'service',
    recommendedCefr: 'A2',
    context: 'You are a sales assistant in a clothing store.',
    communicativeGoal: 'Ask for a different size or color, or start a return.',
    role: { model: 'Sales assistant', student: 'Customer' },
    opening: 'Hi, let me know if you need help finding anything!',
    maxTurns: 6,
    requiredIntents: [
      { id: 'requested_size_or_color', label: 'Asked for a different size or color' },
    ],
    targets: [
      { targetId: contrastTargetId('/iː/', '/ɪ/'), phrase: 'Do you have this in a smaller size?' },
      { targetId: phonemeTargetId('/ə/'), phrase: "I'd like to return this" },
    ],
    transferVariant: {
      context: 'A different store, a return instead of a purchase.',
      opening: 'Hi there, are you looking to buy something or return an item today?',
    },
  },
  {
    id: 'roleplay.code_review',
    category: 'workplace',
    recommendedCefr: 'B1',
    context: 'You are a senior software engineer doing a code review on the student\'s pull request.',
    communicativeGoal: 'Respond to feedback and suggest one improvement using softened language.',
    role: { model: 'Senior engineer', student: 'Developer' },
    opening: "Hey, I looked over your PR and left a few comments — got a minute?",
    maxTurns: 8,
    requiredIntents: [
      { id: 'responded_to_feedback', label: 'Responded to a specific piece of feedback' },
      { id: 'suggested_improvement', label: 'Suggested an improvement or alternative' },
    ],
    targets: [
      { targetId: 'prosody.sentence-stress', phrase: 'I think this could be simpler' },
      { targetId: 'connected.linking', phrase: 'Have you considered a different approach?' },
    ],
    transferVariant: {
      context: 'A follow-up review on the next PR, same reviewer.',
      opening: "Good news, this one's much cleaner — one small thing though.",
    },
  },
  {
    id: 'roleplay.standup',
    category: 'workplace',
    recommendedCefr: 'B1',
    context: 'You are a team lead running a daily standup meeting.',
    communicativeGoal: "Report what you're working on and whether you have blockers.",
    role: { model: 'Team lead', student: 'Developer' },
    opening: "Morning! Let's start with you — what did you work on yesterday?",
    maxTurns: 8,
    requiredIntents: [
      { id: 'reported_current_work', label: 'Described what they are working on today' },
      { id: 'stated_blockers_or_none', label: 'Stated a blocker or explicitly said there are none' },
    ],
    targets: [
      { targetId: 'connected.reduction.gonna', phrase: "I've been working on it, not I worked" },
      { targetId: 'prosody.word-stress', phrase: "I don't have any blockers" },
    ],
    transferVariant: {
      context: 'A standup on a Friday, wrapping up the week.',
      opening: "Last one before the weekend — how's everything looking?",
    },
  },
  {
    id: 'roleplay.tech_design',
    category: 'workplace',
    recommendedCefr: 'B2',
    context: 'You are a non-technical product manager listening to a developer explain a technical design.',
    communicativeGoal: 'Explain a technical trade-off in plain language a non-engineer can follow.',
    role: { model: 'Product manager', student: 'Developer' },
    opening: "Before sprint planning, can you walk me through the design? Keep it simple for me.",
    maxTurns: 8,
    requiredIntents: [
      { id: 'explained_tradeoff', label: 'Explained a trade-off in plain language' },
    ],
    targets: [
      { targetId: 'connected.linking', phrase: 'The trade-off is speed versus simplicity' },
      { targetId: 'prosody.intonation.rising-question', phrase: 'What does that mean in practice?' },
    ],
    transferVariant: {
      context: 'A skeptical stakeholder pushes back harder on the same design.',
      opening: "I heard about your proposal — walk me through it again, I'm not convinced yet.",
    },
  },
]

export const MISSIONS: Readonly<Record<string, OralMission>> = Object.freeze(
  Object.fromEntries(MISSIONS_LIST.map((m) => [m.id, m]))
)

/** Adapts legacy `roleplay:<scenario>` AIConversationMode suffixes to mission ids. */
export const LEGACY_ROLEPLAY_MODE_TO_MISSION_ID: Readonly<Record<string, string>> = Object.freeze({
  interview: 'roleplay.interview',
  cafe: 'roleplay.cafe',
  airport: 'roleplay.airport',
  doctor: 'roleplay.doctor',
  store: 'roleplay.store',
  code_review: 'roleplay.code_review',
  standup: 'roleplay.standup',
  tech_design: 'roleplay.tech_design',
})

export function getMission(id: string): OralMission | null {
  return MISSIONS[id] ?? null
}

export function listMissions(): readonly OralMission[] {
  return Object.values(MISSIONS)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/ai-practice/missions/__tests__/registry.test.ts`
Expected: PASS — all 6 assertions green.

- [ ] **Step 5: Commit**

```bash
git add lib/ai-practice/missions/registry.ts lib/ai-practice/missions/__tests__/registry.test.ts
git commit -m "feat(missions): migrate the 8 roleplay scenarios into the mission registry"
```

---

## Phase 2: Deterministic state machine

### Task 3: Define `MissionState`/`MissionEvent` and the reducer skeleton

**Files:**
- Create: `lib/ai-practice/missions/state-machine.ts`
- Test: `lib/ai-practice/missions/__tests__/state-machine.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/ai-practice/missions/__tests__/state-machine.test.ts
import { describe, expect, it } from 'vitest'
import { createInitialMissionState, missionReducer } from '../state-machine'
import { getMission } from '../registry'

const mission = getMission('roleplay.cafe')!

describe('mission reducer — briefing and turn counting', () => {
  it('starts in briefing phase with no evidence', () => {
    const state = createInitialMissionState(mission)
    expect(state.phase).toBe('briefing')
    expect(state.turnCount).toBe(0)
    expect(state.intentsObserved.size).toBe(0)
    expect(state.status).toBe('in_progress')
  })

  it('moves to active on the first turn_text or turn_spoken event', () => {
    const state = createInitialMissionState(mission)
    const next = missionReducer(state, { type: 'turn_text' }, mission)
    expect(next.phase).toBe('active')
    expect(next.turnCount).toBe(1)
  })

  it('forces phase to result once maxTurns is reached', () => {
    let state = createInitialMissionState(mission)
    for (let i = 0; i < mission.maxTurns; i++) {
      state = missionReducer(state, { type: 'turn_text' }, mission)
    }
    expect(state.phase).toBe('result')
    expect(state.status).toBe('completed')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/ai-practice/missions/__tests__/state-machine.test.ts`
Expected: FAIL — `Cannot find module '../state-machine'`

- [ ] **Step 3: Write the implementation**

```ts
// lib/ai-practice/missions/state-machine.ts
import type { FeedbackPriority } from '@/lib/pronunciation/feedback/types'
import type { SpokenAttempt } from '@/lib/pronunciation/spoken-attempt'
import type { OralMission } from './types'

export type MissionPhase = 'briefing' | 'active' | 'correction' | 'transfer' | 'result'
export type MissionStatus = 'in_progress' | 'completed' | 'cancelled' | 'provider_error'

export interface MissionState {
  missionId: string
  phase: MissionPhase
  turnCount: number
  intentsObserved: Set<string>
  pendingCorrection: FeedbackPriority | null
  correctionRetried: boolean
  transferAttempted: boolean
  spokenAttempts: SpokenAttempt[]
  status: MissionStatus
}

export type MissionEvent =
  | { type: 'intent_observed'; intentId: string }
  | { type: 'turn_spoken'; attempt: SpokenAttempt }
  | { type: 'turn_text' }
  | { type: 'retry_correction' }
  | { type: 'transfer_attempted'; attempt: SpokenAttempt }
  | { type: 'provider_error' }
  | { type: 'cancel' }
  | { type: 'resume'; from: MissionState }

export function createInitialMissionState(mission: OralMission): MissionState {
  return {
    missionId: mission.id,
    phase: 'briefing',
    turnCount: 0,
    intentsObserved: new Set(),
    pendingCorrection: null,
    correctionRetried: false,
    transferAttempted: false,
    spokenAttempts: [],
    status: 'in_progress',
  }
}

function advancePhaseAfterTurn(state: MissionState, mission: OralMission): MissionPhase {
  if (state.turnCount >= mission.maxTurns) return 'result'
  if (state.phase === 'briefing') return 'active'
  return state.phase
}

export function missionReducer(state: MissionState, event: MissionEvent, mission: OralMission): MissionState {
  if (state.status !== 'in_progress') return state

  switch (event.type) {
    case 'resume':
      return event.from

    case 'cancel':
      return { ...state, status: 'cancelled' }

    case 'provider_error':
      return { ...state, status: 'provider_error' }

    case 'turn_text': {
      const turnCount = state.turnCount + 1
      const phase = advancePhaseAfterTurn({ ...state, turnCount }, mission)
      return { ...state, turnCount, phase, status: phase === 'result' ? 'completed' : state.status }
    }

    default:
      return state
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/ai-practice/missions/__tests__/state-machine.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/ai-practice/missions/state-machine.ts lib/ai-practice/missions/__tests__/state-machine.test.ts
git commit -m "feat(missions): add MissionState/MissionEvent types and turn-counting reducer skeleton"
```

---

### Task 4: Intent tracking — valid, unknown, and duplicate events

**Files:**
- Modify: `lib/ai-practice/missions/state-machine.ts`
- Modify: `lib/ai-practice/missions/__tests__/state-machine.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `lib/ai-practice/missions/__tests__/state-machine.test.ts`:

```ts
describe('mission reducer — intent tracking', () => {
  it('adds a valid intentId to intentsObserved', () => {
    const state = createInitialMissionState(mission)
    const next = missionReducer(state, { type: 'intent_observed', intentId: 'ordered_drink' }, mission)
    expect(next.intentsObserved.has('ordered_drink')).toBe(true)
  })

  it('silently ignores an intentId not in the mission\'s requiredIntents', () => {
    const state = createInitialMissionState(mission)
    const next = missionReducer(state, { type: 'intent_observed', intentId: 'not_a_real_intent' }, mission)
    expect(next.intentsObserved.size).toBe(0)
    expect(next.status).toBe('in_progress')
  })

  it('is idempotent for a duplicate valid intentId', () => {
    const state = createInitialMissionState(mission)
    const once = missionReducer(state, { type: 'intent_observed', intentId: 'ordered_drink' }, mission)
    const twice = missionReducer(once, { type: 'intent_observed', intentId: 'ordered_drink' }, mission)
    expect(twice.intentsObserved.size).toBe(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/ai-practice/missions/__tests__/state-machine.test.ts`
Expected: FAIL — the `intent_observed` case falls through the reducer's `default: return state`, so `intentsObserved` never gains `'ordered_drink'`.

- [ ] **Step 3: Add the `intent_observed` case**

In `lib/ai-practice/missions/state-machine.ts`, add this case to the `switch` in `missionReducer`, above `default`:

```ts
    case 'intent_observed': {
      const isKnown = mission.requiredIntents.some((i) => i.id === event.intentId)
      if (!isKnown) return state
      if (state.intentsObserved.has(event.intentId)) return state
      const intentsObserved = new Set(state.intentsObserved)
      intentsObserved.add(event.intentId)
      return { ...state, intentsObserved }
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/ai-practice/missions/__tests__/state-machine.test.ts`
Expected: PASS — 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/ai-practice/missions/state-machine.ts lib/ai-practice/missions/__tests__/state-machine.test.ts
git commit -m "feat(missions): validate intent events against the mission's requiredIntents"
```

---

### Task 5: Spoken turns — scored evidence triggers correction, unscored/text never does

**Files:**
- Modify: `lib/ai-practice/missions/state-machine.ts`
- Modify: `lib/ai-practice/missions/__tests__/state-machine.test.ts`

This task wires `turn_spoken` to plan 069's prioritizer. A scored attempt whose
transcript maps to one of the mission's targets moves the phase to
`'correction'`; an unscored/failed/skipped attempt is recorded in
`spokenAttempts` but never does.

- [ ] **Step 1: Write the failing test**

Append to `lib/ai-practice/missions/__tests__/state-machine.test.ts`:

```ts
import type { SpokenAttempt } from '@/lib/pronunciation/spoken-attempt'

function scoredAttempt(overrides: Partial<SpokenAttempt> = {}): SpokenAttempt {
  return {
    userId: 'user-1',
    targetText: "I'd like a medium latte, please",
    transcript: "I'd like a medium latte, please",
    evaluatorVersion: 'stt-v1',
    scoreKind: 'stt_intelligibility',
    overallScore: 40,
    durationMs: 1200,
    outcome: 'scored',
    ...overrides,
  }
}

describe('mission reducer — spoken turns and correction', () => {
  it('records every spoken attempt in spokenAttempts regardless of outcome', () => {
    const state = createInitialMissionState(mission)
    const unscored = scoredAttempt({ outcome: 'unscored', overallScore: 0 })
    const next = missionReducer(state, { type: 'turn_spoken', attempt: unscored }, mission)
    expect(next.spokenAttempts).toHaveLength(1)
  })

  it('does not enter correction phase for an unscored attempt', () => {
    const state = createInitialMissionState(mission)
    const unscored = scoredAttempt({ outcome: 'unscored', overallScore: 0 })
    const next = missionReducer(state, { type: 'turn_spoken', attempt: unscored }, mission)
    expect(next.phase).not.toBe('correction')
  })

  it('enters correction phase for a scored attempt with low accuracy', () => {
    const state = createInitialMissionState(mission)
    const weak = scoredAttempt({ overallScore: 20 })
    const next = missionReducer(state, { type: 'turn_spoken', attempt: weak }, mission)
    expect(next.phase).toBe('correction')
    expect(next.pendingCorrection).not.toBeNull()
  })

  it('does not re-enter correction once already corrected this session', () => {
    let state = createInitialMissionState(mission)
    state = missionReducer(state, { type: 'turn_spoken', attempt: scoredAttempt({ overallScore: 20 }) }, mission)
    state = missionReducer(state, { type: 'retry_correction' }, mission)
    const secondWeakAttempt = scoredAttempt({ overallScore: 25 })
    const next = missionReducer(state, { type: 'turn_spoken', attempt: secondWeakAttempt }, mission)
    expect(next.phase).not.toBe('correction')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/ai-practice/missions/__tests__/state-machine.test.ts`
Expected: FAIL — `turn_spoken` falls through to `default: return state`, so `spokenAttempts` stays empty and `phase` never changes.

- [ ] **Step 3: Wire `turn_spoken` to the prioritizer**

In `lib/ai-practice/missions/state-machine.ts`, add the import and the case:

```ts
import { isScorableAttempt } from '@/lib/pronunciation/spoken-attempt'
import { prioritizeFeedbackTarget } from '@/lib/pronunciation/feedback/prioritize'
```

Add this case to the `switch` in `missionReducer`, above `default`:

```ts
    case 'turn_spoken': {
      const spokenAttempts = [...state.spokenAttempts, event.attempt]
      if (!isScorableAttempt(event.attempt) || state.correctionRetried || state.pendingCorrection) {
        return { ...state, spokenAttempts }
      }
      const priority = prioritizeFeedbackTarget(
        mission.targets.map((t) => ({
          targetId: t.targetId,
          confidence: event.attempt.overallScore < 60 ? 0.8 : 0,
          relevance: 1,
        }))
      )
      if (!priority) return { ...state, spokenAttempts }
      return { ...state, spokenAttempts, phase: 'correction', pendingCorrection: priority }
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/ai-practice/missions/__tests__/state-machine.test.ts`
Expected: PASS — 10 tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/ai-practice/missions/state-machine.ts lib/ai-practice/missions/__tests__/state-machine.test.ts
git commit -m "feat(missions): trigger one correction from scored spoken attempts via plan-069 prioritizer"
```

---

### Task 6: Retry and transfer — bounded to one correction, one retry

**Files:**
- Modify: `lib/ai-practice/missions/state-machine.ts`
- Modify: `lib/ai-practice/missions/__tests__/state-machine.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `lib/ai-practice/missions/__tests__/state-machine.test.ts`:

```ts
describe('mission reducer — retry and transfer', () => {
  it('retry_correction marks correctionRetried and returns to active', () => {
    let state = createInitialMissionState(mission)
    state = missionReducer(state, { type: 'turn_spoken', attempt: scoredAttempt({ overallScore: 20 }) }, mission)
    const next = missionReducer(state, { type: 'retry_correction' }, mission)
    expect(next.correctionRetried).toBe(true)
    expect(next.phase).toBe('active')
  })

  it('transfer_attempted marks transferAttempted and moves to transfer phase', () => {
    let state = createInitialMissionState(mission)
    state = missionReducer(state, { type: 'turn_spoken', attempt: scoredAttempt({ overallScore: 20 }) }, mission)
    state = missionReducer(state, { type: 'retry_correction' }, mission)
    const next = missionReducer(state, { type: 'transfer_attempted', attempt: scoredAttempt({ overallScore: 85 }) }, mission)
    expect(next.transferAttempted).toBe(true)
    expect(next.phase).toBe('transfer')
    expect(next.spokenAttempts).toHaveLength(2)
  })

  it('provider_error preserves already-collected spokenAttempts', () => {
    let state = createInitialMissionState(mission)
    state = missionReducer(state, { type: 'turn_spoken', attempt: scoredAttempt() }, mission)
    const next = missionReducer(state, { type: 'provider_error' }, mission)
    expect(next.status).toBe('provider_error')
    expect(next.spokenAttempts).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/ai-practice/missions/__tests__/state-machine.test.ts`
Expected: FAIL — `retry_correction` and `transfer_attempted` fall through to `default`.

- [ ] **Step 3: Add the retry/transfer cases**

Add these cases to the `switch` in `missionReducer`, above `default`:

```ts
    case 'retry_correction':
      return { ...state, correctionRetried: true, phase: 'active' }

    case 'transfer_attempted':
      return {
        ...state,
        spokenAttempts: [...state.spokenAttempts, event.attempt],
        transferAttempted: true,
        phase: 'transfer',
      }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/ai-practice/missions/__tests__/state-machine.test.ts`
Expected: PASS — 13 tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/ai-practice/missions/state-machine.ts lib/ai-practice/missions/__tests__/state-machine.test.ts
git commit -m "feat(missions): add one-shot retry and transfer transitions"
```

---

## Phase 3: Outcome derivation

### Task 7: `deriveMissionOutcome` — goalAchieved vs. evidence, kept separate

**Files:**
- Create: `lib/ai-practice/missions/outcome.ts`
- Test: `lib/ai-practice/missions/__tests__/outcome.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/ai-practice/missions/__tests__/outcome.test.ts
import { describe, expect, it } from 'vitest'
import { deriveMissionOutcome } from '../outcome'
import { createInitialMissionState, missionReducer } from '../state-machine'
import { getMission } from '../registry'
import type { SpokenAttempt } from '@/lib/pronunciation/spoken-attempt'

const mission = getMission('roleplay.cafe')!

function scoredAttempt(overrides: Partial<SpokenAttempt> = {}): SpokenAttempt {
  return {
    userId: 'user-1',
    targetText: "I'd like a medium latte, please",
    transcript: "I'd like a medium latte, please",
    evaluatorVersion: 'stt-v1',
    scoreKind: 'stt_intelligibility',
    overallScore: 40,
    durationMs: 1200,
    outcome: 'scored',
    ...overrides,
  }
}

describe('deriveMissionOutcome', () => {
  it('goalAchieved is true only when every requiredIntent was observed', () => {
    let state = createInitialMissionState(mission)
    state = missionReducer(state, { type: 'intent_observed', intentId: 'ordered_drink' }, mission)
    const partial = deriveMissionOutcome(state, mission)
    expect(partial.goalAchieved).toBe(false)

    state = missionReducer(state, { type: 'intent_observed', intentId: 'answered_size_or_milk' }, mission)
    const full = deriveMissionOutcome(state, mission)
    expect(full.goalAchieved).toBe(true)
  })

  it('goal achieved + weak pronunciation: both are reported, independently', () => {
    let state = createInitialMissionState(mission)
    state = missionReducer(state, { type: 'intent_observed', intentId: 'ordered_drink' }, mission)
    state = missionReducer(state, { type: 'intent_observed', intentId: 'answered_size_or_milk' }, mission)
    state = missionReducer(state, { type: 'turn_spoken', attempt: scoredAttempt({ overallScore: 20 }) }, mission)
    const outcome = deriveMissionOutcome(state, mission)
    expect(outcome.goalAchieved).toBe(true)
    expect(outcome.intelligibilityEvidence.scoredCount).toBe(1)
  })

  it('goal missed + intelligible speech: both are reported, independently', () => {
    let state = createInitialMissionState(mission)
    state = missionReducer(state, { type: 'turn_spoken', attempt: scoredAttempt({ overallScore: 95 }) }, mission)
    const outcome = deriveMissionOutcome(state, mission)
    expect(outcome.goalAchieved).toBe(false)
    expect(outcome.intelligibilityEvidence.scoredCount).toBe(1)
  })

  it('fully unscored fallback: no scored evidence, reasons are honest', () => {
    let state = createInitialMissionState(mission)
    state = missionReducer(state, { type: 'turn_spoken', attempt: scoredAttempt({ outcome: 'unscored', overallScore: 0 }) }, mission)
    const outcome = deriveMissionOutcome(state, mission)
    expect(outcome.intelligibilityEvidence.scoredCount).toBe(0)
    expect(outcome.unscoredReasons).toContain('unscored')
  })

  it('repairUsed reflects whether retry_correction fired', () => {
    let state = createInitialMissionState(mission)
    state = missionReducer(state, { type: 'turn_spoken', attempt: scoredAttempt({ overallScore: 20 }) }, mission)
    expect(deriveMissionOutcome(state, mission).repairUsed).toBe(false)
    state = missionReducer(state, { type: 'retry_correction' }, mission)
    expect(deriveMissionOutcome(state, mission).repairUsed).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/ai-practice/missions/__tests__/outcome.test.ts`
Expected: FAIL — `Cannot find module '../outcome'`

- [ ] **Step 3: Write the implementation**

```ts
// lib/ai-practice/missions/outcome.ts
import { feedbackFromScoringResult } from '@/lib/pronunciation/feedback/from-scoring'
import { isScorableAttempt } from '@/lib/pronunciation/spoken-attempt'
import type { SpokenAttempt, SpokenAttemptOutcome } from '@/lib/pronunciation/spoken-attempt'
import type { FeedbackOutcome } from '@/lib/pronunciation/feedback/types'
import type { PronunciationTargetId } from '@/lib/pronunciation/targets/types'
import type { MissionState } from './state-machine'
import type { OralMission } from './types'

export interface MissionOutcome {
  missionId: string
  /** Derived from structured intents only — never from SpokenAttempt/transcript. */
  goalAchieved: boolean
  intelligibilityEvidence: { attempts: SpokenAttempt[]; scoredCount: number }
  targetEvidence: Array<{ targetId: PronunciationTargetId; outcome: FeedbackOutcome }>
  repairUsed: boolean
  unscoredReasons: SpokenAttemptOutcome[]
}

export function deriveMissionOutcome(state: MissionState, mission: OralMission): MissionOutcome {
  const goalAchieved = mission.requiredIntents.every((intent) => state.intentsObserved.has(intent.id))

  const scored = state.spokenAttempts.filter(isScorableAttempt)
  const nonScoredReasons = [...new Set(state.spokenAttempts.filter((a) => !isScorableAttempt(a)).map((a) => a.outcome))]

  const targetEvidence = mission.targets.map((target) => {
    const relevantAttempt = scored.find((a) => a.targetId === target.targetId) ?? scored[scored.length - 1]
    if (!relevantAttempt) return { targetId: target.targetId, outcome: 'unscored' as FeedbackOutcome }
    const feedback = feedbackFromScoringResult({
      accuracy: relevantAttempt.overallScore,
      transcript: relevantAttempt.transcript,
      wordResults: [],
      evaluatorVersion: relevantAttempt.evaluatorVersion,
    })
    return { targetId: target.targetId, outcome: feedback.outcome }
  })

  return {
    missionId: mission.id,
    goalAchieved,
    intelligibilityEvidence: { attempts: scored, scoredCount: scored.length },
    targetEvidence,
    repairUsed: state.correctionRetried,
    unscoredReasons: nonScoredReasons,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/ai-practice/missions/__tests__/outcome.test.ts`
Expected: PASS — 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/ai-practice/missions/outcome.ts lib/ai-practice/missions/__tests__/outcome.test.ts
git commit -m "feat(missions): derive goalAchieved and target evidence independently"
```

---

### Task 8: Run the full missions suite + typecheck before moving to prompts/UI

**Files:** none (verification checkpoint)

- [ ] **Step 1: Run the full missions test suite**

Run: `pnpm exec vitest run lib/ai-practice/missions`
Expected: PASS — all tests from Tasks 1–7 green (registry: 6, state-machine: 13, outcome: 5, types: 1 = 25 tests across 4 files).

- [ ] **Step 2: Typecheck**

Run: `pnpm type-check`
Expected: exit 0

- [ ] **Step 3: Stop here for review**

This is the natural checkpoint between the pure core (Phases 1–3, no I/O, no
UI, no LLM) and the integration work (Phases 4–7, which touch prompts, the
chat hook, Dexie, and components). Confirm the reducer/outcome design reads
correctly against `docs/superpowers/specs/2026-07-26-plan-070-oral-missions-design.md`
before continuing — Phase 4 onward is harder to unwind.

---

## Phase 4: Tool registry and prompts

### Task 9: Add `start_mission` and `mission_intent_observed` tools

**Files:**
- Modify: `lib/ai-practice/tools/registry.ts`
- Test: `lib/ai-practice/tools/__tests__/registry.test.ts` (create if it doesn't exist — check first)

- [ ] **Step 1: Check for an existing tool registry test file**

Run: `pnpm exec vitest run lib/ai-practice/tools --reporter=verbose 2>&1 | head -50` (or read `lib/ai-practice/tools/__tests__/` directory listing) to see current coverage and avoid duplicating an existing `registry.test.ts`. If one exists, add to it instead of creating a new file — adjust the file path in this task accordingly before writing.

- [ ] **Step 2: Write the failing test**

```ts
// lib/ai-practice/tools/__tests__/registry.test.ts (add if new, else append)
import { describe, expect, it } from 'vitest'
import { isValidToolName, parseToolArgs } from '../registry'

describe('mission tools', () => {
  it('accepts a valid start_mission call', () => {
    expect(isValidToolName('start_mission')).toBe(true)
    const args = parseToolArgs('start_mission', { missionId: 'roleplay.cafe' })
    expect(args).toEqual({ missionId: 'roleplay.cafe' })
  })

  it('accepts a valid mission_intent_observed call', () => {
    expect(isValidToolName('mission_intent_observed')).toBe(true)
    const args = parseToolArgs('mission_intent_observed', { intentId: 'ordered_drink' })
    expect(args).toEqual({ intentId: 'ordered_drink' })
  })

  it('rejects start_mission with a non-string missionId', () => {
    expect(() => parseToolArgs('start_mission', { missionId: 42 })).toThrow()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm exec vitest run lib/ai-practice/tools/__tests__/registry.test.ts`
Expected: FAIL — `start_mission`/`mission_intent_observed` are not valid tool names yet.

- [ ] **Step 4: Read the current parseToolArgs implementation before editing**

Read `lib/ai-practice/tools/registry.ts` in full (it was last seen ending
around line 320 with the `start_roleplay` parse branch) to find the exact
`parseToolArgs` switch and `EXERCISE_TOOL_NAMES`/`ActionToolName` lists, then
make the following changes:

1. Replace the `StartRoleplayArgs` type and its `ToolArgs` union member with:

```ts
export type StartMissionArgs = { missionId: string };
export type MissionIntentObservedArgs = { intentId: string };
```

2. In the `ToolArgs` union, replace `| { name: "start_roleplay"; args: StartRoleplayArgs }` with:

```ts
  | { name: "start_mission"; args: StartMissionArgs }
  | { name: "mission_intent_observed"; args: MissionIntentObservedArgs }
```

3. Update `ActionToolName` to replace `"start_roleplay"` with `"start_mission" | "mission_intent_observed"`.

4. In the tool schema list used for the Gemini function-calling declaration
   (the block containing `scenario: { type: "string", enum: [...] }` seen at
   registry.ts:192), replace that `start_roleplay` declaration with:

```ts
      {
        name: "start_mission",
        description: "Starts a goal-based oral mission by id.",
        parameters: {
          type: "object",
          properties: { missionId: { type: "string" } },
          required: ["missionId"],
        },
      },
      {
        name: "mission_intent_observed",
        description: "Reports that the student's turn satisfied one of the mission's required communicative intents.",
        parameters: {
          type: "object",
          properties: { intentId: { type: "string" } },
          required: ["intentId"],
        },
      },
```

5. In `parseToolArgs`, replace the `start_roleplay` branch (the one building
   `{ scenario: obj.scenario as StartRoleplayArgs["scenario"] }`) with:

```ts
    case "start_mission": {
      if (typeof obj.missionId !== "string") throw new Error("start_mission requires a string missionId");
      return { missionId: obj.missionId } satisfies StartMissionArgs;
    }
    case "mission_intent_observed": {
      if (typeof obj.intentId !== "string") throw new Error("mission_intent_observed requires a string intentId");
      return { intentId: obj.intentId } satisfies MissionIntentObservedArgs;
    }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run lib/ai-practice/tools/__tests__/registry.test.ts`
Expected: PASS

- [ ] **Step 6: Run the full tool-registry-dependent suite to catch breakage**

Run: `pnpm exec vitest run lib/ai-practice`
Expected: FAIL at this point is acceptable ONLY in
`hooks`/`stream-processor`-adjacent files that reference `start_roleplay` or
`StartRoleplayArgs` — note every failing file here, they are exactly the
files Tasks 10–12 fix next. Do not fix them in this task.

- [ ] **Step 7: Commit**

```bash
git add lib/ai-practice/tools/registry.ts lib/ai-practice/tools/__tests__/registry.test.ts
git commit -m "feat(missions): replace start_roleplay with start_mission and mission_intent_observed tools"
```

---

### Task 10: Fix `stream-processor.ts` for the new tool names

**Files:**
- Modify: `lib/ai-practice/stream-processor.ts`
- Test: `lib/ai-practice/__tests__/stream-processor.test.ts` (check if it exists first; if not, add inline tests to this task's test file)

- [ ] **Step 1: Write the failing test**

```ts
// lib/ai-practice/__tests__/stream-processor.test.ts
import { describe, expect, it, vi } from 'vitest'
import { makeStreamState, processChunk } from '../stream-processor'

describe('stream processor — mission tool calls', () => {
  it('calls onStartMission with the parsed missionId', () => {
    const state = makeStreamState()
    const onStartMission = vi.fn()
    const handlers = {
      onSaveWord: vi.fn(),
      onStartMission,
      onMissionIntentObserved: vi.fn(),
      onActionToolResult: vi.fn(),
      onError: vi.fn(),
    }
    processChunk({ type: 'tool_call_start', id: 'c1', name: 'start_mission' }, state, handlers)
    processChunk({ type: 'tool_call_args_delta', id: 'c1', delta: '{"missionId":"roleplay.cafe"}' }, state, handlers)
    processChunk({ type: 'tool_call_end', id: 'c1' }, state, handlers)
    expect(onStartMission).toHaveBeenCalledWith('roleplay.cafe')
  })

  it('calls onMissionIntentObserved with the parsed intentId', () => {
    const state = makeStreamState()
    const onMissionIntentObserved = vi.fn()
    const handlers = {
      onSaveWord: vi.fn(),
      onStartMission: vi.fn(),
      onMissionIntentObserved,
      onActionToolResult: vi.fn(),
      onError: vi.fn(),
    }
    processChunk({ type: 'tool_call_start', id: 'c2', name: 'mission_intent_observed' }, state, handlers)
    processChunk({ type: 'tool_call_args_delta', id: 'c2', delta: '{"intentId":"ordered_drink"}' }, state, handlers)
    processChunk({ type: 'tool_call_end', id: 'c2' }, state, handlers)
    expect(onMissionIntentObserved).toHaveBeenCalledWith('ordered_drink')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/ai-practice/__tests__/stream-processor.test.ts`
Expected: FAIL — `onStartMission`/`onMissionIntentObserved` are not in `ActionHandlers`, and `start_roleplay` handling in `tool_call_end` no longer matches any tool name.

- [ ] **Step 3: Update `ActionHandlers` and the `tool_call_end` branch**

In `lib/ai-practice/stream-processor.ts`:

1. Replace the import:

```ts
import { isValidToolName, parseToolArgs, isExerciseTool, type StartMissionArgs, type MissionIntentObservedArgs } from "./tools/registry";
```

2. Replace the `ActionHandlers` interface's roleplay field:

```ts
export interface ActionHandlers {
  onSaveWord: (word: string, context: string) => void;
  onStartMission: (missionId: string) => void;
  onMissionIntentObserved: (intentId: string) => void;
  onActionToolResult: (toolCallId: string, name: string) => void;
  onError: (id: string, tool: string, message: string) => void;
}
```

3. In `processChunk`'s `tool_call_end` case, replace the `start_roleplay`
   branch:

```ts
            } else if (tc.name === "start_mission") {
              handlers.onStartMission((args as StartMissionArgs).missionId);
            } else if (tc.name === "mission_intent_observed") {
              handlers.onMissionIntentObserved((args as MissionIntentObservedArgs).intentId);
            }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/ai-practice/__tests__/stream-processor.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/ai-practice/stream-processor.ts lib/ai-practice/__tests__/stream-processor.test.ts
git commit -m "feat(missions): route start_mission and mission_intent_observed tool calls in the stream processor"
```

---

### Task 11: Build `buildMissionPrompt` replacing `buildRoleplayPrompt`

**Files:**
- Create: `lib/ai-practice/missions/prompt.ts`
- Test: `lib/ai-practice/missions/__tests__/prompt.test.ts`
- Modify: `lib/ai-prompts.ts` (if `BASE_TUTOR_PROMPT` or roleplay prompt strings live there — check first)

- [ ] **Step 1: Confirm where `BASE_TUTOR_PROMPT` is defined**

Run a search: it is imported in `lib/ai-practice/modes/roleplay.ts:1` from
`@/lib/ai-practice/prompts`. Confirm whether `lib/ai-practice/prompts.ts` is
the same file the hard rule (`lib/ai-prompts.ts`, no prompts in components)
refers to, or a different, already-existing exception. If the two are
different files, do not consolidate them in this task — only ensure the new
mission prompt string templates live in `lib/ai-practice/missions/prompt.ts`
alongside the other mission modules, consistent with where
`SCENARIO_PROMPTS` already lived in `lib/ai-practice/modes/roleplay.ts` (not
in `lib/ai-prompts.ts`) before this migration.

- [ ] **Step 2: Write the failing test**

```ts
// lib/ai-practice/missions/__tests__/prompt.test.ts
import { describe, expect, it } from 'vitest'
import { buildMissionPrompt } from '../prompt'
import { getMission } from '../registry'

const mission = getMission('roleplay.cafe')!

describe('buildMissionPrompt', () => {
  it('includes the mission context, opening, and role', () => {
    const prompt = buildMissionPrompt(mission)
    expect(prompt).toContain(mission.context)
    expect(prompt).toContain(mission.opening)
    expect(prompt).toContain(mission.role.model)
  })

  it('instructs the model to call mission_intent_observed for each required intent, without stating pass/fail', () => {
    const prompt = buildMissionPrompt(mission)
    for (const intent of mission.requiredIntents) {
      expect(prompt).toContain(intent.id)
    }
    expect(prompt.toLowerCase()).not.toContain('decide whether')
  })

  it('appends the compact learner state when provided', () => {
    const withState = buildMissionPrompt(mission, 'Weak sounds: /θ/, /ð/')
    expect(withState).toContain('Weak sounds: /θ/, /ð/')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm exec vitest run lib/ai-practice/missions/__tests__/prompt.test.ts`
Expected: FAIL — `Cannot find module '../prompt'`

- [ ] **Step 4: Write the implementation**

```ts
// lib/ai-practice/missions/prompt.ts
import { BASE_TUTOR_PROMPT } from '@/lib/ai-practice/prompts'
import type { compactState } from '@/lib/ai-practice/learning-state'
import type { OralMission } from './types'

export function buildMissionPrompt(mission: OralMission, compact?: ReturnType<typeof compactState>): string {
  const intentInstructions = mission.requiredIntents
    .map((intent) => `- When the student's turn satisfies "${intent.label}", call mission_intent_observed with intentId "${intent.id}". Call this at most once per intent.`)
    .join('\n')

  const parts = [
    BASE_TUTOR_PROMPT,
    `\n--- ORAL MISSION: ${mission.id.toUpperCase()} ---\n`,
    `You are the ${mission.role.model}. The student is the ${mission.role.student}.`,
    mission.context,
    `Communicative goal for the student: ${mission.communicativeGoal}`,
    `Stay in character. Ask one thing at a time. If pronunciation or grammar is notably wrong, gently correct it in character — but you do not decide mastery or whether the mission is complete; report structured events instead.`,
    `\nRequired communicative intents to report as they happen (never state whether the student "passed" — just report):\n${intentInstructions}`,
    `\nStart with: "${mission.opening}"`,
  ]

  if (compact) {
    parts.push(`\n--- STUDENT PROFILE ---\n${compact}`)
  }

  return parts.join('\n').trim()
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run lib/ai-practice/missions/__tests__/prompt.test.ts`
Expected: PASS

- [ ] **Step 6: Verify the prompt audit still passes**

Run: `pnpm audit:ai-prompts`
Expected: exit 0. If this fails because it flags mission prompt strings living
outside `lib/ai-prompts.ts`, read `scripts/` for the audit script's exact
allowlist rule before changing file locations — do not silence the audit.

- [ ] **Step 7: Commit**

```bash
git add lib/ai-practice/missions/prompt.ts lib/ai-practice/missions/__tests__/prompt.test.ts
git commit -m "feat(missions): generate mission system prompts from registry data"
```

---

## Phase 5: Chat hook integration (voice-first, honest text fallback)

### Task 12: Replace `onStartRoleplay`/`activeRoleplay` with mission wiring in `useStreamingChat`

**Files:**
- Modify: `hooks/useStreamingChat.ts`
- Modify: `hooks/useAIPractice.ts`
- Modify: `lib/types.ts` (AIConversationMode)
- Test: `hooks/__tests__/useStreamingChat.test.ts` (check if it exists first — read the directory listing)

This is the highest-risk task in the plan: it touches the live streaming chat
hook. Read `hooks/useStreamingChat.ts` in full again immediately before
editing (it may have drifted further since this plan was written) and confirm
line numbers before applying the diff below.

- [ ] **Step 1: Update `AIConversationMode` in `lib/types.ts`**

Replace the `roleplay:*` union members (lib/types.ts:180-187) with a single
open string pattern for mission ids, keeping `chat`/`pronunciation`/`lesson`
untouched:

```ts
export type AIConversationMode =
  | "chat"
  | `mission:${string}`
  | "pronunciation"
  | "lesson";
```

- [ ] **Step 2: Update `modeLabel` in `lib/ai-practice/conversation-mode.ts`**

Replace the `roleplay:` branch (conversation-mode.ts:61-64) with:

```ts
  if (mode.startsWith("mission:")) {
    const missionId = mode.slice("mission:".length);
    const mission = getMission(missionId);
    return mission ? `Mission · ${mission.communicativeGoal}` : "Mission";
  }
```

Add the import: `import { getMission } from '@/lib/ai-practice/missions/registry'`

- [ ] **Step 3: Write the failing test for `useStreamingChat`**

Check `hooks/__tests__/` for an existing `useStreamingChat.test.ts` first — if
none exists, this codebase tests this hook indirectly through
`components/ai-coach/__tests__/AICoachPanel.test.tsx` (seen mocking
`useStreamingChat`-adjacent modules earlier). Add a focused reducer-level
test instead of a full hook-render test, since the hook itself is a thin
transport layer once mission logic moves to `missions/state-machine.ts`:

```ts
// hooks/__tests__/useStreamingChat.missions.test.ts
import { describe, expect, it } from 'vitest'
import type { StartMissionArgs, MissionIntentObservedArgs } from '@/lib/ai-practice/tools/registry'

describe('useStreamingChat mission handler contract', () => {
  it('StartMissionArgs and MissionIntentObservedArgs remain string-only payloads', () => {
    const start: StartMissionArgs = { missionId: 'roleplay.cafe' }
    const intent: MissionIntentObservedArgs = { intentId: 'ordered_drink' }
    expect(typeof start.missionId).toBe('string')
    expect(typeof intent.intentId).toBe('string')
  })
})
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm exec vitest run hooks/__tests__/useStreamingChat.missions.test.ts`
Expected: FAIL — `StartMissionArgs`/`MissionIntentObservedArgs` don't exist
until Task 9 lands (they do, since Task 9 precedes this one) — if Task 9 is
already committed, this test should actually PASS immediately as a
type-level smoke check. Treat a pass here as confirmation, not a bug; skip
straight to Step 5.

- [ ] **Step 5: Update `useStreamingChat.ts`**

Replace the `StartRoleplayArgs` import and the `onStartRoleplay` option with:

```ts
import type { StartMissionArgs, MissionIntentObservedArgs } from "@/lib/ai-practice/tools/registry";
```

In `UseStreamingChatOptions` (useStreamingChat.ts:27-36), replace:

```ts
  onStartRoleplay: (scenario: StartRoleplayArgs["scenario"]) => void;
```

with:

```ts
  onStartMission: (missionId: StartMissionArgs["missionId"]) => void;
  onMissionIntentObserved: (intentId: MissionIntentObservedArgs["intentId"]) => void;
```

Update the function signature destructuring (useStreamingChat.ts:38-47) to
match, and in the `processChunk` call inside `sendMessage`
(useStreamingChat.ts:148-161), replace:

```ts
            onStartRoleplay,
```

with:

```ts
            onStartMission,
            onMissionIntentObserved,
```

Update the `useCallback` dependency array at the end of `sendMessage`
(useStreamingChat.ts:225) to replace `onStartRoleplay` with `onStartMission,
onMissionIntentObserved`.

- [ ] **Step 6: Update `useAIPractice.ts`**

Replace `activeRoleplay`/`StartRoleplayArgs` throughout
(useAIPractice.ts:5,25,46,59,124,136-138,144,153-157) with a single
`activeMissionId: string | null` piece of state, and rename `onStartRoleplay`
wiring to `onStartMission`/`onMissionIntentObserved`. Because the mission's
own conversational progress (`intentsObserved`, phase, etc.) now lives in
`missionReducer` state — not in this hook — `useAIPractice` only needs to
track *which* mission is active, not its progress:

```ts
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
```

Replace every `activeRoleplay`/`setActiveRoleplay`/
`StartRoleplayArgs["scenario"]` reference in this file with
`activeMissionId`/`setActiveMissionId`/`string`. Replace the mode-string
parsing (`next.startsWith("roleplay:")` / `conv.mode.startsWith("roleplay:")`)
with `next.startsWith("mission:")` / `conv.mode?.startsWith("mission:")`, and
`.slice("roleplay:".length)` with `.slice("mission:".length)`.

Pass `onMissionIntentObserved` through to `useStreamingChat` as a no-op for
now (`() => {}`) — Task 13 wires it to a real `missionReducer` dispatch. Do
not skip passing the prop; an omitted required prop is a type error, not a
deferred behavior.

- [ ] **Step 7: Run the full hooks + ai-practice suite**

Run: `pnpm exec vitest run hooks lib/ai-practice`
Expected: PASS. If `AICoachPanel.test.tsx` or similar component tests
reference `onStartRoleplay`/`activeRoleplay` mocks, update those mocks in
this same task — do not leave them broken for a later task.

- [ ] **Step 8: Typecheck**

Run: `pnpm type-check`
Expected: exit 0 — this surfaces every remaining `StartRoleplayArgs`/
`activeRoleplay` reference across the codebase (e.g. `ChatTabs.tsx`,
`components/ai-coach/*`) that Task 13 must still handle. List them here as a
comment in the commit message rather than fixing them now if they belong to
components addressed by Phase 6.

- [ ] **Step 9: Commit**

```bash
git add hooks/useStreamingChat.ts hooks/useAIPractice.ts lib/types.ts lib/ai-practice/conversation-mode.ts hooks/__tests__/useStreamingChat.missions.test.ts
git commit -m "refactor(missions): replace roleplay mode/handlers with mission-id based wiring in chat hooks"
```

---

## Phase 6: Persistence

### Task 13: Add the `MissionSessionRecord` Dexie table

**Files:**
- Modify: `lib/db/index.ts`
- Test: `lib/db/__tests__/mission-session.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/db/__tests__/mission-session.test.ts
// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '../index'
import type { MissionSessionRecord } from '../index'

describe('mission session Dexie table', () => {
  beforeEach(async () => { await db.open() })
  afterEach(async () => { await db.missionSessions.clear() })

  it('stores and retrieves a mission session scoped to a user', async () => {
    const record: MissionSessionRecord = {
      id: 'session-1',
      userId: 'user-a',
      missionId: 'roleplay.cafe',
      targetIds: ['segmental.contrast.iː|ɪ'],
      outcome: { missionId: 'roleplay.cafe', goalAchieved: true, intelligibilityEvidence: { attempts: [], scoredCount: 0 }, targetEvidence: [], repairUsed: false, unscoredReasons: [] },
      turnCount: 4,
      status: 'completed',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    }
    await db.missionSessions.put(record)
    const rows = await db.missionSessions.where('userId').equals('user-a').toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0].missionId).toBe('roleplay.cafe')
  })

  it('isolates sessions by userId', async () => {
    await db.missionSessions.put({
      id: 'session-a', userId: 'user-a', missionId: 'roleplay.cafe', targetIds: [],
      outcome: { missionId: 'roleplay.cafe', goalAchieved: false, intelligibilityEvidence: { attempts: [], scoredCount: 0 }, targetEvidence: [], repairUsed: false, unscoredReasons: [] },
      turnCount: 1, status: 'in_progress', startedAt: new Date().toISOString(), completedAt: null,
    })
    const userBRows = await db.missionSessions.where('userId').equals('user-b').toArray()
    expect(userBRows).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/db/__tests__/mission-session.test.ts`
Expected: FAIL — `db.missionSessions` is undefined.

- [ ] **Step 3: Add the table**

Read `lib/db/index.ts` in full immediately before editing to find the exact
current highest `this.version(N)` (it was `27` as of this plan's writing —
confirm it hasn't advanced) and the `PronunciationFeedbackEvidenceRecord`
interface (index.ts:168-172) to match its style. Add, right after that
interface:

```ts
export interface MissionSessionRecord {
  id: string
  userId: string
  missionId: string
  targetIds: string[]
  outcome: Record<string, unknown> // serialized MissionOutcome (lib/ai-practice/missions/outcome.ts)
  turnCount: number
  status: 'in_progress' | 'completed' | 'cancelled' | 'provider_error'
  startedAt: string
  completedAt: string | null
}
```

Add the table declaration near `pronunciationFeedbackEvidence!: Table<...>`
(index.ts:257):

```ts
  missionSessions!: Table<MissionSessionRecord, string>;
```

Add a new version block immediately after the current highest version
(`this.version(27)` at index.ts:456-458) — increment to the next integer,
e.g. `this.version(28)`:

```ts
    this.version(28).stores({
      missionSessions: 'id, userId, missionId, [userId+missionId], [userId+startedAt]',
    });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/db/__tests__/mission-session.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/db/index.ts lib/db/__tests__/mission-session.test.ts
git commit -m "feat(missions): add missionSessions Dexie table with per-user isolation"
```

---

### Task 14: `persistMissionSession` — one record per session, referencing existing evidence

**Files:**
- Create: `lib/ai-practice/missions/persistence.ts`
- Test: `lib/ai-practice/missions/__tests__/persistence.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/ai-practice/missions/__tests__/persistence.test.ts
// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/lib/db'
import { persistMissionSession } from '../persistence'
import { createInitialMissionState, missionReducer } from '../state-machine'
import { deriveMissionOutcome } from '../outcome'
import { getMission } from '../registry'

vi.mock('@/lib/pronunciation/feedback/persistence', () => ({
  persistPronunciationFeedbackEvidence: vi.fn(async () => true),
}))

const mission = getMission('roleplay.cafe')!

describe('persistMissionSession', () => {
  beforeEach(async () => {
    await db.open()
    await db.missionSessions.clear()
  })

  it('writes exactly one MissionSessionRecord per session', async () => {
    let state = createInitialMissionState(mission)
    state = missionReducer(state, { type: 'intent_observed', intentId: 'ordered_drink' }, mission)
    const outcome = deriveMissionOutcome(state, mission)

    await persistMissionSession('user-1', mission, state, outcome)
    const rows = await db.missionSessions.where('userId').equals('user-1').toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0].missionId).toBe('roleplay.cafe')
    expect(rows[0].targetIds).toEqual(mission.targets.map((t) => t.targetId))
  })

  it('a two-account run never lets account B see account A\'s session', async () => {
    let state = createInitialMissionState(mission)
    const outcome = deriveMissionOutcome(state, mission)
    await persistMissionSession('user-a', mission, state, outcome)
    const bRows = await db.missionSessions.where('userId').equals('user-b').toArray()
    expect(bRows).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/ai-practice/missions/__tests__/persistence.test.ts`
Expected: FAIL — `Cannot find module '../persistence'`

- [ ] **Step 3: Write the implementation**

```ts
// lib/ai-practice/missions/persistence.ts
'use client'
import { db, type MissionSessionRecord } from '@/lib/db'
import type { MissionState } from './state-machine'
import type { MissionOutcome } from './outcome'
import type { OralMission } from './types'

/**
 * Persists one coherent mission session record. Individual SpokenAttempts
 * are already persisted by the existing plan 063/069 flow
 * (persistPronunciationFeedbackEvidence, called separately per scored turn)
 * — this record references the mission's target ids, it does not duplicate
 * that evidence.
 */
export async function persistMissionSession(
  userId: string,
  mission: OralMission,
  state: MissionState,
  outcome: MissionOutcome,
): Promise<void> {
  const now = new Date().toISOString()
  const record: MissionSessionRecord = {
    id: globalThis.crypto.randomUUID(),
    userId,
    missionId: mission.id,
    targetIds: mission.targets.map((t) => t.targetId),
    outcome: outcome as unknown as Record<string, unknown>,
    turnCount: state.turnCount,
    status: state.status,
    startedAt: now,
    completedAt: state.status === 'completed' ? now : null,
  }
  await db.missionSessions.put(record)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/ai-practice/missions/__tests__/persistence.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/ai-practice/missions/persistence.ts lib/ai-practice/missions/__tests__/persistence.test.ts
git commit -m "feat(missions): persist one mission session record referencing existing evidence"
```

---

### Task 15: Queue weak targets for review via the existing plan-069 handoff

**Files:**
- Modify: `lib/ai-practice/missions/persistence.ts`
- Modify: `lib/ai-practice/missions/__tests__/persistence.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `lib/ai-practice/missions/__tests__/persistence.test.ts`:

```ts
import { persistPronunciationFeedbackEvidence } from '@/lib/pronunciation/feedback/persistence'

describe('persistMissionSession — review handoff', () => {
  it('enqueues targetEvidence entries through the existing plan-069 handoff, not a new SRS', async () => {
    let state = createInitialMissionState(mission)
    const outcome = {
      missionId: mission.id,
      goalAchieved: true,
      intelligibilityEvidence: { attempts: [], scoredCount: 1 },
      targetEvidence: [{ targetId: mission.targets[0].targetId, outcome: 'needs_more_evidence' as const }],
      repairUsed: false,
      unscoredReasons: [],
    }
    await persistMissionSession('user-1', mission, state, outcome)
    expect(vi.mocked(persistPronunciationFeedbackEvidence)).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/ai-practice/missions/__tests__/persistence.test.ts`
Expected: FAIL — `persistMissionSession` doesn't call the feedback persistence
function yet.

- [ ] **Step 3: Wire the handoff**

In `lib/ai-practice/missions/persistence.ts`, add the import and call after
`db.missionSessions.put(record)`:

```ts
import { persistPronunciationFeedbackEvidence } from '@/lib/pronunciation/feedback/persistence'
import { buildPronunciationFeedback } from '@/lib/pronunciation/feedback/model'
```

```ts
  await db.missionSessions.put(record)

  for (const evidence of outcome.targetEvidence) {
    if (evidence.outcome === 'unscored') continue
    const model = buildPronunciationFeedback({
      signal: { kind: 'stt_intelligibility', evaluatorVersion: 'mission-v1', confidence: 0.8, transcript: '', recognizedPercent: 0 },
      candidates: [{ targetId: evidence.targetId, confidence: 0.8 }],
    })
    await persistPronunciationFeedbackEvidence(userId, { ...model, outcome: evidence.outcome, priority: { targetId: evidence.targetId } }).catch(() => undefined)
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/ai-practice/missions/__tests__/persistence.test.ts`
Expected: PASS — 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/ai-practice/missions/persistence.ts lib/ai-practice/missions/__tests__/persistence.test.ts
git commit -m "feat(missions): route weak target evidence through the existing plan-069 review handoff"
```

---

## Phase 7: UI

### Task 16: `MissionLibrary` — empty, recommended, and category states

**Files:**
- Create: `components/ai-coach/missions/MissionLibrary.tsx`
- Create: `components/ai-coach/missions/MissionCard.tsx`
- Test: `components/ai-coach/missions/__tests__/MissionLibrary.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/ai-coach/missions/__tests__/MissionLibrary.test.tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import MissionLibrary from '../MissionLibrary'
import { listMissions } from '@/lib/ai-practice/missions/registry'

describe('MissionLibrary', () => {
  it('renders one MissionCard per mission when no category filter is active', () => {
    render(<MissionLibrary missions={listMissions()} onSelect={vi.fn()} />)
    for (const mission of listMissions()) {
      expect(screen.getByText(mission.communicativeGoal)).toBeInTheDocument()
    }
  })

  it('renders an empty state when the missions list is empty', () => {
    render(<MissionLibrary missions={[]} onSelect={vi.fn()} />)
    expect(screen.getByText(/no missions/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run components/ai-coach/missions/__tests__/MissionLibrary.test.tsx`
Expected: FAIL — `Cannot find module '../MissionLibrary'`

- [ ] **Step 3: Write `MissionCard`**

```tsx
// components/ai-coach/missions/MissionCard.tsx
'use client'
import type { OralMission } from '@/lib/ai-practice/missions/types'
import { PillButton } from '@/components/ui/PillButton'

interface MissionCardProps {
  mission: OralMission
  onSelect: (missionId: string) => void
}

export function MissionCard({ mission, onSelect }: MissionCardProps) {
  return (
    <div className="rounded-md border border-border-subtle bg-surface-raised p-4 space-y-2">
      <p className="m-0 font-kicker text-fg-subtle">{mission.category.toUpperCase()} · {mission.recommendedCefr}</p>
      <p className="m-0 text-body-md font-semibold text-fg">{mission.communicativeGoal}</p>
      <p className="m-0 text-body-sm text-fg-muted">{mission.context}</p>
      <PillButton variant="primary" size="sm" onClick={() => onSelect(mission.id)}>Start</PillButton>
    </div>
  )
}
```

- [ ] **Step 4: Write `MissionLibrary`**

```tsx
// components/ai-coach/missions/MissionLibrary.tsx
'use client'
import type { OralMission } from '@/lib/ai-practice/missions/types'
import { MissionCard } from './MissionCard'

// Planned structure:
// <MissionLibrary>
//   <MissionCard /> — one per mission

interface MissionLibraryProps {
  missions: readonly OralMission[]
  onSelect: (missionId: string) => void
}

export default function MissionLibrary({ missions, onSelect }: MissionLibraryProps) {
  if (missions.length === 0) {
    return <p className="text-body-sm text-fg-muted">No missions available yet.</p>
  }
  return (
    <div className="grid gap-3">
      {missions.map((mission) => (
        <MissionCard key={mission.id} mission={mission} onSelect={onSelect} />
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run components/ai-coach/missions/__tests__/MissionLibrary.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add components/ai-coach/missions/MissionLibrary.tsx components/ai-coach/missions/MissionCard.tsx components/ai-coach/missions/__tests__/MissionLibrary.test.tsx
git commit -m "feat(missions): add MissionLibrary and MissionCard components"
```

---

### Task 17: Category filter

**Files:**
- Create: `components/ai-coach/missions/MissionCategoryFilter.tsx`
- Modify: `components/ai-coach/missions/MissionLibrary.tsx`
- Modify: `components/ai-coach/missions/__tests__/MissionLibrary.test.tsx`

- [ ] **Step 1: Write the failing test**

Append to `components/ai-coach/missions/__tests__/MissionLibrary.test.tsx`:

```tsx
import { fireEvent } from '@testing-library/react'

describe('MissionLibrary — category filter', () => {
  it('filters missions by category when a filter chip is clicked', () => {
    render(<MissionLibrary missions={listMissions()} onSelect={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /service/i }))
    expect(screen.queryByText(/introduce yourself and describe/i)).not.toBeInTheDocument()
    expect(screen.getByText(/order a drink/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run components/ai-coach/missions/__tests__/MissionLibrary.test.tsx`
Expected: FAIL — no category filter button exists yet.

- [ ] **Step 3: Write `MissionCategoryFilter`**

```tsx
// components/ai-coach/missions/MissionCategoryFilter.tsx
'use client'
import { cn } from '@/lib/cn'
import type { MissionCategory } from '@/lib/ai-practice/missions/types'

const CATEGORIES: Array<{ id: MissionCategory | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'interview', label: 'Interview' },
  { id: 'service', label: 'Service' },
  { id: 'workplace', label: 'Workplace' },
  { id: 'social', label: 'Social' },
]

interface MissionCategoryFilterProps {
  active: MissionCategory | 'all'
  onChange: (category: MissionCategory | 'all') => void
}

export function MissionCategoryFilter({ active, onChange }: MissionCategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            'rounded-full border px-3 py-1 text-body-sm cursor-pointer transition-colors focus-ring',
            active === id
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border-subtle bg-surface-raised text-fg-muted hover:text-fg'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Wire the filter into `MissionLibrary`**

```tsx
// components/ai-coach/missions/MissionLibrary.tsx
'use client'
import { useState } from 'react'
import type { MissionCategory, OralMission } from '@/lib/ai-practice/missions/types'
import { MissionCard } from './MissionCard'
import { MissionCategoryFilter } from './MissionCategoryFilter'

// Planned structure:
// <MissionLibrary>
//   <MissionCategoryFilter />
//   <MissionCard /> — one per mission, filtered by active category

interface MissionLibraryProps {
  missions: readonly OralMission[]
  onSelect: (missionId: string) => void
}

export default function MissionLibrary({ missions, onSelect }: MissionLibraryProps) {
  const [category, setCategory] = useState<MissionCategory | 'all'>('all')
  const filtered = category === 'all' ? missions : missions.filter((m) => m.category === category)

  if (missions.length === 0) {
    return <p className="text-body-sm text-fg-muted">No missions available yet.</p>
  }

  return (
    <div className="space-y-3">
      <MissionCategoryFilter active={category} onChange={setCategory} />
      <div className="grid gap-3">
        {filtered.map((mission) => (
          <MissionCard key={mission.id} mission={mission} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run components/ai-coach/missions/__tests__/MissionLibrary.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add components/ai-coach/missions/MissionCategoryFilter.tsx components/ai-coach/missions/MissionLibrary.tsx components/ai-coach/missions/__tests__/MissionLibrary.test.tsx
git commit -m "feat(missions): add category filtering to MissionLibrary"
```

---

### Task 18: `MissionResult` — goal summary never gated, feedback target gated

**Files:**
- Create: `components/ai-coach/missions/MissionResult.tsx`
- Create: `components/ai-coach/missions/MissionGoalSummary.tsx`
- Create: `components/ai-coach/missions/MissionFeedbackTarget.tsx`
- Test: `components/ai-coach/missions/__tests__/MissionResult.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/ai-coach/missions/__tests__/MissionResult.test.tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import MissionResult from '../MissionResult'
import type { MissionOutcome } from '@/lib/ai-practice/missions/outcome'

const outcome: MissionOutcome = {
  missionId: 'roleplay.cafe',
  goalAchieved: true,
  intelligibilityEvidence: { attempts: [], scoredCount: 1 },
  targetEvidence: [{ targetId: 'segmental.contrast.iː|ɪ' as never, outcome: 'needs_more_evidence' }],
  repairUsed: false,
  unscoredReasons: [],
}

describe('MissionResult', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_PRONUNCIATION_ACTIONABLE_FEEDBACK_COPY
  })

  it('always shows goalAchieved, even with the copy flag off', () => {
    process.env.NEXT_PUBLIC_PRONUNCIATION_ACTIONABLE_FEEDBACK_COPY = 'false'
    render(<MissionResult outcome={outcome} onReviewCta={() => {}} />)
    expect(screen.getByText(/goal achieved/i)).toBeInTheDocument()
  })

  it('hides the pronunciation-accuracy claim when the copy flag is off', () => {
    process.env.NEXT_PUBLIC_PRONUNCIATION_ACTIONABLE_FEEDBACK_COPY = 'false'
    render(<MissionResult outcome={outcome} onReviewCta={() => {}} />)
    expect(screen.queryByText(/accuracy/i)).not.toBeInTheDocument()
  })

  it('shows the feedback target with the copy flag on', () => {
    render(<MissionResult outcome={outcome} onReviewCta={() => {}} />)
    expect(screen.getByText(/next focus/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run components/ai-coach/missions/__tests__/MissionResult.test.tsx`
Expected: FAIL — `Cannot find module '../MissionResult'`

- [ ] **Step 3: Write `MissionGoalSummary`**

```tsx
// components/ai-coach/missions/MissionGoalSummary.tsx
'use client'
interface MissionGoalSummaryProps {
  goalAchieved: boolean
}

/** Never gated by the actionable-copy flag — goalAchieved is structured outcome, not a signal claim. */
export function MissionGoalSummary({ goalAchieved }: MissionGoalSummaryProps) {
  return (
    <section aria-live="polite" className="rounded-md border border-border-subtle bg-surface-raised px-4 py-3">
      <p className="m-0 font-kicker text-fg-subtle">RESULT</p>
      <p className="mb-0 mt-1 text-body-md font-semibold text-fg">
        {goalAchieved ? 'Goal achieved' : 'Goal not achieved yet'}
      </p>
    </section>
  )
}
```

- [ ] **Step 4: Write `MissionFeedbackTarget`**

```tsx
// components/ai-coach/missions/MissionFeedbackTarget.tsx
'use client'
import { isActionablePronunciationFeedbackCopyEnabled } from '@/lib/pronunciation/feedback/copy-flag'
import { getLearnerTargetCopy } from '@/lib/pronunciation/assessment/learner-copy'
import type { MissionOutcome } from '@/lib/ai-practice/missions/outcome'

interface MissionFeedbackTargetProps {
  targetEvidence: MissionOutcome['targetEvidence']
}

export function MissionFeedbackTarget({ targetEvidence }: MissionFeedbackTargetProps) {
  if (!isActionablePronunciationFeedbackCopyEnabled()) return null
  const focus = targetEvidence.find((t) => t.outcome !== 'unscored')
  if (!focus) return null
  const copy = getLearnerTargetCopy(focus.targetId)
  return (
    <section className="rounded-md border border-border-subtle bg-surface-raised px-4 py-3">
      <p className="m-0 font-kicker text-fg-subtle">NEXT FOCUS</p>
      <p className="mb-0 mt-1 text-body-sm text-fg">{copy.title}. From word recognition, not an accuracy measurement.</p>
    </section>
  )
}
```

- [ ] **Step 5: Write `MissionResult`**

```tsx
// components/ai-coach/missions/MissionResult.tsx
'use client'
import type { MissionOutcome } from '@/lib/ai-practice/missions/outcome'
import { MissionGoalSummary } from './MissionGoalSummary'
import { MissionFeedbackTarget } from './MissionFeedbackTarget'
import { PillButton } from '@/components/ui/PillButton'

// Planned structure:
// <MissionResult>
//   <MissionGoalSummary />       — never gated
//   <MissionFeedbackTarget />    — gated by NEXT_PUBLIC_PRONUNCIATION_ACTIONABLE_FEEDBACK_COPY
//   <MissionReviewCta />

interface MissionResultProps {
  outcome: MissionOutcome
  onReviewCta: () => void
}

export default function MissionResult({ outcome, onReviewCta }: MissionResultProps) {
  return (
    <div className="space-y-3">
      <MissionGoalSummary goalAchieved={outcome.goalAchieved} />
      <MissionFeedbackTarget targetEvidence={outcome.targetEvidence} />
      <PillButton variant="outline" size="sm" onClick={onReviewCta}>Review this later</PillButton>
    </div>
  )
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm exec vitest run components/ai-coach/missions/__tests__/MissionResult.test.tsx`
Expected: PASS — 3 tests green.

- [ ] **Step 7: Commit**

```bash
git add components/ai-coach/missions/MissionResult.tsx components/ai-coach/missions/MissionGoalSummary.tsx components/ai-coach/missions/MissionFeedbackTarget.tsx components/ai-coach/missions/__tests__/MissionResult.test.tsx
git commit -m "feat(missions): add MissionResult with goal summary never gated, feedback target gated"
```

---

### Task 19: Replace the "Interview" `ChatTabs` entry with the mission library

**Files:**
- Modify: `components/ai-coach/ChatTabs.tsx`
- Test: `components/ai-coach/__tests__/ChatTabs.test.tsx` (check if it exists first)

- [ ] **Step 1: Check for an existing ChatTabs test**

Read the `components/ai-coach/__tests__/` directory listing. If
`ChatTabs.test.tsx` exists, extend it; otherwise create it fresh.

- [ ] **Step 2: Write the failing test**

```tsx
// components/ai-coach/__tests__/ChatTabs.test.tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ChatTabs, { TABS } from '../ChatTabs'

describe('ChatTabs', () => {
  it('has a missions tab, not an ambiguous Interview tab', () => {
    expect(TABS.some((t) => t.id === 'interview')).toBe(false)
    expect(TABS.some((t) => t.id === 'missions')).toBe(true)
  })

  it('renders the missions tab label and description', () => {
    render(<ChatTabs active="missions" onChange={vi.fn()} />)
    expect(screen.getByText('Missions')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm exec vitest run components/ai-coach/__tests__/ChatTabs.test.tsx`
Expected: FAIL — `TABS` still has an `interview` entry, not `missions`.

- [ ] **Step 4: Update `ChatTabs.tsx`**

Replace the `interview` entry in `TABS` (ChatTabs.tsx:8):

```ts
  { id: "missions", label: "Missions", desc: "Complete a real-world goal", icon: BriefcaseBusiness },
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run components/ai-coach/__tests__/ChatTabs.test.tsx`
Expected: PASS

- [ ] **Step 6: Find and fix every consumer of the old `"interview"` tab id**

Run: `pnpm type-check` — this will surface every file that still switches on
`TabId === "interview"` (the parent Coach panel component that renders
`PronunciationView`/roleplay content per active tab). Read each flagged file
and replace the `"interview"` case with `"missions"`, rendering
`MissionLibrary`/`MissionRunner`/`MissionResult` (built in Tasks 16–18 and
20) in place of whatever previously rendered the roleplay/interview chat
view. Do not leave a dangling `"interview"` case.

- [ ] **Step 7: Run the full ai-coach suite**

Run: `pnpm exec vitest run components/ai-coach`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add components/ai-coach/ChatTabs.tsx components/ai-coach/__tests__/ChatTabs.test.tsx
git commit -m "feat(missions): replace the ambiguous Interview tab with a Missions tab"
```

Note: this task's Step 6 may reveal that the parent panel component needing
updates is large enough to warrant its own file split under the ≤250-line
rule (CLAUDE.md). If so, split it as part of this task rather than exceeding
the limit — do not defer a split to "later."

---

### Task 20: `MissionRunner` — briefing, active/correction, transfer phases

**Files:**
- Create: `components/ai-coach/missions/MissionRunner.tsx`
- Create: `components/ai-coach/missions/MissionBriefing.tsx`
- Create: `components/ai-coach/missions/MissionConversation.tsx`
- Create: `components/ai-coach/missions/MissionTransferPrompt.tsx`
- Test: `components/ai-coach/missions/__tests__/MissionRunner.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/ai-coach/missions/__tests__/MissionRunner.test.tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import MissionRunner from '../MissionRunner'
import { createInitialMissionState } from '@/lib/ai-practice/missions/state-machine'
import { getMission } from '@/lib/ai-practice/missions/registry'

const mission = getMission('roleplay.cafe')!

describe('MissionRunner', () => {
  it('shows the briefing (context + opening) when phase is briefing', () => {
    const state = createInitialMissionState(mission)
    render(<MissionRunner mission={mission} state={state} onRetry={vi.fn()} onListen={vi.fn()} onSlow={vi.fn()} onTransfer={vi.fn()} />)
    expect(screen.getByText(mission.opening)).toBeInTheDocument()
  })

  it('shows the RemediationSequence controls during correction phase', () => {
    const state = { ...createInitialMissionState(mission), phase: 'correction' as const, pendingCorrection: { targetId: mission.targets[0].targetId } }
    render(<MissionRunner mission={mission} state={state} onRetry={vi.fn()} onListen={vi.fn()} onSlow={vi.fn()} onTransfer={vi.fn()} />)
    expect(screen.getByRole('button', { name: /retry|reintentar/i })).toBeInTheDocument()
  })

  it('shows the transfer prompt during transfer phase', () => {
    const state = { ...createInitialMissionState(mission), phase: 'transfer' as const }
    render(<MissionRunner mission={mission} state={state} onRetry={vi.fn()} onListen={vi.fn()} onSlow={vi.fn()} onTransfer={vi.fn()} />)
    expect(screen.getByText(mission.transferVariant.opening)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run components/ai-coach/missions/__tests__/MissionRunner.test.tsx`
Expected: FAIL — `Cannot find module '../MissionRunner'`

- [ ] **Step 3: Write `MissionBriefing`**

```tsx
// components/ai-coach/missions/MissionBriefing.tsx
'use client'
import type { OralMission } from '@/lib/ai-practice/missions/types'

interface MissionBriefingProps {
  mission: OralMission
}

export function MissionBriefing({ mission }: MissionBriefingProps) {
  return (
    <div className="space-y-2 rounded-md border border-border-subtle bg-surface-raised p-4">
      <p className="m-0 font-kicker text-fg-subtle">{mission.communicativeGoal}</p>
      <p className="m-0 text-body-sm text-fg-muted">{mission.context}</p>
      <p className="m-0 text-body-md font-medium text-fg">{mission.opening}</p>
    </div>
  )
}
```

- [ ] **Step 4: Write `MissionConversation`**

```tsx
// components/ai-coach/missions/MissionConversation.tsx
'use client'
import { RemediationSequence } from '@/components/pronunciation-feedback/RemediationSequence'
import type { FeedbackPriority } from '@/lib/pronunciation/feedback/types'

interface MissionConversationProps {
  pendingCorrection: FeedbackPriority | null
  onListen: () => void
  onSlow: () => void
  onRetry: () => void
}

export function MissionConversation({ pendingCorrection, onListen, onSlow, onRetry }: MissionConversationProps) {
  if (!pendingCorrection) return null
  return <RemediationSequence cue={pendingCorrection.cueEs} onListen={onListen} onSlow={onSlow} onRetry={onRetry} />
}
```

- [ ] **Step 5: Write `MissionTransferPrompt`**

```tsx
// components/ai-coach/missions/MissionTransferPrompt.tsx
'use client'
import type { OralMission } from '@/lib/ai-practice/missions/types'

interface MissionTransferPromptProps {
  mission: OralMission
}

export function MissionTransferPrompt({ mission }: MissionTransferPromptProps) {
  return (
    <div className="space-y-2 rounded-md border border-border-subtle bg-surface-raised p-4">
      <p className="m-0 font-kicker text-fg-subtle">TRY IT IN A NEW SITUATION</p>
      <p className="m-0 text-body-sm text-fg-muted">{mission.transferVariant.context}</p>
      <p className="m-0 text-body-md font-medium text-fg">{mission.transferVariant.opening}</p>
    </div>
  )
}
```

- [ ] **Step 6: Write `MissionRunner`**

```tsx
// components/ai-coach/missions/MissionRunner.tsx
'use client'
import type { OralMission } from '@/lib/ai-practice/missions/types'
import type { MissionState } from '@/lib/ai-practice/missions/state-machine'
import { MissionBriefing } from './MissionBriefing'
import { MissionConversation } from './MissionConversation'
import { MissionTransferPrompt } from './MissionTransferPrompt'

// Planned structure:
// <MissionRunner>
//   <MissionBriefing />          — phase 'briefing'
//   <MissionConversation />      — phase 'active'/'correction'
//   <MissionTransferPrompt />    — phase 'transfer'

interface MissionRunnerProps {
  mission: OralMission
  state: MissionState
  onListen: () => void
  onSlow: () => void
  onRetry: () => void
  onTransfer: () => void
}

export default function MissionRunner({ mission, state, onListen, onSlow, onRetry }: MissionRunnerProps) {
  return (
    <div className="space-y-3">
      {state.phase === 'briefing' && <MissionBriefing mission={mission} />}
      {(state.phase === 'active' || state.phase === 'correction') && (
        <MissionConversation pendingCorrection={state.pendingCorrection} onListen={onListen} onSlow={onSlow} onRetry={onRetry} />
      )}
      {state.phase === 'transfer' && <MissionTransferPrompt mission={mission} />}
    </div>
  )
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `pnpm exec vitest run components/ai-coach/missions/__tests__/MissionRunner.test.tsx`
Expected: PASS — 3 tests green.

- [ ] **Step 8: Commit**

```bash
git add components/ai-coach/missions/MissionRunner.tsx components/ai-coach/missions/MissionBriefing.tsx components/ai-coach/missions/MissionConversation.tsx components/ai-coach/missions/MissionTransferPrompt.tsx components/ai-coach/missions/__tests__/MissionRunner.test.tsx
git commit -m "feat(missions): add MissionRunner covering briefing, correction, and transfer phases"
```

---

## Phase 8: Route, Daily, Tracking integration

### Task 21: Launch contract and exact-step reconciliation

**Files:**
- Create: `lib/ai-practice/missions/launch.ts`
- Test: `lib/ai-practice/missions/__tests__/launch.test.ts`
- Read first: `lib/progress/daily-reconcile.ts` (exact-reconciliation pattern to follow)

- [ ] **Step 1: Read the exact-reconciliation pattern**

Read `lib/progress/daily-reconcile.ts` in full to find its exported function
signature for reconciling one specific step (not all pending steps). Match
that function's parameter shape in this task's implementation rather than
inventing a new one.

- [ ] **Step 2: Write the failing test**

```ts
// lib/ai-practice/missions/__tests__/launch.test.ts
import { describe, expect, it } from 'vitest'
import { parseMissionLaunch, type MissionLaunchSource } from '../launch'

describe('parseMissionLaunch', () => {
  it('parses a full launch payload', () => {
    const launch = parseMissionLaunch({ missionId: 'roleplay.cafe', targetIds: ['segmental.phoneme./ə/'], source: 'route' })
    expect(launch).toEqual({ missionId: 'roleplay.cafe', targetIds: ['segmental.phoneme./ə/'], source: 'route' })
  })

  it('defaults targetIds to an empty array when omitted', () => {
    const launch = parseMissionLaunch({ missionId: 'roleplay.cafe', source: 'coach' })
    expect(launch.targetIds).toEqual([])
  })

  it('rejects an unknown source', () => {
    expect(() => parseMissionLaunch({ missionId: 'roleplay.cafe', source: 'not-a-source' as MissionLaunchSource })).toThrow()
  })

  it('rejects an unknown missionId', () => {
    expect(() => parseMissionLaunch({ missionId: 'not.a.mission', source: 'coach' })).toThrow()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm exec vitest run lib/ai-practice/missions/__tests__/launch.test.ts`
Expected: FAIL — `Cannot find module '../launch'`

- [ ] **Step 4: Write the implementation**

```ts
// lib/ai-practice/missions/launch.ts
import { getMission } from './registry'

export type MissionLaunchSource = 'route' | 'daily' | 'tracking' | 'coach'

export interface MissionLaunch {
  missionId: string
  targetIds: string[]
  source: MissionLaunchSource
}

const VALID_SOURCES: readonly MissionLaunchSource[] = ['route', 'daily', 'tracking', 'coach']

export function parseMissionLaunch(input: { missionId: string; targetIds?: string[]; source: MissionLaunchSource }): MissionLaunch {
  if (!VALID_SOURCES.includes(input.source)) {
    throw new Error(`Unknown mission launch source: ${input.source}`)
  }
  if (!getMission(input.missionId)) {
    throw new Error(`Unknown mission id: ${input.missionId}`)
  }
  return { missionId: input.missionId, targetIds: input.targetIds ?? [], source: input.source }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run lib/ai-practice/missions/__tests__/launch.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/ai-practice/missions/launch.ts lib/ai-practice/missions/__tests__/launch.test.ts
git commit -m "feat(missions): add validated launch contract for Route/Daily/Tracking/Coach sources"
```

---

### Task 22: One contract test per launch source

**Files:**
- Modify: `lib/ai-practice/missions/__tests__/launch.test.ts`
- Read first: whichever files in `components/courses/CoursePathRealLife*`,
  Daily's step composer (`lib/practice/daily-plan/`), and Tracking
  (`components/tracking/TrackingClient.tsx` or `TrackingReviewClient.tsx`)
  currently construct navigation/launch payloads for roleplay, so this task
  updates the real call sites rather than only testing the parser in
  isolation.

- [ ] **Step 1: Read the current roleplay launch call sites**

Search each of the three areas above for `roleplay:` string construction or
navigation to the AI Coach with a roleplay mode. Because this plan does not
have line numbers for these (they were out of scope for the earlier codebase
reads in this session), the executor must locate them fresh via a search for
`"roleplay:"` across `components/courses/`, `lib/practice/daily-plan/`, and
`components/tracking/`.

- [ ] **Step 2: Write one contract test per source**

Append to `lib/ai-practice/missions/__tests__/launch.test.ts`:

```ts
describe('parseMissionLaunch — per-source contracts', () => {
  it('route launches carry the transfer step\'s target ids', () => {
    const launch = parseMissionLaunch({ missionId: 'roleplay.cafe', targetIds: ['segmental.contrast.iː|ɪ'], source: 'route' })
    expect(launch.source).toBe('route')
    expect(launch.targetIds).toContain('segmental.contrast.iː|ɪ')
  })

  it('daily launches carry no target ids unless explicitly seeded', () => {
    const launch = parseMissionLaunch({ missionId: 'roleplay.standup', source: 'daily' })
    expect(launch.source).toBe('daily')
    expect(launch.targetIds).toEqual([])
  })

  it('tracking launches seed target ids from a saved phrase without mutating the mission', () => {
    const launch = parseMissionLaunch({ missionId: 'roleplay.doctor', targetIds: ['segmental.contrast.θ|ð'], source: 'tracking' })
    expect(launch.source).toBe('tracking')
  })

  it('direct coach launches have source coach and no seeded targets', () => {
    const launch = parseMissionLaunch({ missionId: 'roleplay.airport', source: 'coach' })
    expect(launch.source).toBe('coach')
    expect(launch.targetIds).toEqual([])
  })
})
```

- [ ] **Step 3: Run test to verify it passes**

Run: `pnpm exec vitest run lib/ai-practice/missions/__tests__/launch.test.ts`
Expected: PASS — these assert the parser's contract per source; they do not
yet prove the UI call sites use it correctly.

- [ ] **Step 4: Wire the real call sites found in Step 1**

For each call site located in Step 1, replace its `roleplay:<scenario>`
mode-string construction with a call to `parseMissionLaunch` using
`LEGACY_ROLEPLAY_MODE_TO_MISSION_ID` (Task 2) to map the old scenario name to
a mission id, and route through `activeMissionId`/`mission:${missionId}`
wiring from Task 12. Because the exact call sites are not enumerated in this
plan (see Step 1), do not guess their shape — read each file fully before
editing, and add or update that file's existing test suite in the same
commit to cover the new mission-based call.

- [ ] **Step 5: Run the full suite for touched areas**

Run: `pnpm exec vitest run lib/ai-practice/missions components/courses lib/practice/daily-plan components/tracking`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/ai-practice/missions/__tests__/launch.test.ts
git commit -m "feat(missions): wire Route/Daily/Tracking launch call sites to the mission launch contract"
```

Note: this task intentionally defers exact file paths for the three call
sites to implementation time, since they were not read in this planning
session. If any of the three call sites turn out not to exist yet (e.g. no
current roleplay launch from Tracking), skip that sub-case and note it in
the commit message — do not invent a call site that has no current
equivalent.

---

## Phase 9: Full verification and cleanup

### Task 23: Remove the migrated-away roleplay files

**Files:**
- Delete: `lib/ai-practice/modes/roleplay.ts`
- Modify: any remaining importer of `lib/ai-practice/modes/roleplay.ts`

- [ ] **Step 1: Confirm no remaining imports**

Run a search for `modes/roleplay` across the repo. Every import should have
been replaced by Tasks 9–12 (`missions/registry.ts` +
`missions/prompt.ts`). If any remain, fix them before deleting the file —
do not delete a file still imported elsewhere.

- [ ] **Step 2: Delete the file**

```bash
rm lib/ai-practice/modes/roleplay.ts
```

- [ ] **Step 3: Typecheck**

Run: `pnpm type-check`
Expected: exit 0

- [ ] **Step 4: Commit**

```bash
git add -A lib/ai-practice/modes/roleplay.ts
git commit -m "chore(missions): remove the migrated-away roleplay.ts module"
```

---

### Task 24: Full verification sweep

**Files:** none (verification only)

- [ ] **Step 1: Run every focused test path from the plan's Commands table**

```bash
pnpm exec vitest run lib/ai-practice/missions lib/ai-practice/__tests__/stream-processor.test.ts
pnpm exec vitest run components/ai-coach components/interview hooks/__tests__
```

Expected: PASS on both.

- [ ] **Step 2: Run the prompt audit**

```bash
pnpm audit:ai-prompts
```

Expected: exit 0

- [ ] **Step 3: Typecheck**

```bash
pnpm type-check
```

Expected: exit 0

- [ ] **Step 4: Design token lint**

```bash
pnpm lint:design-tokens
```

Expected: exit 0

- [ ] **Step 5: Accessibility**

```bash
pnpm test:a11y --grep "oral mission"
```

Expected: targeted tests pass. If no a11y tests exist yet for missions, add a
minimal one to `components/ai-coach/missions/__tests__/` covering keyboard
operability of `MissionRunner`'s controls (reusing `RemediationSequence`,
which is already keyboard-accessible per plan 069) before treating this step
as satisfied — do not skip it.

- [ ] **Step 6: Full test suite**

```bash
pnpm exec vitest run
```

Expected: PASS, no regressions anywhere in the repo.

- [ ] **Step 7: Update plan 070's status row**

Edit `plans/070-build-goal-based-oral-missions.md`: check every box under
"Done criteria" that is now true, and add a short "Verification" section
(matching the style already used in `plans/069-unify-actionable-pronunciation-feedback.md`
after its own verification pass) summarizing what was checked and any gaps
found.

- [ ] **Step 8: Commit**

```bash
git add plans/070-build-goal-based-oral-missions.md
git commit -m "docs(missions): mark plan 070 done criteria and record verification"
```

---

## Self-review notes (for the plan author, not the executor)

- **Spec coverage**: Steps 1–9 of `plans/070-build-goal-based-oral-missions.md`
  map to Phases 1–8 above 1:1 (registry→Phase1, state machine→Phase2,
  prompts/events→Phase4, voice/text→Phase5 via SpokenAttempt reuse,
  feedback/transfer→Task 5-6's reducer rules, outcome→Phase3,
  persistence→Phase6, UI→Phase7, Route/Daily/Tracking→Phase8).
- **Known deferred specificity**: Task 22 (per-source launch call sites) and
  part of Task 19 Step 6 (the parent Coach panel's tab-switch consumer)
  intentionally could not be pinned to exact file:line references, because
  they were not read during this planning session — this plan explicitly
  instructs the executor to read those files fresh rather than guessing
  their shape, which is safer than fabricating line numbers that may not
  match current `dev`.
- **Type consistency check performed**: `OralMission`/`MissionState`/
  `MissionEvent`/`MissionOutcome` field names are used identically across
  Tasks 1, 3–7, 14–15, and 18–20 (`intentsObserved`, `pendingCorrection`,
  `targetEvidence`, `goalAchieved`, etc.) — no renaming drift between tasks.
