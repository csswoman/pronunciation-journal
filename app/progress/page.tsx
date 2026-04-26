'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useAuth } from "@/components/auth/AuthProvider"
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { getUserStats } from '@/lib/db'
import Section from '@/components/layout/Section'
import PageHeader from '@/components/layout/PageHeader'
import PageLayout from '@/components/layout/PageLayout'
import StatsSection from '@/components/layout/StatsSection'
import AchievementsSection from '@/components/progress/AchievementsSection'
import JourneyToFluiditySection from '@/components/progress/JourneyToFluiditySection'
import { useLiveTodayProgress, useLiveProgressHistory } from '@/store/useLiveData'
import type { UserStats } from '@/lib/types'

export default function ProgressPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // Live Dexie subscriptions — auto-update when practice data changes
  const todayProgress = useLiveTodayProgress()
  const progressHistory = useLiveProgressHistory(7)

  useEffect(() => {
    if (!user) {
      setStatsLoading(false)
      return
    }

    const load = async () => {
      setStatsLoading(true)
      const supabase = getSupabaseBrowserClient()

      // Load Dexie stats and Supabase deck stats in parallel
      const [localStats, deckResult, deckEntryResult, dueResult] = await Promise.all([
        getUserStats(),
        supabase.from("decks").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("deck_entries").select("entry_id, decks!inner(user_id)").eq("decks.user_id", user.id),
        supabase
          .from("user_sound_progress")
          .select("id")
          .eq("user_id", user.id)
          .lte("next_review", new Date().toISOString().split("T")[0])
          .in("status", ["learning", "review"]),
      ])

      setStats({
        ...localStats,
        totalDecks: deckResult.count ?? 0,
        totalDeckWords: deckEntryResult.data?.length ?? 0,
        deckWordsDueToday: dueResult.data?.length ?? 0,
      })
      setStatsLoading(false)
    }

    load()
  }, [user])

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
            onClick: () => window.location.href = '/practice',
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
          todayProgress={todayProgress ?? null}
          progressHistory={progressHistory}
          userId={user?.id}
          loading={statsLoading}
        />
        {user && (
          <>
            <AchievementsSection />
            <JourneyToFluiditySection />
          </>
        )}
      </Section>
    </PageLayout>
  )
}
