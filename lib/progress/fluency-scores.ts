import { resolveAnswerSkills } from './skill-matrix'
import * as PracticeTypes from '@/lib/practice/types'
import type { ExerciseSlug } from '@/lib/practice/types'

export type SkillKey =
  | 'pronunciation'
  | 'grammar'
  | 'vocabulary'
  | 'listening'
  | 'speaking'
  | 'reading'
  | 'writing'

export interface SkillScore {
  /** 0-100 or null if insufficient evidence */
  score: number | null
  /** Accuracy % over deduplicated evaluable answers */
  accuracy: number
  /** Distinct content_ids with evaluated answers in the window */
  uniqueContentCount: number
  /** Total deduplicated evaluated answers */
  evidenceCount: number
  /** true when uniqueContentCount < MINIMUM_EVIDENCE_THRESHOLD */
  insufficientEvidence: boolean
}

export type FluencyScores = Record<SkillKey, SkillScore>

export const SKILL_KEYS: SkillKey[] = [
  'pronunciation',
  'grammar',
  'vocabulary',
  'listening',
  'speaking',
  'reading',
  'writing',
]

/** Below this number of distinct content_ids, no score is computed. */
export const MINIMUM_EVIDENCE_THRESHOLD = 5

/** Max attempts per content_id that contribute to the skill score. */
export const MAX_ATTEMPTS_PER_CONTENT = 3

export interface FluencyWordBankStatus {
  new: number
  learning: number
  review: number
  mastered: number
  /** Legacy mastered rows are an exclusive SRS bucket, not verified mastery. */
  legacyMastered?: number
}

export interface FluencyRawAnswer {
  exerciseTypeId: number
  slug?: ExerciseSlug | null
  exercisePayload?: unknown
  context: string | null
  isCorrect: boolean
  grade: number | null
  /** Used for deduplication: max MAX_ATTEMPTS_PER_CONTENT per content_id. */
  contentId?: string | null
}

