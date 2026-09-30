import { requiresCheckpointOralEvidence } from "./assessment-oral-shared";
import type { AssessmentLevelScore, AssessmentResult } from "./assessment";
import type { CefrLevelId } from "./types";

export function buildAssessmentOralResultDetails(input: {
  levelScores: AssessmentLevelScore[];
  mode: "placement" | "checkpoint";
  checkpointLevel?: CefrLevelId;
  oralEvidencePassed: boolean;
}): Pick<AssessmentResult, "levelScores" | "oralEvidence"> {
  const oralRequired = input.mode === "checkpoint"
    && input.checkpointLevel !== undefined
    && requiresCheckpointOralEvidence(input.checkpointLevel);
  const levelScores = input.levelScores.map((levelScore) => {
    const writtenListeningMet = levelScore.thresholdMet;
    const levelRequiresOral = oralRequired && levelScore.level === input.checkpointLevel;
    const oralPassed = !levelRequiresOral || input.oralEvidencePassed;
    return {
      ...levelScore,
      writtenListeningMet,
      oralRequired: levelRequiresOral,
      oralPassed,
      thresholdMet: writtenListeningMet && oralPassed,
    };
  });
  const targetWrittenListeningMet = input.checkpointLevel
    ? levelScores.find((levelScore) => levelScore.level === input.checkpointLevel)?.writtenListeningMet ?? false
    : false;

  return {
    levelScores,
    ...(oralRequired && input.checkpointLevel ? {
      oralEvidence: {
        level: input.checkpointLevel,
        status: !targetWrittenListeningMet
          ? "not-required" as const
          : input.oralEvidencePassed ? "passed" as const : "pending" as const,
      },
    } : {}),
  };
}
