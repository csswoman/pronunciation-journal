'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import LessonCard from '@/components/lesson/LessonCard'
import Section from '@/components/layout/Section'
import PageLayout from '@/components/layout/PageLayout'
import Grid from '@/components/layout/Grid'
import Card from '@/components/layout/Card'
import PageHeader from '@/components/layout/PageHeader'
import { getAttemptsByLessonId, getRecentAttempts, getUserStats } from '@/lib/db'
import { getAllLessons } from '@/lib/lesson-generator'
import { getAllDbLessons } from '@/lib/lesson-generator-db'
import { getAllProgress } from '@/lib/phoneme-practice/queries'
import type { Lesson } from '@/lib/types'
import type { UserSoundProgressWithSound } from '@/lib/phoneme-practice/types'
import Button from '@/components/ui/Button'

type PracticeFilter = 'all' | 'basics' | 'vowels' | 'consonants' | 'diphthongs'

const FILTERS: { id: PracticeFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'basics', label: 'Basics' },
  { id: 'vowels', label: 'Vowels' },
  { id: 'consonants', label: 'Consonants' },
  { id: 'diphthongs', label: 'Diphthongs' },
]
const PAGE_SIZE = 6

interface HeroLessonState {
  lesson: Lesson | null
  progress: number
}

function getSoundLessonProgress(progressEntry: UserSoundProgressWithSound): number {
  if (progressEntry.status === 'mastered') return 100
  if (progressEntry.total_attempts === 0) return 0

  return Math.max(
    0,
    Math.min(100, Math.round((progressEntry.correct_answers / progressEntry.total_attempts) * 100))
  )
}

