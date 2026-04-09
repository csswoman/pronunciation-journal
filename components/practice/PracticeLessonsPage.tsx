'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import LessonCard from '@/components/lesson/LessonCard'
import Container from '@/components/layout/Container'
import Section from '@/components/layout/Section'
import Grid from '@/components/layout/Grid'
import Card from '@/components/layout/Card'
import PageHeader from '@/components/layout/PageHeader'
import { getUserStats } from '@/lib/db'
import { getAllLessons } from '@/lib/lesson-generator'
import { getAllDbLessons } from '@/lib/lesson-generator-db'
import { getAllProgress } from '@/lib/phoneme-practice/queries'
import type { Lesson } from '@/lib/types'
import type { UserSoundProgressWithSound } from '@/lib/phoneme-practice/types'

type PracticeFilter = 'all' | 'basics' | 'vowels' | 'consonants' | 'diphthongs'

const FILTERS: { id: PracticeFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'basics', label: 'Basics' },
  { id: 'vowels', label: 'Vowels' },
  { id: 'consonants', label: 'Consonants' },
  { id: 'diphthongs', label: 'Diphthongs' },
]
const PAGE_SIZE = 6

export default function PracticeLessonsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [filter, setFilter] = useState<PracticeFilter>('all')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [dbLessons, setDbLessons] = useState<Lesson[]>([])
  const [isLoadingLessons, setIsLoadingLessons] = useState(true)
  const [progress, setProgress] = useState<UserSoundProgressWithSound[] | null>(null)
  const [dayStreak, setDayStreak] = useState(0)

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
  const recommendedLesson = allLessons[0]

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
  }, [filter, search])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const masteredCount = progress?.filter((p) => p.status === 'mastered').length ?? 0
  const totalAttempts = progress?.reduce((sum, p) => sum + p.total_attempts, 0) ?? 0
  const totalCorrect = progress?.reduce((sum, p) => sum + p.correct_answers, 0) ?? 0
  const accuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0
  const soundProgressMap = useMemo(() => {
    const map = new Map<number, number>()
    if (!progress) return map

    progress.forEach((p) => {
      let pct = 0
      if (p.status === 'mastered') pct = 100
      else if (p.status === 'practicing') pct = 60
      else if (p.status === 'available') pct = 20
      else if (p.status === 'locked') pct = 0
      map.set(p.sound_id, pct)
    })

    return map
  }, [progress])

  const handleResume = () => {
    if (!recommendedLesson) return
    router.push(recommendedLesson.href ?? `/practice/lesson/${recommendedLesson.id}`)
  }

  return (
    <div className="py-8 pb-24">
      <Container>
        {/* Header with PageHeader component */}
        <PageHeader
          badge="Sound Lab"
          title="Speak Better"
          subtitle="One Sound at a Time"
          description="Short drills. Clear feedback. Real progress."
          primaryCta={{
            label: "Continue",
            icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              </svg>
            ),
            onClick: () => recommendedLesson && router.push(recommendedLesson.href ?? `/practice/lesson/${recommendedLesson.id}`),
          }}
          illustration={
            <Image
              src="/illustrations/music.svg"
              alt="Music illustration"
              width={561}
              height={367}
              priority
              className="w-[300px] xl:w-[340px] h-auto"
            />
          }
        />
      </Container>

      <Container>
        {/* Stats Section */}
        <Section spacing="lg" className="mt-8" title="Your Progress">

          <Grid cols="4" gap="md" responsive={true}>
            <Card variant="stat">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: 'var(--btn-regular-bg)' }}>🔥</div>
              <div>
                <p className="text-4xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>{dayStreak}</p>
                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Day Streak</p>
              </div>
            </Card>
            <Card variant="stat">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: 'var(--btn-regular-bg)' }}>🎯</div>
              <div>
                <p className="text-4xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>{accuracy.toFixed(1)}%</p>
                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Avg. Accuracy</p>
              </div>
            </Card>
            <Card variant="stat">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: 'var(--btn-regular-bg)' }}>⭐</div>
              <div>
                <p className="text-4xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>{masteredCount}</p>
                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Mastered</p>
              </div>
            </Card>
            <Card variant="stat">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: 'var(--btn-regular-bg)' }}>🔁</div>
              <div>
                <p className="text-4xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>{totalAttempts}</p>
                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Total Attempts</p>
              </div>
            </Card>
          </Grid>
        </Section>
      </Container>

      <Container>
        <Section spacing="lg" className="mt-8">
          <Card className="p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)', borderColor: 'transparent' }}>
            <div>
              <p className="text-3xl font-bold text-white mb-2">Continue where you left off</p>
              <p className="text-white/90 text-xl">
                {recommendedLesson ? `${recommendedLesson.title} · ${Math.max(20, Math.min(90, Math.round(accuracy || 45)))}% complete` : 'Choose your next lesson to keep improving'}
              </p>
            </div>
            <button
              onClick={handleResume}
              disabled={!recommendedLesson}
              className="px-7 py-4 rounded-2xl font-semibold text-lg bg-white text-pink-500 hover:bg-pink-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
            >
              ▶ Resume
            </button>
          </Card>
        </Section>
      </Container>

      <Container>
        <Section spacing="lg" className="mt-8" title="Available Lessons">
          {/* Filters + Search */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex gap-3 flex-wrap">
              {FILTERS.map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setFilter(chip.id)}
                  className="px-5 py-2.5 rounded-full text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: filter === chip.id ? 'var(--primary)' : 'var(--surface)',
                    color: filter === chip.id ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  {chip.label}
                </button>
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

              {/* Pagination */}
              {filteredLessons.length > PAGE_SIZE && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
                  >
                    Previous
                  </button>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </Section>
      </Container>
    </div>
  )
}
