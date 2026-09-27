import { findStudyByDeckSlug, parseCefrLevelId } from '@/lib/courses/curriculumIndex'
import type { ConceptEvidenceItem, ConceptSignal } from '@/lib/courses/concept-profile'
import { isEvaluatedPracticeAnswer } from '@/lib/practice/evaluation-status'
import type { SessionResult } from '@/lib/practice/types'
import { isSkillTag } from '@/lib/progress/skill-matrix'

/**
 * Concept evidence contract (plan 050, step 3).
 *
 * - Identity: one item per attempt id, first write wins, so a replayed or
 *   retried session never counts twice.
 * - Content: only the latest answer per content id counts, so repeating the
 *   same question five times is one piece of evidence, not five.
 * - Time: items are ordered by answer time and only the most recent window is
 *   kept, bounding the JSON stored in user_learning_state.
 *
 * `mastered` needs at least CONCEPT_MASTERY_MIN_CONTENTS distinct contents at
 * CONCEPT_MASTERY_MIN_ACCURACY. This product criterion was approved on
 * 2026-09-27 for exercise evidence, with no minimum elapsed time. It is not
 * universal proof of mastery; assessment aggregates cannot establish mastery
 * without content identities. Historical signals are not backfilled.
 */
export const CONCEPT_MASTERY_MIN_CONTENTS = 5
export const CONCEPT_MASTERY_MIN_ACCURACY = 0.8
export const CONCEPT_EVIDENCE_WINDOW = 30

export interface ConceptEvidenceSummary {
  correct: number
  total: number
  status: 'mastered' | 'review'
}

/** Union by attempt id (first write wins), oldest→newest, bounded window. */
export function mergeConceptEvidence(
  previous: readonly ConceptEvidenceItem[],
  incoming: readonly ConceptEvidenceItem[],
): ConceptEvidenceItem[] {
  const byAttempt = new Map<string, ConceptEvidenceItem>()
  for (const item of [...previous, ...incoming]) {
    if (!byAttempt.has(item.attemptId)) byAttempt.set(item.attemptId, item)
  }
  return [...byAttempt.values()]
    .sort((a, b) => a.at.localeCompare(b.at))
    .slice(-CONCEPT_EVIDENCE_WINDOW)
}

export function summarizeConceptEvidence(
  items: readonly ConceptEvidenceItem[],
): ConceptEvidenceSummary {
  const latestByContent = new Map<string, ConceptEvidenceItem>()
  for (const item of items) {
    const key = `${item.taskSkill ?? 'unattributed'}:${item.contentId}`
    const current = latestByContent.get(key)
    if (!current || item.at >= current.at) latestByContent.set(key, item)
  }
  const total = latestByContent.size
  const correct = [...latestByContent.values()].filter((item) => item.correct).length
  const dimensions = new Set(items.map((item) => item.taskSkill ?? 'unattributed'))
  const mastered = dimensions.size === 1 && total >= CONCEPT_MASTERY_MIN_CONTENTS
    && correct / total >= CONCEPT_MASTERY_MIN_ACCURACY
  return { correct, total, status: mastered ? 'mastered' : 'review' }
}

/** Keep skill mastery separate; mixed dimensions never produce global mastery. */
export function conceptMasteryBySkill(items: readonly ConceptEvidenceItem[]): ConceptSignal['masteryBySkill'] {
  const skills = [...new Set(items.flatMap((item) => item.taskSkill ? [item.taskSkill] : []))]
  if (!skills.length) return undefined
  return Object.fromEntries(skills.map((skill) => [
    skill, summarizeConceptEvidence(items.filter((item) => item.taskSkill === skill)),
  ]))
}

/** Fold an incoming exercise signal into the previous one for the same concept. */
export function accumulateConceptSignal(
  previous: ConceptSignal | undefined,
  incoming: ConceptSignal,
): ConceptSignal {
  if (!incoming.evidence) return incoming
  const evidence = mergeConceptEvidence(previous?.evidence ?? [], incoming.evidence)
  const summary = summarizeConceptEvidence(evidence)
  const assessedAt = previous && previous.assessedAt > incoming.assessedAt
    ? previous.assessedAt
    : incoming.assessedAt
  return {
    ...incoming,
    assessedAt,
    evidence,
    ...(conceptMasteryBySkill(evidence) ? { masteryBySkill: conceptMasteryBySkill(evidence) } : {}),
    correct: summary.correct,
    total: summary.total,
    status: summary.status,
    selfRating: summary.status === 'mastered' ? 'confident' : 'familiar',
  }
}

/** True when every incoming item is already stored (a replay adds nothing). */
export function isConceptEvidenceReplay(
  previous: ConceptSignal | undefined,
  incoming: ConceptSignal,
): boolean {
  if (!incoming.evidence?.length) return false
  const known = new Set((previous?.evidence ?? []).map((item) => item.attemptId))
  return incoming.evidence.every((item) => known.has(item.attemptId))
}

/**
 * Group a session's evaluated answers by concept. The answer payload's
 * lessonSlug wins over sourceRef ids and session metadata, so each answer
 * contributes to one concept at most.
 */
export function collectConceptSignals(
  sessionResult: SessionResult,
  options: { sessionId?: string; metadataLessonSlug?: string; nowIso: string },
): ConceptSignal[] {
  const bySlug = new Map<string, ConceptEvidenceItem[]>()
  sessionResult.results.forEach((result, index) => {
    if (!isEvaluatedPracticeAnswer(result)) return
    const payload = result.exercisePayload as Record<string, unknown> | undefined
    const slugFromPayload = (payload?.lessonSlug as string | undefined) ?? (payload?.deckSlug as string | undefined)
    const slugFromSourceRef = result.sourceRef?.source === 'grammar_deck' ? result.sourceRef.id : undefined
    const slug = slugFromPayload ?? slugFromSourceRef ?? options.metadataLessonSlug
    if (!slug) return
    const items = bySlug.get(slug) ?? []
    items.push({
      ...(isSkillTag(payload?.taskSkill) ? { taskSkill: payload.taskSkill } : {}),
      attemptId: result.attemptId
        ?? (options.sessionId ? `${options.sessionId}:${index}` : crypto.randomUUID()),
      contentId: result.contentId ?? result.exerciseId,
      correct: result.isCorrect,
      at: result.completedAt ? new Date(result.completedAt).toISOString() : options.nowIso,
    })
    bySlug.set(slug, items)
  })

  return [...bySlug.entries()].map(([lessonSlug, items]) => {
    // Resolve real CEFR level and human title; falling back to the slug keeps
    // evidence flowing for decks that are not part of the course curriculum.
    const study = findStudyByDeckSlug(lessonSlug)
    const summary = summarizeConceptEvidence(items)
    return {
      lessonSlug,
      // Elective tracks (business, chunks…) are not CEFR levels: fall back to a1.
      level: parseCefrLevelId(study?.trackId) ?? 'a1',
      title: study?.lesson.title ?? lessonSlug,
      selfRating: summary.status === 'mastered' ? 'confident' : 'familiar',
      status: summary.status,
      correct: summary.correct,
      total: summary.total,
      assessedAt: options.nowIso,
      source: 'exercise',
      evidence: items,
      ...(conceptMasteryBySkill(items) ? { masteryBySkill: conceptMasteryBySkill(items) } : {}),
    }
  })
}
