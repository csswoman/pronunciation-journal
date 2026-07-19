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
  const status: ConceptStatus = hasPerfectEvidence && selfRating !== "unknown"
    ? "mastered"
    : selfRating === "unknown" && (!hasPerfectEvidence || evidence.total === 0)
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
