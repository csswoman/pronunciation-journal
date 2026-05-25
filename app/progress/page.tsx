import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getProgressPageData } from '@/lib/progress/queries'
import PageLayout from '@/components/layout/PageLayout'
import { GuestBanner } from '@/components/layout/stats/GuestBanner'
import { StreakCard } from '@/components/progress/StreakCard'
import { DailyCompletionRate } from '@/components/progress/DailyCompletionRate'
import { AccuracyTrend } from '@/components/progress/AccuracyTrend'
import { SkillProfileCard } from '@/components/progress/SkillProfileCard'
import { FluencyRadarCard } from '@/components/progress/FluencyRadarCard'

export default async function ProgressPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <PageLayout cardWrapper={false}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <PageIntro />
        {!user ? <GuestBanner /> : <ProgressDashboard userId={user.id} />}
      </div>
    </PageLayout>
  )
}

function PageIntro() {
  return (
    <header className="flex flex-col gap-2">
      <span className="text-tiny font-bold uppercase tracking-[0.24em] text-fg-subtle">
        Daily Wins
      </span>
      <h1 className="text-h2 font-display tracking-tight text-fg">
        Your progress
      </h1>
      <p className="max-w-xl text-sm text-fg-muted">
        Streak, consistency, and skill profile at a glance.
      </p>
    </header>
  )
}

async function ProgressDashboard({ userId }: { userId: string }) {
  const data = await getProgressPageData(userId)

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StreakCard streak={data.streak} />
        <DailyCompletionRate stats={data.dailyCompletion} />
        <AccuracyTrend stats={data.accuracy} />
      </div>

      <FluencyRadarCard scores={null} />

      <SkillProfileCard data={data.skillProfile} />

      <div className="flex justify-center pt-2">
        <Link
          href="/daily"
          className="rounded-2xl px-8 py-3 text-sm font-semibold transition-opacity hover:opacity-85"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          {data.streak.completedToday ? 'Practice more' : "Start today's daily"}
        </Link>
      </div>
    </div>
  )
}
