// Task 8.9f §9-§10 — condición de estabilidad mandatory y headroom de
// crecimiento. Puramente analítico: no cambia selección, FSRS, presupuesto
// ni C1-C11. Consume series ya observadas (arrival/service por sesión) o
// agregados ya existentes (envelope, requeridos C8/C9) para reportar.
import type { AdmissionLoadEnvelope } from "./admission-envelope";
import { totalExpectedReviewSeconds } from "./admission-envelope";
import type { MandatoryAuditDay } from "./mandatory-audit";

export type MandatoryFeasibilityStatus = "stable" | "marginal" | "unstable";

export interface MandatoryFeasibility {
  arrivalSecondsPerSession: number;
  serviceCapacitySecondsPerSession: number;
  utilization: number;
  backlogSlope: number;
  status: MandatoryFeasibilityStatus;
}

/** Umbral de utilización a partir del cual se considera "marginal". */
const MARGINAL_UTILIZATION = 0.85;
/** Pendiente de backlog (s/sesión) tolerada como ruido antes de "marginal". */
const NOISE_SLOPE_SECONDS_PER_SESSION = 0.5;

/**
 * mandatoryArrival >= sustainableMandatoryService ⇒ inestable, incluso antes
 * de considerar nuevas activaciones. El backlog existente NO se trata como
 * arrival nueva: `arrivalSecondsPerSession` debe venir de sólo los trabajos
 * cuya `firstMandatorySession === sessionIndex` (ver mandatory-audit.ts).
 */
export function evaluateMandatoryFeasibility(input: {
  arrivalSecondsPerSession: number;
  serviceCapacitySecondsPerSession: number;
  backlogSlope: number;
}): MandatoryFeasibility {
  const utilization = input.serviceCapacitySecondsPerSession > 0
    ? input.arrivalSecondsPerSession / input.serviceCapacitySecondsPerSession
    : (input.arrivalSecondsPerSession > 0 ? Number.POSITIVE_INFINITY : 0);

  let status: MandatoryFeasibilityStatus;
  if (utilization >= 1 || input.backlogSlope > NOISE_SLOPE_SECONDS_PER_SESSION) {
    status = "unstable";
  } else if (utilization >= MARGINAL_UTILIZATION || input.backlogSlope > 0) {
    status = "marginal";
  } else {
    status = "stable";
  }

  return {
    arrivalSecondsPerSession: input.arrivalSecondsPerSession,
    serviceCapacitySecondsPerSession: input.serviceCapacitySecondsPerSession,
    utilization,
    backlogSlope: input.backlogSlope,
    status,
  };
}

/** Pendiente (segundos de backlog por sesión) por mínimos cuadrados simple. */
export function computeBacklogSlope(
  backlogSecondsBySession: readonly number[],
): number {
  const n = backlogSecondsBySession.length;
  if (n < 2) return 0;
  const xs = Array.from({ length: n }, (_, index) => index);
  const meanX = xs.reduce((total, x) => total + x, 0) / n;
  const meanY = backlogSecondsBySession.reduce((total, y) => total + y, 0) / n;
  let numerator = 0;
  let denominator = 0;
  for (let index = 0; index < n; index += 1) {
    numerator += (xs[index] - meanX) * (backlogSecondsBySession[index] - meanY);
    denominator += (xs[index] - meanX) ** 2;
  }
  return denominator === 0 ? 0 : numerator / denominator;
}

export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[index];
}

export interface BacklogFlowStats {
  meanArrivalSecondsPerSession: number;
  meanServiceSecondsPerSession: number;
  meanBacklogDeltaSecondsPerSession: number;
  p50BacklogSeconds: number;
  p95BacklogSeconds: number;
  maxBacklogSeconds: number;
  backlogSlope: number;
  maxAbsReconciliationErrorSeconds: number;
}

