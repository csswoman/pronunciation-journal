import type { AssessmentConcept, ConceptSignal } from '@/lib/courses/concept-profile'

/** 1 day — aligned with lexicon "known" verification. */
export const CLAIM_VERIFICATION_MS = 24 * 60 * 60 * 1000

export type ManualSignalOption = 'mastered' | 'so_so' | 'need_help'

export function buildTheoryClaimSignal(
  concept: Pick<AssessmentConcept, 'lessonSlug' | 'level' | 'title'>,
  nowIso: string,
): ConceptSignal {
  return buildManualConceptSignal(concept, 'need_help', nowIso)
}

export function buildManualConceptSignal(
  concept: Pick<AssessmentConcept, 'lessonSlug' | 'level' | 'title'>,
  option: ManualSignalOption,
  nowIso: string = new Date().toISOString(),
): ConceptSignal {
  const nowMs = Date.parse(nowIso)

  if (option === 'mastered') {
    return {
      lessonSlug: concept.lessonSlug,
      level: concept.level,
      title: concept.title,
      selfRating: 'confident',
      status: 'mastered',
      correct: 0,
      total: 0,
      assessedAt: nowIso,
      source: 'manual',
    }
  }

  if (option === 'so_so') {
    // Normal review cadence: 3 days
    const due = new Date(nowMs + 3 * CLAIM_VERIFICATION_MS).toISOString()
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
      source: 'manual',
    }
  }

  // option === 'need_help': short review due (tomorrow, 24h)
  const due = new Date(nowMs + CLAIM_VERIFICATION_MS).toISOString()
  return {
    lessonSlug: concept.lessonSlug,
    level: concept.level,
    title: concept.title,
    selfRating: 'unknown',
    status: 'review',
    correct: 0,
    total: 0,
    assessedAt: nowIso,
    verificationDueAt: due,
    source: 'manual',
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
