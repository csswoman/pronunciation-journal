import { admitNewWords, admitPlacementConversions } from "./admission-control";
import {
  DEFAULT_ACTIVATION_LIMITS,
  resolveAbsoluteBaseActivationSafetyCeiling,
} from "./activation-limits";
import {
  type MandatorySelection,
  orderDueFirst,
  placementIdSet,
  rolloverReservations,
  selectActivations,
  selectMandatory,
} from "./daily-budget-selectors";
import { selectBaseDynamically } from "./daily-budget-base";
import { buildLoadBreakdown } from "./planning-load";
import {
  deriveBaseBacklogPolicy,
  pendingBaseBacklogSeconds,
} from "./pending-base-fairness";
import type {
  ActivationLimits,
  ActivationSelection,
  CapacityReservation,
  DailyAllowance,
  DailyPlan,
  DailyPlanningInput,
  PlanningLoadBreakdown,
} from "./planning-types";
import { backlogSeconds, resolveMode, type RecoveryPolicy } from "./recovery-mode";
import type { LearningItem } from "./verification/types";
import {
  consumeBaseObligationCapacity,
  deriveBaseBackpressure,
} from "./base-backpressure";

export { DEFAULT_ACTIVATION_LIMITS, resolveAbsoluteBaseActivationSafetyCeiling };
export { selectMandatory } from "./daily-budget-selectors";

/**
 * First Easy interval from New in ts-fsrs defaults (see fsrs-schedule tests) —
 * the horizon at which a newly admitted word's first scheduled review lands.
 * Replaces admission-envelope.ts's versioned envelope (encargo §7a): the only
 * number that mattered from it, kept as a plain constant.
 */
const FSRS_NEW_EASY_INTERVAL_DAYS = 8;

