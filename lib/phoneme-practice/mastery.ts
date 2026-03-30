import type { UserSoundProgress } from './types'

export function isMastered(p: UserSoundProgress): boolean {
  return (
    p.total_attempts >= 15 &&
    p.total_attempts > 0 &&
    p.correct_answers / p.total_attempts >= 0.85 &&
    p.streak >= 5
  )
}

export function getNextUnlockedSoundId(
  progressList: UserSoundProgress[],
  allSoundIds: number[]
): number | null {
  const masteredIds = new Set(
    progressList.filter(p => p.status === 'mastered').map(p => p.sound_id)
  )
  const unlockedIds = new Set(
    progressList
      .filter(p => p.status !== 'locked')
      .map(p => p.sound_id)
  )
  // Find first sound in sorted order that is still locked
  for (const id of allSoundIds) {
    if (!unlockedIds.has(id) && masteredIds.size > 0) {
      return id
    }
  }
  return null
}
