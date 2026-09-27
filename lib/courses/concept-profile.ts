import type { CefrLevelId } from "@/lib/courses/types";

export type ConceptSelfRating = "unknown" | "familiar" | "confident";

export type ConceptStatus = "mastered" | "review" | "learn";

export type ConceptSignalSource = "manual" | "assessment" | "exercise";

export interface AssessmentConcept {
  lessonSlug: string;
  level: CefrLevelId;
  title: string;
  goal?: string;
}

/** One evaluated answer kept as concept evidence (plan 050). */
export interface ConceptEvidenceItem {
  /** Unique attempt identity: replays of the same attempt count once. */
  attemptId: string;
  /** Question/content identity: repeating one item is one piece of evidence. */
  contentId: string;
  correct: boolean;
  /** ISO timestamp of the answer; the latest answer per content wins. */
  at: string;
}

export interface ConceptSignal {
  lessonSlug: string;
  level: CefrLevelId;
  title: string;
  selfRating: ConceptSelfRating;
  status: ConceptStatus;
  correct: number;
  total: number;
  assessedAt: string;
  /** When set, Daily study_deck ignores this review signal until due. */
  verificationDueAt?: string;
  source?: ConceptSignalSource;
  /**
   * Bounded exercise evidence behind `correct`/`total`. When present, those
   * counts and `status` are derived from it (see lib/progress/concept-evidence).
   */
  evidence?: ConceptEvidenceItem[];
}

export function deriveConceptSignal(
  concept: AssessmentConcept,
  selfRating: ConceptSelfRating,
  evidence: { correct: number; total: number },
  assessedAt: string,
): ConceptSignal {
  const hasPerfectEvidence = evidence.total > 0 && evidence.correct === evidence.total;
  // Quiz evidence wins over a humble self-rating: perfect answers → mastered
  // even if the learner marked the topic as unknown before the questions.
  const status: ConceptStatus = hasPerfectEvidence
    ? "mastered"
    : selfRating === "unknown"
      ? "learn"
      : "review";

  return {
    lessonSlug: concept.lessonSlug,
    level: concept.level,
    title: concept.title,
    selfRating,
    status,
    correct: evidence.correct,
    total: evidence.total,
    assessedAt,
  };
}
