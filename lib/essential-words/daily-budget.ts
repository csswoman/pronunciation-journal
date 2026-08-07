import { admitNewWords, admitPlacementConversions } from "./admission-control";
import { applyAdmissionThroughputCap } from "./admission-capacity";
import {
  DEFAULT_ACTIVATION_LIMITS,
  resolveAbsoluteBaseActivationSafetyCeiling,
} from "./activation-limits";
import { buildAdmissionLoadEnvelope } from "./admission-envelope";
import { selectBaseDynamically } from "./daily-budget-base";
import { buildFutureCapacity, mergeReservations, orderDueReservationsFirst } from "./future-capacity";
import { buildLoadBreakdown } from "./planning-load";
import type {
  ActivationCandidate,
  ActivationLimits,
  ActivationSelection,
  CapacityReservation,
  DailyAllowance,
  DailyPlan,
  DailyPlanningInput,
  PlannedItem,
  PlanningLoadBreakdown,
} from "./planning-types";
import { backlogSeconds, resolveMode, type RecoveryPolicy } from "./recovery-mode";
import type { AttemptModality, LearningItem } from "./verification/types";

export { DEFAULT_ACTIVATION_LIMITS, resolveAbsoluteBaseActivationSafetyCeiling };

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
    if (selected.length > 0 && seconds + cost > budgetSeconds) {
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
    if (maxPerItemPerSession < 1 || seconds + cost > availableSeconds) {
      deferred.push(...candidates.slice(index));
      break;
    }
    selected.push(candidate);
    selectedItemIds.add(candidate.itemId);
    seconds += cost;
  }

  return { selected, deferred, seconds };
}

function beyondHorizon(
  reservations: readonly CapacityReservation[],
): CapacityReservation[] {
  return reservations.filter((reservation) => reservation.deadlineSession > 8);
}