export default function PracticeLessonsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [filter, setFilter] = useState<PracticeFilter>('all')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [dbLessons, setDbLessons] = useState<Lesson[]>([])
  const [isLoadingLessons, setIsLoadingLessons] = useState(true)
  const [progress, setProgress] = useState<UserSoundProgressWithSound[] | null>(null)
  const [, setDayStreak] = useState(0)
  const [heroLesson, setHeroLesson] = useState<HeroLessonState>({ lesson: null, progress: 0 })
  const [gridKey, setGridKey] = useState(0)

  useEffect(() => {
    getAllDbLessons()
      .then(setDbLessons)
      .catch((err) => console.error('Failed to load DB lessons:', err))
      .finally(() => setIsLoadingLessons(false))

    getUserStats()
      .then((stats) => setDayStreak(stats.currentStreak ?? 0))
      .catch((err) => console.error('Failed to load user stats:', err))
  }, [])

  useEffect(() => {
    if (!user) {
      setProgress([])
      return
    }

    getAllProgress(user.id)
      .then(setProgress)
      .catch((err) => {
        console.error('Failed to load progress:', err)
        setProgress([])
      })
  }, [user])

  const allLessons = useMemo(() => [...getAllLessons(), ...dbLessons], [dbLessons])

  const filteredLessons = useMemo(() => {
    const categorize = (lesson: Lesson): PracticeFilter[] => {
      const title = lesson.title.toLowerCase()
      const categories: PracticeFilter[] = ['all']

      if (lesson.difficulty === 'easy' || lesson.category === 'basics') {
        categories.push('basics')
      }
      if (title.includes('diphthong')) {
        categories.push('diphthongs')
      }
      if (title.includes('vowel') || lesson.category === 'vowels') {
        categories.push('vowels')
      }
      if (title.includes('consonant') || lesson.category === 'consonants') {
        categories.push('consonants')
      }
      if (title.includes('/')) {
        categories.push('vowels', 'consonants')
      }

      return categories
    }

    const query = search.trim().toLowerCase()
    return allLessons.filter((lesson) => {
      if (!categorize(lesson).includes(filter)) return false
      if (!query) return true
      const title = lesson.title.toLowerCase()
      const description = lesson.description.toLowerCase()
      return title.includes(query) || description.includes(query)
    })
  }, [allLessons, filter, search])

  const totalPages = Math.max(1, Math.ceil(filteredLessons.length / PAGE_SIZE))
  const paginatedLessons = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredLessons.slice(start, start + PAGE_SIZE)
  }, [filteredLessons, currentPage])

  useEffect(() => {
    setCurrentPage(1)
    setGridKey((k) => k + 1)
  }, [filter, search])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const soundProgressMap = useMemo(() => {
    const map = new Map<number, number>()
    if (!progress) return map

    progress.forEach((p) => {
      const pct = getSoundLessonProgress(p)
      map.set(p.sound_id, pct)
    })

    return map
  }, [progress])

  useEffect(() => {
    let isMounted = true

    async function loadHeroLesson() {
      const latestSoundProgress = (progress ?? [])
        .filter((entry) => entry.last_practiced)
        .sort((a, b) => {
          const first = new Date(a.last_practiced ?? 0).getTime()
          const second = new Date(b.last_practiced ?? 0).getTime()
          return second - first
        })[0]

      const latestAttempt = (await getRecentAttempts(1))[0]
      const latestSoundTime = latestSoundProgress?.last_practiced
        ? new Date(latestSoundProgress.last_practiced).getTime()
        : 0
      const latestAttemptTime = latestAttempt?.timestamp
        ? new Date(latestAttempt.timestamp).getTime()
        : 0

      if (latestSoundTime >= latestAttemptTime && latestSoundProgress) {
        const soundLessonId = `sound-${latestSoundProgress.sound_id}`
        const lesson = allLessons.find((entry) => entry.id === soundLessonId) ?? null

        if (!isMounted) return

        setHeroLesson({
          lesson,
          progress: getSoundLessonProgress(latestSoundProgress),
        })
        return
      }

      if (latestAttempt) {
        const lesson = allLessons.find((entry) => entry.id === latestAttempt.lessonId) ?? null

        if (lesson) {
          const lessonAttempts = await getAttemptsByLessonId(lesson.id)
          const progressValue =
            lesson.words.length === 0
              ? lessonAttempts.length > 0
                ? 100
                : 0
              : Math.round(
                  (new Set(lessonAttempts.map((attempt) => attempt.word.toLowerCase())).size /
                    lesson.words.length) *
                    100
                )

          if (!isMounted) return

          setHeroLesson({
            lesson,
            progress: Math.max(0, Math.min(100, progressValue)),
          })
          return
        }
      }

      const fallbackLesson = allLessons[0] ?? null
      const fallbackProgress =
        fallbackLesson && fallbackLesson.id.startsWith('sound-')
          ? soundProgressMap.get(Number(fallbackLesson.id.replace('sound-', ''))) ?? 0
          : 0

      if (!isMounted) return

      setHeroLesson({
        lesson: fallbackLesson,
        progress: fallbackProgress,
      })
    }

    void loadHeroLesson()

    return () => {
      isMounted = false
    }
  }, [allLessons, progress, soundProgressMap])

  const handleResume = () => {
    if (!heroLesson.lesson) return
    router.push(heroLesson.lesson.href ?? `/practice/lesson/${heroLesson.lesson.id}`)
  }

  return (
    <PageLayout
      hero={
        <PageHeader
          badge="Sound Lab"
          title="Speak Better"
          subtitle="One Sound at a Time"
          description="Short drills. Clear feedback. Real progress."
          progress={heroLesson.progress}
          lessonTitle={heroLesson.lesson?.title ?? 'Basic Greetings'}
          onContinue={handleResume}
          illustration={
            <Image
              src="/illustrations/music.svg"
              alt="Music illustration"
              width={561}
              height={367}
              priority
              className="h-auto w-full max-w-[300px] xl:max-w-[340px]"
            />
          }
        />
      }
    >
      <Section spacing="lg" title="Available Lessons">
          {/* Filters + Search */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex gap-3 flex-wrap">
              {FILTERS.map((chip) => (
                <Button
                  key={chip.id}
                  type="button"
                  onClick={() => setFilter(chip.id)}
                  variant="chip"
                  size="sm"
                  selected={filter === chip.id}
                  className="rounded-full px-5 py-2.5 text-sm font-semibold"
                >
                  {chip.label}
                </Button>
              ))}
            </div>

            <div className="w-full lg:w-72">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search lessons..."
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--line-divider)',
                  backgroundColor: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          <p className="text-sm font-semibold tracking-[0.12em] uppercase mb-6" style={{ color: 'var(--text-secondary)' }}>
            {filteredLessons.length} exercises available
          </p>

          {/* Loading State */}
          {isLoadingLessons ? (
            <Card className="p-8 text-center">
              <div className="text-sm animate-pulse" style={{ color: 'var(--text-secondary)' }}>
                Loading lessons...
              </div>
            </Card>
          ) : (
            <>
              {/* Lessons Grid */}
              <div
                key={gridKey}
                className="animate-grid-in"
              >
                <Grid cols="3" gap="lg" responsive={true}>
                  {paginatedLessons.map((lesson) => (
                    <LessonCard
                      key={lesson.id}
                      lesson={lesson}
                      progressPct={
                        lesson.id.startsWith('sound-')
                          ? soundProgressMap.get(Number(lesson.id.replace('sound-', '')))
                          : undefined
                      }
                    />
                  ))}
                </Grid>
              </div>

              {/* Pagination */}
              {filteredLessons.length > PAGE_SIZE && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <Button
                    type="button"
                    onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); setGridKey((k) => k + 1) }}
                    disabled={currentPage === 1}
                    variant="secondary"
                    size="sm"
                    className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Previous
                  </Button>
                  <span className="text-sm tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    type="button"
                    onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); setGridKey((k) => k + 1) }}
                    disabled={currentPage === totalPages}
                    variant="secondary"
                    size="sm"
                    className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </Section>
    </PageLayout>
  )
}
