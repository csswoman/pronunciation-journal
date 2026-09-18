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

export type FluencyScores = Record<SkillKey, number>

export const SKILL_KEYS: SkillKey[] = [
  'pronunciation',
  'grammar',
  'vocabulary',
  'listening',
  'speaking',
  'reading',
]

export interface FluencyWordBankStatus {
  new: number
  learning: number
  review: number
  mastered: number
}
export interface FluencyRawAnswer {
  exerciseTypeId: number
  slug?: ExerciseSlug | null
  exercisePayload?: unknown
  context: string | null
  isCorrect: boolean
  grade: number | null
}

export interface FluencyScoreInput {
  answers: FluencyRawAnswer[]
  wordsByStatus: FluencyWordBankStatus
  contrastCorrect: number
  contrastTotal: number
  essentialWordsStudied: number
}

/** Target answers in 30 days for frequency component to reach 100. */
const TARGET_ANSWERS_PER_SKILL = 20

function answerAccuracy(answer: FluencyRawAnswer): number {
  return answer.isCorrect ? 100 : 0
}

function skillsForAnswer(answer: FluencyRawAnswer): SkillKey[] {
  const slug =
    answer.slug ?? PracticeTypes.slugForExerciseTypeId(answer.exerciseTypeId)
  return [...resolveAnswerSkills(slug, answer.exercisePayload)]
}

function emptyBuckets(): Record<SkillKey, { correct: number; total: number }> {
  return {
    pronunciation: { correct: 0, total: 0 },
    grammar: { correct: 0, total: 0 },
    vocabulary: { correct: 0, total: 0 },
    listening: { correct: 0, total: 0 },
    speaking: { correct: 0, total: 0 },
    reading: { correct: 0, total: 0 },
  }
}

function bucketAnswers(answers: FluencyRawAnswer[]): Record<SkillKey, { correct: number; total: number }> {
  const buckets = emptyBuckets()
  for (const answer of answers) {
    const acc = answerAccuracy(answer)
    for (const skill of skillsForAnswer(answer)) {
      buckets[skill].total++
      buckets[skill].correct += acc
    }
  }
  return buckets
}

function retentionForSkill(skill: SkillKey, input: FluencyScoreInput): number {
  const { wordsByStatus, contrastCorrect, contrastTotal } = input
  const wordTotal = Object.values(wordsByStatus).reduce((a, b) => a + b, 0)

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

function scoreSkill(
  skill: SkillKey,
  bucket: { correct: number; total: number },
  input: FluencyScoreInput,
): number {
  if (bucket.total === 0 && retentionForSkill(skill, input) === 0) return 0

  const accuracy = bucket.total > 0
    ? bucket.correct / bucket.total
    : retentionForSkill(skill, input)

  const frequency = Math.min(100, Math.round((bucket.total / TARGET_ANSWERS_PER_SKILL) * 100))
  const retention = retentionForSkill(skill, input)

  return Math.round(Math.min(100, 0.6 * accuracy + 0.3 * frequency + 0.1 * retention))
}

export function computeFluencyScores(input: FluencyScoreInput): FluencyScores {
  const buckets = bucketAnswers(input.answers)
  const scores = {} as FluencyScores
  for (const skill of SKILL_KEYS) {
    scores[skill] = scoreSkill(skill, buckets[skill], input)
  }
  return scores
}

function averageScore(scores: FluencyScores): number {
  const values = SKILL_KEYS.map((k) => scores[k])
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
  return SKILL_KEYS.every((k) => scores[k] <= 0)
}

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
    const accuracy = bucket.total > 0 ? Math.round((bucket.correct / bucket.total) * 100) : 0
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

  const wordBankTotal = Object.values(input.wordsByStatus).reduce((a, b) => a + b, 0)
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
