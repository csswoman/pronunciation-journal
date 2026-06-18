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
  context: string | null
  isCorrect: boolean
  grade: number | null
}

export interface FluencyScoreInput {
  answers: FluencyRawAnswer[]
  wordsByStatus: FluencyWordBankStatus
  contrastCorrect: number
  contrastTotal: number
  core1000Practiced: number
  lessonsCompleted: number
}

/** Target answers in 30 days for frequency component to reach 100. */
const TARGET_ANSWERS_PER_SKILL = 20

const PHONEME_TYPES = new Set([1, 2, 3, 4, 11, 12, 13, 14])
const LISTENING_TYPES = new Set([3, 4, 6, 12, 13, 14])
const GRAMMAR_TYPES = new Set([5, 7, 8])
const SPEAKING_TYPES = new Set([10])

function answerAccuracy(answer: FluencyRawAnswer): number {
  if (answer.grade != null) return Math.round((answer.grade / 5) * 100)
  return answer.isCorrect ? 100 : 0
}

function skillsForAnswer(answer: FluencyRawAnswer): SkillKey[] {
  const skills = new Set<SkillKey>()
  const { exerciseTypeId: typeId, context } = answer

  if (context === 'courses') skills.add('reading')
  if (context === 'ai_coach') skills.add('speaking')
  if (context === 'core-1000') {
    skills.add('vocabulary')
    if (typeId === 10) skills.add('speaking')
  }
  if (context === 'sound_lab' || PHONEME_TYPES.has(typeId)) skills.add('pronunciation')
  if (LISTENING_TYPES.has(typeId)) skills.add('listening')
  if (SPEAKING_TYPES.has(typeId)) skills.add('speaking')
  if (GRAMMAR_TYPES.has(typeId) && context !== 'core-1000') skills.add('grammar')
  if (typeId === 7 || typeId === 5) skills.add('vocabulary')

  return [...skills]
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
  const { wordsByStatus, contrastCorrect, contrastTotal, core1000Practiced, lessonsCompleted } = input
  const wordTotal = Object.values(wordsByStatus).reduce((a, b) => a + b, 0)

  switch (skill) {
    case 'vocabulary': {
      if (wordTotal === 0 && core1000Practiced === 0) return 0
      const bankRetention = wordTotal > 0
        ? Math.round((wordsByStatus.mastered / wordTotal) * 100)
        : 0
      const coreBonus = Math.min(100, core1000Practiced * 2)
      return Math.max(bankRetention, coreBonus)
    }
    case 'pronunciation':
      return contrastTotal >= 5
        ? Math.round((contrastCorrect / contrastTotal) * 100)
        : 0
    case 'grammar':
    case 'reading':
      return Math.min(100, lessonsCompleted * 12)
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
  if (delta >= 3) return 'Improving this week'
  if (delta <= -3) return 'Needs focus'
  return 'Stable this week'
}

export function isFluencyProfileEmpty(scores: FluencyScores): boolean {
  return SKILL_KEYS.every((k) => scores[k] <= 0)
}
