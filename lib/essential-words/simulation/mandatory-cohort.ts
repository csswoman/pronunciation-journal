// Task 8.9f §7 — análisis de cohorte aislado: cuánto mandatory genera en
// régimen una palabra admitida (o una cohorte de N), sin otras fuentes de
// carga. Es análisis ESTRUCTURAL de la simulación existente (no calibra
// ningún parámetro): sólo instrumenta `runSimulation` con hooks de sólo
// lectura sobre un mundo aislado (corpusSize=N, presupuesto sin restricción).
import { estimateItemsSeconds } from "../cost-estimate";
import type { PlannedItem } from "../planning-types";
import type { Skill } from "../verification/types";
import type { SimulationMandatory } from "./candidates";
import type { SimulationProfile } from "./profiles";
import { runSimulation, SIMULATION_COSTS, SIMULATION_NEW_WORD_INTRODUCTION_SECONDS } from "./run-simulation";
import type { SimulationOptions } from "./state";

/** Perfil neutro dedicado sólo a análisis de cohorte: sin placement, sin
 * pérdida de sesiones, práctica diaria. Deliberadamente NO reutiliza
 * `PROFILES` de producción para que este análisis nunca quede acoplado a
 * los cinco perfiles de aceptación (C1-C11). */
const COHORT_PROFILE: SimulationProfile = {
  id: "steady",
  practicePattern: { kind: "probability", dailyRate: 1 },
  accuracyByModality: {
    recognition: 0.9,
    production: 0.85,
    listening: 0.85,
    pronunciation: 0.85,
  },
  completionBudgetRatio: 1,
  placementConfidence: "none",
  alreadyKnownOverestimateRate: 0,
  audioReplayRate: 0,
};

/** Presupuesto deliberadamente enorme: aísla la carga generada por la
 * cohorte del efecto de saturación de presupuesto (§7: "análisis
 * estructural", no una simulación con el budget real de producto). */
const UNCONSTRAINED_BUDGET_SECONDS = 200_000;

function bySkill(items: readonly PlannedItem[]): Record<Skill, PlannedItem[]> {
  const groups: Record<Skill, PlannedItem[]> = {
    meaning: [], listening: [], production: [], usage: [],
  };
  for (const item of items) groups[item.skill].push(item);
  return groups;
}

export interface CohortMandatorySkillSeconds {
  meaning: number;
  listening: number;
  production: number;
  usage: number;
}

export interface CohortMandatoryResult {
  wordCount: number;
  horizonDays: number;
  activeSessions: number;
  immediateIntroductionSecondsPerWord: number;
  listeningActivationSecondsTotal: number;
  productionActivationSecondsTotal: number;
  scheduledReviewSecondsBySkill: CohortMandatorySkillSeconds;
  learningStepSecondsBySkill: CohortMandatorySkillSeconds;
  provisionalSecondsBySkill: CohortMandatorySkillSeconds;
  totalMandatorySecondsGenerated: number;
  totalMandatorySecondsPerWord: number;
  learningStepsCreatedTotal: number;
  learningStepsCreatedPerWord: number;
}

function emptySkillSeconds(): CohortMandatorySkillSeconds {
  return { meaning: 0, listening: 0, production: 0, usage: 0 };
}

function addSkillSeconds(
  totals: CohortMandatorySkillSeconds,
  items: readonly PlannedItem[],
): void {
  const groups = bySkill(items);
  for (const skill of Object.keys(groups) as Skill[]) {
    totals[skill] += estimateItemsSeconds(groups[skill], SIMULATION_COSTS);
  }
}

/**
 * `estimateMandatoryLoadPerAdmittedWord` — Task 8.9f §7.
 * Corre una simulación aislada (sólo `wordCount` palabras, sin otra fuente
 * de carga, sin restricción de presupuesto) y mide cuánto mandatory se
 * genera en total durante `horizonDays`. No usa el resultado como
 * calibración: es la cifra estructural "segundos mandatory por palabra
 * admitida en régimen" pedida para convertir el problema en capacidad.
 */
export function estimateMandatoryLoadPerAdmittedWord(input: {
  wordCount: number;
  horizonDays: number;
  seed?: number;
}): CohortMandatoryResult {
  const options: SimulationOptions = {
    days: input.horizonDays,
    corpusSize: input.wordCount,
    seed: input.seed ?? 8009,
    startAt: "2026-08-01T00:00:00.000Z",
    dailyBudgetSeconds: UNCONSTRAINED_BUDGET_SECONDS,
    targetNewWords: input.wordCount,
  };

  const scheduledReviewSecondsBySkill = emptySkillSeconds();
  const learningStepSecondsBySkill = emptySkillSeconds();
  const provisionalSecondsBySkill = emptySkillSeconds();
  let learningStepsCreatedTotal = 0;
  let activeSessions = 0;

  const result = runSimulation(COHORT_PROFILE, options, {
    mutateMandatory: (mandatory: SimulationMandatory) => {
      addSkillSeconds(scheduledReviewSecondsBySkill, [...mandatory.dueToday, ...mandatory.overdue]);
      addSkillSeconds(learningStepSecondsBySkill, mandatory.learning);
      addSkillSeconds(provisionalSecondsBySkill, mandatory.provisionalDue);
      learningStepsCreatedTotal += mandatory.learning.length;
      return mandatory;
    },
    mutateDay: (day) => {
      if (day.active) activeSessions += 1;
      return day;
    },
    allowTrivialDynamics: true,
  });

  const listeningActivationSecondsTotal = result.days
    .reduce((total, day) => total + (day.servedListening ?? 0) * SIMULATION_COSTS.listening, 0);
  const productionActivationSecondsTotal = result.days
    .reduce((total, day) => total + (day.servedProduction ?? 0) * SIMULATION_COSTS.production, 0);

  const totalScheduled = scheduledReviewSecondsBySkill.meaning
    + scheduledReviewSecondsBySkill.listening + scheduledReviewSecondsBySkill.production
    + scheduledReviewSecondsBySkill.usage;
  const totalLearning = learningStepSecondsBySkill.meaning
    + learningStepSecondsBySkill.listening + learningStepSecondsBySkill.production
    + learningStepSecondsBySkill.usage;
  const totalProvisional = provisionalSecondsBySkill.meaning
    + provisionalSecondsBySkill.listening + provisionalSecondsBySkill.production
    + provisionalSecondsBySkill.usage;

  const totalMandatorySecondsGenerated = totalScheduled + totalLearning + totalProvisional;

  return {
    wordCount: input.wordCount,
    horizonDays: input.horizonDays,
    activeSessions,
    immediateIntroductionSecondsPerWord: SIMULATION_NEW_WORD_INTRODUCTION_SECONDS
      + SIMULATION_COSTS.recognition,
    listeningActivationSecondsTotal,
    productionActivationSecondsTotal,
    scheduledReviewSecondsBySkill,
    learningStepSecondsBySkill,
    provisionalSecondsBySkill,
    totalMandatorySecondsGenerated,
    totalMandatorySecondsPerWord: totalMandatorySecondsGenerated / Math.max(1, input.wordCount),
    learningStepsCreatedTotal,
    learningStepsCreatedPerWord: learningStepsCreatedTotal / Math.max(1, input.wordCount),
  };
}
