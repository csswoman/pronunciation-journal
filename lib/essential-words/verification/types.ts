import type { Grade } from "../attempt-grade";
import type { EssentialWordMode } from "../exercise-modes";
import type { InitialListeningLevel } from "../initial-listening-level";

export type FsrsCardState = "New" | "Learning" | "Review" | "Relearning";
export type Skill = "meaning" | "listening" | "production" | "usage";
export type BaseSkill = Exclude<Skill, "usage">;
export type AttemptModality = "recognition" | "production" | "listening" | "pronunciation";
export type AttemptEventType = "practice" | "verification" | "scheduled-review" | "learning-step";

export type ItemSchedule =
  | { kind: "none" }
  | {
      kind: "provisional";
      dueAt: string;
      source: "direct" | "placement-inference";
      evidenceConfidence: number;
    }
  | {
      kind: "fsrs";
      dueAt: string;
      stability: number;
      difficulty: number;
      state: FsrsCardState;
    };

export interface PlacementInference {
  bandId: string;
  confidence: number;
  inferredAt: string;
  policyVersion: string;
}

export type UsageKind = "context_usage" | "advanced_usage";

export interface GeneratedContentMetadata {
  generatorVersion?: string;
  promptVersion?: string;
  modelVersion?: string;
  schemaVersion: number;
  reviewed?: boolean;
}

export interface UsagePayload {
  usageKind: UsageKind;
  expression: string;
  sentence: string;
  sentenceIpa?: string;
  acceptedVariants: string[];
  generationStatus: "pending" | "ready" | "failed";
  generatedAt?: string;
  activatedAt?: string;
  retiredAt?: string;
  metadata: GeneratedContentMetadata;
}

interface LearningItemFields {
  id: string;
  wordId: string;
  contentOrigin: "authored" | "generated" | "journal";
  generatorProvider?: "gemini";
  payload?: UsagePayload;
  schedule: ItemSchedule;
  lastReview?: string;
  repetitions: number;
  lapses: number;
  suspended: boolean;
  /** One-time legacy seed; only writers for listening assign it. */
  initialListeningLevel?: InitialListeningLevel;
}

export type LearningItem =
  | (LearningItemFields & { skill: BaseSkill; placementInference?: PlacementInference })
  | (LearningItemFields & { skill: "usage"; placementInference?: never });

export type SkillStatus = "unseen" | "learning" | "provisional" | "review";

export interface SkillObservation {
  skill: Skill;
  outcome: "success" | "failure";
  source: "direct" | "placement-inference" | "journal";
  basis:
    | { kind: "attempt"; modality: AttemptModality }
    | { kind: "band-inference"; bandId: string; policyVersion: string };
  evidenceConfidence: number;
  observedAt: string;
}

export interface AttemptAssessment {
  grade: Grade;
  modality: AttemptModality;
  correct: boolean;
  latencyMs: number;
  interactionDurationMs: number;
  usedHints: boolean;
  rescued: boolean;
  acceptedVariant: boolean;
  firstTryFailed: boolean;
  freeAudioReplays: number;
}

export interface SkillPlacement {
  skill: Skill;
  schedule: ItemSchedule;
  verificationSource: "direct" | "placement-inference";
}

export interface AttemptLog {
  id: string;
  sessionId: string;
  wordId: string;
  assessment: AttemptAssessment;
  observations: SkillObservation[];
  eventType: AttemptEventType;
  occurredAt: string;
  /** The exercise shown to the learner; distinct from assessment.modality. */
  renderedMode?: EssentialWordMode;
  diagnostic?: {
    tier?: 1 | 2 | 3;
    focusContrastId?: string;
    words: Array<{ expected?: string; written?: string; category: string; expectedIpa?: string; writtenIpa?: string; contrastId?: string }>;
  };
}

export interface SrsReviewEvent {
  id: string;
  attemptLogId: string;
  learningItemId: string;
  grade: Grade;
  assessment: AttemptAssessment;
  priorSchedule: ItemSchedule;
  resultingSchedule: ItemSchedule;
  occurredAt: string;
  affectsSchedule: true;
  fsrsAudit: {
    schedulerVersion: string;
    parametersVersion?: string;
    desiredRetention: number;
    retrievabilityBeforeReview?: number;
  };
}

export interface MaturityPolicy {
  version: string;
  minStabilityDays: number;
  minSuccessfulReviews: number;
  maxRecentLapses: number;
  recentReviewWindow: number;
}
