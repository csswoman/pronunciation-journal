'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import Section from '@/components/layout/Section'
import PageLayout from '@/components/layout/PageLayout'
import PageHeader from '@/components/layout/PageHeader'
import { getUserStats } from '@/lib/db'
import { getAllLessons } from '@/lib/lesson-generator'
import { getAllDbLessons } from '@/lib/lesson-generator-db'
import { getAllProgress } from '@/lib/phoneme-practice/queries'
import type { Lesson } from '@/lib/types'
import type { UserSoundProgressWithSound } from '@/lib/phoneme-practice/types'
import LessonFilters from './LessonFilters'
import LessonGrid from './LessonGrid'
import { useLessonFilters } from '@/hooks/useLessonFilters'
import { useHeroLesson } from '@/hooks/useHeroLesson'

export default function PracticeLessonsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [dbLessons, setDbLessons] = useState<Lesson[]>([])
  const [isLoadingLessons, setIsLoadingLessons] = useState(true)
  const [progress, setProgress] = useState<UserSoundProgressWithSound[] | null>(null)
  const [, setDayStreak] = useState(0)

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
    if (!user) { setProgress([]); return }
    getAllProgress(user.id)
      .then(setProgress)
      .catch((err) => { console.error('Failed to load progress:', err); setProgress([]) })
  }, [user])

  const allLessons = useMemo(() => [...getAllLessons(), ...dbLessons], [dbLessons])

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

  const heroLesson = useHeroLesson(allLessons, progress, soundProgressMap)

  const {
    filter, search, currentPage, totalPages, gridKey,
    filteredLessons, paginatedLessons,
    setFilter, setSearch, handlePageChange,
  } = useLessonFilters(allLessons)

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
              width={560}
              height={360}
              priority
            />
          }
        />
      }
    >
      <Section spacing="lg" title="Available Lessons">
        <LessonFilters
          filter={filter}
          search={search}
          resultCount={filteredLessons.length}
          onFilterChange={setFilter}
          onSearchChange={setSearch}
        />
        <LessonGrid
          lessons={paginatedLessons}
          totalCount={filteredLessons.length}
          currentPage={currentPage}
          totalPages={totalPages}
          gridKey={gridKey}
          soundProgressMap={soundProgressMap}
          isLoading={isLoadingLessons}
          onPageChange={handlePageChange}
        />
      </Section>
    </PageLayout>
  )
}
