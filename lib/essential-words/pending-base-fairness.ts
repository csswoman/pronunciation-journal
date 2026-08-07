import type { ActivationCandidate } from "./planning-types";
import type { AttemptModality, Skill } from "./verification/types";

/** C9 limit — do not change (Task 8.9c). */
export const C9_BASE_ACTIVATION_LIMIT = 8;

export const PENDING_BASE_FAIRNESS_POLICY_VERSION = "pending-base-fairness-v1";

export type BaseBlockingReason =
  | "mandatory-capacity"
  | "base-throughput-cap"
  | "priority"
  | "placement-reservation"
  | "usage-reservation"
  | "no-session-capacity"
  | "deduplicated"
  | "other";

export interface PendingBaseCandidate extends ActivationCandidate {
  source: "pending-base";
  waitSessions: number;
  firstEligibleSession: number;
  admittedSession: number;
  deadlineSession: number;
}

export interface BaseServiceDiagnostic {
  itemId: string;
  skill: Skill;
  source: "pending-base";
  admittedSession: number;
  firstEligibleSession: number;
  servedSession: number | null;
  waitSessions: number;
  blockingReasons: Array<{
    sessionIndex: number;
    reason: BaseBlockingReason;
    detail: string;
  }>;
}

/**
 * Deterministic urgency: higher when closer to C9 deadline.
 * f(wait, remaining) = waitSessions * 10 + (C9_LIMIT - remainingSessions)^2
 */
export function serviceUrgency(waitSessions: number, remainingSessions: number): number {
  const remaining = Math.max(0, remainingSessions);
  const wait = Math.max(0, waitSessions);
  const proximity = Math.max(0, C9_BASE_ACTIVATION_LIMIT - remaining);
  return wait * 10 + proximity * proximity;
}

export function remainingSessionsUntilC9(waitSessions: number): number {
  return Math.max(0, C9_BASE_ACTIVATION_LIMIT - Math.max(0, waitSessions));
}

/**
 * Rank key (ascending = higher priority):
 * 1. nearer C9 deadline (remainingSessions)
 * 2. greater waitSessions
 * 3. greater serviceUrgency
 * 4. deterministic itemId
 */
export function comparePendingBaseCandidates(
  left: PendingBaseCandidate,
  right: PendingBaseCandidate,
): number {
  const leftRemaining = remainingSessionsUntilC9(left.waitSessions);
  const rightRemaining = remainingSessionsUntilC9(right.waitSessions);
  if (leftRemaining !== rightRemaining) return leftRemaining - rightRemaining;
  if (left.waitSessions !== right.waitSessions) {
    return right.waitSessions - left.waitSessions;
  }
  const leftUrgency = serviceUrgency(left.waitSessions, leftRemaining);
  const rightUrgency = serviceUrgency(right.waitSessions, rightRemaining);
  if (leftUrgency !== rightUrgency) return rightUrgency - leftUrgency;
  return left.itemId.localeCompare(right.itemId);
}

export function rankPendingBaseCandidates(
  candidates: readonly PendingBaseCandidate[],
): PendingBaseCandidate[] {
  return [...candidates].sort(comparePendingBaseCandidates);
}

export function toPendingBaseCandidate(
  candidate: ActivationCandidate,
  meta: {
    waitSessions?: number;
    firstEligibleSession?: number;
    admittedSession?: number;
    deadlineSession?: number;
  } = {},
): PendingBaseCandidate {
  const waitSessions = meta.waitSessions
    ?? candidate.waitSessions
    ?? 0;
  const deadlineSession = meta.deadlineSession
    ?? candidate.deadlineSession
    ?? remainingSessionsUntilC9(waitSessions);
  return {
    ...candidate,
    source: "pending-base",
    waitSessions,
    firstEligibleSession: meta.firstEligibleSession
      ?? candidate.firstEligibleSession
      ?? 0,
    admittedSession: meta.admittedSession
      ?? candidate.admittedSession
      ?? 0,
    deadlineSession,
  };
}

export function diagnoseBaseBlocking(input: {
  candidate: PendingBaseCandidate;
  remainingBudgetSeconds: number;
  remainingBaseSlots: number;
  selectedItemIds: ReadonlySet<string>;
  hardMandatoryRemainingSeconds: number;
  placementReservationSeconds: number;
  usageReservationSeconds: number;
  candidateCostSeconds?: number;
}): BaseBlockingReason {
  const cost = input.candidateCostSeconds ?? 1;
  if (input.selectedItemIds.has(input.candidate.itemId)) return "deduplicated";
  if (input.remainingBudgetSeconds <= 0) return "no-session-capacity";
  if (input.hardMandatoryRemainingSeconds >= input.remainingBudgetSeconds) {
    return "mandatory-capacity";
  }
  if (input.remainingBaseSlots <= 0) return "base-throughput-cap";
  if (
    input.placementReservationSeconds > 0
    && input.remainingBudgetSeconds - cost < input.placementReservationSeconds
  ) {
    return "placement-reservation";
  }
  if (
    input.usageReservationSeconds > 0
    && input.remainingBudgetSeconds - cost < input.usageReservationSeconds
  ) {
    return "usage-reservation";
  }
  if (input.remainingBudgetSeconds < cost) return "no-session-capacity";
  return "priority";
}

/** Never emit bare `other` — always attach detail. */
export function blockingReasonWithDetail(
  reason: BaseBlockingReason,
  detail: string,
): { reason: BaseBlockingReason; detail: string } {
  if (reason === "other" && !detail.trim()) {
    throw new Error("BaseBlockingReason 'other' requires diagnostic detail");
  }
  return { reason, detail };
}

export type ModalityCosts = Record<AttemptModality, number>;
