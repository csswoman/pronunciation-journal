'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { SoundGrid } from '@/components/phoneme-practice/SoundGrid'
import { getAllProgress } from '@/lib/phoneme-practice/queries'
import type { UserSoundProgressWithSound } from '@/lib/phoneme-practice/types'

export default function DashboardPage() {
  const { user } = useAuth()
  const [progress, setProgress] = useState<UserSoundProgressWithSound[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getAllProgress(user.id)
      .then(setProgress)
      .catch(e => { console.error(e); setError('Failed to load progress.') })
  }, [user])

  if (error) {
    return (
      <div className="p-6 text-red-500">{error}</div>
    )
  }

  if (!progress) {
    return (
      <div className="p-6 animate-pulse text-gray-400">Loading…</div>
    )
  }

  const now = new Date()
  const dueCount = progress.filter(
    p => p.status !== 'locked' && p.next_review && new Date(p.next_review) <= now
  ).length
  const masteredCount = progress.filter(p => p.status === 'mastered').length
  const totalAttempts = progress.reduce((s, p) => s + p.total_attempts, 0)
  const totalCorrect = progress.reduce((s, p) => s + p.correct_answers, 0)
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Phoneme Practice</h1>
        {dueCount > 0 && (
          <Link
            href="/review"
            className="px-4 py-2 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-colors"
          >
            {dueCount} due for review
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{masteredCount}</div>
          <div className="text-xs text-gray-400 mt-1">Mastered</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-700">
          <div className="text-2xl font-bold" style={{color: 'var(--primary)'}}>{accuracy}%</div>
          <div className="text-xs text-gray-400 mt-1">Accuracy</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-700">
          <div className="text-2xl font-bold" style={{color: 'var(--admonitions-color-note)'}}>{totalAttempts}</div>
          <div className="text-xs text-gray-400 mt-1">Attempts</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-700 inline-block" /> Locked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded inline-block" style={{backgroundColor: 'var(--admonitions-color-note)', opacity: 0.3}} /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-200 dark:bg-amber-700 inline-block" /> Practicing
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded inline-block" style={{backgroundColor: 'var(--admonitions-color-tip)', opacity: 0.3}} /> Mastered
        </span>
      </div>

      {/* Sound grid */}
      <SoundGrid progressList={progress} />
    </div>
  )
}
