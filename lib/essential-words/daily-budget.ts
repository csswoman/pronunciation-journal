import { admitNewWords } from "./admission-control";
import { buildFutureCapacity, mergeReservations, orderDueReservationsFirst } from "./future-capacity";
import type {
  ActivationCandidate,
  ActivationLimits,
  ActivationSelection,
  DailyAllowance,
  DailyPlan,
  DailyPlanningInput,
  PlannedItem,
} from "./planning-types";
import { backlogSeconds, resolveMode, type RecoveryPolicy } from "./recovery-mode";
import type { AttemptModality } from "./verification/types";

export const DEFAULT_ACTIVATION_LIMITS: ActivationLimits = {
  maxBaseSkillActivationsPerSession: 2,
  maxUsageActivationsPerSession: 1,
  maxPerItemPerSession: 1,
};

interface MandatorySelection {
  selected: PlannedItem[];
  deferred: PlannedItem[];
  seconds: number;
}

function urgencyOrder(left: PlannedItem, right: PlannedItem): number {
  const leftRetrievability = left.retrievability ?? 1;
  const rightRetrievability = right.retrievability ?? 1;
  if (leftRetrievability !== rightRetrievability) {
    return leftRetrievability - rightRetrievability;
  }
  return left.dueAt.localeCompare(right.dueAt);
}

function orderMandatory(mandatory: DailyPlanningInput["mandatory"]): PlannedItem[] {
  return deduplicateItems([
    ...[...mandatory.learning].sort(urgencyOrder),
    ...[...mandatory.overdue, ...mandatory.provisionalDue].sort(urgencyOrder),
    ...[...mandatory.dueToday].sort(urgencyOrder),
  ]);
}

function deduplicateItems<T extends { itemId: string }>(items: T[]): T[] {
  const seenItemIds = new Set<string>();
  return items.filter((item) => {
    if (seenItemIds.has(item.itemId)) return false;
    seenItemIds.add(item.itemId);
    return true;
  });
}

export function selectMandatory(
  mandatory: DailyPlanningInput["mandatory"],
  budgetSeconds: number,
  byModality: Record<AttemptModality, number>,
): MandatorySelection {
  const ordered = orderMandatory(mandatory);
  const selected: PlannedItem[] = [];
  const deferred: PlannedItem[] = [];
  let seconds = 0;

  for (let index = 0; index < ordered.length; index += 1) {
    const item = ordered[index];
    const cost = byModality[item.modality];
    const firstItem = selected.length === 0;
    if (!firstItem && seconds + cost > budgetSeconds) {
      deferred.push(...ordered.slice(index));
      break;
    }
    selected.push(item);
    seconds += cost;
  }

  return { selected, deferred, seconds };
}

function selectActivations(
  candidates: ActivationCandidate[],
  maximum: number,
  availableSeconds: number,
  byModality: Record<AttemptModality, number>,
  selectedItemIds: Set<string>,
  maxPerItemPerSession: number,
): ActivationSelection {
  const selected: ActivationCandidate[] = [];
  const deferred: ActivationCandidate[] = [];
  let seconds = 0;

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    const cost = byModality[candidate.modality];
    if (selected.length >= maximum || selectedItemIds.has(candidate.itemId)) {
      deferred.push(candidate);
      continue;
    }
    if (maxPerItemPerSession < 1) {
      deferred.push(...candidates.slice(index));
      break;
    }
    if (seconds + cost > availableSeconds) {
      deferred.push(...candidates.slice(index));
      break;
    }

    selected.push(candidate);
    selectedItemIds.add(candidate.itemId);
    seconds += cost;
  }

  return { selected, deferred, seconds };
}

