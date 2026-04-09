'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Settings } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import LessonCard from '@/components/lesson/LessonCard'
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
    router.push(recommendedLesson.href ?? `/lesson/${recommendedLesson.id}`)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24 space-y-8">
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Phoneme Practice
            </h1>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Train your ear and mouth one sound at a time
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-3 rounded-xl border hover:opacity-80 transition-opacity" style={{ borderColor: 'var(--line-divider)', backgroundColor: 'var(--card-bg)' }} title="Notifications">
              <Bell size={18} style={{ color: 'var(--text-secondary)' }} />
            </button>
            <button className="p-3 rounded-xl border hover:opacity-80 transition-opacity" style={{ borderColor: 'var(--line-divider)', backgroundColor: 'var(--card-bg)' }} title="Settings">
              <Settings size={18} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--line-divider)' }}>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: 'var(--btn-regular-bg)' }}>🔥</div>
            <div>
              <p className="text-4xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>{dayStreak}</p>
              <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Day Streak</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--line-divider)' }}>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: 'var(--btn-regular-bg)' }}>🎯</div>
            <div>
              <p className="text-4xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>{accuracy.toFixed(1)}%</p>
              <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Avg. Accuracy</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--line-divider)' }}>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: 'var(--btn-regular-bg)' }}>⭐</div>
            <div>
              <p className="text-4xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>{masteredCount}</p>
              <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Mastered</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--line-divider)' }}>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: 'var(--btn-regular-bg)' }}>🔁</div>
            <div>
              <p className="text-4xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>{totalAttempts}</p>
              <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Total Attempts</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)' }}>
        <div>
          <p className="text-3xl font-bold text-white mb-2">Continue where you left off</p>
          <p className="text-white/90 text-xl">
            {recommendedLesson ? `${recommendedLesson.title} · ${Math.max(20, Math.min(90, Math.round(accuracy || 45)))}% complete` : 'Choose your next lesson to keep improving'}
          </p>
        </div>
        <button
          onClick={handleResume}
          disabled={!recommendedLesson}
          className="px-7 py-4 rounded-2xl font-semibold text-lg bg-white text-pink-500 hover:bg-pink-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          ▶ Resume
        </button>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
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

        <p className="text-sm font-semibold tracking-[0.12em] uppercase" style={{ color: 'var(--text-secondary)' }}>
          {filteredLessons.length} exercises available
        </p>

        {isLoadingLessons ? (
          <div className="text-sm animate-pulse" style={{ color: 'var(--text-secondary)' }}>
            Loading lessons...
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            </div>

            {filteredLessons.length > PAGE_SIZE && (
              <div className="flex items-center justify-center gap-3">
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
          </div>
        )}
      </section>
    </div>
  )
}
