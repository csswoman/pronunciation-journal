import type { CefrLevel } from '@/lib/essential-words/types'

export interface RainWord {
  id: string
  word: string
  ipa?: string | null
  pos?: string
  cefr_level: CefrLevel
  meaningEs?: string | null
}

export interface FallingWordItem {
  id: string
  word: string
  ipa?: string | null
  cefr_level: CefrLevel
  xPercent: number // 5% to 85% horizontal placement
  yPercent: number // 0% (top) to 100% (hit bottom)
  speed: number // percentage per tick
  isMatched?: boolean
  isDistractor?: boolean
}

export type WordRainStatus = 'ready' | 'playing' | 'paused' | 'game_over' | 'victory'

export interface WordRainStats {
  score: number
  streak: number
  maxStreak: number
  wordsCompleted: number
  wordsMissed: number
  accuracy: number
  wpm: number
  durationSeconds: number
}

export interface WordRainDifficultyConfig {
  spawnIntervalMs: number
  baseSpeed: number
  speedMultiplier: number
  maxSimultaneousWords: number
  distractorChance: number
  lives: number
  targetWordsToWin: number
}

export const DIFFICULTY_BY_LEVEL: Record<CefrLevel, WordRainDifficultyConfig> = {
  A1: {
    spawnIntervalMs: 2200,
    baseSpeed: 0.16,
    speedMultiplier: 1.0,
    maxSimultaneousWords: 4,
    distractorChance: 0.15,
    lives: 3,
    targetWordsToWin: 20,
  },
  A2: {
    spawnIntervalMs: 1800,
    baseSpeed: 0.20,
    speedMultiplier: 1.05,
    maxSimultaneousWords: 4,
    distractorChance: 0.20,
    lives: 3,
    targetWordsToWin: 25,
  },
  B1: {
    spawnIntervalMs: 1500,
    baseSpeed: 0.24,
    speedMultiplier: 1.1,
    maxSimultaneousWords: 5,
    distractorChance: 0.22,
    lives: 3,
    targetWordsToWin: 30,
  },
  B2: {
    spawnIntervalMs: 1300,
    baseSpeed: 0.28,
    speedMultiplier: 1.12,
    maxSimultaneousWords: 5,
    distractorChance: 0.25,
    lives: 3,
    targetWordsToWin: 35,
  },
  C1: {
    spawnIntervalMs: 1100,
    baseSpeed: 0.32,
    speedMultiplier: 1.15,
    maxSimultaneousWords: 6,
    distractorChance: 0.28,
    lives: 3,
    targetWordsToWin: 40,
  },
}
