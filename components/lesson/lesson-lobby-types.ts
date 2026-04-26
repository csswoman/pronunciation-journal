import type { Lesson } from '@/lib/types'

export type LessonStageId = 'guided' | 'pronunciation' | 'speed'

export interface LessonStageDef {
  id: LessonStageId
  title: string
  subtitle: string
  description: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  icon: 'ear' | 'mic' | 'zap'
  recommended?: boolean
  barColor: string
}

export const LESSON_STAGES: LessonStageDef[] = [
  {
    id: 'guided',
    title: 'Listen & Repeat',
    subtitle: 'Hear the word clearly, then record yourself saying it back.',
    description: 'Hear each word, then record yourself',
    difficulty: 'Easy',
    icon: 'ear',
    recommended: true,
    barColor: 'var(--primary)',
  },
  {
    id: 'pronunciation',
    title: 'Speak Free',
    subtitle: 'No hints this time — say each word from memory and get scored.',
    description: 'Pronounce each word without the IPA hint',
    difficulty: 'Medium',
    icon: 'mic',
    barColor: '#2ec4b6',
  },
  {
    id: 'speed',
    title: 'Quick Quiz',
    subtitle: 'Five rapid-fire questions to lock in what you practiced.',
    description: 'Go through all words as fast as you can',
    difficulty: 'Hard',
    icon: 'zap',
    barColor: '#f4a261',
  },
]

export interface LessonStageMastery {
  pct: number
  attempts: number
}

export type LessonStageMasteryMap = Record<LessonStageId, LessonStageMastery>

export type DifficultyMode = 'chill' | 'master'

export interface LessonLobbyProps {
  lesson: Lesson
  totalWords: number
  sessionChunk: number
  totalChunks: number
  mastery: LessonStageMasteryMap
  onSelectStage: (stageId: LessonStageId, diff: DifficultyMode) => void
  backHref?: string
}

export function emptyLessonMastery(): LessonStageMasteryMap {
  return {
    guided:        { pct: 0, attempts: 0 },
    pronunciation: { pct: 0, attempts: 0 },
    speed:         { pct: 0, attempts: 0 },
  }
}

export function isLessonStageUnlocked(id: LessonStageId, mastery: LessonStageMasteryMap): boolean {
  switch (id) {
    case 'guided':        return true
    case 'pronunciation': return mastery.guided.attempts >= 1
    case 'speed':         return mastery.pronunciation.attempts >= 1
  }
}

export function overallLessonMastery(mastery: LessonStageMasteryMap): number {
  const vals = Object.values(mastery).filter(m => m.attempts > 0)
  if (vals.length === 0) return 0
  return Math.round(vals.reduce((s, m) => s + m.pct, 0) / vals.length)
}
