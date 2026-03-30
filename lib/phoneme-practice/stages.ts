import type { ExerciseType } from './types'

export type StageId = 'recognition' | 'pairs' | 'dictation'

export interface StageDef {
  id: StageId
  title: string
  exerciseTypes: ExerciseType[]
  difficulty: 'Easy' | 'Medium'
  icon: 'ear' | 'swap' | 'mic'
}

export const STAGES: StageDef[] = [
  {
    id: 'recognition',
    title: 'Identify the Sound',
    exerciseTypes: ['pick_word', 'pick_sound'],
    difficulty: 'Easy',
    icon: 'ear',
  },
  {
    id: 'pairs',
    title: 'Minimal Pairs',
    exerciseTypes: ['minimal_pair'],
    difficulty: 'Medium',
    icon: 'swap',
  },
  {
    id: 'dictation',
    title: 'Dictation',
    exerciseTypes: ['dictation'],
    difficulty: 'Medium',
    icon: 'mic',
  },
]

export interface StageMastery {
  correct: number
  total: number
  pct: number
}

export type StageMasteryMap = Record<StageId, StageMastery>

export function computeStageMastery(
  history: { exercise_type: string; is_correct: boolean }[]
): StageMasteryMap {
  const blank = (): StageMastery => ({ correct: 0, total: 0, pct: 0 })
  const map: StageMasteryMap = {
    recognition: blank(),
    pairs: blank(),
    dictation: blank(),
  }

  for (const row of history) {
    const stageId = typeToStage(row.exercise_type)
    if (!stageId) continue
    map[stageId].total++
    if (row.is_correct) map[stageId].correct++
  }

  for (const key of Object.keys(map) as StageId[]) {
    const s = map[key]
    s.pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
  }

  return map
}

function typeToStage(type: string): StageId | null {
  if (type === 'pick_word' || type === 'pick_sound') return 'recognition'
  if (type === 'minimal_pair') return 'pairs'
  if (type === 'dictation') return 'dictation'
  return null
}

export function isStageUnlocked(
  stageId: StageId,
  mastery: StageMasteryMap,
  hasPairs: boolean
): boolean {
  switch (stageId) {
    case 'recognition':
      return true
    case 'pairs':
      return hasPairs && mastery.recognition.total >= 4
    case 'dictation':
      if (!hasPairs) return mastery.recognition.total >= 8
      return mastery.pairs.total >= 4
  }
}

export function overallMastery(mastery: StageMasteryMap, hasPairs: boolean): number {
  const stages: StageId[] = hasPairs ? ['recognition', 'pairs', 'dictation'] : ['recognition', 'dictation']
  const relevant = stages.map(id => mastery[id])
  const totalAttempts = relevant.reduce((sum, s) => sum + s.total, 0)
  const totalCorrect = relevant.reduce((sum, s) => sum + s.correct, 0)
  return totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0
}
