import type { CefrLevelId } from "@/lib/courses/types";

export type ConceptSelfRating = "unknown" | "familiar" | "confident";

export type ConceptStatus = "mastered" | "review" | "learn";

export interface AssessmentConcept {
  lessonSlug: string;
  level: CefrLevelId;
  title: string;
  goal?: string;
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
