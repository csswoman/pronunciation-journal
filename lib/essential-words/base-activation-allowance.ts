import {
  comparePendingBaseCandidates,
  remainingSessionsUntilC9,
  toPendingBaseCandidate,
  type PendingBaseCandidate,
} from "./pending-base-fairness";
import type { ActivationCandidate, ActivationSelection } from "./planning-types";
import type { AttemptModality } from "./verification/types";

/**
 * Base activation policy (Task 8.9e; simplified Fase 8 final — docs/superpowers/
 * plans/notes/2026-08-07-fase8-final-planner-simplification.md §7e).
 *
 * absoluteSafetyCeiling = 24:
 * - 2x the C8-derived demand (6 words x 2 skills = 12) so the ceiling is not
 *   the habitual limiter when time exists;
 * - still bounds runaway if a packing bug admits a huge pending set;
 * - normally limitingFactor should be time-budget, not safety-ceiling.
 *
 * The dynamic allowance now has a single capacity economy — remaining
 * seconds today — instead of also consulting a per-lane 8-session forecast.
 */
export const BASE_ACTIVATION_POLICY_VERSION = "base-activation-policy-v2";

export interface BaseActivationPolicy {
  version: string;
  absoluteSafetyCeiling: number;
  /** Share of residual seconds kept for unforeseen mandatory. */
  reserveShare: number;
  maxWaitSessions: 8;
  /** In recovery, only serve pending with remainingSessions <= this. */
  recoveryUrgentRemainingSessions: number;
}

export const DEFAULT_BASE_ACTIVATION_POLICY: BaseActivationPolicy = {
  version: BASE_ACTIVATION_POLICY_VERSION,
  absoluteSafetyCeiling: 24,
  reserveShare: 0.1,
  maxWaitSessions: 8,
  recoveryUrgentRemainingSessions: 2,
};

export type BaseAllowanceLimitingFactor =
  | "time-budget"
  | "recovery"
  | "no-pending"
  | "safety-ceiling";

export interface DynamicBaseAllowanceInput {
  pendingBase: readonly ActivationCandidate[];
  residualSecondsToday: number;
  modalityCosts: Record<AttemptModality, number>;
  mandatoryDueBaseCount: number;
  recoveryMode: boolean;
  policy: BaseActivationPolicy;
}

export interface DynamicBaseAllowance {
  maxActivationsToday: number;
  listeningSlots: number;
  productionSlots: number;
  reservedSeconds: number;
  limitingFactor: BaseAllowanceLimitingFactor;
  availableSeconds: number;
}

function isUrgent(candidate: PendingBaseCandidate, policy: BaseActivationPolicy): boolean {
  return remainingSessionsUntilC9(candidate.waitSessions)
    <= policy.recoveryUrgentRemainingSessions;
}

function placementPenalty(candidate: ActivationCandidate): number {
  return candidate.source === "placement" ? 1 : 0;
}

function compareForService(
  left: PendingBaseCandidate,
  right: PendingBaseCandidate,
): number {
  const placement = placementPenalty(left) - placementPenalty(right);
  if (placement !== 0) return placement;
  return comparePendingBaseCandidates(left, right);
}

/**
 * Interleaves urgent listening/production so one modality cannot monopolize
 * when both have near-C9 items. Non-urgent items keep pure fairness order.
 */
export function orderPendingForDynamicService(
  candidates: readonly ActivationCandidate[],
): PendingBaseCandidate[] {
  const pending = candidates.map((item) => toPendingBaseCandidate(item))
    .sort(compareForService);
  const urgentListening = pending.filter((item) => (
    item.skill === "listening" && remainingSessionsUntilC9(item.waitSessions) <= 2
  ));
  const urgentProduction = pending.filter((item) => (
    item.skill === "production" && remainingSessionsUntilC9(item.waitSessions) <= 2
  ));
  if (urgentListening.length === 0 || urgentProduction.length === 0) {
    return pending;
  }

  const selectedIds = new Set<string>();
  const interleaved: PendingBaseCandidate[] = [];
  let listenIndex = 0;
  let productionIndex = 0;
  while (
    listenIndex < urgentListening.length
    || productionIndex < urgentProduction.length
  ) {
    const nextListening = urgentListening[listenIndex];
    const nextProduction = urgentProduction[productionIndex];
    if (
      nextListening
      && (
        !nextProduction
        || comparePendingBaseCandidates(nextListening, nextProduction) <= 0
        || listenIndex <= productionIndex
      )
    ) {
      interleaved.push(nextListening);
      selectedIds.add(nextListening.itemId);
      listenIndex += 1;
    } else if (nextProduction) {
      interleaved.push(nextProduction);
      selectedIds.add(nextProduction.itemId);
      productionIndex += 1;
    } else {
      break;
    }
  }
  for (const item of pending) {
    if (!selectedIds.has(item.itemId)) interleaved.push(item);
  }
  return interleaved;
}

