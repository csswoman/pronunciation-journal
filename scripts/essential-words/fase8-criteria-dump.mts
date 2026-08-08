/** Compact C1–C11 dump for Task 8.9 sweeps. */
import {
  baseSkillActivationLiveness,
  backlogStable,
  budgetRespected,
  newWordLiveness,
  noOverdueStarvation,
  noSynchronizedPeaks,
  observedRetentionWithinTarget,
  percentile95WithinBudget,
  recoveryExits,
  recoveryReturnSessions,
  usageActivationShare,
} from "../../lib/essential-words/simulation/criteria";
import { PROFILES } from "../../lib/essential-words/simulation/profiles";
import { runSimulation } from "../../lib/essential-words/simulation/run-simulation";
import type { SimulationOptions } from "../../lib/essential-words/simulation/state";

const options: SimulationOptions = {
  days: 180,
  corpusSize: 1_000,
  seed: 42,
  startAt: "2026-08-01T00:00:00.000Z",
  dailyBudgetSeconds: 900,
  targetNewWords: 10,
};

const rows: string[] = [];
for (const profile of Object.values(PROFILES)) {
  const r = runSimulation(profile, options);
  const c = {
    C1: budgetRespected(r.days, 900).passed,
    C2: percentile95WithinBudget(r.days, 900).passed,
    C3: recoveryExits(r.days).passed,
    C4: backlogStable(r.days, 14, 2, 900).passed,
    C5: recoveryReturnSessions(r.days, 14).passed,
    C6: usageActivationShare(r.days, 7, 10, 0.3),
    C7: noSynchronizedPeaks(r.days, 900).passed,
    C8: newWordLiveness(r.days, 10),
    C9: baseSkillActivationLiveness(r.eligibility, 8),
    C10: noOverdueStarvation(r.deferredObservations, 12).passed,
    C11: observedRetentionWithinTarget(r.attemptLogs, r.srsEvents, 0.9, 0.05, 50),
  };
  rows.push(JSON.stringify({
    profile: profile.id,
    pass: {
      C1: c.C1, C2: c.C2, C3: c.C3, C4: c.C4, C5: c.C5,
      C6: c.C6.passed, C7: c.C7, C8: c.C8.passed, C9: c.C9.passed,
      C10: c.C10, C11: c.C11.passed,
    },
    m: {
      C6: c.C6.measured, C8: c.C8.measured, C9: c.C9.measured,
      C9d: c.C9.detail, C11: c.C11.measured, C11d: c.C11.detail,
      C8d: c.C8.detail,
    },
  }));
}
process.stdout.write(`${rows.join("\n")}\n`);
