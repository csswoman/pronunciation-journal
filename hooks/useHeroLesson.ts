import { useEffect, useState } from 'react'
import { getAttemptsByLessonId, getRecentAttempts } from '@/lib/db'
import { ipaFromLessonTitle } from '@/lib/sound-lab/display'
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
          const soundProgress = lesson.id.startsWith('sound-')
            ? (soundProgressMap.get(ipaFromLessonTitle(lesson.title) ?? '') ?? 0)
            : await getAttemptsByLessonId(lesson.id).then((attempts) =>
                lesson.words.length === 0
                  ? attempts.length > 0 ? 100 : 0
                  : Math.round(
                      (new Set(attempts.map((a) => a.word.toLowerCase())).size /
                        lesson.words.length) * 100
                    )
              )
          if (!isMounted) return
          setHeroLesson({ lesson, progress: Math.max(0, Math.min(100, soundProgress)) })
          return
        }
      }

      const fallback = allLessons[0] ?? null
      const fallbackProgress = fallback?.id.startsWith('sound-')
        ? (soundProgressMap.get(ipaFromLessonTitle(fallback.title) ?? '') ?? 0)
        : 0
      if (!isMounted) return
      setHeroLesson({ lesson: fallback, progress: fallbackProgress })
    }

    void load()
    return () => { isMounted = false }
  }, [allLessons, soundProgressMap])

  return heroLesson
}