function placementIdSet(input: DailyPlanningInput): Set<string> {
  return new Set(
    [
      ...input.capacityForecast.dueReservations,
      ...input.capacityForecast.futureReservations,
    ]
      .filter((reservation) => reservation.source === "placement")
      .map((reservation) => reservation.itemId),
  );
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
  const placementIds = placementIdSet(input);
  const selectedItemIds = new Set(mandatory.selected.map((item) => item.itemId));
  const orderedBase = orderDueReservationsFirst(
    input.candidates.baseSkillActivations,
    input.capacityForecast.dueReservations,
  );

  if (mode === "recovery") {
    const base = selectBaseDynamically(
      input,
      limits,
      orderedBase,
      remainingAfterMandatory,
      selectedItemIds,
      true,
    );
    const forecast = buildFutureCapacity(input, mandatory.deferred, base.deferred);
    const futureReservations = mergeReservations([
      ...input.capacityForecast.dueReservations,
      ...beyondHorizon(input.capacityForecast.futureReservations),
      ...forecast.reservations,
    ]);
    return planFromSelections(
      mode, mandatory, base,
      { selected: [], deferred: input.candidates.usageActivations, seconds: 0 },
      { selected: [], seconds: 0 }, 0, [], 0, futureReservations,
      buildLoadBreakdown(input, mandatory, base, { selected: [], deferred: [], seconds: 0 }, 0, futureReservations, placementIds),
    );
  }

  const base = selectBaseDynamically(
    input,
    limits,
    orderedBase,
    remainingAfterMandatory,
    selectedItemIds,
    false,
  );
  const forecast = buildFutureCapacity(input, mandatory.deferred, base.deferred);
  const placement = input.placementContext
    ? admitPlacementConversions({
        candidates: input.candidates.placementCandidates ?? [],
        maxConversionsPerSession: input.placementContext.maxConversionsPerSession,
        forecast,
        estimatedSecondsByModality: input.estimatedSeconds.byModality,
        now: input.placementContext.now,
        activeSessionDates: input.placementContext.activeSessionDates,
      })
    : {
        admitted: [] as LearningItem[],
        deferred: input.candidates.placementCandidates ?? [],
        capacitySafeConversions: 0,
        newReservations: [] as CapacityReservation[],
        forecast,
        status: "ready" as const,
      };
  for (const reservation of placement.newReservations) {
    if (reservation.source === "placement") placementIds.add(reservation.itemId);
  }

  const usage = selectActivations(
    input.candidates.usageActivations,
    Math.max(0, limits.maxUsageActivationsPerSession - input.consumed.usageActivations),
    remainingAfterMandatory - base.seconds,
    input.estimatedSeconds.byModality,
    selectedItemIds,
    Math.min(1, Math.max(0, limits.maxPerItemPerSession)),
  );
  const availableForNewWords = Math.max(0, remainingAfterMandatory - base.seconds - usage.seconds);
  const perNewWord = input.estimatedSeconds.newWordIntroduction
    + input.estimatedSeconds.byModality.recognition;
  const sessionCap = perNewWord > 0
    ? Math.floor(availableForNewWords / perNewWord)
    : input.configuredNewWordLimit;
  const admissionEnvelope = buildAdmissionLoadEnvelope({
    costs: input.estimatedSeconds.byModality,
    introductionSeconds: input.estimatedSeconds.newWordIntroduction,
    horizonSessions: 8,
  });
  const admission = admitNewWords({
    candidates: input.candidates.newWords.slice(0, sessionCap),
    configuredNewWordLimit: Math.max(0, input.configuredNewWordLimit - input.consumed.newWords),
    forecast: applyAdmissionThroughputCap(
      placement.forecast,
      resolveAbsoluteBaseActivationSafetyCeiling(limits),
      input.estimatedSeconds.byModality,
    ),
    estimatedSecondsByModality: input.estimatedSeconds.byModality,
    admissionEnvelope,
    introductionSeconds: input.estimatedSeconds.newWordIntroduction,
  });
  const newWords = {
    selected: admission.admitted,
    seconds: admission.admitted.length * perNewWord,
  };
  const futureReservations = mergeReservations([
    ...input.capacityForecast.dueReservations,
    ...beyondHorizon(input.capacityForecast.futureReservations),
    ...admission.forecast.reservations,
  ]);

  return planFromSelections(
    mode, mandatory, base, usage, newWords, admission.capacitySafeNewWords,
    placement.admitted, placement.deferred.length, futureReservations,
    buildLoadBreakdown(
      input, mandatory, base, usage, newWords.seconds, futureReservations, placementIds,
    ),
  );
}

function planFromSelections(
  mode: DailyAllowance["mode"],
  mandatory: MandatorySelection,
  base: ActivationSelection,
  usage: ActivationSelection,
  newWords: { selected: DailyPlan["newWordsSelected"]; seconds: number },
  capacitySafeNewWords: number,
  placementSelected: LearningItem[],
  placementDeferred: number,
  futureReservations: DailyPlan["futureReservations"],
  loadBreakdown: PlanningLoadBreakdown,
): DailyPlan {
  const newWordMeaningActivations = newWords.selected.length;
  return {
    allowance: {
      newWords: newWords.selected.length,
      capacitySafeNewWords,
      baseSkillActivations: base.selected.length,
      usageActivations: usage.selected.length,
      newWordMeaningActivations,
      totalSkillActivations: base.selected.length + newWordMeaningActivations,
      plannedSeconds: mandatory.seconds + base.seconds + usage.seconds + newWords.seconds,
      mode,
      dynamicBaseAllowanceMax: base.dynamicBaseAllowanceMax ?? base.selected.length,
      dynamicBaseLimitingFactor: base.dynamicBaseLimitingFactor,
    },
    mandatorySelected: mandatory.selected,
    deferredMandatory: mandatory.deferred,
    baseSkillSelected: base.selected,
    usageSelected: usage.selected,
    newWordsSelected: newWords.selected,
    placementSelected,
    placementDeferred,
    futureReservations,
    loadBreakdown,
  };
}
