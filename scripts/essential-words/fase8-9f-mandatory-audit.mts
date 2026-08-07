/**
 * Task 8.9f — Auditoría, descomposición y feasibility de carga mandatory.
 *
 * Puramente diagnóstico: no cambia C1-C11, presupuesto, target newWords,
 * C9, desiredRetention, MaturityPolicy, latencia ni costes. Sólo instrumenta
 * `runSimulation`/`runMandatoryAudit` para producir las cifras que decidirán
 * si la carga mandatory observada (~780/900 s en steady) es legítima (B),
 * un bug (A) o transitoria (C).
 */
import { C9_HORIZON_SESSIONS, } from "../../lib/essential-words/base-throughput-feasibility";
import { deriveRequiredBaseActivations } from "../../lib/essential-words/base-throughput-contract";
import { buildAdmissionLoadEnvelope } from "../../lib/essential-words/admission-envelope";
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
} from "../../lib/essential-words/simulation/criteria";
import { PROFILES } from "../../lib/essential-words/simulation/profiles";
import {
  SIMULATION_COSTS,
  SIMULATION_NEW_WORD_INTRODUCTION_SECONDS,
} from "../../lib/essential-words/simulation/run-simulation";
import type { SimulationOptions } from "../../lib/essential-words/simulation/state";
import { runMandatoryAudit } from "../../lib/essential-words/simulation/mandatory-audit";
import {
  computeMandatoryHeadroom,
  evaluateMandatoryFeasibility,
  splitByWarmupSteadyWindow,
  summarizeBacklogFlow,
} from "../../lib/essential-words/simulation/mandatory-feasibility";
import { correlateLatenessWithRecall } from "../../lib/essential-words/simulation/lateness-correlation";
import { computeLearningStepAmplification } from "../../lib/essential-words/simulation/learning-step-amplification";
import { estimateMandatoryLoadPerAdmittedWord } from "../../lib/essential-words/simulation/mandatory-cohort";

const BUDGET_SECONDS = 900;
const TARGET_NEW_WORDS = 10;

const options: SimulationOptions = {
  days: 180,
  corpusSize: 1_000,
  seed: 42,
  startAt: "2026-08-01T00:00:00.000Z",
  dailyBudgetSeconds: BUDGET_SECONDS,
  targetNewWords: TARGET_NEW_WORDS,
};

const envelope = buildAdmissionLoadEnvelope({
  costs: SIMULATION_COSTS,
  introductionSeconds: SIMULATION_NEW_WORD_INTRODUCTION_SECONDS,
  horizonSessions: C9_HORIZON_SESSIONS,
});
const derived = deriveRequiredBaseActivations({
  configuredNewWordsTarget: TARGET_NEW_WORDS,
  minimumC8Share: 0.6,
  horizonSessions: C9_HORIZON_SESSIONS,
});

function avg(values: readonly number[]): number {
  return values.length === 0 ? 0 : values.reduce((total, value) => total + value, 0) / values.length;
}

// ---- §7: cohorte de una palabra y de N palabras, horizonte suficiente ----
const cohortOne = estimateMandatoryLoadPerAdmittedWord({ wordCount: 1, horizonDays: 200, seed: 11 });
const cohortTen = estimateMandatoryLoadPerAdmittedWord({ wordCount: 10, horizonDays: 200, seed: 11 });
process.stdout.write(`${JSON.stringify({ section: "7-cohort", cohortOne, cohortTen })}\n`);