export function summarizeBacklogFlow(days: readonly MandatoryAuditDay[]): BacklogFlowStats {
  const n = Math.max(1, days.length);
  const backlogSeries = days.map((day) => day.backlogSecondsEnd);
  return {
    meanArrivalSecondsPerSession: days.reduce((t, d) => t + d.arrivalSeconds, 0) / n,
    meanServiceSecondsPerSession: days.reduce((t, d) => t + d.serviceSeconds, 0) / n,
    meanBacklogDeltaSecondsPerSession: days.reduce((t, d) => t + d.backlogDeltaSeconds, 0) / n,
    p50BacklogSeconds: percentile(backlogSeries, 0.5),
    p95BacklogSeconds: percentile(backlogSeries, 0.95),
    maxBacklogSeconds: Math.max(0, ...backlogSeries),
    backlogSlope: computeBacklogSlope(backlogSeries),
    maxAbsReconciliationErrorSeconds: Math.max(
      0,
      ...days.map((day) => Math.abs(day.reconciliationErrorSeconds)),
    ),
  };
}

/**
 * Task 8.9f §11 — separa warm-up de steady-state usando sesiones ACTIVAS
 * (no días calendario), documentado explícitamente: los primeros
 * `warmupActiveSessions` (default 30, pedido literalmente por el spec)
 * son warm-up; el resto se divide en "middle" y "final" (últimas
 * `warmupActiveSessions` sesiones activas) para ver si la carga es un pico
 * transitorio o estacionaria.
 */
export interface WarmupSteadyWindows<T> {
  warmup: T[];
  middle: T[];
  final: T[];
  warmupActiveSessions: number;
}

export function splitByWarmupSteadyWindow<T extends { sessionIndex: number }>(
  days: readonly T[],
  warmupActiveSessions = 30,
): WarmupSteadyWindows<T> {
  const sorted = [...days].sort((left, right) => left.sessionIndex - right.sessionIndex);
  const total = sorted.length;
  const finalStart = Math.max(warmupActiveSessions, total - warmupActiveSessions);
  return {
    warmup: sorted.filter((day) => day.sessionIndex < warmupActiveSessions),
    middle: sorted.filter((day) => (
      day.sessionIndex >= warmupActiveSessions && day.sessionIndex < finalStart
    )),
    final: sorted.filter((day) => day.sessionIndex >= finalStart),
    warmupActiveSessions,
  };
}

export interface MandatoryHeadroomReport {
  budgetSeconds: number;
  mandatoryServiceSecondsPerSession: number;
  headroomSeconds: number;
  headroomRatio: number;
  requiredImmediateWorkSeconds: number;
  requiredBaseActivationWorkSeconds: number;
  expectedFsrsDebtSeconds: number;
  totalRequiredGrowthWorkSeconds: number;
  marginSeconds: number;
}

/**
 * headroom = budget - carga mandatory esperada. Se compara luego contra el
 * trabajo mínimo requerido para C8 (palabras nuevas) + C9 (activaciones
 * base), usando el envelope YA existente (admission-envelope.ts) — nunca la
 * admisión actual. `requiredNewWordsPerSession` y sus derivados deben venir
 * de `deriveRequiredBaseActivations` (base-throughput-contract.ts), no de
 * un valor inventado aquí.
 */
export function computeMandatoryHeadroom(input: {
  budgetSeconds: number;
  mandatoryServiceSecondsPerSession: number;
  requiredNewWordsPerSession: number;
  envelope: AdmissionLoadEnvelope;
}): MandatoryHeadroomReport {
  const headroomSeconds = input.budgetSeconds - input.mandatoryServiceSecondsPerSession;
  const headroomRatio = input.budgetSeconds > 0 ? headroomSeconds / input.budgetSeconds : 0;

  const requiredImmediateWorkSeconds = input.requiredNewWordsPerSession * input.envelope.immediateSeconds;
  const requiredBaseActivationWorkSeconds = input.requiredNewWordsPerSession
    * input.envelope.baseActivationSeconds;
  const expectedFsrsDebtSeconds = input.requiredNewWordsPerSession
    * totalExpectedReviewSeconds(input.envelope);
  const totalRequiredGrowthWorkSeconds = requiredImmediateWorkSeconds
    + requiredBaseActivationWorkSeconds
    + expectedFsrsDebtSeconds;

  return {
    budgetSeconds: input.budgetSeconds,
    mandatoryServiceSecondsPerSession: input.mandatoryServiceSecondsPerSession,
    headroomSeconds,
    headroomRatio,
    requiredImmediateWorkSeconds,
    requiredBaseActivationWorkSeconds,
    expectedFsrsDebtSeconds,
    totalRequiredGrowthWorkSeconds,
    marginSeconds: headroomSeconds - totalRequiredGrowthWorkSeconds,
  };
}
