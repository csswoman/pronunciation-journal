'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { PracticeHeader } from '@/components/practice/PracticeHeader'
import { PracticeLedger } from '@/components/practice/PracticeLedger'
import { ExpertInsightCard } from '@/components/practice/ExpertInsightCard'
import { getAllProgress, getAllSounds } from '@/lib/phoneme-practice/queries'
import type { UserSoundProgressWithSound, Sound } from '@/lib/phoneme-practice/types'

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [progress, setProgress] = useState<UserSoundProgressWithSound[] | null>(null)
  const [sounds, setSounds] = useState<Sound[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    Promise.all([
      getAllProgress(user.id),
      getAllSounds(),
    ])
      .then(([progressData, soundsData]) => {
        setProgress(progressData)
        setSounds(soundsData)
      })
      .catch(e => { console.error(e); setError('Failed to load progress.') })
  }, [user])

  if (error) {
    return (
      <div className="p-6 text-red-500">{error}</div>
    )
  }

  if (!progress || !sounds) {
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
  const accuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0

  // Build sound statuses for ledger
  const soundStatuses: Record<number, 'locked' | 'available' | 'practicing' | 'mastered'> = {}
  progress.forEach(p => {
    soundStatuses[p.sound_id] = (p.status as 'locked' | 'available' | 'practicing' | 'mastered') || 'available'
  })

  // Find a sound that needs review for expert insight
  const soundNeedingReview = progress.find(p => p.status !== 'locked' && p.next_review && new Date(p.next_review) <= now)
  const soundProgress = soundNeedingReview
    ? (soundNeedingReview.correct_answers / Math.max(soundNeedingReview.total_attempts, 1)) * 100
    : 85

  const handleSelectSound = (soundId: number) => {
    router.push(`/practice/${soundId}`)
  }

  const handleStartReview = () => {
    router.push('/review')
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header with stats */}
      <PracticeHeader
        masteredCount={masteredCount}
        accuracy={accuracy}
        totalAttempts={totalAttempts}
        dueForReview={dueCount}
      />

      {/* Practice Ledger */}
      <PracticeLedger
        sounds={sounds}
        onSelectSound={handleSelectSound}
        soundStatuses={soundStatuses}
      />

      {/* Expert Insight Card */}
      {soundNeedingReview && soundNeedingReview.sounds ? (
        <ExpertInsightCard
          title={`Master the ${soundNeedingReview.sounds.ipa} in 15 Minutes`}
          description={`Your accuracy with ${soundNeedingReview.sounds.ipa} has dipped 5% this week. A quick review of the aspiration techniques could bridge the gap.`}
          soundIpa={soundNeedingReview.sounds.ipa}
          currentProgress={Math.round(soundProgress)}
          durationMinutes={15}
          onStartReview={handleStartReview}
        />
      ) : null}
    </div>
  )
}
