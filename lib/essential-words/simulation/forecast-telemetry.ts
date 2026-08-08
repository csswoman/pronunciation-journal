import type { SimulatedDay } from "./types";

/** Default Task 8.9b/c forecast telemetry for inactive / stub days. */
export function emptyForecastTelemetry(): Pick<
  SimulatedDay,
  | "futureMandatoryReservedSeconds"
  | "expectedFsrsDebtSeconds"
  | "futureResidualSeconds"
  | "admissionDemandSeconds"
  | "feasibilityStatus"
  | "c8CriterionApplicable"
  | "targetMarginSeconds"
> {
  return {
    futureMandatoryReservedSeconds: 0,
    expectedFsrsDebtSeconds: 0,
    futureResidualSeconds: 0,
    admissionDemandSeconds: 0,
    feasibilityStatus: "n/a",
    c8CriterionApplicable: false,
    targetMarginSeconds: null,
  };
}
