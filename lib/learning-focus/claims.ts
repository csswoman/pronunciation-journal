import type { AssessmentConcept, ConceptSignal } from '@/lib/courses/concept-profile'

/** 1 day — aligned with lexicon "known" verification. */
export const CLAIM_VERIFICATION_MS = 24 * 60 * 60 * 1000

export function buildTheoryClaimSignal(
  concept: Pick<AssessmentConcept, 'lessonSlug' | 'level' | 'title'>,
  nowIso: string,
): ConceptSignal {
  const due = new Date(Date.parse(nowIso) + CLAIM_VERIFICATION_MS).toISOString()
  return {
    lessonSlug: concept.lessonSlug,
    level: concept.level,
    title: concept.title,
    selfRating: 'familiar',
    status: 'review',
    correct: 0,
    total: 0,
    assessedAt: nowIso,
    verificationDueAt: due,
  }
}

export function isConceptSignalDue(
  signal: ConceptSignal,
  nowMs: number = Date.now(),
): boolean {
  if (signal.status !== 'review') return true
  if (!signal.verificationDueAt) return true
  return Date.parse(signal.verificationDueAt) <= nowMs
}
