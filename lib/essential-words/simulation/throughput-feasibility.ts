/**
 * Versioned marginal band for throughput feasibility (Task 8.9c).
 * residual in [0, marginRatioMax) of available ⇒ marginal.
 * residual < 0 ⇒ infeasible; residual >= marginRatioMax * available ⇒ feasible.
 */
export const MARGINAL_FEASIBILITY_POLICY_VERSION = "marginal-feasibility-v1";

/** Soft band: less than 5% of session budget free after target demand. */
export const MARGINAL_MARGIN_RATIO_MAX = 0.05;

export type FeasibilityStatus = "feasible" | "marginal" | "infeasible";

export type ThroughputBottleneck =
  | "mandatory"
  | "base-activation"
  | "placement"
  | "usage"
  | "fsrs-future-load"
  | "required-arrival";

export interface ThroughputFeasibility {
  actualStatus: FeasibilityStatus;
  targetStatus: FeasibilityStatus;
  /** @deprecated Prefer targetStatus — kept for 8.9b call sites during migration. */
  status: FeasibilityStatus;
  horizonSessions: number;
  availableSeconds: number;
  committedSeconds: number;
  requiredNewWords: number;
  requiredBaseActivations: number;
  requiredSeconds: number;
  residualSeconds: number;
  requiredArrivalSecondsPerSession: number;
  actualArrivalSecondsPerSession: number;
  sustainableServiceSecondsPerSession: number;
  committedMandatorySecondsPerSession: number;
  residualForGrowthSecondsPerSession: number;
  marginSecondsPerSession: number;
  marginRatio: number;
  bottlenecks: ThroughputBottleneck[];
}

export interface ThroughputFeasibilityInput {
  horizonSessions: number;
  availableSecondsPerSession: number;
  committedMandatorySecondsPerSession?: number;
  committedBaseSecondsPerSession?: number;
  committedPlacementSecondsPerSession?: number;
  usageSecondsPerSession?: number;
  actualArrivalSecondsPerSession?: number;
  requiredArrivalSecondsPerSession?: number;
  /** Optional legacy fields for requiredNewWords telemetry. */
  requiredNewWordsPerSession?: number;
  secondsPerNewWordImmediate?: number;
  secondsPerNewWordBase?: number;
  expectedFsrsPerNewWordPerSession?: readonly number[];
  /** @deprecated Prefer committedMandatorySecondsPerSession. */
  committedMandatoryPerSession?: number;
  committedBasePerSession?: number;
  committedPlacementPerSession?: number;
  usagePerSession?: number;
}

export interface SteadyC8C9RequirementsInput {
  targetNewWordsPerSession: number;
  minimumAcceptedShare: number;
  horizonSessions: number;
  perNewWordSeconds: number;
  reviewEnvelopeSecondsPerWord: number;
}

/**
 * C8 requires measured >= 0.6 with targetNewWords=10 → ~6 new words/session
 * in low-pressure sessions. Each word needs listening+production within C9=8.
 */
export function steadyC8C9Requirements(input: SteadyC8C9RequirementsInput): {
  requiredNewWordsPerSession: number;
  requiredBaseActivationsPerSession: number;
  requiredSecondsPerSession: number;
  horizonSessions: number;
} {
  const requiredNewWordsPerSession = Math.ceil(
    input.targetNewWordsPerSession * input.minimumAcceptedShare,
  );
  return {
    requiredNewWordsPerSession,
    requiredBaseActivationsPerSession: requiredNewWordsPerSession * 2,
    requiredSecondsPerSession: requiredNewWordsPerSession * (
      input.perNewWordSeconds + input.reviewEnvelopeSecondsPerWord / input.horizonSessions
    ),
    horizonSessions: input.horizonSessions,
  };
}

function classifyStatus(
  marginSeconds: number,
  availableSecondsPerSession: number,
): FeasibilityStatus {
  if (marginSeconds < 0) return "infeasible";
  const ratio = availableSecondsPerSession > 0
    ? marginSeconds / availableSecondsPerSession
    : 0;
  if (ratio < MARGINAL_MARGIN_RATIO_MAX) return "marginal";
  return "feasible";
}

