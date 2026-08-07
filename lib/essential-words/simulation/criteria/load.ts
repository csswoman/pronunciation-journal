import type { SimulatedDay } from "../run-simulation";

export interface CriterionResult {
  passed: boolean;
  name: string;
  measured: number | null;
  limit: number | null;
  detail: string;
}

function activeSessions(days: SimulatedDay[]): SimulatedDay[] {
  return days.filter((day) => day.active);
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function regressionSlope(values: number[]): number {
  const meanX = (values.length - 1) / 2;
  const meanY = values.reduce((total, value) => total + value, 0) / values.length;
  let numerator = 0;
  let denominator = 0;
  for (let index = 0; index < values.length; index += 1) {
    numerator += (index - meanX) * (values[index] - meanY);
    denominator += (index - meanX) ** 2;
  }
  return denominator === 0 ? 0 : numerator / denominator;
}

export function budgetRespected(
  days: SimulatedDay[],
  dailyBudgetSeconds: number,
): CriterionResult {
  const sessions = activeSessions(days);
  const limit = 0.9;
  if (sessions.length === 0) {
    return {
      passed: false,
      name: "budget-respected",
      measured: null,
      limit,
      detail: "no active sessions",
    };
  }
  const ceiling = dailyBudgetSeconds * 1.2;
  const within = sessions.filter((day) => day.plannedSeconds <= ceiling).length;
  const measured = within / sessions.length;
  return {
    passed: measured >= limit,
    name: "budget-respected",
    measured,
    limit,
    detail: `${within}/${sessions.length} active sessions at or below ${ceiling}s`,
  };
}

export function percentile95WithinBudget(
  days: SimulatedDay[],
  dailyBudgetSeconds: number,
): CriterionResult {
  const planned = activeSessions(days)
    .map((day) => day.plannedSeconds)
    .sort((left, right) => left - right);
  const limit = dailyBudgetSeconds * 1.5;
  if (planned.length === 0) {
    return {
      passed: false,
      name: "percentile-95-within-budget",
      measured: null,
      limit,
      detail: "no active sessions",
    };
  }
  const measured = planned[Math.max(0, Math.ceil(planned.length * 0.95) - 1)];
  return {
    passed: measured <= limit,
    name: "percentile-95-within-budget",
    measured,
    limit,
    detail: `nearest-rank p95 across ${planned.length} active sessions`,
  };
}

export function recoveryExits(days: SimulatedDay[]): CriterionResult {
  const recoveryIndices = days.flatMap((day, index) => (
    day.active && day.mode === "recovery" ? [index] : []
  ));
  if (recoveryIndices.length === 0) {
    return {
      passed: true,
      name: "recovery-exits",
      measured: 0,
      limit: null,
      detail: "simulation never entered recovery",
    };
  }

  const lastRecovery = recoveryIndices[recoveryIndices.length - 1];
  const laterActive = days.slice(lastRecovery + 1).filter((day) => day.active);
  const normalOffset = laterActive.findIndex((day) => day.mode === "normal");
  return {
    passed: normalOffset >= 0,
    name: "recovery-exits",
    measured: normalOffset >= 0 ? normalOffset + 1 : laterActive.length,
    limit: null,
    detail: normalOffset >= 0
      ? `returned to normal after ${normalOffset + 1} active sessions`
      : "recovery remained active through the final session",
  };
}

export function backlogStable(
  days: SimulatedDay[],
  warmupSessions: number,
  maxFinalBudgetRatios: number,
  dailyBudgetSeconds: number,
): CriterionResult {
  const sessions = activeSessions(days).slice(warmupSessions);
  const finalLimit = maxFinalBudgetRatios * dailyBudgetSeconds;
  if (sessions.length < 2) {
    return {
      passed: false,
      name: "backlog-stable",
      measured: null,
      limit: 0,
      detail: `need at least two active sessions after warm-up; final cap ${finalLimit}s`,
    };
  }
  const values = sessions.map((day) => day.backlogSeconds);
  const measured = regressionSlope(values);
  const finalBacklog = values[values.length - 1];
  return {
    passed: measured <= 0 && finalBacklog <= finalLimit,
    name: "backlog-stable",
    measured,
    limit: 0,
    detail: `slope=${measured.toFixed(3)}s/session; final=${finalBacklog}s; cap=${finalLimit}s`,
  };
}

const LONG_ABSENCE_DAYS = 10;

export function recoveryReturnSessions(
  days: SimulatedDay[],
  maximumActiveSessions: number,
): CriterionResult {
  const returnCounts: number[] = [];
  let unresolved = false;
  let idleDays = 0;

  for (let index = 0; index < days.length; index += 1) {
    const day = days[index];
    if (!day.active) {
      idleDays += 1;
      continue;
    }
    if (idleDays >= LONG_ABSENCE_DAYS && day.mode === "recovery") {
      let activeCount = 0;
      let returned = false;
      for (let candidate = index; candidate < days.length; candidate += 1) {
        if (!days[candidate].active) continue;
        activeCount += 1;
        if (days[candidate].mode === "normal") {
          returned = true;
          break;
        }
      }
      if (returned) returnCounts.push(activeCount);
      else unresolved = true;
    }
    idleDays = 0;
  }

  const measured = returnCounts.length > 0 ? Math.max(...returnCounts) : 0;
  return {
    passed: !unresolved && measured <= maximumActiveSessions,
    name: "recovery-return-sessions",
    measured: unresolved ? null : measured,
    limit: maximumActiveSessions,
    detail: unresolved
      ? "a recovery episode after a long absence never returned to normal"
      : returnCounts.length === 0
        ? "no long absence followed by recovery"
        : `slowest return took ${measured} active sessions`,
  };
}

function isPeak(value: number, previous: number[]): boolean {
  const baseline = median(previous);
  return baseline === 0 ? value > 0 : value > baseline * 1.5;
}

export function noSynchronizedPeaks(
  days: SimulatedDay[],
  dailyBudgetSeconds: number,
): CriterionResult {
  const sessions = activeSessions(days);
  let synchronizedPeaks = 0;
  for (let index = 4; index < sessions.length; index += 1) {
    const previous = sessions.slice(index - 4, index);
    const current = sessions[index];
    const provisionalPeak = isPeak(
      current.provisionalDue,
      previous.map((day) => day.provisionalDue),
    );
    const usagePeak = isPeak(
      current.usageActivations,
      previous.map((day) => day.usageActivations),
    );
    if (
      provisionalPeak
      && usagePeak
      && current.plannedSeconds > dailyBudgetSeconds * 1.5
    ) synchronizedPeaks += 1;
  }

  return {
    passed: synchronizedPeaks === 0,
    name: "no-synchronized-peaks",
    measured: synchronizedPeaks,
    limit: 0,
    detail: `${synchronizedPeaks} synchronized provisional/usage load peaks`,
  };
}
