import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getAllDbLessons } from '@/lib/db/lesson-generator'
import { getAllContrastProgress } from '@/lib/phoneme-practice/queries'
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

  // Build a per-IPA accuracy map from contrast progress.
  // A sound is "mastered" when all its contrast rows have >= 85% accuracy.
  const soundProgressMap = useMemo(() => {
    const map = new Map<string, number>()
    if (!progress) return map
    // Group accuracy by first IPA of each contrast
    const byIpa = new Map<string, { correct: number; total: number }>()
    for (const p of progress) {
      const [ipaA] = p.contrast_id.split('|')
      const prev = byIpa.get(ipaA) ?? { correct: 0, total: 0 }
      byIpa.set(ipaA, { correct: prev.correct + p.correct_answers, total: prev.total + p.total_attempts })
    }
    for (const [ipa, { correct, total }] of byIpa) {
      if (total === 0) continue
      map.set(ipa, Math.max(0, Math.min(100, Math.round((correct / total) * 100))))
    }
    return map
  }, [progress])

  const completedCount = useMemo(() => {
    let n = 0; soundProgressMap.forEach((v) => { if (v >= 85) n++ }); return n
  }, [soundProgressMap])

  const inProgressCount = useMemo(() => {
    let n = 0; soundProgressMap.forEach((v) => { if (v > 0 && v < 85) n++ }); return n
  }, [soundProgressMap])

  const heroLesson = useHeroLesson(allLessons, null, soundProgressMap)

  return { allLessons, soundProgressMap, completedCount, inProgressCount, heroLesson, isLoading }
}
