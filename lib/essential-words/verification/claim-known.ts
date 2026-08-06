import { deriveSkillStatus } from "../skill-item";
import type { EssentialWord } from "../types";
import type { AttemptModality, LearningItem, Skill } from "./types";

const BASE_SKILLS: readonly Skill[] = ["meaning", "listening", "production"];

export interface VerificationStep {
  modality: AttemptModality;
  /** Lo que se muestra: español, nunca la respuesta inglesa. */
  prompt: string;
  /** Lo que se espera. No se renderiza antes de responder. */
  expected: string;
  /** Si fuera true, la verificación no mediría nada. */
  revealsAnswer: false;
}

export type KnownClaimPlan =
  | { kind: "verify"; step: VerificationStep }
  | { kind: "nothing-to-verify" };

/**
 * Una verificación de producción o listening acredita dos habilidades y debe
 * consumir ambas activaciones del presupuesto diario.
 */
export function verificationCost(modality: AttemptModality): number {
  return modality === "recognition" || modality === "pronunciation" ? 1 : 2;
}

/**
 * "Ya conozco esta palabra" abre una prueba inmediata. La producción escrita
 * es la modalidad más informativa: observa meaning y production a la vez.
 */
export function planKnownClaim(
  word: EssentialWord,
  items: LearningItem[],
): KnownClaimPlan {
  const bySkill = new Map(items.map((item) => [item.skill, item]));
  const hasUnscheduledBaseSkill = BASE_SKILLS.some((skill) => {
    const item = bySkill.get(skill);
    return !item || deriveSkillStatus(item) === "unseen";
  });

  if (!hasUnscheduledBaseSkill) return { kind: "nothing-to-verify" };

  return {
    kind: "verify",
    step: {
      modality: "production",
      prompt: word.translation ?? word.meaning ?? word.word,
      expected: word.word,
      revealsAnswer: false,
    },
  };
}