export interface FluencyScoreInput {
  answers: FluencyRawAnswer[]
  wordsByStatus: FluencyWordBankStatus
  contrastCorrect: number
  contrastTotal: number
  essentialWordsStudied: number
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function skillsForAnswer(answer: FluencyRawAnswer): SkillKey[] {
  const slug =
    answer.slug ?? PracticeTypes.slugForExerciseTypeId(answer.exerciseTypeId)
  return [...resolveAnswerSkills(slug, answer.exercisePayload)]
}

function exclusiveWordBankTotal(words: FluencyWordBankStatus): number {
  return words.new
    + words.learning
    + words.review
    + words.mastered
    + (words.legacyMastered ?? 0)
}

function retentionForSkill(skill: SkillKey, input: FluencyScoreInput): number {
  const { wordsByStatus, contrastCorrect, contrastTotal } = input
  const wordTotal = exclusiveWordBankTotal(wordsByStatus)

  switch (skill) {
    case 'vocabulary': {
      if (wordTotal === 0) return 0
      return Math.round((wordsByStatus.mastered / wordTotal) * 100)
    }
    case 'pronunciation':
      return contrastTotal >= 5
        ? Math.round((contrastCorrect / contrastTotal) * 100)
        : 0
    default:
      return 0
  }
}

// ── Deduplication ─────────────────────────────────────────────────────────────

interface SkillBucket {
  correct: number
  total: number
  /** content_id → count of attempts already included */
  contentCounts: Map<string, number>
  /** content_ids seen (for uniqueContentCount) */
  contentIds: Set<string>
}

function emptyBuckets(): Record<SkillKey, SkillBucket> {
  const make = (): SkillBucket => ({
    correct: 0,
    total: 0,
    contentCounts: new Map(),
    contentIds: new Set(),
  })
  return {
    pronunciation: make(),
    grammar: make(),
    vocabulary: make(),
    listening: make(),
    speaking: make(),
    reading: make(),
    writing: make(),
  }
}

/**
 * Buckets answers by skill with content deduplication.
 *
 * For each content_id, only the most recent MAX_ATTEMPTS_PER_CONTENT attempts
 * contribute (answers arrive newest-last from the paginated query, so we
 * walk them backwards and cap per content_id). Rows without content_id are
 * treated as unique — we cannot deduplicate what has no identity.
 */
function bucketAnswers(answers: FluencyRawAnswer[]): Record<SkillKey, SkillBucket> {
  const buckets = emptyBuckets()
  for (let i = answers.length - 1; i >= 0; i--) {
    const answer = answers[i]
    const skills = skillsForAnswer(answer)
    const acc = answer.isCorrect ? 100 : 0

    for (const skill of skills) {
      const bucket = buckets[skill]
      const cid = answer.contentId

      if (cid) {
        bucket.contentIds.add(cid)
        const count = bucket.contentCounts.get(cid) ?? 0
        if (count >= MAX_ATTEMPTS_PER_CONTENT) continue
        bucket.contentCounts.set(cid, count + 1)
      }

      bucket.total++
      bucket.correct += acc
    }
  }
  return buckets
}

// ── Score computation ─────────────────────────────────────────────────────────

function scoreSkill(
  skill: SkillKey,
  bucket: SkillBucket,
  input: FluencyScoreInput,
): SkillScore {
  const accuracy = bucket.total > 0
    ? Math.round(bucket.correct / bucket.total)
    : 0
  const retention = retentionForSkill(skill, input)
  const uniqueContentCount = bucket.contentIds.size
  const insufficientEvidence = uniqueContentCount < MINIMUM_EVIDENCE_THRESHOLD

  if (bucket.total === 0 && retention === 0) {
    return { score: null, accuracy: 0, uniqueContentCount, evidenceCount: 0, insufficientEvidence: true }
  }

  const score = insufficientEvidence
    ? null
    : Math.round(Math.min(100, 0.75 * accuracy + 0.25 * retention))

  return { score, accuracy, uniqueContentCount, evidenceCount: bucket.total, insufficientEvidence }
}

export function computeFluencyScores(input: FluencyScoreInput): FluencyScores {
  const buckets = bucketAnswers(input.answers)
  const scores = {} as FluencyScores
  for (const skill of SKILL_KEYS) {
    scores[skill] = scoreSkill(skill, buckets[skill], input)
  }
  return scores
}

// ── Comparison & empty check ──────────────────────────────────────────────────

function averageScore(scores: FluencyScores): number {
  const values = SKILL_KEYS.map((k) => scores[k].score).filter((v): v is number => v != null)
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
}

/** Label for week-over-week profile shift. */
export function fluencyComparisonLabel(
  current: FluencyScores,
  previous: FluencyScores,
): string | undefined {
  const cur = averageScore(current)
  const prev = averageScore(previous)
  if (prev <= 0 && cur <= 0) return undefined
  const delta = cur - prev
  if (delta >= 3) return 'Mejorando esta semana'
  if (delta <= -3) return 'Enfoque necesario'
  return 'Estable esta semana'
}

export function isFluencyProfileEmpty(scores: FluencyScores): boolean {
  return SKILL_KEYS.every((k) => {
    const s = scores[k]
    return s.score == null && s.evidenceCount <= 0
  })
}

// ── Detailed metrics (Phase A, unchanged) ─────────────────────────────────────

export interface SkillMetricsBreakdown {
  accuracy: number
  retrievalQuality: number | null
  retention: number
  practiceVolume: number
}

export interface SeparateLearningDimensions {
  accuracy: {
    overallPct: number
    bySkill: Record<SkillKey, number>
    evaluatedAnswers: number
  }
  retrievalQuality: {
    averageGrade: number | null
    bySkill: Record<SkillKey, number | null>
    gradedAnswers: number
  }
  retention: {
    overallPct: number
    bySkill: Record<SkillKey, number>
  }
  coverage: {
    essentialWordsStudied: number
    wordBankTotal: number
    wordBankMastered: number
  }
}

export function computeDetailedSkillMetrics(
  input: FluencyScoreInput,
): Record<SkillKey, SkillMetricsBreakdown> {
  const buckets = bucketAnswers(input.answers)
  const result = {} as Record<SkillKey, SkillMetricsBreakdown>

  for (const skill of SKILL_KEYS) {
    const bucket = buckets[skill]
    const accuracy = bucket.total > 0 ? Math.round(bucket.correct / bucket.total) : 0
    const relevantAnswers = input.answers.filter((a) => skillsForAnswer(a).includes(skill) && a.grade != null && a.grade > 0)
    const retrievalQuality = relevantAnswers.length > 0
      ? Math.round((relevantAnswers.reduce((sum, a) => sum + (a.grade ?? 0), 0) / relevantAnswers.length) * 10) / 10
      : null
    const retention = retentionForSkill(skill, input)

    result[skill] = {
      accuracy,
      retrievalQuality,
      retention,
      practiceVolume: bucket.total,
    }
  }

  return result
}

export function computeSeparateLearningDimensions(
  input: FluencyScoreInput,
): SeparateLearningDimensions {
  const detailed = computeDetailedSkillMetrics(input)

  let totalEvaluated = 0
  let totalCorrect = 0
  let totalGradeSum = 0
  let totalGraded = 0

  for (const answer of input.answers) {
    totalEvaluated++
    if (answer.isCorrect) totalCorrect++
    if (answer.grade != null && answer.grade > 0) {
      totalGradeSum += answer.grade
      totalGraded++
    }
  }

  const accuracyBySkill = {} as Record<SkillKey, number>
  const retrievalBySkill = {} as Record<SkillKey, number | null>
  const retentionBySkill = {} as Record<SkillKey, number>

  for (const skill of SKILL_KEYS) {
    accuracyBySkill[skill] = detailed[skill].accuracy
    retrievalBySkill[skill] = detailed[skill].retrievalQuality
    retentionBySkill[skill] = detailed[skill].retention
  }

  const wordBankTotal = exclusiveWordBankTotal(input.wordsByStatus)
  const wordRetentionPct = wordBankTotal > 0
    ? Math.round((input.wordsByStatus.mastered / wordBankTotal) * 100)
    : 0

  return {
    accuracy: {
      overallPct: totalEvaluated > 0 ? Math.round((totalCorrect / totalEvaluated) * 100) : 0,
      bySkill: accuracyBySkill,
      evaluatedAnswers: totalEvaluated,
    },
    retrievalQuality: {
      averageGrade: totalGraded > 0 ? Math.round((totalGradeSum / totalGraded) * 10) / 10 : null,
      bySkill: retrievalBySkill,
      gradedAnswers: totalGraded,
    },
    retention: {
      overallPct: wordRetentionPct,
      bySkill: retentionBySkill,
    },
    coverage: {
      essentialWordsStudied: input.essentialWordsStudied,
      wordBankTotal,
      wordBankMastered: input.wordsByStatus.mastered,
    },
  }
}
