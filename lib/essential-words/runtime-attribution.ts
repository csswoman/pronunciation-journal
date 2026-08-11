import { buildAssessment, type AssessmentContext } from "./verification/assessment";
import type { AttemptOutcome, AttemptSkillEvidence } from "./attempt-grade";
import type { EssentialWordMode } from "./exercise-modes";
import type {
  AttemptAssessment,
  AttemptModality,
  Skill,
  SkillObservation,
} from "./verification/types";

export interface RenderedAttemptAttribution {
  assessment: AttemptAssessment;
  observations?: SkillObservation[];
  assessmentsBySkill?: Partial<Record<Skill, AttemptAssessment>>;
}

function modalityForRenderedMode(mode: EssentialWordMode): AttemptModality {
  if (mode === "dictation_word" || mode === "dictation_sentence" || mode === "listening_cloze_sentence" || mode === "recognize_audio") {
    return "listening";
  }
  if (mode === "cloze_sentence" || mode === "weak_form" || mode === "recall_translation" || mode === "speak_sentence") {
    return "production";
  }
  return "recognition";
}

function observationForEvidence(
  evidence: AttemptSkillEvidence,
  modality: AttemptModality,
  observedAt: string,
): SkillObservation | null {
  if (evidence.veredicto === "neutro") return null;
  return {
    skill: evidence.habilidad,
    outcome: evidence.veredicto === "acierto" ? "success" : "failure",
    source: "direct",
    basis: { kind: "attempt", modality },
    evidenceConfidence: 1,
    observedAt,
  };
}

function assessmentForEvidence(
  outcome: AttemptOutcome,
  modality: AttemptModality,
  context: AssessmentContext,
  evidence: AttemptSkillEvidence,
): AttemptAssessment {
  const assessment = buildAssessment({
    ...outcome,
    correct: evidence.veredicto === "acierto",
    typo: false,
  }, modality, context);
  if (evidence.veredicto !== "fallo") return assessment;

  return {
    ...assessment,
    grade: outcome.resultado === "casi" && evidence.habilidad === "production"
      ? "Hard"
      : "Again",
  };
}

/**
 * Separates the mode rendered to the learner from the modality and skills
 * accredited by the resulting evidence. Dictation is intentionally multi-skill.
 */
export function attributionForRenderedAttempt(
  renderedMode: EssentialWordMode,
  outcome: AttemptOutcome,
  context: AssessmentContext = { interactionDurationMs: outcome.latencyMs },
  observedAt = new Date(0).toISOString(),
): RenderedAttemptAttribution {
  const modality = modalityForRenderedMode(renderedMode);
  const assessment = buildAssessment(outcome, modality, context);
  if (!outcome.evidencia) return { assessment };

  const evidence = outcome.evidencia.filter((entry) => entry.veredicto !== "neutro");
  const observations = evidence.flatMap((entry) => {
    const observation = observationForEvidence(entry, modality, observedAt);
    return observation ? [observation] : [];
  });
  const assessmentsBySkill = Object.fromEntries(evidence.map((entry) => [
    entry.habilidad,
    assessmentForEvidence(outcome, modality, context, entry),
  ])) as Partial<Record<Skill, AttemptAssessment>>;
  return { assessment, observations, assessmentsBySkill };
}
