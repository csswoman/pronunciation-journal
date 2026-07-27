# Plan 070: Goal-based oral missions — design

> Implements `plans/070-build-goal-based-oral-missions.md`. Depends on plans
> 063 (SpokenAttempt), 066 (pronunciation target registry), 068 (learning
> route) and 069 (shared feedback model) — all merged to `dev`.

## Problem

The app has eight hardcoded roleplay prompts (`lib/ai-practice/modes/roleplay.ts`),
a duplicated scenario enum (`lib/ai-practice/tools/registry.ts:55`), and CEFR
`realLife` scenarios in `lib/courses/curriculum.ts` that never connect to
roleplay or progress. None of them have a communicative goal, an oral target,
a success criterion, or a shared transfer-to-review path. The Coach's
"Interview" tab is really "practice real scenarios" but only exposes one
scenario type.

Missions turn the Coach into the Route's contextual capstone: say something
useful, get one correction, prove it in a variant — with the LLM interpreting
a role, never deciding what counts as evidence.

## Decisions locked in during brainstorming

- Migrate the 8 existing roleplay prompts as-is into the first 8 missions
  (reuse their text/context), rather than authoring new content from scratch.
- Ship Steps 1–9 in one pass: registry, state machine, prompts, voice/text,
  feedback integration, outcome evaluation, persistence, UI, and Route/Daily/
  Tracking integration.
- Work directly on `dev`, no feature branch (matches how plan 069 shipped).
- Intent signaling: the LLM emits a structured tool call per intent
  (`mission_intent_observed { intentId }`); the reducer validates and decides
  whether it counts — the model only reports.
- Target phrases for the 8 migrated missions are hand-authored (see table
  below), not derived from a heuristic over `curriculum.ts`.
- An intent event with an `intentId` outside the mission's authorized list is
  silently ignored (logged, not surfaced, not a mission-ending error).

## Architecture

### Component list (per CLAUDE.md convention)

```tsx
// Planned structure:
// <MissionLibrary>              — replaces the "Interview" tab in ChatTabs
//   <MissionCategoryFilter />
//   <MissionCard />             — goal, estimated time, target phrases, why recommended
// <MissionRunner>                — lives inside the existing AI Coach shell
//   <MissionBriefing />          — phase 'briefing': context + opening line
//   <MissionConversation />      — phase 'active'/'correction': reuses RemediationSequence (plan 069)
//   <MissionTransferPrompt />    — phase 'transfer'
// <MissionResult>
//   <MissionGoalSummary />       — leads with goalAchieved, never gated by the copy flag
//   <MissionFeedbackTarget />    — one focus, gated by NEXT_PUBLIC_PRONUNCIATION_ACTIONABLE_FEEDBACK_COPY
//   <MissionReviewCta />
```

### 1. `OralMission` registry (`lib/ai-practice/missions/types.ts`, `registry.ts`)

```ts
export type MissionCategory = 'interview' | 'service' | 'workplace' | 'social'

export interface OralMissionTarget {
  targetId: PronunciationTargetId   // from lib/pronunciation/targets/registry
  phrase: string                    // authored natural phrase containing the target
}

export interface RequiredIntent {
  id: string                        // stable, mission-scoped, e.g. "stated_availability"
  label: string                     // learner-facing description of what satisfies it
}

export interface OralMission {
  id: string                        // stable, e.g. "roleplay.cafe" — never renamed
  category: MissionCategory
  recommendedCefr: CEFRLevel
  context: string                   // scene-setting, feeds the prompt
  communicativeGoal: string         // learner-facing "what you're trying to do"
  role: { model: string; student: string }
  opening: string                   // model's first line
  maxTurns: number
  requiredIntents: RequiredIntent[] // ALL required for goalAchieved by default
  targets: OralMissionTarget[]      // 2-3 entries
  transferVariant: { context: string; opening: string }
}
```

