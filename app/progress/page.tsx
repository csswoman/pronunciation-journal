'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useAuth } from '@/components/AuthProvider'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import Section from '@/components/layout/Section'
import PageHeader from '@/components/layout/PageHeader'
import PageLayout from '@/components/layout/PageLayout'
import StatsSection from '@/components/layout/StatsSection'
import AchievementsSection from '@/components/progress/AchievementsSection'
import JourneyToFluiditySection from '@/components/progress/JourneyToFluiditySection'
import type { UserStats, DailyProgress } from '@/lib/types'

export default function ProgressPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [todayProgress, setTodayProgress] = useState<DailyProgress | null>(null)
  const [progressHistory, setProgressHistory] = useState<DailyProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchDeckStats = async () => {
      const supabase = getSupabaseBrowserClient()

      // Total decks for user
      const { count: deckCount } = await supabase
        .from("decks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

      // Total words across all decks (via join)
      const { data: deckEntryData } = await supabase
        .from("deck_entries")
        .select("entry_id, decks!inner(user_id)")
        .eq("decks.user_id", user.id)

      // Words due today: sounds whose next_review <= today and status is learning/review
      const today = new Date().toISOString().split("T")[0]
      const { data: dueData } = await supabase
        .from("user_sound_progress")
        .select("id")
        .eq("user_id", user.id)
        .lte("next_review", today)
        .in("status", ["learning", "review"])

      return {
        totalDecks: deckCount ?? 0,
        totalDeckWords: deckEntryData?.length ?? 0,
        deckWordsDueToday: dueData?.length ?? 0,
      }
    }

    // TODO: Fetch stats from API/Supabase
    // Mock data for now, with deck stats fetched
    fetchDeckStats().then(deckStats => {
      setStats({
        currentStreak: 14,
        longestStreak: 21,
        totalXP: 2450,
        totalWords: 156,
        totalAttempts: 892,
        averageAccuracy: 87,
        lastStudyDate: new Date().toISOString(),
        ...deckStats,
      })
    })

    setTodayProgress({
      date: new Date().toISOString().split('T')[0],
      totalAttempts: 12,
      correctAttempts: 10,
      averageAccuracy: 89,
      xp: 150,
      wordsStudied: ['beautiful', 'pronunciation', 'fluency'],
    })

    setProgressHistory([
      { date: '2026-03-29', totalAttempts: 8, correctAttempts: 7, averageAccuracy: 88, xp: 120, wordsStudied: [] },
      { date: '2026-03-30', totalAttempts: 10, correctAttempts: 9, averageAccuracy: 90, xp: 140, wordsStudied: [] },
      { date: '2026-03-31', totalAttempts: 0, correctAttempts: 0, averageAccuracy: 0, xp: 0, wordsStudied: [] },
      { date: '2026-04-01', totalAttempts: 15, correctAttempts: 13, averageAccuracy: 87, xp: 180, wordsStudied: [] },
      { date: '2026-04-02', totalAttempts: 12, correctAttempts: 11, averageAccuracy: 92, xp: 160, wordsStudied: [] },
      { date: '2026-04-03', totalAttempts: 9, correctAttempts: 8, averageAccuracy: 85, xp: 130, wordsStudied: [] },
      { date: '2026-04-04', totalAttempts: 12, correctAttempts: 10, averageAccuracy: 89, xp: 150, wordsStudied: [] },
    ])

    setLoading(false)
  }, [user])

  if (loading) {
    return (
      <div className="p-6 animate-pulse text-gray-400">Cargando…</div>
    )
  }

  return (
    <PageLayout
      hero={
        <PageHeader
          badge="Daily Wins"
          title="Your Progress"
          subtitle="Keep Climbing"
          description="See your streak, points, and momentum at a glance."
          primaryCta={{
            label: 'Keep Going',
            onClick: () => console.log('Navigate to level'),
          }}
          illustration={
            <Image
              src="/illustrations/xp-points.svg"
              alt="XP points illustration"
              width={560}
              height={360}
              priority
            />
          }
        />
      }
    >
      <Section spacing="lg">
        <StatsSection
          stats={stats}
          todayProgress={todayProgress}
          progressHistory={progressHistory}
          userId={user?.id}
        />
        <AchievementsSection />
        <JourneyToFluiditySection />
      </Section>
    </PageLayout>
  )
}
