import type { CefrLevelId } from "@/lib/courses/types";

export const ASSESSMENT_ORAL_PILOT_LEVELS = ["a1", "a2"] as const;
export type AssessmentOralPilotLevel = (typeof ASSESSMENT_ORAL_PILOT_LEVELS)[number];

export interface AssessmentOralEvidenceStatus {
  level: CefrLevelId;
  status: "passed" | "pending" | "not-required";
}

export function requiresCheckpointOralEvidence(level: CefrLevelId): level is AssessmentOralPilotLevel {
  return ASSESSMENT_ORAL_PILOT_LEVELS.includes(level as AssessmentOralPilotLevel);
}

export const ASSESSMENT_ORAL_RECORDING_MAX_MS = 15_000;
export const ASSESSMENT_ORAL_AUDIO_MAX_BYTES = 1_500_000;
export const ASSESSMENT_ORAL_CHALLENGE_TTL_MS = 5 * 60_000;
export const ASSESSMENT_ORAL_ATTEMPT_TTL_MS = 24 * 60 * 60_000;

export interface AssessmentOralChallenge {
  id: string;
  level: AssessmentOralPilotLevel;
  prompt: string;
  expiresAt: string;
}