This replaces `RoleplayScenario`/`SCENARIO_PROMPTS` and the duplicated enum in
`tools/registry.ts`. `StartRoleplayArgs.scenario` becomes `start_mission {
missionId: string }`, validated against the registry — not a union literal
hardcoded in two files.

Registry tests assert: unique ids, every `targetId` resolves via
`getTarget()` (plan 066), CEFR/context coverage, and round-trip compatibility
for all 8 legacy `roleplay:<scenario>` mode strings.

### 2. Deterministic state machine (`lib/ai-practice/missions/state-machine.ts`)

```ts
export type MissionPhase = 'briefing' | 'active' | 'correction' | 'transfer' | 'result'

export interface MissionState {
  missionId: string
  phase: MissionPhase
  turnCount: number
  intentsObserved: Set<string>              // subset of requiredIntents ids
  pendingCorrection: FeedbackPriority | null // from plan 069's prioritizer
  correctionRetried: boolean
  transferAttempted: boolean
  spokenAttempts: SpokenAttempt[]            // plan 063 contract, append-only
  status: 'in_progress' | 'completed' | 'cancelled' | 'provider_error'
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

export function missionReducer(state: MissionState, event: MissionEvent, mission: OralMission): MissionState
```

Reducer rules (this is what makes the machine deterministic, not the LLM):

- `intent_observed` with an `intentId` not in `mission.requiredIntents` is
  **silently ignored** — logged for diagnostics, never surfaced, never ends
  the mission.
- `intent_observed` for an id already in `intentsObserved` is idempotent — no
  duplicate evidence.
- `turn_spoken` is appended to `spokenAttempts` regardless of outcome (for
  history), but only an attempt with `outcome === 'scored'`, run through
  plan 069's prioritizer, can move `phase: 'active' → 'correction'`.
- `turn_text` never appends to `spokenAttempts` and never counts as evidence
  — it only lets the conversation continue (accessible fallback). This is a
  type-level guarantee: `turn_text` carries no `SpokenAttempt` payload.
- `turnCount >= mission.maxTurns` forces `phase → 'result'` regardless of
  intent completion (bounded turns).
- `correction` is entered at most once per session (one prioritized
  correction, plan 069) and allows exactly one `retry_correction` before
  moving to `transfer` or back to `active`.
- `provider_error` / `cancel` are terminal but preserve `spokenAttempts`
  already collected — a mid-mission failure doesn't discard real evidence.
- `goalAchieved` is **derived**, not stored as a mutable boolean — computed
  in `deriveMissionOutcome` from `intentsObserved` at any point, including
  mid-session for progress UI.

### 3. Outcome evaluation (`lib/ai-practice/missions/outcome.ts`)

```ts
export interface MissionOutcome {
  missionId: string
  goalAchieved: boolean                     // requiredIntents ⊆ intentsObserved — pure set membership
  intelligibilityEvidence: { attempts: SpokenAttempt[]; scoredCount: number }
  targetEvidence: Array<{ targetId: PronunciationTargetId; outcome: FeedbackOutcome }>
  repairUsed: boolean                       // any 'retry_correction' fired
  unscoredReasons: SpokenAttemptOutcome[]   // distinct non-'scored' outcomes seen
}
```

Three guarantees:

1. `goalAchieved` never reads `SpokenAttempt`/transcript — it's set
   membership over structured intent ids. Model prose that "sounds pleased"
   cannot move it.
2. `targetEvidence`/`intelligibilityEvidence` never read `intentsObserved` —
   they reuse `feedbackFromScoringResult` (plan 069) over each
   `SpokenAttempt` with `outcome === 'scored'`. A fulfilled intent with poor
   pronunciation doesn't inflate pronunciation evidence, and vice versa —
   this is the "goal achieved + weak pronunciation" fixture the plan's test
   plan requires.
3. `unscoredReasons` lets the result honestly say "we couldn't evaluate your
   voice this time" without inventing or hiding — same abstention pattern as
   plan 069.

### 4. Prompts and structured events (Step 3)

