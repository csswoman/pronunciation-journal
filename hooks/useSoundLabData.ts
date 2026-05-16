import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getAllDbLessons } from '@/lib/lesson-generator-db'
import { getAllProgress } from '@/lib/phoneme-practice/queries'
import { useHeroLesson } from './useHeroLesson'
import type { Lesson } from '@/lib/types'
import type { UserSoundProgressWithSound } from '@/lib/phoneme-practice/types'

export function useSoundLabData() {
  const { user } = useAuth()
  const [dbLessons, setDbLessons] = useState<Lesson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState<UserSoundProgressWithSound[] | null>(null)

  useEffect(() => {
    getAllDbLessons()
      .then(setDbLessons)
      .catch((err) => console.error('Failed to load DB lessons:', err))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    if (!user) { setProgress([]); return }
    getAllProgress(user.id)
      .then(setProgress)
      .catch(() => setProgress([]))
  }, [user])

  const allLessons = useMemo(() => dbLessons, [dbLessons])

  const soundProgressMap = useMemo(() => {
    const map = new Map<number, number>()
    if (!progress) return map
    progress.forEach((p) => {
      if (p.status === 'mastered') { map.set(p.sound_id, 100); return }
      if (p.total_attempts === 0) return
      map.set(p.sound_id, Math.max(0, Math.min(100, Math.round((p.correct_answers / p.total_attempts) * 100))))
    })
    return map
  }, [progress])

  const completedCount = useMemo(() => {
    let n = 0; soundProgressMap.forEach((v) => { if (v === 100) n++ }); return n
  }, [soundProgressMap])

  const inProgressCount = useMemo(() => {
    let n = 0; soundProgressMap.forEach((v) => { if (v > 0 && v < 100) n++ }); return n
  }, [soundProgressMap])

  const heroLesson = useHeroLesson(allLessons, progress, soundProgressMap)

  return { allLessons, soundProgressMap, completedCount, inProgressCount, heroLesson, isLoading }
}
