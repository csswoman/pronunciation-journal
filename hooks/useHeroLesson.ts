import { useEffect, useState } from 'react'
import { getAttemptsByLessonId, getRecentAttempts } from '@/lib/db'
import type { Lesson } from '@/lib/types'
import type { UserSoundProgressWithSound } from '@/lib/phoneme-practice/types'

interface HeroLessonState {
  lesson: Lesson | null
  progress: number
}

function getSoundLessonProgress(entry: UserSoundProgressWithSound): number {
  if (entry.status === 'mastered') return 100
  if (entry.total_attempts === 0) return 0
  return Math.max(0, Math.min(100, Math.round((entry.correct_answers / entry.total_attempts) * 100)))
}

export function useHeroLesson(
  allLessons: Lesson[],
  progress: UserSoundProgressWithSound[] | null,
  soundProgressMap: Map<number, number>
) {
  const [heroLesson, setHeroLesson] = useState<HeroLessonState>({ lesson: null, progress: 0 })

  useEffect(() => {
    let isMounted = true

    async function load() {
      const latestSoundProgress = (progress ?? [])
        .filter((e) => e.last_practiced)
        .sort((a, b) => {
          const ta = new Date(a.last_practiced ?? 0).getTime()
          const tb = new Date(b.last_practiced ?? 0).getTime()
          return tb - ta
        })[0]

      const latestAttempt = (await getRecentAttempts(1))[0]
      const latestSoundTime = latestSoundProgress?.last_practiced
        ? new Date(latestSoundProgress.last_practiced).getTime()
        : 0
      const latestAttemptTime = latestAttempt?.timestamp
        ? new Date(latestAttempt.timestamp).getTime()
        : 0

      if (latestSoundTime >= latestAttemptTime && latestSoundProgress) {
        const lesson =
          allLessons.find((e) => e.id === `sound-${latestSoundProgress.sound_id}`) ?? null
        if (!isMounted) return
        setHeroLesson({ lesson, progress: getSoundLessonProgress(latestSoundProgress) })
        return
      }

      if (latestAttempt) {
        const lesson = allLessons.find((e) => e.id === latestAttempt.lessonId) ?? null
        if (lesson) {
          const lessonAttempts = await getAttemptsByLessonId(lesson.id)
          const progressValue =
            lesson.words.length === 0
              ? lessonAttempts.length > 0
                ? 100
                : 0
              : Math.round(
                  (new Set(lessonAttempts.map((a) => a.word.toLowerCase())).size /
                    lesson.words.length) *
                    100
                )
          if (!isMounted) return
          setHeroLesson({ lesson, progress: Math.max(0, Math.min(100, progressValue)) })
          return
        }
      }

      const fallback = allLessons[0] ?? null
      const fallbackProgress = fallback?.id.startsWith('sound-')
        ? (soundProgressMap.get(Number(fallback.id.replace('sound-', ''))) ?? 0)
        : 0
      if (!isMounted) return
      setHeroLesson({ lesson: fallback, progress: fallbackProgress })
    }

    void load()
    return () => { isMounted = false }
  }, [allLessons, progress, soundProgressMap])

  return heroLesson
}