- `buildMissionPrompt(mission, compactState)` replaces `buildRoleplayPrompt`
  — same `BASE_TUTOR_PROMPT` + context + role structure, plus the mission's
  `requiredIntents` injected as instructions for **when to call**
  `mission_intent_observed` (the prompt never tells the model whether an
  intent "counts" — only the reducer decides that).
- New tool in `lib/ai-practice/tools/registry.ts`:
  `{ name: "mission_intent_observed"; args: { intentId: string } }`.
  `start_roleplay { scenario }` becomes `start_mission { missionId: string }`.
- `pnpm audit:ai-prompts` must pass — no prompt strings outside
  `lib/ai-prompts.ts`/`missions/registry.ts`, same hard rule as everywhere
  else in the app.

### 5. Voice-first, honest text fallback (Step 4)

Reuses the mic/`SpokenAttempt` flow from plan 063 unchanged (same hook,
`useSpeechInput`, that `PronunciationView` already uses). A text turn emits
`turn_text` (never `turn_spoken`) — the reducer cannot mistake identical
content submitted via text for oral evidence, because the event type itself
carries no `SpokenAttempt` payload.

### 6. Feedback and transfer (Step 5)

After a `turn_spoken` with `outcome === 'scored'`, run plan 069's
`prioritizeFeedbackTarget` over the mission's `targets`. One prioritized
correction max, one guided retry (`RemediationSequence`, reused as-is), then
`transferVariant` tests the same target in a changed context. No false
"improved" claim when either attempt is unscored (same `isComparable` rule
from `lib/pronunciation/feedback/model.ts`).

### 7. Persistence (Step 7)

```ts
// lib/db — new table
interface MissionSessionRecord {
  id: string
  userId: string              // per-user isolation, plan 060 pattern (user-leading key)
  missionId: string
  targetIds: string[]         // snapshotted from mission.targets at session start
  outcome: MissionOutcome     // serialized
  turnCount: number
  status: MissionState['status']
  startedAt: string
  completedAt: string | null
}
```

- One `MissionSessionRecord` per mission session (not per turn) — same
  consolidation pattern as `recordCoachSession` in `coach-progress.ts`.
- Individual `SpokenAttempt`s are already persisted via the existing plan
  063/069 flow (`persistPronunciationFeedbackEvidence`); the mission session
  references those, it does not duplicate them.
- `handoffPronunciationFeedbackToReview` (plan 069, unchanged) queues
  `targetEvidence` entries with `outcome !== 'unscored'` into `tracked_items`
  — no mission-specific SRS.
- Two-account test follows the existing `persistence.test.ts` pattern:
  `[userId+...]` keying, invalidation on account switch.

### 8. UI (Step 8)

- `MissionLibrary` replaces the "Interview" `ChatTabs` entry; `interview`
  remains a `MissionCategory`, not a separate surface.
- `MissionResult`/`MissionGoalSummary` leads with `goalAchieved` and next
  action — never a large opaque score.
- `MissionFeedbackTarget` is gated by
  `isActionablePronunciationFeedbackCopyEnabled()` (existing flag from plan
  069, same pattern just applied to `CoachPanel`). `goalAchieved` and all
  structured-outcome fields are **never** gated, per the plan's explicit
  requirement.
- Six component states from the test plan (empty/recommended/category/
  active/result/resume) map to `MissionLibrary` states (empty/recommended/
  category) and `MissionRunner`/`MissionResult` states (active/result/resume
  via `state.status`).

### 9. Route/Daily/Tracking integration (Step 9)

- Launch contract: `{ missionId, targetIds?, source: 'route' | 'daily' |
  'tracking' | 'coach' }`.
- On completion, reconciles only the exact source step (reuses the exact-
  reconciliation pattern already in `lib/progress/daily-reconcile.ts`) — no
  broad "mark everything pending" behavior.
- A saved phrase (Tracking) can seed suggested `targets` as prompt context
  but cannot mutate the authored mission contract.