// ---- §1-§6, §8-§12: por perfil ----
for (const profile of Object.values(PROFILES)) {
  const audit = runMandatoryAudit(profile, options);
  const flow = summarizeBacklogFlow(audit.days);
  const feasibility = evaluateMandatoryFeasibility({
    arrivalSecondsPerSession: flow.meanArrivalSecondsPerSession,
    serviceCapacitySecondsPerSession: BUDGET_SECONDS,
    backlogSlope: flow.backlogSlope,
  });
  const headroom = computeMandatoryHeadroom({
    budgetSeconds: BUDGET_SECONDS,
    mandatoryServiceSecondsPerSession: flow.meanServiceSecondsPerSession,
    requiredNewWordsPerSession: derived.requiredNewWordsPerSession,
    envelope,
  });
  const windows = splitByWarmupSteadyWindow(audit.days, 30);
  const meanTotalSeconds = (days: typeof audit.days) => (
    avg(days.map((day) => day.breakdown.totalMandatorySeconds))
  );
  const latenessCorrelation = correlateLatenessWithRecall(audit.serviceEvents);
  const amplification = computeLearningStepAmplification(audit.simulation, SIMULATION_COSTS);

  const c1 = budgetRespected(audit.simulation.days, BUDGET_SECONDS);
  const c2 = percentile95WithinBudget(audit.simulation.days, BUDGET_SECONDS);
  const c3 = recoveryExits(audit.simulation.days);
  const c4 = backlogStable(audit.simulation.days, 14, 2, BUDGET_SECONDS);
  const c5 = recoveryReturnSessions(audit.simulation.days, 14);
  const c7 = noSynchronizedPeaks(audit.simulation.days, BUDGET_SECONDS);
  const c8 = newWordLiveness(audit.simulation.days, 10);
  const c9 = baseSkillActivationLiveness(audit.simulation.eligibility, 8);
  const c10 = noOverdueStarvation(audit.simulation.deferredObservations, 12);
  const c11 = observedRetentionWithinTarget(audit.simulation.attemptLogs, audit.simulation.srsEvents, 0.9, 0.05, 50);

  process.stdout.write(`${JSON.stringify({
    section: "profile",
    profile: profile.id,
    activeSessions: audit.days.length,
    violations: audit.violations,
    // §1 breakdown medio (segundos/sesión)
    breakdownAvg: {
      scheduledReviewSeconds: avg(audit.days.map((d) => d.breakdown.scheduledReviewSeconds)),
      overdueReviewSeconds: avg(audit.days.map((d) => d.breakdown.overdueReviewSeconds)),
      learningStepSeconds: avg(audit.days.map((d) => d.breakdown.learningStepSeconds)),
      provisionalDueSeconds: avg(audit.days.map((d) => d.breakdown.provisionalDueSeconds)),
      carriedMandatorySeconds: avg(audit.days.map((d) => d.breakdown.carriedMandatorySeconds)),
      otherMandatorySeconds: avg(audit.days.map((d) => d.breakdown.otherMandatorySeconds)),
      totalMandatorySeconds: meanTotalSeconds(audit.days),
    },
    // §1 cantidades medias
    countsAvg: {
      scheduledReviews: avg(audit.days.map((d) => d.counts.scheduledReviews)),
      overdueReviews: avg(audit.days.map((d) => d.counts.overdueReviews)),
      learningSteps: avg(audit.days.map((d) => d.counts.learningSteps)),
      provisionalDue: avg(audit.days.map((d) => d.counts.provisionalDue)),
      carried: avg(audit.days.map((d) => d.counts.carried)),
    },
    // §5 amplificación de learning steps
    learningStepAmplification: amplification,
    // §8 flujo arrival/service/backlog
    backlogFlow: flow,
    // §9 feasibility
    feasibility,
    // §10 headroom
    headroom,
    // §11 warm-up vs steady-state (mandatory total medio por ventana)
    warmupSteady: {
      warmupSessions: windows.warmup.length,
      middleSessions: windows.middle.length,
      finalSessions: windows.final.length,
      warmupMeanTotalSeconds: meanTotalSeconds(windows.warmup),
      middleMeanTotalSeconds: meanTotalSeconds(windows.middle),
      finalMeanTotalSeconds: meanTotalSeconds(windows.final),
    },
    // §12 correlación lateness vs C11
    latenessCorrelation,
    // Baseline C1-C11 tras el fix de ownership
    C1: c1.passed,
    C2: c2.passed,
    C3: c3.passed,
    C4: c4.passed,
    C5: c5.passed,
    C7: c7.passed,
    C8: c8.passed,
    C9: { passed: c9.passed, measured: c9.measured },
    C10: c10.passed,
    C11: { passed: c11.passed, measured: c11.measured },
  })}\n`);
}
