/**
 * Deterministic diagnostic prompt selection (plan 067, step 3).
 *
 * Selects a compact, balanced subset of targets from the frozen registry
 * (`lib/pronunciation/targets/registry.ts`) to probe in a single diagnostic
 * run — weighted by Spanish-L1 confusability, biased by CEFR level, and
 * deprioritizing targets the learner already has evidence for. Pure
 * selection logic only: no scoring, no persistence, no prompt-content
 * authoring (actual words/phrases belong to a later step).
 */

import { contrastTargetId, listTargets, listTargetsByCefr } from '@/lib/pronunciation/targets/registry'
import type { CEFRLevel } from '@/lib/exercises/cefr'
import type { EvidenceCapability, PronunciationTarget, PronunciationTargetId } from '@/lib/pronunciation/targets/types'
import { createSeededRng, weightedSampleWithoutReplacement } from './seeded-random'

/** Which diagnostic stage a selected target is probed in. Mirrors `EvidenceCapability` — no parallel identity scheme. */
export type DiagnosticStage = 'perception' | 'controlled_production' | 'contextual_production'

export interface DiagnosticPromptSelection {
  targetId: PronunciationTargetId
  stage: DiagnosticStage
}

export interface SelectDiagnosticPromptsOptions {
  /** Seeds the deterministic PRNG. Same seed + same inputs → same output. */
  seed: number | string
  /** Learner's current/estimated CEFR level. Biases toward targets recommended at or below it. */
  cefrLevel: CEFRLevel
  /** Target ids the learner already has evidence for — deprioritized in favor of gaps. */
  existingEvidence?: ReadonlySet<PronunciationTargetId>
}

/**
 * Higher weight = more likely to be sampled. Keyed only by the two
 * `segmental.contrast` targets that are well-documented Spanish-L1
 * confusables (TH θ/ð, and the iː/ɪ tense/lax vowel contrast — Spanish
 * lacks both distinctions). Everything else falls back to `BASELINE_WEIGHT`.
 * Scoped to this module — the registry (plan 066) stays frozen/unaware of
 * L1-specific weighting.
 */
const SPANISH_L1_CONFUSABLE_WEIGHT: Partial<Record<PronunciationTargetId, number>> = {
  [contrastTargetId('/θ/', '/ð/')]: 4,
  [contrastTargetId('/iː/', '/ɪ/')]: 4,
}

const BASELINE_WEIGHT = 1
const NO_EVIDENCE_MULTIPLIER = 1
const HAS_EVIDENCE_MULTIPLIER = 0.15

/** Bounds keep the diagnostic inside its 8-12 minute contract — a real subset, not "less than 11". */
export const MIN_SELECTED_TARGETS = 6
export const MAX_SELECTED_TARGETS = 9

/** Preferred stage order per target category, mapped against what the target actually declares. */
function preferredStagesFor(target: PronunciationTarget): DiagnosticStage[] {
  // Word stress has a validated listening item in the diagnostic. Selecting
  // production would only create an honest-but-unhelpful abstention because
  // STT cannot evaluate stress placement.
  if (target.id === 'prosody.word-stress') return ['perception']
  const caps = target.evidenceCapabilities
  const order: DiagnosticStage[] = ['perception', 'controlled_production', 'contextual_production']
  return order.filter((stage): stage is DiagnosticStage => caps.includes(stage as EvidenceCapability))
}

function weightFor(
  target: PronunciationTarget,
  existingEvidence: ReadonlySet<PronunciationTargetId> | undefined
): number {
  const base = SPANISH_L1_CONFUSABLE_WEIGHT[target.id] ?? BASELINE_WEIGHT
  const hasEvidence = existingEvidence?.has(target.id) ?? false
  return base * (hasEvidence ? HAS_EVIDENCE_MULTIPLIER : NO_EVIDENCE_MULTIPLIER)
}

/** Picks a single supported stage for a target deterministically from the shared rng. */
function pickStage(target: PronunciationTarget, rng: () => number): DiagnosticStage | null {
  const stages = preferredStagesFor(target)
  if (stages.length === 0) return null
  const index = Math.floor(rng() * stages.length) % stages.length
  return stages[index]
}

/**
 * Selects a bounded, deterministic set of targets (with an assigned stage
 * each) for one diagnostic run. Always includes at least one
 * `contextual_production`-capable target (the "mini transferencia
 * contextual" phrase-transfer slot). Never returns the full registry.
 */
export function selectDiagnosticPrompts(
  options: SelectDiagnosticPromptsOptions
): DiagnosticPromptSelection[] {
  const { seed, cefrLevel, existingEvidence } = options
  const rng = createSeededRng(seed)

  // The registry has no targets with recommendedCefr 'A1' (the lowest is
  // A2), so `listTargetsByCefr('A1')` returns []. Falling back to 'C2' here
  // would silently substitute the ENTIRE registry (including B2-only items
  // like connected.elision/connected.assimilation) as the general pool for
  // every non-transfer slot — defeating CEFR bias for the whole run. Floor
  // the fallback at 'A2' instead: the lowest level that actually has
  // registry content, so A1 learners still get a CEFR-appropriate pool
  // rather than borrowing the full registry.
  const eligible = listTargetsByCefr(cefrLevel)
  const pool = eligible.length > 0 ? eligible : listTargetsByCefr('A2')

  const transferCandidates = pool.filter((t) => t.evidenceCapabilities.includes('contextual_production'))

  const targetCount = MIN_SELECTED_TARGETS + Math.floor(rng() * (MAX_SELECTED_TARGETS - MIN_SELECTED_TARGETS + 1))

  const selected: PronunciationTarget[] = []
  const result: DiagnosticPromptSelection[] = []

  // Guarantee the phrase-transfer slot first, so it survives the bound even
  // under adversarial weighting — "at least one" is a hard contract, not a
  // side effect of weighted luck. Its stage is pinned to
  // `contextual_production`, not re-rolled via `pickStage`.
  //
  // This guarantee is unconditional and must NOT be constrained by the CEFR
  // cap: the registry has zero contextual_production-capable targets at or
  // below A2 (all such targets are recommendedCefr B1+), so at A1/A2 the
  // CEFR-capped pool alone can never satisfy it. Fall back to the full
  // registry's transfer-capable targets when the capped pool has none —
  // this is a deliberate, documented exception to the CEFR bias applied to
  // the rest of the selection.
  const transferPool = transferCandidates.length > 0
    ? transferCandidates
    : listTargets().filter((t) => t.evidenceCapabilities.includes('contextual_production'))

  if (transferPool.length > 0) {
    const [transferPick] = weightedSampleWithoutReplacement(
      transferPool,
      (t) => weightFor(t, existingEvidence),
      1,
      rng
    )
    if (transferPick) {
      selected.push(transferPick)
      result.push({ targetId: transferPick.id, stage: 'contextual_production' })
    }
  }

  const remainingPool = pool.filter((t) => !selected.some((s) => s.id === t.id))
  const remainingCount = Math.max(targetCount - selected.length, 0)
  const rest = weightedSampleWithoutReplacement(
    remainingPool,
    (t) => weightFor(t, existingEvidence),
    remainingCount,
    rng
  )
  selected.push(...rest)

  for (const target of rest) {
    const stage = pickStage(target, rng)
    if (stage) result.push({ targetId: target.id, stage })
  }

  return result
}