function resolveCommitted(input: ThroughputFeasibilityInput): {
  mandatory: number;
  base: number;
  placement: number;
  usage: number;
} {
  return {
    mandatory: input.committedMandatorySecondsPerSession
      ?? input.committedMandatoryPerSession
      ?? 0,
    base: input.committedBaseSecondsPerSession
      ?? input.committedBasePerSession
      ?? 0,
    placement: input.committedPlacementSecondsPerSession
      ?? input.committedPlacementPerSession
      ?? 0,
    usage: input.usageSecondsPerSession
      ?? input.usagePerSession
      ?? 0,
  };
}

export function evaluateThroughputFeasibility(
  input: ThroughputFeasibilityInput,
): ThroughputFeasibility {
  const horizon = Math.max(0, Math.floor(input.horizonSessions));
  const availablePer = Math.max(0, input.availableSecondsPerSession);
  const availableSeconds = availablePer * horizon;
  const committed = resolveCommitted(input);
  const committedPerSession = committed.mandatory
    + committed.base
    + committed.placement
    + committed.usage;
  const committedSeconds = committedPerSession * horizon;

  const sustainableServiceSecondsPerSession = Math.max(
    0,
    availablePer - committedPerSession,
  );

  const requiredArrival = Math.max(0, input.requiredArrivalSecondsPerSession ?? 0);
  const actualArrival = Math.max(0, input.actualArrivalSecondsPerSession ?? 0);

  // Legacy path: derive required arrival from per-word costs when only words given.
  let requiredArrivalResolved = requiredArrival;
  if (
    requiredArrivalResolved === 0
    && (input.requiredNewWordsPerSession ?? 0) > 0
    && input.secondsPerNewWordImmediate !== undefined
    && input.secondsPerNewWordBase !== undefined
  ) {
    const fsrsPerWord = (input.expectedFsrsPerNewWordPerSession ?? [])
      .slice(0, horizon)
      .reduce((total, value) => total + value, 0);
    requiredArrivalResolved = input.requiredNewWordsPerSession! * (
      input.secondsPerNewWordImmediate
      + input.secondsPerNewWordBase
      + fsrsPerWord / Math.max(1, horizon)
    );
  }

  const targetMargin = sustainableServiceSecondsPerSession - requiredArrivalResolved;
  const actualMargin = sustainableServiceSecondsPerSession - actualArrival;
  const residualForGrowthSecondsPerSession = targetMargin;
  const marginSecondsPerSession = targetMargin;
  const marginRatio = availablePer > 0 ? targetMargin / availablePer : 0;

  const actualStatus = classifyStatus(actualMargin, availablePer);
  const targetStatus = classifyStatus(targetMargin, availablePer);

  const bottlenecks: ThroughputBottleneck[] = [];
  if (committed.mandatory >= availablePer * 0.85) bottlenecks.push("mandatory");
  if (committed.base > 0 && targetMargin < 0) bottlenecks.push("base-activation");
  if (committed.placement > 0 && targetMargin < 0) bottlenecks.push("placement");
  if (committed.usage > 0 && targetMargin < 0) bottlenecks.push("usage");
  if (requiredArrivalResolved > 0 && targetMargin < 0) {
    bottlenecks.push("required-arrival");
    bottlenecks.push("fsrs-future-load");
  }
  if (targetMargin < 0 && bottlenecks.length === 0) bottlenecks.push("mandatory");

  const requiredNewWordsPerSession = input.requiredNewWordsPerSession
    ?? 0;
  const requiredSeconds = requiredArrivalResolved * horizon;

  return {
    actualStatus,
    targetStatus,
    status: targetStatus,
    horizonSessions: horizon,
    availableSeconds,
    committedSeconds,
    requiredNewWords: requiredNewWordsPerSession * horizon,
    requiredBaseActivations: requiredNewWordsPerSession * 2 * horizon,
    requiredSeconds,
    residualSeconds: targetMargin * horizon,
    requiredArrivalSecondsPerSession: requiredArrivalResolved,
    actualArrivalSecondsPerSession: actualArrival,
    sustainableServiceSecondsPerSession,
    committedMandatorySecondsPerSession: committed.mandatory,
    residualForGrowthSecondsPerSession,
    marginSecondsPerSession,
    marginRatio,
    bottlenecks,
  };
}
