import type {
  DailySelectionMetadata,
  DailySelectionReason,
  DailyStep,
} from '@/lib/practice/types'

const REASON_PRIORITY: Record<DailySelectionReason, number> = {
  due: 0,
  verification_due: 0,
  // Preserve one new communicative thread after the genuinely due work. The
  // current builder caps due candidates before this can displace all novelty.
  chunk_new: 1,
  // The grammar slot outranks everything except genuinely due SRS work:
  // its whole purpose is to stop phonetics from silently evicting grammar.
  grammar_slot: 1,
  // New vocabulary is new material, not filler: at 'variety' it sat last and
  // never reached the plan, so the learner only ever saw words they had seen.
  // It ranks BELOW chunk_new deliberately — expressions are the unit we want
  // to grow — so a reserved slot goes to a new chunk whenever one exists.
  word_new: 2,
  recent_error: 2,
  weak_target: 2,
  route_next: 3,
  saved_intent: 4,
  variety: 5,
}

export interface DailyPlanCandidate {
  step: DailyStep
  selection: DailySelectionMetadata
}

export interface SelectDailyCandidatesOptions {
  limit: number
  availableCapabilities?: ReadonlySet<string>
  maxSavedIntent?: number
  /**
   * Slots held back from the first pass and filled only with new material
   * (`chunk_new` first, then `word_new`). Without this, a backlog of due work
   * occupies every slot and the plan stops introducing material — the learner
   * reviews forever and never advances.
   */
  reservedChunkNewSlots?: number
  /**
   * Hard cap on `due` steps. Review stays first in priority; this only stops it
   * from being the *whole* session once a backlog builds up.
   */
  maxDueSteps?: number
}

/** Reasons that introduce material the learner has not seen before. */
const NEW_MATERIAL_REASONS: ReadonlySet<DailySelectionReason> = new Set(['chunk_new', 'word_new'])

/** Pure policy: stable priority, capability gate, target dedupe, bounded intent. */
export function selectDailyCandidates(
  candidates: readonly DailyPlanCandidate[],
  options: SelectDailyCandidatesOptions,
): DailyStep[] {
  const available = options.availableCapabilities
  const maxSavedIntent = options.maxSavedIntent ?? 2
  const ranked = candidates
    .map((candidate, index) => ({ ...candidate, index }))
    .sort((a, b) => REASON_PRIORITY[a.selection.reason] - REASON_PRIORITY[b.selection.reason] || a.index - b.index)
  const selected: DailyStep[] = []
  const selectedIds = new Set<string>()
  const selectedTargets = new Set<string>()
  let savedCount = 0
  let dueCount = 0

  const availableNew = ranked.filter((candidate) => NEW_MATERIAL_REASONS.has(candidate.selection.reason)).length
  const reserved = Math.min(options.reservedChunkNewSlots ?? 0, availableNew)
  const maxDue = options.maxDueSteps ?? Infinity

  const take = (candidate: (typeof ranked)[number], limit: number): boolean => {
    if (selected.length >= limit) return false
    const { selection, step } = candidate
    if (selectedIds.has(step.id)) return false
    if (selection.requiredCapability && available && !available.has(selection.requiredCapability)) return false
    if (selection.reason === 'saved_intent' && savedCount >= maxSavedIntent) return false
    if (selection.reason === 'due' && dueCount >= maxDue) return false
    if (selection.targetRefs.some((target) => selectedTargets.has(target))) return false

    selected.push({ ...step, selection })
    selectedIds.add(step.id)
    selection.targetRefs.forEach((target) => selectedTargets.add(target))
    if (selection.reason === 'saved_intent') savedCount += 1
    if (selection.reason === 'due') dueCount += 1
    return true
  }

  // Pass 1: everything else competes for the unreserved slots only.
  for (const candidate of ranked) {
    if (NEW_MATERIAL_REASONS.has(candidate.selection.reason)) continue
    if (!take(candidate, options.limit - reserved)) {
      if (selected.length >= options.limit - reserved) break
    }
  }
  // Pass 2: the held-back slots, which only new material can claim. Chunks are
  // ranked first, so they take these slots before new words do.
  for (const candidate of ranked) {
    if (!NEW_MATERIAL_REASONS.has(candidate.selection.reason)) continue
    take(candidate, options.limit)
  }
  // Pass 3: a reserved slot nobody claimed goes back to the general pool
  // rather than shortening the session.
  for (const candidate of ranked) {
    take(candidate, options.limit)
  }
  // Reserving slots changes only WHICH steps survive the cut, never their
  // order: the caller still receives them in the documented priority order.
  const rankOf = new Map(ranked.map((entry, position) => [entry.step.id, position]))
  return selected.sort((a, b) => (rankOf.get(a.id) ?? 0) - (rankOf.get(b.id) ?? 0))
}

export function candidate(
  step: DailyStep,
  selection: DailySelectionMetadata,
): DailyPlanCandidate {
  return { step, selection }
}
