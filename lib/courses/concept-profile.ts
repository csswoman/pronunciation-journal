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
  /** Authored task dimension. Unattributed legacy evidence stays separate. */
  taskSkill?: import('@/lib/progress/activity-types').SkillTag;
  /** Unique attempt identity: replays of the same attempt count once. */
  attemptId: string;
  /** Question/content identity: repeating one item is one piece of evidence. */
  contentId: string;
  correct: boolean;
  /** ISO timestamp of the answer; the latest answer per content wins. */
  at: string;
}

export interface ConceptSignal {
  masteryBySkill?: Partial<Record<import('@/lib/progress/activity-types').SkillTag, {
    correct: number; total: number; status: 'mastered' | 'review';
  }>>;
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
  // Placement aggregates do not carry distinct content/attempt identities.
  // Keep their result without asserting the mastery reserved for practice evidence.
  const status: ConceptStatus = evidence.correct > 0
    ? "review"
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
