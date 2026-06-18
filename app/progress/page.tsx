import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getProgressPageData } from '@/lib/progress/queries'
import PageLayout from '@/components/layout/PageLayout'
import { GuestBanner } from '@/components/layout/stats/GuestBanner'
import { StreakCard } from '@/components/progress/StreakCard'
import { DailyCompletionRate } from '@/components/progress/DailyCompletionRate'
import { AccuracyTrend } from '@/components/progress/AccuracyTrend'
import { FluencyRadarCard } from '@/components/progress/FluencyRadarCard'
import { SkillProfileCard } from '@/components/progress/SkillProfileCard'
import { ThisWeekCard } from '@/components/progress/ThisWeekCard'
import { ActivityHistoryCard } from '@/components/progress/ActivityHistoryCard'

export default async function ProgressPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <PageLayout cardWrapper={false}>
      <div className="relative z-[1] flex w-full flex-col gap-7 px-6 pb-18">
        <PageIntro />
        {!user ? <GuestBanner /> : <ProgressDashboard userId={user.id} />}
      </div>
    </PageLayout>
  )
}

function PageIntro() {
  return (
    <header className="flex flex-col gap-2 pt-2">
      <span className="text-tiny font-semibold uppercase tracking-[0.18em] text-fg-subtle">
        Daily wins
      </span>
      <h1 className="font-display text-h2 font-normal leading-tight tracking-[-0.02em] text-fg">
        Your progress
      </h1>
      <p className="max-w-xl text-body-sm text-fg-muted">
        Streak, consistency, and skill profile at a glance — calculated from what you practice.
      </p>
    </header>
  )
}

async function ProgressDashboard({ userId }: { userId: string }) {
  const data = await getProgressPageData(userId)

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 lg:grid-cols-3">
        <StreakCard streak={data.streak} />
        <DailyCompletionRate stats={data.dailyCompletion} />
        <AccuracyTrend stats={data.accuracy} />
      </div>

      <FluencyRadarCard
        scores={data.fluencyProfile.scores}
        comparisonLabel={data.fluencyProfile.comparisonLabel}
      />

      <SkillProfileCard data={data.skillProfile} coach={data.coachInsights} />

      <ActivityHistoryCard sessions={data.recentSessions} />

      <ThisWeekCard stats={data.weeklySummary} />

      <div className="flex justify-center pt-3">
        <Link
          href="/daily"
          className="rounded-full px-8 py-3.5 text-base font-bold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
          style={{ background: 'var(--primary)' }}
        >
          {data.streak.completedToday ? '▶ Practice more' : "▶ Start today's daily"}
        </Link>
      </div>
    </div>
  )
}
