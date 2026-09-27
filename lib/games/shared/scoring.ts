export interface BaseScoringState {
  score: number
  streak: number
  maxStreak: number
  hits: number
  misses: number
}

export function comboMultiplier(streak: number): number {
  if (streak >= 10) return 3
  if (streak >= 5) return 2
  return 1
}

export function createInitialScoringState(): BaseScoringState {
  return {
    score: 0,
    streak: 0,
    maxStreak: 0,
    hits: 0,
    misses: 0,
  }
}

export function applyHit<T extends BaseScoringState>(state: T, basePoints = 100): T {
  const newStreak = state.streak + 1
  const mult = comboMultiplier(newStreak)
  const addedScore = basePoints * mult
  return {
    ...state,
    score: state.score + addedScore,
    streak: newStreak,
    maxStreak: Math.max(state.maxStreak, newStreak),
    hits: state.hits + 1,
  }
}

export function applyMiss<T extends BaseScoringState>(state: T, penalty = 0): T {
  return {
    ...state,
    score: Math.max(0, state.score - penalty),
    streak: 0,
    misses: state.misses + 1,
  }
}
