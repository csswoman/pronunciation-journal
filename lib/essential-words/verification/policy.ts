import type {
  AttemptAssessment,
  AttemptModality,
  Skill,
  SkillObservation,
} from "./types";

/**
 * Skills evaluated by each modality. This mapping is independent from the
 * attempt result: a failed production attempt evaluates the same skills as a
 * successful one, with opposite evidence.
 */
const OBSERVED_SKILLS: Record<AttemptModality, readonly Skill[]> = {
  production: ["meaning", "production"],
  listening: ["meaning", "listening"],
  recognition: ["meaning"],
  // Repeating a sound does not demonstrate listening comprehension.
  pronunciation: ["production"],
};

/**
 * Derives direct skill evidence from an attempt without assigning schedules.
 * The clock is injected so simulations and tests remain deterministic.
 */
export function deriveObservations(
  assessment: AttemptAssessment,
  now: Date,
): SkillObservation[] {
  const outcome = assessment.correct ? "success" : "failure";
  const observedAt = now.toISOString();

  return OBSERVED_SKILLS[assessment.modality].map((skill) => ({
    skill,
    outcome,
    source: "direct",
    basis: { kind: "attempt", modality: assessment.modality },
    evidenceConfidence: 1,
    observedAt,
  }));
}
