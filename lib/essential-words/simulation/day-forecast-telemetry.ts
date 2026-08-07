import { buildAdmissionLoadEnvelope } from "../admission-envelope";
import type { CapacityReservation } from "../planning-types";
import {
  evaluateThroughputFeasibility,
  steadyC8C9Requirements,
} from "../throughput-feasibility";
import type { AttemptModality } from "../verification/types";
import type { SimulatedDay } from "./types";

export function buildActiveDayForecastTelemetry(input: {
  profileId: string;
  dailyBudgetSeconds: number;
  targetNewWords: number;
  newWords: number;
  usageActivations: number;
  completedSeconds: number;
  costs: Record<AttemptModality, number>;
  introductionSeconds: number;
  futureMandatory: ReadonlyArray<{ estimatedSeconds: number }>;
  futureReservations: readonly CapacityReservation[];
  placementReservations: readonly CapacityReservation[];
}): Pick<
  SimulatedDay,
  | "futureMandatoryReservedSeconds"
  | "expectedFsrsDebtSeconds"
  | "futureResidualSeconds"
  | "admissionDemandSeconds"
  | "feasibilityStatus"
  | "serviceRateSeconds"
  | "arrivalRateSeconds"
  | "arrivalMinusServiceSeconds"
> {
  const envelope = buildAdmissionLoadEnvelope({
    costs: input.costs,
    introductionSeconds: input.introductionSeconds,
    horizonSessions: 8,
  });
  const futureMandatoryReservedSeconds = input.futureMandatory
    .reduce((total, item) => total + item.estimatedSeconds, 0);
  const reviewPerWord = envelope.expectedReviewSecondsBySession
    .reduce((total, value) => total + value, 0);
  const expectedFsrsDebtSeconds = input.newWords * reviewPerWord;
  const reservedBaseSeconds = input.futureReservations
    .reduce((total, item) => total + item.estimatedSeconds, 0);
  const placementSeconds = input.placementReservations
    .reduce((total, item) => total + item.estimatedSeconds, 0);
  const admissionDemandSeconds = input.newWords * (
    input.introductionSeconds
    + input.costs.recognition
    + input.costs.listening
    + input.costs.production
  ) + expectedFsrsDebtSeconds;
  const futureResidualSeconds = Math.max(
    0,
    input.dailyBudgetSeconds * 8
      - futureMandatoryReservedSeconds
      - reservedBaseSeconds
      - expectedFsrsDebtSeconds,
  );
  const c8c9 = steadyC8C9Requirements({
    targetNewWordsPerSession: input.targetNewWords,
    minimumAcceptedShare: 0.6,
    horizonSessions: 8,
    perNewWordSeconds: input.introductionSeconds
      + input.costs.recognition
      + input.costs.listening
      + input.costs.production,
    reviewEnvelopeSecondsPerWord: reviewPerWord,
  });
  const feasibility = evaluateThroughputFeasibility({
    horizonSessions: 8,
    availableSecondsPerSession: input.dailyBudgetSeconds,
    committedMandatoryPerSession: futureMandatoryReservedSeconds / 8,
    committedBasePerSession: reservedBaseSeconds / 8,
    committedPlacementPerSession: placementSeconds / 8,
    usagePerSession: input.usageActivations * input.costs.production,
    requiredNewWordsPerSession: c8c9.requiredNewWordsPerSession,
    secondsPerNewWordImmediate: envelope.immediateSeconds,
    secondsPerNewWordBase: envelope.baseActivationSeconds,
    expectedFsrsPerNewWordPerSession: envelope.expectedReviewSecondsBySession,
  });
  const serviceRateSeconds = input.completedSeconds;
  const arrivalRateSeconds = admissionDemandSeconds + placementSeconds;

  return {
    futureMandatoryReservedSeconds,
    expectedFsrsDebtSeconds,
    futureResidualSeconds,
    admissionDemandSeconds,
    feasibilityStatus: feasibility.status,
    ...(input.profileId === "steady"
      ? {
          serviceRateSeconds,
          arrivalRateSeconds,
          arrivalMinusServiceSeconds: arrivalRateSeconds - serviceRateSeconds,
        }
      : {}),
  };
}
