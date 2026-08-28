import type {
  DailySelectionMetadata,
  DailySelectionReason,
  DailyStep,
} from '@/lib/practice/types'

const REASON_PRIORITY: Record<DailySelectionReason, number> = {
  due: 0,
  verification_due: 0,
  // The grammar slot outranks everything except genuinely due SRS work:
  // its whole purpose is to stop phonetics from silently evicting grammar.
  grammar_slot: 1,
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
}

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

  for (const candidate of ranked) {
    if (selected.length >= options.limit) break
    const { selection, step } = candidate
    if (selectedIds.has(step.id)) continue
    if (selection.requiredCapability && available && !available.has(selection.requiredCapability)) continue
    if (selection.reason === 'saved_intent' && savedCount >= maxSavedIntent) continue
    if (selection.targetRefs.some((target) => selectedTargets.has(target))) continue

    selected.push({ ...step, selection })
    selectedIds.add(step.id)
    selection.targetRefs.forEach((target) => selectedTargets.add(target))
    if (selection.reason === 'saved_intent') savedCount += 1
  }
  return selected
}

export function candidate(
  step: DailyStep,
  selection: DailySelectionMetadata,
): DailyPlanCandidate {
  return { step, selection }
}
