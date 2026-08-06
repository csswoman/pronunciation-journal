import { scheduleFsrsReview } from "@/lib/srs/fsrs-schedule";
import {
  provisionalDueAt,
  type ProvisionalOrigin,
} from "./provisional-intervals";
import type {
  AttemptAssessment,
  AttemptModality,
  ItemSchedule,
  LearningItem,
  Skill,
  SkillObservation,
  SkillPlacement,
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

const INITIAL_FSRS = { stability: 0, difficulty: 0, state: "New" as const };

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

/**
 * Assigns schedules only to skills already observed by the attempt. The grade
 * decides the placement; modality has already been resolved above.
 */
export function derivePlacements(
  observations: SkillObservation[],
  assessment: AttemptAssessment,
  currentItems: LearningItem[],
  now: Date,
): SkillPlacement[] {
  const bySkill = new Map(currentItems.map((item) => [item.skill, item]));

  return observations.map((observation) => {
    const current = bySkill.get(observation.skill);
    const itemId = current?.id ?? observation.skill;

    return {
      skill: observation.skill,
      schedule: scheduleForObservation(observation, assessment, current, itemId, now),
      verificationSource: observation.source === "placement-inference"
        ? "placement-inference"
        : "direct",
    };
  });
}

function scheduleForObservation(
  observation: SkillObservation,
  assessment: AttemptAssessment,
  current: LearningItem | undefined,
  itemId: string,
  now: Date,
): ItemSchedule {
  const currentFsrs = current?.schedule.kind === "fsrs" ? current.schedule : undefined;

  // Provisional evidence cannot overwrite an existing FSRS history. Failures
  // also enter ordinary learning, regardless of the attempted modality.
  if (currentFsrs || observation.outcome === "failure") {
    return nextFsrsSchedule(currentFsrs ?? INITIAL_FSRS, assessment, now);
  }

  const origin = provisionalOrigin(observation, assessment);
  if (!origin) {
    return nextFsrsSchedule(INITIAL_FSRS, assessment, now);
  }

  return {
    kind: "provisional",
    dueAt: provisionalDueAt(origin, itemId, now).toISOString(),
    source: observation.source === "placement-inference" ? "placement-inference" : "direct",
    evidenceConfidence: observation.evidenceConfidence,
  };
}

function nextFsrsSchedule(
  current: Pick<Extract<ItemSchedule, { kind: "fsrs" }>, "stability" | "difficulty" | "state">,
  assessment: AttemptAssessment,
  now: Date,
): ItemSchedule {
  const next = scheduleFsrsReview({
    stability: current.stability,
    difficulty: current.difficulty,
    state: current.state,
    grade: assessment.grade,
    now,
  });

  return {
    kind: "fsrs",
    dueAt: next.dueAt.toISOString(),
    stability: next.stability,
    difficulty: next.difficulty,
    state: next.state,
  };
}

/**
 * Selects a provisional window when the evidence is sufficient; otherwise
 * the observed skill enters ordinary FSRS learning.
 */
function provisionalOrigin(
  observation: SkillObservation,
  assessment: AttemptAssessment,
): ProvisionalOrigin | null {
  if (observation.source === "placement-inference") return "inference";
  if (assessment.grade === "Easy") return "direct-easy";

  const isSupportSkill = observation.skill === "meaning"
    && assessment.modality !== "recognition";
  if (assessment.grade === "Good") {
    return isSupportSkill ? "direct-good" : null;
  }
  if (assessment.grade === "Hard" && isSupportSkill) return "direct-good";

  return null;
}
