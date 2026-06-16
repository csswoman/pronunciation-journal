import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getAllDbLessons } from '@/lib/db/lesson-generator'
import { getAllContrastProgress } from '@/lib/phoneme-practice/queries'
import { buildSoundMasteryMap, MASTERY_DISPLAY_THRESHOLD } from '@/lib/phoneme-practice/mastery-pct'
import { useHeroLesson } from './useHeroLesson'
import type { Lesson } from '@/lib/types'
import type { UserContrastProgress } from '@/lib/phoneme-practice/types'

export function useSoundLabData() {
  const { user } = useAuth()
  const [dbLessons, setDbLessons] = useState<Lesson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState<UserContrastProgress[] | null>(null)

  useEffect(() => {
    getAllDbLessons()
      .then(setDbLessons)
      .catch((err) => console.error('Failed to load DB lessons:', err))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    if (!user) { setProgress([]); return }
    getAllContrastProgress(user.id)
      .then(setProgress)
      .catch(() => setProgress([]))
  }, [user])

  const allLessons = useMemo(() => dbLessons, [dbLessons])

  // Per-IPA dynamic mastery (EMA); weakest link across confusable contrasts.
  const soundProgressMap = useMemo(() => {
    if (!progress) return new Map<string, number>()
    return buildSoundMasteryMap(progress)
  }, [progress])

  const completedCount = useMemo(() => {
    let n = 0; soundProgressMap.forEach((v) => { if (v >= MASTERY_DISPLAY_THRESHOLD) n++ }); return n
  }, [soundProgressMap])

  const inProgressCount = useMemo(() => {
    let n = 0; soundProgressMap.forEach((v) => { if (v > 0 && v < MASTERY_DISPLAY_THRESHOLD) n++ }); return n
  }, [soundProgressMap])

  const heroLesson = useHeroLesson(allLessons, null, soundProgressMap)

  return { allLessons, soundProgressMap, completedCount, inProgressCount, heroLesson, isLoading }
}
