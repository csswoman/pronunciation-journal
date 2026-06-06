'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from "@/components/auth/AuthProvider"
import PageLayout from '@/components/layout/PageLayout'
import PageHeader from '@/components/layout/PageHeader'
import { getAllDbLessons } from '@/lib/db/lesson-generator'
import { getAllContrastProgress } from '@/lib/phoneme-practice/queries'
import type { Lesson } from '@/lib/types'
import type { UserContrastProgress } from '@/lib/phoneme-practice/types'
import LessonFilters from './LessonFilters'
import LessonGrid from './LessonGrid'
import { useLessonFilters } from '@/hooks/useLessonFilters'
import { useHeroLesson } from '@/hooks/useHeroLesson'

export default function PracticeLessonsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [dbLessons, setDbLessons] = useState<Lesson[]>([])
  const [isLoadingLessons, setIsLoadingLessons] = useState(true)
  const [progress, setProgress] = useState<UserContrastProgress[] | null>(null)

  useEffect(() => {
    getAllDbLessons()
      .then(setDbLessons)
      .catch((err) => console.error('Failed to load DB lessons:', err))
      .finally(() => setIsLoadingLessons(false))
  }, [])

  useEffect(() => {
    if (!user) { setProgress([]); return }
    getAllContrastProgress(user.id)
      .then(setProgress)
      .catch((err) => { console.error('Failed to load progress:', err); setProgress([]) })
  }, [user])

  const allLessons = useMemo(() => dbLessons, [dbLessons])

  const soundProgressMap = useMemo(() => {
    const map = new Map<string, number>()
    if (!progress) return map
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
    let n = 0
    soundProgressMap.forEach((v) => { if (v >= 85) n++ })
    return n
  }, [soundProgressMap])

  const inProgressCount = useMemo(() => {
    let n = 0
    soundProgressMap.forEach((v) => { if (v > 0 && v < 85) n++ })
    return n
  }, [soundProgressMap])

  const heroLesson = useHeroLesson(allLessons, progress, soundProgressMap)

  const {
    filter, search, currentPage, totalPages, gridKey,
    filteredLessons, paginatedLessons,
    setFilter, setSearch, handlePageChange,
  } = useLessonFilters(allLessons)

  const heroPhoneme = useMemo(() => {
    const title = heroLesson.lesson?.title ?? ''
    const match = title.match(/\/([^/]+)\//)
    return match ? `/${match[1]}/` : null
  }, [heroLesson.lesson?.title])

  const heroLessonName = useMemo(() => {
    const title = heroLesson.lesson?.title ?? 'Basic Greetings'
    return title.replace(/^\/[^/]+\/\s*[—–-]\s*/, '')
  }, [heroLesson.lesson?.title])

  const handleResume = () => {
    if (!heroLesson.lesson?.href) return
    router.push(heroLesson.lesson.href)
  }

  const handleClearFilters = () => {
    setFilter('all')
    setSearch('')
  }

  return (
    <PageLayout
      contentStyle={{ paddingTop: "var(--space-5)", paddingBottom: "3.5rem" }}
      hero={
        <PageHeader
          variant="hero-compact"
          badge="Sound Lab"
          title="Speak Better"
          subtitle="One Sound at a Time"
          progress={heroLesson.progress}
          lessonTitle={heroLessonName}
          phonemeLabel={heroPhoneme ?? undefined}
          onContinue={handleResume}
        />
      }
    >
      <LessonFilters
        filter={filter}
        search={search}
        resultCount={filteredLessons.length}
        statLine={`${completedCount} completed · ${inProgressCount} in progress`}
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
        onClearFilters={handleClearFilters}
      />
    </PageLayout>
  )
}
