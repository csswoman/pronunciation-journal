// Level-3 (production) gate. Fases A y B now provide the production exercise,
// feedback, and hint experience; the deployment environment controls when it
// becomes available to learners.
// Fase B has landed alongside this comment: hints (hint-ladder.ts), typo
// tolerance (typo.ts), diff feedback (AnswerDiff.tsx), and priced grading
// (attempt-grade.ts) all exist now. Per spec "Fases A y B se despliegan
// juntas", THIS is the point where ESSENTIAL_WORDS_LEVEL3_ENABLED should be
// flipped to true in the deployment environment (set
// NEXT_PUBLIC_ESSENTIAL_WORDS_LEVEL3=true) — flipping the constant's default
// in code is deliberately NOT done here, since environment-driven flags
// should be flipped via the environment, not by changing what "unset" means.
export const ESSENTIAL_WORDS_LEVEL3_ENABLED =
  process.env.NEXT_PUBLIC_ESSENTIAL_WORDS_LEVEL3 === "true";

import type { Step } from "./session-plan-types";

/** Single choke point for the temporary level-3 gate. */
export function gateLevel3Mode(step: Step, enabled: boolean): Step {
  if (enabled || step.kind !== "exercise" || step.level !== 3) return step;
  return { ...step, level: 2 };
}
