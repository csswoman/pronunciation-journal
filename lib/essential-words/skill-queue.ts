import type {
  ActivationCandidate,
  DailyPlan,
  NewWordCandidate,
  PlannedItem,
} from "./planning-types";

export interface SkillQueueInput {
  plan: DailyPlan;
}

const UNSCHEDULED_DUE_AT = "";

function activationToPlannedItem(candidate: ActivationCandidate): PlannedItem {
  return { ...candidate, dueAt: UNSCHEDULED_DUE_AT };
}

function newWordToMeaningActivation(candidate: NewWordCandidate): PlannedItem {
  return {
    itemId: `${candidate.wordId}#meaning`,
    wordId: candidate.wordId,
    skill: "meaning",
    modality: "recognition",
    dueAt: UNSCHEDULED_DUE_AT,
  };
}

function deduplicateByItemId(items: PlannedItem[]): PlannedItem[] {
  const seenItemIds = new Set<string>();
  return items.filter((item) => {
    if (seenItemIds.has(item.itemId)) return false;
    seenItemIds.add(item.itemId);
    return true;
  });
}

/**
 * Builds the learner queue exclusively from materialized plan selections.
 * Unscheduled activations intentionally have no due timestamp: `dueAt` is
 * meaningful only for the mandatory review segment.
 */
export function buildSkillQueue({ plan }: SkillQueueInput): PlannedItem[] {
  const negotiated = plan.allowance.mode === "recovery"
    ? []
    : [
      ...plan.baseSkillSelected.map(activationToPlannedItem),
      ...plan.usageSelected.map(activationToPlannedItem),
      ...plan.newWordsSelected.map(newWordToMeaningActivation),
    ];

  return deduplicateByItemId([...plan.mandatorySelected, ...negotiated]);
}
