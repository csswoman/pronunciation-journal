/**
 * Task 8.9j — auditoría C9 reservation→service. Solo lectura/instrumentación
 * (ver lib/essential-words/simulation/audit/c9-obligation-trace.ts). No
 * cambia C1-C11, targetNewWords, budget, desiredRetention, perfiles.
 */
import { baseSkillActivationLiveness } from "../../lib/essential-words/simulation/criteria";
import { createC9ObligationAuditor } from "../../lib/essential-words/simulation/audit/c9-obligation-trace";
import { PROFILES, type SimulationProfileId } from "../../lib/essential-words/simulation/profiles";
import { runSimulation } from "../../lib/essential-words/simulation/run-simulation";
import type { SimulatedDay } from "../../lib/essential-words/simulation/types";
import type { SimulationOptions } from "../../lib/essential-words/simulation/state";

const options: SimulationOptions = {
  days: 180,
  corpusSize: 1_000,
  seed: 42,
  startAt: "2026-08-01T00:00:00.000Z",
  dailyBudgetSeconds: 900,
  targetNewWords: 10,
};

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
  return sorted[index];
}

function summarize(waits: number[], violations: number) {
  const sorted = [...waits].sort((a, b) => a - b);
  return {
    count: waits.length,
    p50: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95),
    max: sorted.length ? sorted[sorted.length - 1] : 0,
    violations,
  };
}

function forecastErrorSamples(days: SimulatedDay[]) {
  const active = days.filter((d) => d.active);
  const samples: number[] = [];
  active.forEach((day, index) => {
    if (!day.newWords || day.newWords <= 0) return;
    const forecast = (day.futureMandatoryReservedSeconds ?? 0) + (day.expectedFsrsDebtSeconds ?? 0);
    const window = active.slice(index + 1, index + 9);
    if (window.length < 8) return;
    const actual = window.reduce((total, d) => total + (d.mandatorySelectedSeconds ?? 0), 0);
    samples.push(actual - forecast);
  });
  return samples;
}

for (const profileId of Object.keys(PROFILES) as SimulationProfileId[]) {
  const auditor = createC9ObligationAuditor();
  const result = runSimulation(PROFILES[profileId], options, auditor.hooks);
  const obligations = auditor.getObligations();
  const lifecycles = auditor.getReservationLifecycles();

  const canonical = baseSkillActivationLiveness(result.eligibility, 8);

  const bySource = new Map<string, { waits: number[]; violations: number }>();
  for (const obligation of obligations) {
    if (obligation.waitSessions === undefined) continue; // never served within the run window
    const bucket = bySource.get(obligation.source) ?? { waits: [], violations: 0 };
    bucket.waits.push(obligation.waitSessions);
    if (obligation.violatedC9) bucket.violations += 1;
    bySource.set(obligation.source, bucket);
  }

  const listeningWaits = obligations.filter((o) => o.skill === "listening" && o.waitSessions !== undefined).map((o) => o.waitSessions!);
  const productionWaits = obligations.filter((o) => o.skill === "production" && o.waitSessions !== undefined).map((o) => o.waitSessions!);

  const neverServed = obligations.filter((o) => o.waitSessions === undefined);

  const transitionsCount = { reserved: 0, rolled: 0, selected: 0, completed: 0, released: 0, expired: 0 };
  for (const lifecycle of lifecycles) {
    for (const t of lifecycle.transitions) transitionsCount[t.kind] += 1;
  }
  const missingReservation = obligations.filter((o) => o.reservationCreatedSession === undefined).length;
  const violated = obligations.filter((o) => o.violatedC9);
  const violatedNotForecastSafe = violated.filter((o) => !o.admittedUnderCapacityForecast).length;
  const expiredButNotViolated = obligations.filter((o) => {
    const lifecycle = lifecycles.find((l) => l.itemId === o.itemId);
    return lifecycle?.transitions.some((t) => t.kind === "expired") && !o.violatedC9;
  }).length;
  const violatedWithExpired = violated.filter((o) => {
    const lifecycle = lifecycles.find((l) => l.itemId === o.itemId);
    return lifecycle?.transitions.some((t) => t.kind === "expired");
  }).length;
  const reservedLateAfterDeadline = obligations.filter((o) => (
    o.violatedC9 && o.reservationDeadlineSession !== undefined && o.servedSession !== undefined
    && o.servedSession > o.reservationDeadlineSession
  )).length;

  const forecastErrors = forecastErrorSamples(result.days);
  const sortedForecastErrors = [...forecastErrors].sort((a, b) => a - b);

  process.stdout.write(`${JSON.stringify({
    profileId,
    canonicalC9: { passed: canonical.passed, measured: canonical.measured, detail: canonical.detail },
    totalObligations: obligations.length,
    neverServedWithinRun: neverServed.length,
    bySource: Object.fromEntries(
      [...bySource.entries()].map(([source, bucket]) => [source, summarize(bucket.waits, bucket.violations)]),
    ),
    listening: summarize(listeningWaits, obligations.filter((o) => o.skill === "listening" && o.violatedC9).length),
    production: summarize(productionWaits, obligations.filter((o) => o.skill === "production" && o.violatedC9).length),
    reservationLifecycle: {
      totalReservations: lifecycles.length,
      transitionsCount,
      missingReservation,
      reservedButServedAfterDeadline: reservedLateAfterDeadline,
      expiredButEventuallyOnTime: expiredButNotViolated,
      violatedWithLedgerExpired: violatedWithExpired,
    },
    violations: {
      total: violated.length,
      notAdmittedUnderCapacityForecast: violatedNotForecastSafe,
    },
    forecastMandatoryErrorSeconds: forecastErrors.length === 0 ? null : {
      count: forecastErrors.length,
      p50: percentile(sortedForecastErrors, 0.5),
      p95: percentile(sortedForecastErrors, 0.95),
      max: sortedForecastErrors[sortedForecastErrors.length - 1],
      min: sortedForecastErrors[0],
    },
  })}\n`);
}
