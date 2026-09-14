import { deriveSkillStatus } from "./skill-item";
import type { EssentialWordLearnerSignalRecord } from "@/lib/db";
import type { LearningItem, Skill, SkillStatus } from "./verification/types";

export type LearnerFamiliarity = "unknown" | "self-declared";
export type PronunciationDifficulty = "none" | "self-reported";

export interface EssentialWordLearnerState {
  familiarity: LearnerFamiliarity;
  pronunciationDifficulty: PronunciationDifficulty;
  meaning: SkillStatus;
  listening: SkillStatus;
  production: SkillStatus;
  usage: SkillStatus;
}

const DEFAULT_SKILL_STATUS: SkillStatus = "unseen";

/**
 * Joins self-report with independently scheduled evidence for display and
 * prioritization. The result is derived; only the signal record is written.
 */
export function deriveEssentialWordLearnerState(
  items: readonly LearningItem[],
  signal?: Pick<EssentialWordLearnerSignalRecord, "familiarity" | "pronunciationDifficulty">,
): EssentialWordLearnerState {
  const statusFor = (skill: Skill) =>
    deriveSkillStatus(items.find((item) => item.skill === skill) ?? {
      id: `unknown#${skill}`,
      wordId: "unknown",
      skill,
      contentOrigin: "authored",
      schedule: { kind: "none" },
      repetitions: 0,
      lapses: 0,
      suspended: false,
    });

  return {
    familiarity: signal?.familiarity ?? "unknown",
    pronunciationDifficulty: signal?.pronunciationDifficulty ?? "none",
    meaning: statusFor("meaning") ?? DEFAULT_SKILL_STATUS,
    listening: statusFor("listening") ?? DEFAULT_SKILL_STATUS,
    production: statusFor("production") ?? DEFAULT_SKILL_STATUS,
    usage: statusFor("usage") ?? DEFAULT_SKILL_STATUS,
  };
}
