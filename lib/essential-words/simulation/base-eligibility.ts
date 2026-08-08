import type { BaseSkill } from "../verification/types";
import type { SimulatedWordState, SimulationWorld } from "./state";

export type ActivatableBaseSkill = Exclude<BaseSkill, "meaning">;

/**
 * Canonical pedagogical eligibility for a base activation.
 *
 * Capacity is intentionally absent: the planner and C9 combine this domain
 * decision with post-mandatory seconds separately. The provisional gate is a
 * property of the meaning schedule, never of the obligation source.
 */
export function isEligibleForBaseActivation(
  word: SimulatedWordState,
  skill: ActivatableBaseSkill,
  now: Date,
): boolean {
  if (!word.introducedAt || word.meaning.schedule.kind === "none") return false;
  if (
    word.meaning.schedule.kind === "provisional"
    && word.meaning.schedule.source === "placement-inference"
    && new Date(word.meaning.schedule.dueAt) > now
  ) return false;

  const item = word[skill];
  if (item.suspended || item.payload?.retiredAt || item.schedule.kind !== "none") {
    return false;
  }
  return skill === "listening" || word.listening.schedule.kind !== "none";
}

export function eligibleBaseActivationSkill(
  word: SimulatedWordState,
  now: Date,
): ActivatableBaseSkill | undefined {
  const skills: readonly ActivatableBaseSkill[] = ["listening", "production"];
  return skills.find((skill) => isEligibleForBaseActivation(word, skill, now));
}

/** Snapshot used by C9 before planning can select or suppress candidates. */
export function collectEligibleBaseItemIds(
  world: SimulationWorld,
  now: Date,
): ReadonlySet<string> {
  const itemIds = new Set<string>();
  for (const word of world.words.values()) {
    const skill = eligibleBaseActivationSkill(word, now);
    if (skill) itemIds.add(word[skill].id);
  }
  return itemIds;
}

/** Current L/P debt, including production gated behind listening/provisional. */
export function countPendingBaseObligations(world: SimulationWorld): number {
  let count = 0;
  for (const word of world.words.values()) {
    if (!word.introducedAt || word.meaning.schedule.kind === "none") continue;
    if (!word.listening.suspended && word.listening.schedule.kind === "none") count += 1;
    if (!word.production.suspended && word.production.schedule.kind === "none") count += 1;
  }
  return count;
}