export function computeDynamicBaseAllowance(
  input: DynamicBaseAllowanceInput,
): DynamicBaseAllowance {
  if (input.pendingBase.length === 0) {
    return {
      maxActivationsToday: 0,
      listeningSlots: 0,
      productionSlots: 0,
      reservedSeconds: 0,
      limitingFactor: "no-pending",
      availableSeconds: 0,
    };
  }
  return selectPendingBaseWithDynamicAllowance({
    ...input,
    selectedItemIds: new Set(),
    maxPerItemPerSession: 1,
    probeOnly: true,
  }).allowance;
}

export function selectPendingBaseWithDynamicAllowance(input: DynamicBaseAllowanceInput & {
  selectedItemIds: Set<string>;
  maxPerItemPerSession: number;
  /** Internal: skip mutating shared sets beyond selection. */
  probeOnly?: boolean;
}): ActivationSelection & { allowance: DynamicBaseAllowance } {
  const policy = input.policy;
  const reserve = Math.max(0, policy.reserveShare);
  const residualAfterReserve = Math.max(
    0,
    input.residualSecondsToday * (1 - reserve),
  );

  let ordered = orderPendingForDynamicService(input.pendingBase);
  if (input.recoveryMode) {
    // Near-C9 first, then less-urgent pending — never drop committed base
    // silently. New/low-wait work sorts after and may get zero residual.
    const urgent = ordered.filter((item) => isUrgent(item, policy));
    const rest = ordered.filter((item) => !isUrgent(item, policy));
    ordered = [...urgent, ...rest];
  }

  const selected: ActivationCandidate[] = [];
  const deferred: ActivationCandidate[] = [];
  const selectedIds = input.probeOnly
    ? new Set(input.selectedItemIds)
    : input.selectedItemIds;
  let seconds = 0;
  let listeningSlots = 0;
  let productionSlots = 0;
  let limitingFactor: BaseAllowanceLimitingFactor = "no-pending";

  for (let index = 0; index < ordered.length; index += 1) {
    const candidate = ordered[index]!;
    const cost = input.modalityCosts[candidate.modality];
    if (selectedIds.has(candidate.itemId)) {
      deferred.push(candidate);
      continue;
    }
    if (input.maxPerItemPerSession < 1) {
      deferred.push(...ordered.slice(index));
      break;
    }
    if (selected.length >= policy.absoluteSafetyCeiling) {
      deferred.push(...ordered.slice(index));
      limitingFactor = "safety-ceiling";
      break;
    }
    if (seconds + cost > residualAfterReserve) {
      deferred.push(...ordered.slice(index));
      limitingFactor = "time-budget";
      break;
    }

    selected.push(candidate);
    selectedIds.add(candidate.itemId);
    seconds += cost;
    if (candidate.modality === "listening") {
      listeningSlots += 1;
    } else if (candidate.modality === "production") {
      productionSlots += 1;
    }
  }

  if (limitingFactor === "no-pending") {
    if (input.pendingBase.length === 0) {
      limitingFactor = "no-pending";
    } else if (selected.length === 0) {
      limitingFactor = input.recoveryMode && residualAfterReserve > 0
        ? "recovery"
        : "time-budget";
    } else if (selected.length >= policy.absoluteSafetyCeiling) {
      limitingFactor = "safety-ceiling";
    } else if (deferred.some((item) => !selectedIds.has(item.itemId))) {
      // Packed until a hard stop was not set — treat leftover as time-bound.
      limitingFactor = "time-budget";
    }
  }

  const maxActivationsToday = selected.length;

  return {
    selected,
    deferred,
    seconds,
    allowance: {
      maxActivationsToday,
      listeningSlots,
      productionSlots,
      reservedSeconds: seconds,
      limitingFactor,
      availableSeconds: residualAfterReserve,
    },
  };
}
