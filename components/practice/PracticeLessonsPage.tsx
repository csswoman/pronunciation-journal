'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from "@/components/auth/AuthProvider"
import PageLayout from '@/components/layout/PageLayout'
import PageHeader from '@/components/layout/PageHeader'
import { getUserStats } from '@/lib/db'
import { getAllDbLessons } from '@/lib/db/lesson-generator'
import { getAllContrastProgress } from '@/lib/phoneme-practice/queries'
import type { Lesson } from '@/lib/types'
import type { UserContrastProgress } from '@/lib/phoneme-practice/types'
import LessonFilters from './LessonFilters'
import LessonGrid from './LessonGrid'
import { useLessonFilters } from '@/hooks/useLessonFilters'
import { useHeroLesson } from '@/hooks/useHeroLesson'

const statCard = {
  background: "var(--surface-raised)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-lg)",
  padding: "var(--space-4) var(--space-5)",
  display: "flex",
  flexDirection: "column" as const,
  gap: "var(--space-1)",
}

export default function PracticeLessonsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [dbLessons, setDbLessons] = useState<Lesson[]>([])
  const [isLoadingLessons, setIsLoadingLessons] = useState(true)
  const [progress, setProgress] = useState<UserContrastProgress[] | null>(null)
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

  return (
    <PageLayout
      contentStyle={{ padding: "var(--space-6) var(--space-8) 3.5rem" }}
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
      {/* Stats row */}
      <div
        className="grid grid-cols-4"
        style={{ gap: "var(--space-4)", marginBottom: "var(--space-8)" }}
      >
        <div style={statCard}>
          <span style={{ font: "var(--font-h3)", color: "var(--text-primary)", lineHeight: 1 }}>
            {allLessons.length}
          </span>
          <span style={{ font: "var(--font-tiny)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Exercises
          </span>
        </div>
        <div style={statCard}>
          <span style={{ font: "var(--font-h3)", color: "var(--text-primary)", lineHeight: 1 }}>
            <span>{currentPage}</span>
            <span style={{ color: "var(--primary)" }}>/{totalPages}</span>
          </span>
          <span style={{ font: "var(--font-tiny)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Page
          </span>
        </div>
        <div style={statCard}>
          <span style={{ font: "var(--font-h3)", color: "var(--primary)", lineHeight: 1 }}>
            {completedCount}
          </span>
          <span style={{ font: "var(--font-tiny)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Completed
          </span>
        </div>
        <div style={statCard}>
          <span style={{ font: "var(--font-h3)", color: "var(--warning)", lineHeight: 1 }}>
            {inProgressCount}
          </span>
          <span style={{ font: "var(--font-tiny)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            In Progress
          </span>
        </div>
      </div>

      {/* Lessons section */}
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
    </PageLayout>
  )
}
