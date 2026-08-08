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
  source: "pending-base" | "placement";
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
    source: candidate.source === "placement" ? "placement" : "pending-base",
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

/**
 * Backpressure policy for admission control (new words + placement).
 *
 * Fase 8 final simplification (docs/superpowers/plans/notes/
 * 2026-08-07-fase8-final-planner-simplification.md §7). Replaces the
 * 8-session `CapacityForecast` reservation ledger as the admission gate:
 * the single signal that throttles new-word/placement admission is the size
 * of the pending listening/production backlog, not a rolling window solver.
 *
 * `maxWaitSessions` mirrors C9 (§9 of the encargo) — it is the measurement
 * horizon, not a structure the runtime maintains. `admissionBackpressureThreshold`
 * is derived from how many listening+production pairs the planner can
 * realistically clear within that horizon at the given modality costs; once
 * the backlog approaches that volume, admission throttles down.
 */
export const BASE_BACKLOG_POLICY_VERSION = "base-backlog-policy-v1";

export interface BaseBacklogPolicy {
  version: string;
  maxWaitSessions: 8;
  /** Seconds of pending-base backlog at which admission starts throttling. */
  admissionBackpressureThresholdSeconds: number;
  /** Safety guard on backlog size, not a throughput target. */
  maxPendingBaseSeconds?: number;
}

/**
 * Derives a backpressure threshold from measured quantities instead of a
 * hardcoded constant (encargo §7): the amount of listening+production work
 * the planner can serve within `maxWaitSessions` sessions at the current
 * per-session budget, reserving `reserveShare` for mandatory/unplanned load.
 */
export function deriveBaseBacklogPolicy(input: {
  dailyBudgetSeconds: number;
  modalityCosts: ModalityCosts;
  reserveShare?: number;
}): BaseBacklogPolicy {
  const reserveShare = input.reserveShare ?? 0.5;
  const servableSecondsPerSession = Math.max(
    0,
    input.dailyBudgetSeconds * (1 - reserveShare),
  );
  const servableSecondsOverHorizon = servableSecondsPerSession * C9_BASE_ACTIVATION_LIMIT;
  return {
    version: BASE_BACKLOG_POLICY_VERSION,
    maxWaitSessions: C9_BASE_ACTIVATION_LIMIT,
    admissionBackpressureThresholdSeconds: servableSecondsOverHorizon,
    maxPendingBaseSeconds: servableSecondsOverHorizon * 2,
  };
}

/** Sum of estimated seconds for pending listening/production not yet served. */
export function pendingBaseBacklogSeconds(
  pendingBase: readonly ActivationCandidate[],
  modalityCosts: ModalityCosts,
): number {
  return pendingBase.reduce(
    (total, candidate) => total + modalityCosts[candidate.modality],
    0,
  );
}

/**
 * Backpressure factor in (0, 1]: 1 when backlog is at/below zero, shrinking
 * linearly to 0 as backlog approaches (or exceeds) the policy threshold.
 * This is the single throttle new-word and placement admission share — no
 * per-candidate rolling-window solver.
 */
export function backpressureFactor(
  backlogSeconds: number,
  policy: BaseBacklogPolicy,
): number {
  if (policy.admissionBackpressureThresholdSeconds <= 0) return backlogSeconds > 0 ? 0 : 1;
  const ratio = backlogSeconds / policy.admissionBackpressureThresholdSeconds;
  return Math.max(0, Math.min(1, 1 - ratio));
}
