import type { ActivationCandidate } from "../planning-types";
import {
  C9_BASE_ACTIVATION_LIMIT,
  diagnoseBaseBlocking,
  toPendingBaseCandidate,
  type BaseServiceDiagnostic,
} from "../pending-base-fairness";
import type { AttemptModality } from "../verification/types";
import type { SimulationWorld } from "./state";

/** Track first eligibility and annotate waitSessions on pending-base candidates. */
export function annotateBaseCandidatesWithWait(
  candidates: ActivationCandidate[],
  world: SimulationWorld,
): ActivationCandidate[] {
  return candidates.map((candidate) => {
    let first = world.baseEligibleSinceSession.get(candidate.itemId);
    if (first === undefined) {
      first = world.sessionIndex;
      world.baseEligibleSinceSession.set(candidate.itemId, first);
    }
    const waitSessions = Math.max(0, world.sessionIndex - first);
    return {
      ...candidate,
      firstEligibleSession: first,
      admittedSession: first,
      waitSessions,
      deadlineSession: Math.max(1, C9_BASE_ACTIVATION_LIMIT - waitSessions),
    };
  });
}

export function clearServedBaseEligibility(
  world: SimulationWorld,
  servedItemIds: readonly string[],
): void {
  for (const itemId of servedItemIds) {
    world.baseEligibleSinceSession.delete(itemId);
  }
}

export function buildDeferredBaseDiagnostics(input: {
  sessionIndex: number;
  candidates: readonly ActivationCandidate[];
  selected: readonly ActivationCandidate[];
  remainingBudgetSeconds: number;
  remainingBaseSlots: number;
  hardMandatoryRemainingSeconds: number;
  placementReservationSeconds: number;
  usageReservationSeconds: number;
  costs: Record<AttemptModality, number>;
}): BaseServiceDiagnostic[] {
  const selectedIds = new Set(input.selected.map((item) => item.itemId));
  const diagnostics: BaseServiceDiagnostic[] = [];

  for (const candidate of input.candidates) {
    if (selectedIds.has(candidate.itemId)) continue;
    const pending = toPendingBaseCandidate(candidate);
    const cost = input.costs[candidate.modality];
    const reason = diagnoseBaseBlocking({
      candidate: pending,
      remainingBudgetSeconds: input.remainingBudgetSeconds,
      remainingBaseSlots: input.remainingBaseSlots,
      selectedItemIds: selectedIds,
      hardMandatoryRemainingSeconds: input.hardMandatoryRemainingSeconds,
      placementReservationSeconds: input.placementReservationSeconds,
      usageReservationSeconds: input.usageReservationSeconds,
      candidateCostSeconds: cost,
    });
    diagnostics.push({
      itemId: candidate.itemId,
      skill: candidate.skill,
      source: "pending-base",
      admittedSession: pending.admittedSession,
      firstEligibleSession: pending.firstEligibleSession,
      servedSession: null,
      waitSessions: pending.waitSessions,
      blockingReasons: [{
        sessionIndex: input.sessionIndex,
        reason,
        detail: `budget=${input.remainingBudgetSeconds};slots=${input.remainingBaseSlots};mandatory=${input.hardMandatoryRemainingSeconds};cost=${cost}`,
      }],
    });
  }
  return diagnostics;
}
