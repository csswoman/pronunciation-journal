import { deriveSkillStatus, isMature } from "../skill-item";
import type {
  LearningItem,
  MaturityPolicy,
  SrsReviewEvent,
  UsageKind,
} from "../verification/types";

export type UsageEligibility = Record<UsageKind, boolean>;

/**
 * Determines which generated usage exercises may be activated for a word.
 * Maturity is evaluated per learning item, so a single attempt that schedules
 * more than one skill cannot contribute evidence to the wrong item.
 */
export function usageEligibility(
  items: LearningItem[],
  events: SrsReviewEvent[],
  policy: MaturityPolicy,
): UsageEligibility {
  const meaning = items.find((item) => item.skill === "meaning");
  const production = items.find((item) => item.skill === "production");

  const meaningInReview = meaning
    ? deriveSkillStatus(meaning) === "review"
    : false;

  return {
    context_usage: meaningInReview,
    advanced_usage: Boolean(
      meaning
      && production
      && isMature(meaning, events, policy)
      && isMature(production, events, policy),
    ),
  };
}

/**
 * Losing maturity controls only the activation of new content. Existing usage
 * items retain their own schedules, preventing an isolated lapse or policy
 * adjustment from withdrawing exercises the learner has already received.
 */
export function planUsageAfterLapse(
  usageItems: LearningItem[],
  eligibility: { canActivateNew: boolean },
): {
  unchanged: LearningItem[];
  retired: LearningItem[];
  blockNewActivations: boolean;
} {
  return {
    unchanged: usageItems,
    retired: [],
    blockNewActivations: !eligibility.canActivateNew,
  };
}
