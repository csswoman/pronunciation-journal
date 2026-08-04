// Level-3 (production) gate. Fase A remains internal/dev-only until Fase B
// ships the production feedback and hint experience alongside it.
export const ESSENTIAL_WORDS_LEVEL3_ENABLED =
  process.env.NEXT_PUBLIC_ESSENTIAL_WORDS_LEVEL3 === "true";

import type { Step } from "./session-plan-types";

/** Single choke point for the temporary level-3 gate. */
export function gateLevel3Mode(step: Step, enabled: boolean): Step {
  if (enabled || step.kind !== "exercise" || step.level !== 3) return step;
  return { ...step, level: 2 };
}
