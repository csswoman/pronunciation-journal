import { DEFAULT_BASE_ACTIVATION_POLICY } from "./base-activation-allowance";
import {
  BASE_THROUGHPUT_CONTRACT_VERSION,
  C9_HORIZON_SESSIONS,
  deriveRequiredBaseActivations,
} from "./base-throughput-contract";
import {
  MARGINAL_FEASIBILITY_POLICY_VERSION,
  MARGINAL_MARGIN_RATIO_MAX,
  type FeasibilityStatus,
} from "./throughput-feasibility";

export {
  BASE_THROUGHPUT_CONTRACT_VERSION,
  C9_HORIZON_SESSIONS,
  REQUIRED_BASE_SKILLS_WITHIN_C9,
  deriveRequiredBaseActivations,
  describeMaxBaseSkillActivationsContract,
  reconcileBaseActivationDemand,
  type BaseActivationDemandItem,
  type MaxBaseSkillActivationsContractDoc,
  type RequiredBaseSkill,
} from "./base-throughput-contract";

/** Pack alternating listening/production into residual seconds (Task 8.9e). */
export function projectBaseServiceCapacityPerSession(input: {
  availableSecondsPerSession: number;
  committedMandatorySecondsPerSession: number;
  listeningCost: number;
  productionCost: number;
  reserveShare?: number;
  absoluteSafetyCeiling?: number;
}): number {
  const reserve = input.reserveShare ?? DEFAULT_BASE_ACTIVATION_POLICY.reserveShare;
  const ceiling = input.absoluteSafetyCeiling
    ?? DEFAULT_BASE_ACTIVATION_POLICY.absoluteSafetyCeiling;
  let seconds = Math.max(
    0,
    (input.availableSecondsPerSession - input.committedMandatorySecondsPerSession)
      * (1 - reserve),
  );
  let count = 0;
  let next: "listening" | "production" = "listening";
  while (count < ceiling) {
    const cost = next === "listening" ? input.listeningCost : input.productionCost;
    if (seconds < cost) break;
    seconds -= cost;
    count += 1;
    next = next === "listening" ? "production" : "listening";
  }
  return count;
}

export interface ResourceFeasibility {
  requiredPerSession: number;
  serviceCapacityPerSession: number;
  requiredOverHorizon: number;
  serviceCapacityOverHorizon: number;
  margin: number;
  status: FeasibilityStatus;
}

export type MultidimensionalBottleneck =
  | "seconds"
  | "base-activation-slots"
  | "listening-slots"
  | "production-slots"
  | "mandatory"
  | "placement";

export interface MultidimensionalThroughputFeasibility {
  seconds: ResourceFeasibility;
  baseActivations: ResourceFeasibility;
  listeningActivations?: ResourceFeasibility;
  productionActivations?: ResourceFeasibility;
  overallStatus: FeasibilityStatus;
  bottlenecks: MultidimensionalBottleneck[];
  requiredNewWordsPerSession: number;
  requiredBaseActivationsPerWord: number;
  contractVersion: string;
  marginalPolicyVersion: string;
}

function classifyResourceMargin(
  margin: number,
  capacityOverHorizon: number,
): FeasibilityStatus {
  if (margin < 0) return "infeasible";
  if (margin === 0) return "feasible";
  const ratio = capacityOverHorizon > 0 ? margin / capacityOverHorizon : 1;
  if (ratio < MARGINAL_MARGIN_RATIO_MAX) return "marginal";
  return "feasible";
}

export function buildResourceFeasibility(input: {
  requiredPerSession: number;
  serviceCapacityPerSession: number;
  horizonSessions: number;
}): ResourceFeasibility {
  const horizon = Math.max(0, Math.floor(input.horizonSessions));
  const requiredPerSession = Math.max(0, input.requiredPerSession);
  const serviceCapacityPerSession = Math.max(0, input.serviceCapacityPerSession);
  const requiredOverHorizon = requiredPerSession * horizon;
  const serviceCapacityOverHorizon = serviceCapacityPerSession * horizon;
  const margin = serviceCapacityOverHorizon - requiredOverHorizon;
  return {
    requiredPerSession,
    serviceCapacityPerSession,
    requiredOverHorizon,
    serviceCapacityOverHorizon,
    margin,
    status: classifyResourceMargin(margin, serviceCapacityOverHorizon),
  };
}

export function evaluateBaseActivationWindows(input: {
  requiredActivationsBySession: readonly number[];
  serviceCapacityPerSession: number;
  horizonSessions?: number;
}): {
  maxRequiredInWindow: number;
  availableSlotsInWindow: number;
  worstMargin: number;
  firstInfeasibleWindowStart: number | null;
} {
  const windowSize = input.horizonSessions ?? C9_HORIZON_SESSIONS;
  const capacity = Math.max(0, input.serviceCapacityPerSession) * windowSize;
  let maxRequiredInWindow = 0;
  let worstMargin = Number.POSITIVE_INFINITY;
  let firstInfeasibleWindowStart: number | null = null;

  if (input.requiredActivationsBySession.length < windowSize) {
    const required = input.requiredActivationsBySession
      .reduce((total, value) => total + Math.max(0, value), 0);
    const margin = capacity - required;
    return {
      maxRequiredInWindow: required,
      availableSlotsInWindow: capacity,
      worstMargin: margin,
      firstInfeasibleWindowStart: margin < 0 ? 0 : null,
    };
  }

  for (
    let start = 0;
    start <= input.requiredActivationsBySession.length - windowSize;
    start += 1
  ) {
    const required = input.requiredActivationsBySession
      .slice(start, start + windowSize)
      .reduce((total, value) => total + Math.max(0, value), 0);
    const margin = capacity - required;
    if (required > maxRequiredInWindow) maxRequiredInWindow = required;
    if (margin < worstMargin) worstMargin = margin;
    if (margin < 0 && firstInfeasibleWindowStart === null) {
      firstInfeasibleWindowStart = start;
    }
  }

  return {
    maxRequiredInWindow,
    availableSlotsInWindow: capacity,
    worstMargin: Number.isFinite(worstMargin) ? worstMargin : capacity,
    firstInfeasibleWindowStart,
  };
}