export function planDailySession(
  input: DailyPlanningInput,
  limits: ActivationLimits,
  recovery: RecoveryPolicy,
): DailyPlan {
  const mode = resolveMode(
    backlogSeconds(input.mandatory, input.estimatedSeconds.byModality),
    input.dailyBudgetSeconds,
    input.previousMode,
    recovery,
  );
  const mandatory = selectMandatory(
    input.mandatory,
    input.dailyBudgetSeconds,
    input.estimatedSeconds.byModality,
  );
  const remainingAfterMandatory = Math.max(0, input.dailyBudgetSeconds - mandatory.seconds);

  if (mode === "recovery") {
    const base = { selected: [], deferred: input.candidates.baseSkillActivations, seconds: 0 };
    const forecast = buildFutureCapacity(input, mandatory.deferred, base.deferred);
    return planFromSelections(
      mode,
      mandatory,
      base,
      { selected: [], deferred: input.candidates.usageActivations, seconds: 0 },
      { selected: [], seconds: 0 },
      0,
      mergeReservations([
        ...input.capacityForecast.dueReservations,
        ...forecast.reservations,
      ]),
    );
  }

  const selectedItemIds = new Set(mandatory.selected.map((item) => item.itemId));
  const maxPerItem = Math.min(1, Math.max(0, limits.maxPerItemPerSession));
  const orderedBase = orderDueReservationsFirst(
    input.candidates.baseSkillActivations,
    input.capacityForecast.dueReservations,
  );
  const dueBaseCount = orderedBase.filter((candidate) => (
    input.capacityForecast.dueReservations.some((reservation) => (
      reservation.itemId === candidate.itemId
    ))
  )).length;
  const configuredBaseLimit = Math.max(
    0,
    limits.maxBaseSkillActivationsPerSession - input.consumed.baseSkillActivations,
  );
  const base = selectActivations(
    orderedBase,
    Math.max(configuredBaseLimit, dueBaseCount),
    remainingAfterMandatory,
    input.estimatedSeconds.byModality,
    selectedItemIds,
    maxPerItem,
  );
  const usage = selectActivations(
    input.candidates.usageActivations,
    Math.max(0, limits.maxUsageActivationsPerSession - input.consumed.usageActivations),
    remainingAfterMandatory - base.seconds,
    input.estimatedSeconds.byModality,
    selectedItemIds,
    maxPerItem,
  );
  const availableForNewWords = Math.max(
    0,
    remainingAfterMandatory - base.seconds - usage.seconds,
  );
  const newWordSeconds = input.estimatedSeconds.newWordIntroduction
    + input.estimatedSeconds.byModality.recognition;
  const currentSessionCapacity = newWordSeconds > 0
    ? Math.floor(availableForNewWords / newWordSeconds)
    : input.configuredNewWordLimit;
  const configuredRemaining = Math.max(
    0,
    input.configuredNewWordLimit - input.consumed.newWords,
  );
  const forecast = buildFutureCapacity(input, mandatory.deferred, base.deferred);
  const admission = admitNewWords({
    candidates: input.candidates.newWords.slice(0, currentSessionCapacity),
    configuredNewWordLimit: configuredRemaining,
    forecast,
    estimatedSecondsByModality: input.estimatedSeconds.byModality,
  });
  const newWords = {
    selected: admission.admitted,
    seconds: admission.admitted.length * newWordSeconds,
  };

  return planFromSelections(
    mode,
    mandatory,
    base,
    usage,
    newWords,
    admission.capacitySafeNewWords,
    mergeReservations([
      ...input.capacityForecast.dueReservations,
      ...admission.forecast.reservations,
    ]),
  );
}

function planFromSelections(
  mode: DailyAllowance["mode"],
  mandatory: MandatorySelection,
  base: ActivationSelection,
  usage: ActivationSelection,
  newWords: { selected: DailyPlan["newWordsSelected"]; seconds: number },
  capacitySafeNewWords: number,
  futureReservations: DailyPlan["futureReservations"],
): DailyPlan {
  const newWordMeaningActivations = newWords.selected.length;
  const allowance: DailyAllowance = {
    newWords: newWords.selected.length,
    capacitySafeNewWords,
    baseSkillActivations: base.selected.length,
    usageActivations: usage.selected.length,
    newWordMeaningActivations,
    totalSkillActivations: base.selected.length + newWordMeaningActivations,
    plannedSeconds: mandatory.seconds + base.seconds + usage.seconds + newWords.seconds,
    mode,
  };

  return {
    allowance,
    mandatorySelected: mandatory.selected,
    deferredMandatory: mandatory.deferred,
    baseSkillSelected: base.selected,
    usageSelected: usage.selected,
    newWordsSelected: newWords.selected,
    futureReservations,
  };
}
