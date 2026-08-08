/**
 * Criterion applicability from the Fase 8 acceptance table
 * (docs/superpowers/specs/... design § trazabilidad criterios).
 *
 * C8 (newWordLiveness) — Acceptance: "constante" → only steady.
 * Not applicable ≠ PASS and ≠ FAIL.
 */
export type SimulationProfileId =
  | "steady"
  | "intermittent"
  | "bursty"
  | "beginner"
  | "advanced";

export function isC8Applicable(profileId: string): boolean {
  return profileId === "steady";
}

/** C9 (baseSkillActivationLiveness) — Acceptance: "elegibles" (all five). */
export function isC9Applicable(profileId: string): boolean {
  return (
    profileId === "steady"
    || profileId === "intermittent"
    || profileId === "bursty"
    || profileId === "beginner"
    || profileId === "advanced"
  );
}