export interface MultidimensionalFeasibilityInput {
  configuredNewWordsTarget: number;
  minimumC8Share: number;
  horizonSessions: number;
  availableSecondsPerSession: number;
  committedMandatorySecondsPerSession?: number;
  committedBaseSecondsPerSession?: number;
  committedPlacementSecondsPerSession?: number;
  usageSecondsPerSession?: number;
  /**
   * Projected base activations/session from residual packing (Task 8.9e).
   * Do not pass a fixed hard-cap×1 unless that is the measured projection.
   */
  projectedBaseServicePerSession: number;
  requiredArrivalSecondsPerSession?: number;
  actualArrivalSecondsPerSession?: number;
  placementBaseActivationsPerSession?: number;
  existingPendingBaseActivationsPerSession?: number;
  listeningRequiredPerSession?: number;
  productionRequiredPerSession?: number;
  listeningServedPerSession?: number;
  productionServedPerSession?: number;
  /** @deprecated Prefer projectedBaseServicePerSession. */
  maxBaseSkillActivationsPerSession?: number;
}

export function evaluateMultidimensionalFeasibility(
  input: MultidimensionalFeasibilityInput,
): MultidimensionalThroughputFeasibility {
  const derived = deriveRequiredBaseActivations({
    configuredNewWordsTarget: input.configuredNewWordsTarget,
    minimumC8Share: input.minimumC8Share,
    horizonSessions: input.horizonSessions,
  });
  const horizon = derived.horizonSessions;
  const placementPer = Math.max(0, input.placementBaseActivationsPerSession ?? 0);
  const pendingPer = Math.max(0, input.existingPendingBaseActivationsPerSession ?? 0);
  const requiredBasePerSession = derived.requiredBaseActivationsPerSession
    + placementPer
    + pendingPer;
  const serviceBasePerSession = Math.max(
    0,
    input.projectedBaseServicePerSession
      ?? input.maxBaseSkillActivationsPerSession
      ?? 0,
  );

  const baseActivations = buildResourceFeasibility({
    requiredPerSession: requiredBasePerSession,
    serviceCapacityPerSession: serviceBasePerSession,
    horizonSessions: horizon,
  });

  const committedSeconds = (input.committedMandatorySecondsPerSession ?? 0)
    + (input.committedBaseSecondsPerSession ?? 0)
    + (input.committedPlacementSecondsPerSession ?? 0)
    + (input.usageSecondsPerSession ?? 0);
  const sustainableSeconds = Math.max(
    0,
    input.availableSecondsPerSession - committedSeconds,
  );
  const seconds = buildResourceFeasibility({
    requiredPerSession: Math.max(0, input.requiredArrivalSecondsPerSession ?? 0),
    serviceCapacityPerSession: sustainableSeconds,
    horizonSessions: horizon,
  });

  const listeningRequired = input.listeningRequiredPerSession
    ?? derived.requiredNewWordsPerSession + placementPer / 2 + pendingPer / 2;
  const productionRequired = input.productionRequiredPerSession
    ?? derived.requiredNewWordsPerSession + placementPer / 2 + pendingPer / 2;
  const listeningActivations = buildResourceFeasibility({
    requiredPerSession: listeningRequired,
    serviceCapacityPerSession: serviceBasePerSession,
    horizonSessions: horizon,
  });
  const productionActivations = buildResourceFeasibility({
    requiredPerSession: productionRequired,
    serviceCapacityPerSession: serviceBasePerSession,
    horizonSessions: horizon,
  });

  const bottlenecks: MultidimensionalBottleneck[] = [];
  if (seconds.status === "infeasible") bottlenecks.push("seconds");
  if (baseActivations.status === "infeasible") bottlenecks.push("base-activation-slots");
  if (listeningActivations.status === "infeasible") bottlenecks.push("listening-slots");
  if (productionActivations.status === "infeasible") bottlenecks.push("production-slots");
  if ((input.committedMandatorySecondsPerSession ?? 0)
    >= input.availableSecondsPerSession * 0.85) {
    bottlenecks.push("mandatory");
  }
  if (placementPer > 0 && baseActivations.status === "infeasible") {
    bottlenecks.push("placement");
  }

  const statuses = [
    seconds.status,
    baseActivations.status,
    listeningActivations.status,
    productionActivations.status,
  ];
  let overallStatus: FeasibilityStatus = "feasible";
  if (statuses.includes("infeasible")) overallStatus = "infeasible";
  else if (statuses.includes("marginal")) overallStatus = "marginal";

  return {
    seconds,
    baseActivations,
    listeningActivations,
    productionActivations,
    overallStatus,
    bottlenecks: [...new Set(bottlenecks)],
    requiredNewWordsPerSession: derived.requiredNewWordsPerSession,
    requiredBaseActivationsPerWord: derived.requiredBaseActivationsPerWord,
    contractVersion: BASE_THROUGHPUT_CONTRACT_VERSION,
    marginalPolicyVersion: MARGINAL_FEASIBILITY_POLICY_VERSION,
  };
}