## Migrated mission content (8 missions)

Hand-authored target phrases mapped to the 11 targets in
`lib/pronunciation/targets/registry.ts`. Draft, approved during
brainstorming — editable before implementation if needed.

| Mission id             | Category  | CEFR | Target phrases → targetId |
| ---------------------- | --------- | ---- | -------------------------- |
| `roleplay.interview`   | interview | B1   | "I've been working on that for two years" → `connected.reduction.gonna` · "What did you learn from that experience?" → `prosody.sentence-stress` |
| `roleplay.cafe`        | service   | A2   | "I'd like a medium latte, please" → `segmental.contrast.iː\|ɪ` · "Can I get that to go?" → `prosody.word-stress` |
| `roleplay.airport`     | service   | A2   | "I'd like a window seat" → `segmental.phoneme./ə/` · "Is there a fee for the extra bag?" → `prosody.word-stress` |
| `roleplay.doctor`      | service   | A2   | "It hurts when I breathe" → `segmental.contrast.θ\|ð` · "I've had this for three days" → `prosody.sentence-stress` |
| `roleplay.store`       | service   | A2   | "Do you have this in a smaller size?" → `segmental.contrast.iː\|ɪ` · "I'd like to return this" → `segmental.phoneme./ə/` |
| `roleplay.code_review` | workplace | B1   | "I think this could be simpler" → `prosody.sentence-stress` · "Have you considered a different approach?" → `connected.linking` |
| `roleplay.standup`     | workplace | B1   | "I've been working on it, not I worked" → `connected.reduction.gonna` · "I don't have any blockers" → `prosody.word-stress` |
| `roleplay.tech_design` | workplace | B2   | "The trade-off is speed versus simplicity" → `connected.linking` · "What does that mean in practice?" → `prosody.intonation.rising-question` |

`maxTurns`: 6 for A2 missions (cafe/airport/doctor/store), 8 for B1/B2
(interview/code_review/standup/tech_design).

`requiredIntents` per mission are derived from each prompt's existing
"ask for X, Y, Z" instructions (e.g. `roleplay.airport` → `stated_destination`,
`stated_seat_preference`) — finalized during implementation against the
existing prose in `roleplay.ts`, not re-litigated here.

## Testing strategy

- Pure reducer tests for every `MissionState`/`MissionEvent` transition,
  including the ignored-unknown-intent case and idempotent duplicate intent.
- Prompt/parser tests: `pnpm audit:ai-prompts`, malformed/unknown event
  rejection, provider-neutral error surfaces.
- Component tests with fake mic/STT and `fake-indexeddb/auto` for resume/
  offline/two-user behavior — mirrors plan 069's `persistence.test.ts`
  pattern.
- One contract test per launch source: Route, Daily, Tracking, direct Coach.
- Fixtures required by the plan: goal achieved + weak pronunciation, goal
  missed + intelligible speech, clarification/repair success, fully
  unscored fallback.

## Out of scope (per plan 070)

- Real-time phone/duplex audio or animated avatars.
- Arbitrary user-generated mission definitions in v1.
- Letting model prose determine mastery without structured evidence.
- Counting a text turn as oral evidence.
- Storing raw audio by default or redesigning the full Coach panel.

## Implementation-time content authoring

`requiredIntents` per mission are not finalized in this spec — the
implementation plan derives each mission's exact intent ids/labels from the
"ask for X, Y, Z" instructions already present in that scenario's prose in
`roleplay.ts` (e.g. `roleplay.airport`'s "ask for their passport,
destination, baggage, seat preference" → 4 required intents). This is
content authoring within an agreed contract, not an open design decision —
the shape (`RequiredIntent { id, label }`) and the rule (all required for
`goalAchieved`) are fixed by this spec.

Whether `MissionCategoryFilter` is its own component or inline filter state
in `MissionLibrary` is decided at implementation time by the ≤250-line
component budget (CLAUDE.md), not a design question.
