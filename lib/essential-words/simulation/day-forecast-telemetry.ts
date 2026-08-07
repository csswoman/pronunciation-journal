import { buildAdmissionLoadEnvelope } from "../admission-envelope";
import { isC8Applicable } from "../criterion-applicability";
import type { CapacityReservation } from "../planning-types";
import {
  computeRequiredArrivalSecondsPerSession,
  envelopeSecondsPerNewWord,
} from "../throughput-rates";
import {
  evaluateThroughputFeasibility,
  type FeasibilityStatus,
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
  pendingBaseSeconds?: number;
  pendingBaseCount?: number;
  oldestPendingWait?: number;
  servedListening?: number;
  servedProduction?: number;
  capacitySafeNewWords?: number;
}): Pick<
  SimulatedDay,
  | "futureMandatoryReservedSeconds"
  | "expectedFsrsDebtSeconds"
  | "futureResidualSeconds"
  | "admissionDemandSeconds"
  | "feasibilityStatus"
  | "actualFeasibilityStatus"
  | "targetFeasibilityStatus"
  | "serviceRateSeconds"
  | "actualArrivalRateSeconds"
  | "requiredArrivalRateSeconds"
  | "arrivalRateSeconds"
  | "arrivalMinusServiceSeconds"
  | "targetMarginSeconds"
  | "c8CriterionApplicable"
  | "pendingBaseCount"
  | "oldestPendingWait"
  | "servedListening"
  | "servedProduction"
  | "capacitySafeNewWords"
  | "committedMandatorySeconds"
  | "committedBaseSeconds"
  | "committedPlacementSeconds"
  | "usageSeconds"
> {
  const envelope = buildAdmissionLoadEnvelope({
    costs: input.costs,
    introductionSeconds: input.introductionSeconds,
    horizonSessions: 8,
  });
  const c8Applicable = isC8Applicable(input.profileId);
  const futureMandatoryReservedSeconds = input.futureMandatory
    .reduce((total, item) => total + item.estimatedSeconds, 0);
  const pendingBaseReservations = input.futureReservations
    .filter((item) => item.source === "pending-base");
  const committedBaseSeconds = input.pendingBaseSeconds
    ?? pendingBaseReservations
      .reduce((total, item) => total + item.estimatedSeconds, 0);
  const committedPlacementSeconds = input.placementReservations
    .reduce((total, item) => total + item.estimatedSeconds, 0);
  const usageSeconds = input.usageActivations * input.costs.production;
  const reviewPerWord = envelope.expectedReviewSecondsBySession
    .reduce((total, value) => total + value, 0);
  const expectedFsrsDebtSeconds = input.newWords * reviewPerWord;
  const perWord = envelopeSecondsPerNewWord(envelope);
  const admissionDemandSeconds = input.newWords * perWord;
  const requiredArrivalRateSeconds = computeRequiredArrivalSecondsPerSession({
    targetNewWordsPerSession: input.targetNewWords,
    minimumC8Share: 0.6,
    envelope,
    c8Applicable,
  });
  const actualArrivalRateSeconds = admissionDemandSeconds;
  const committedMandatoryPerSession = futureMandatoryReservedSeconds / 8;
  const committedBasePerSession = committedBaseSeconds / 8;
  const committedPlacementPerSession = committedPlacementSeconds / 8;
  const futureResidualSeconds = Math.max(
    0,
    input.dailyBudgetSeconds * 8
      - futureMandatoryReservedSeconds
      - committedBaseSeconds
      - committedPlacementSeconds
      - expectedFsrsDebtSeconds,
  );

  const feasibility = evaluateThroughputFeasibility({
    horizonSessions: 8,
    availableSecondsPerSession: input.dailyBudgetSeconds,
    committedMandatorySecondsPerSession: committedMandatoryPerSession,
    committedBaseSecondsPerSession: committedBasePerSession,
    committedPlacementSecondsPerSession: committedPlacementPerSession,
    usageSecondsPerSession: usageSeconds,
    actualArrivalSecondsPerSession: actualArrivalRateSeconds,
    requiredArrivalSecondsPerSession: requiredArrivalRateSeconds,
  });

  const serviceRateSeconds = input.completedSeconds;
  const feasibilityStatus: FeasibilityStatus | "n/a" = c8Applicable
    ? feasibility.targetStatus
    : "n/a";

  return {
    futureMandatoryReservedSeconds,
    expectedFsrsDebtSeconds,
    futureResidualSeconds,
    admissionDemandSeconds,
    feasibilityStatus,
    actualFeasibilityStatus: feasibility.actualStatus,
    targetFeasibilityStatus: c8Applicable ? feasibility.targetStatus : "n/a",
    serviceRateSeconds,
    actualArrivalRateSeconds,
    requiredArrivalRateSeconds,
    arrivalRateSeconds: actualArrivalRateSeconds,
    arrivalMinusServiceSeconds: actualArrivalRateSeconds - serviceRateSeconds,
    targetMarginSeconds: c8Applicable ? feasibility.marginSecondsPerSession : null,
    c8CriterionApplicable: c8Applicable,
    pendingBaseCount: input.pendingBaseCount
      ?? pendingBaseReservations.length,
    oldestPendingWait: input.oldestPendingWait ?? 0,
    servedListening: input.servedListening ?? 0,
    servedProduction: input.servedProduction ?? 0,
    capacitySafeNewWords: input.capacitySafeNewWords ?? 0,
    committedMandatorySeconds: futureMandatoryReservedSeconds,
    committedBaseSeconds,
    committedPlacementSeconds,
    usageSeconds,
  };
}
