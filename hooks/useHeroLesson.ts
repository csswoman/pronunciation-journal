import { useEffect, useState } from 'react'
import { getAttemptsByLessonId, getRecentAttempts } from '@/lib/db'
import type { Lesson } from '@/lib/types'

interface HeroLessonState {
  lesson: Lesson | null
  progress: number
}

export function useHeroLesson(
  allLessons: Lesson[],
  _progress: unknown,
  soundProgressMap: Map<string | number, number>
) {
  const [heroLesson, setHeroLesson] = useState<HeroLessonState>({ lesson: null, progress: 0 })

  useEffect(() => {
    let isMounted = true

    async function load() {
      const latestAttempt = (await getRecentAttempts(1))[0]

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
  }, [allLessons, soundProgressMap])

  return heroLesson
}
