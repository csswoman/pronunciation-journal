export type ThroughputBottleneck =
  | "mandatory"
  | "base-activation"
  | "placement"
  | "usage"
  | "fsrs-future-load";

export interface ThroughputFeasibility {
  status: "feasible" | "infeasible";
  horizonSessions: number;
  availableSeconds: number;
  committedSeconds: number;
  requiredNewWords: number;
  requiredBaseActivations: number;
  requiredSeconds: number;
  residualSeconds: number;
  bottlenecks: ThroughputBottleneck[];
}

export interface ThroughputFeasibilityInput {
  horizonSessions: number;
  availableSecondsPerSession: number;
  committedMandatoryPerSession: number;
  committedBasePerSession: number;
  committedPlacementPerSession: number;
  usagePerSession: number;
  requiredNewWordsPerSession: number;
  secondsPerNewWordImmediate: number;
  secondsPerNewWordBase: number;
  /** Per-session FSRS envelope seconds for ONE new word across the horizon. */
  expectedFsrsPerNewWordPerSession: readonly number[];
}

/**
 * C8 requires measured >= 0.6 with targetNewWords=10 → ~6 new words/session
 * in low-pressure sessions. Each word needs listening+production within C9=8.
 */
export function steadyC8C9Requirements(input: {
  targetNewWordsPerSession: number;
  minimumAcceptedShare: number;
  horizonSessions: number;
  perNewWordSeconds: number;
  reviewEnvelopeSecondsPerWord: number;
}): {
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

export function evaluateThroughputFeasibility(
  input: ThroughputFeasibilityInput,
): ThroughputFeasibility {
  const horizon = Math.max(0, Math.floor(input.horizonSessions));
  const availableSeconds = input.availableSecondsPerSession * horizon;
  const committedPerSession = input.committedMandatoryPerSession
    + input.committedBasePerSession
    + input.committedPlacementPerSession
    + input.usagePerSession;
  const committedSeconds = committedPerSession * horizon;

  const fsrsPerWord = input.expectedFsrsPerNewWordPerSession
    .slice(0, horizon)
    .reduce((total, value) => total + value, 0);
  const requiredPerSession = input.requiredNewWordsPerSession * (
    input.secondsPerNewWordImmediate + input.secondsPerNewWordBase
  ) + input.requiredNewWordsPerSession * (fsrsPerWord / Math.max(1, horizon));
  const requiredSeconds = requiredPerSession * horizon;
  const residualSeconds = availableSeconds - committedSeconds - requiredSeconds;

  const bottlenecks: ThroughputBottleneck[] = [];
  if (input.committedMandatoryPerSession >= input.availableSecondsPerSession * 0.85) {
    bottlenecks.push("mandatory");
  }
  if (
    input.requiredNewWordsPerSession * input.secondsPerNewWordBase
    > input.availableSecondsPerSession - input.committedMandatoryPerSession
  ) {
    bottlenecks.push("base-activation");
  }
  if (input.committedPlacementPerSession > 0
    && residualSeconds < 0
    && input.committedPlacementPerSession >= input.committedBasePerSession) {
    bottlenecks.push("placement");
  }
  if (input.usagePerSession > 0 && residualSeconds < 0) {
    bottlenecks.push("usage");
  }
  if (fsrsPerWord > 0 && residualSeconds < 0) {
    bottlenecks.push("fsrs-future-load");
  }
  if (residualSeconds < 0 && bottlenecks.length === 0) {
    bottlenecks.push("mandatory");
  }

  return {
    status: residualSeconds >= 0 ? "feasible" : "infeasible",
    horizonSessions: horizon,
    availableSeconds,
    committedSeconds,
    requiredNewWords: input.requiredNewWordsPerSession * horizon,
    requiredBaseActivations: input.requiredNewWordsPerSession * 2 * horizon,
    requiredSeconds,
    residualSeconds,
    bottlenecks,
  };
}