/**
 * Fase 8 final simplification (docs/superpowers/plans/notes/
 * 2026-08-07-fase8-final-planner-simplification.md §3). One economy —
 * available seconds — and one backpressure signal — pending-base backlog
 * seconds. Five steps, in priority order:
 *
 *   1. mandatory (scheduled reviews + learning/relearning)
 *   2. pending base already committed (listening/production backlog)
 *   3. placement conversions already committed, same backpressure as (2)
 *   4. new words, min(target, capacityEstimate) gated by the same backlog
 *   5. usage, residual only
 *
 * No 8-session reservation ledger is built or reconciled here anymore —
 * `futureReservations` on the output is now a flat rollover (previous
 * reservations not yet served, plus whatever this session newly promised),
 * kept only so the C9 obligation audit (simulation/audit/c9-obligation-trace.ts)
 * and simulation's cross-session bookkeeping (simulation/capacity-state.ts)
 * keep a stable, append-only ledger of individual listening/production
 * promises — never a capacity solver production code depends on.
 *
 * Selection primitives (selectMandatory/selectActivations/orderDueFirst/
 * rolloverReservations) live in daily-budget-selectors.ts to keep this file
 * under the repo's 250-line convention.
 */
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

  // Step 1 — mandatory (scheduled reviews + learning/relearning).
  const mandatory = selectMandatory(
    input.mandatory,
    input.dailyBudgetSeconds,
    input.estimatedSeconds.byModality,
  );
  const remainingAfterMandatory = Math.max(0, input.dailyBudgetSeconds - mandatory.seconds);
  const placementIds = placementIdSet(input);
  const selectedItemIds = new Set(mandatory.selected.map((item) => item.itemId));
  const orderedBase = orderDueFirst(
    input.candidates.baseSkillActivations,
    input.capacityForecast.dueReservations,
  );

  // Step 2 — pending base already committed (listening/production backlog).
  const base = selectBaseDynamically(
    input,
    limits,
    orderedBase,
    remainingAfterMandatory,
    selectedItemIds,
    mode === "recovery",
  );
  const remainingAfterBase = Math.max(0, remainingAfterMandatory - base.seconds);

  const backlogPolicy = deriveBaseBacklogPolicy({
    dailyBudgetSeconds: input.dailyBudgetSeconds,
    modalityCosts: input.estimatedSeconds.byModality,
  });
  // Backlog counts what is still pending after this session's own base
  // service — the same signal placement and new-word admission both react
  // to (encargo §7/§8): serving base work today relieves tomorrow's pressure.
  const backlogAfterService = pendingBaseBacklogSeconds(base.deferred, input.estimatedSeconds.byModality);
  const pendingObligationsAfterService = Math.max(
    0,
    (input.pendingBaseObligationCount ?? base.deferred.length) - base.selected.length,
  );
  const baseBackpressure = deriveBaseBackpressure({
    pendingBaseCount: pendingObligationsAfterService,
    recentService: input.recentBaseService ?? [],
    remainingSecondsAfterMandatory: remainingAfterMandatory,
    modalityCosts: input.estimatedSeconds.byModality,
  });

  if (mode === "recovery") {
    const futureReservations = rolloverReservations(input, []);
    return planFromSelections(
      mode, mandatory, base,
      { selected: [], deferred: input.candidates.usageActivations, seconds: 0 },
      { selected: [], seconds: 0 }, 0, [], 0, futureReservations,
      { capacitySafeConversions: 0, rejectedForCapacity: 0, rejectedForSafetyCeiling: 0 },
      baseBackpressure,
      buildLoadBreakdown(input, mandatory, base, { selected: [], deferred: [], seconds: 0 }, 0, futureReservations, placementIds),
    );
  }

  // Step 3 — placement conversions already committed, same backpressure.
  const placement = input.placementContext
    ? admitPlacementConversions({
        candidates: input.candidates.placementCandidates ?? [],
        maxConversionsPerSession: input.placementContext.maxConversionsPerSession,
        remainingSeconds: remainingAfterBase,
        perConversionSeconds: input.estimatedSeconds.byModality.recognition,
        estimatedSecondsByModality: input.estimatedSeconds.byModality,
        pendingBaseBacklogSeconds: backlogAfterService,
        backlogPolicy,
        baseBackpressure,
        now: input.placementContext.now,
        activeSessionDates: input.placementContext.activeSessionDates,
      })
    : {
        admitted: [] as LearningItem[],
        deferred: input.candidates.placementCandidates ?? [],
        capacitySafeConversions: 0,
        newReservations: [] as CapacityReservation[],
        status: "ready" as const,
        rejectedForCapacity: 0,
        rejectedForSafetyCeiling: 0,
      };
  for (const reservation of placement.newReservations) {
    if (reservation.source === "placement") placementIds.add(reservation.itemId);
  }
  const placementSeconds = placement.admitted.length * input.estimatedSeconds.byModality.recognition;
  const remainingAfterPlacement = Math.max(0, remainingAfterBase - placementSeconds);
  const backpressureAfterPlacement = consumeBaseObligationCapacity(
    baseBackpressure,
    placement.newReservations.length,
  );

  // Step 5 (computed before new words to bound their share of what's left,
  // but usage stays residual — never displaces new-word admission on its own).
  const usage = selectActivations(
    input.candidates.usageActivations,
    Math.max(0, limits.maxUsageActivationsPerSession - input.consumed.usageActivations),
    remainingAfterPlacement,
    input.estimatedSeconds.byModality,
    selectedItemIds,
    Math.min(1, Math.max(0, limits.maxPerItemPerSession)),
  );

  // Step 4 — new words: min(target, capacityEstimate), same backpressure.
  const availableForNewWords = Math.max(0, remainingAfterPlacement - usage.seconds);
  // Immediate seconds actually spent this session per admitted word.
  const perNewWordImmediate = input.estimatedSeconds.newWordIntroduction
    + input.estimatedSeconds.byModality.recognition;
  // Inline safety reserve replacing admission-envelope.ts + hard-mandatory-forecast.ts
  // (encargo §7a): a word admitted today also creates a listening+production
  // base obligation and a first FSRS review in ~FSRS_NEW_EASY_INTERVAL_DAYS
  // sessions. Amortizing that debt into the admission throttle (not into the
  // seconds actually charged to today's plan) is what keeps early-run
  // admission from outrunning sustained base-service capacity — without a
  // versioned envelope module or a session ledger.
  const perNewWordAmortized = perNewWordImmediate
    + input.estimatedSeconds.byModality.listening
    + input.estimatedSeconds.byModality.production
    + input.estimatedSeconds.byModality.recognition / FSRS_NEW_EASY_INTERVAL_DAYS;
  const admission = admitNewWords({
    candidates: input.candidates.newWords,
    configuredNewWordLimit: Math.max(0, input.configuredNewWordLimit - input.consumed.newWords),
    remainingSeconds: availableForNewWords,
    perNewWordSeconds: perNewWordAmortized,
    estimatedSecondsByModality: input.estimatedSeconds.byModality,
    pendingBaseBacklogSeconds: backlogAfterService,
    backlogPolicy,
    baseBackpressure: backpressureAfterPlacement,
  });
  const newWords = {
    selected: admission.admitted,
    seconds: admission.admitted.length * perNewWordImmediate,
  };

  const futureReservations = rolloverReservations(input, [
    ...placement.newReservations,
    ...admission.newReservations,
  ]);

  return planFromSelections(
    mode, mandatory, base, usage, newWords, admission.capacitySafeNewWords,
    placement.admitted, placement.deferred.length, futureReservations,
    {
      capacitySafeConversions: placement.capacitySafeConversions,
      rejectedForCapacity: placement.rejectedForCapacity,
      rejectedForSafetyCeiling: placement.rejectedForSafetyCeiling,
    },
    baseBackpressure,
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
  placementCapacity: DailyPlan["placementCapacity"],
  baseBackpressure: DailyPlan["baseBackpressure"],
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
    placementCapacity,
    baseBackpressure,
    futureReservations,
    loadBreakdown,
  };
}
