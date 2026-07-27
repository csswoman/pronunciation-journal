import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getProgressPageData } from '@/lib/progress/queries'
import { cn } from '@/lib/cn'
import PageLayout from '@/components/layout/PageLayout'
import PageHeader from '@/components/layout/PageHeader'
import { GuestBanner } from '@/components/layout/stats/GuestBanner'
import { StreakCard } from '@/components/progress/StreakCard'
import { DailyCompletionRate } from '@/components/progress/DailyCompletionRate'
import { AccuracyTrend } from '@/components/progress/AccuracyTrend'
import { FluencyRadarCard } from '@/components/progress/FluencyRadarCard'
import { SkillProfileCard } from '@/components/progress/SkillProfileCard'
import { ThisWeekCard } from '@/components/progress/ThisWeekCard'
import { ActivityHistoryCard } from '@/components/progress/ActivityHistoryCard'

const progressHeader = (
  <PageHeader
    kicker="Seguimiento"
    title="Progreso"
    subtitle="Racha, consistencia y perfil de habilidades a partir de lo que practicas."
  />
)

export default async function ProgressPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <PageLayout archetype="dashboard" hero={progressHeader}>
        <GuestBanner />
      </PageLayout>
    )
  }

  const data = await getProgressPageData(user.id)

  return (
    <PageLayout
      archetype="dashboard"
      hero={progressHeader}
      railLabel="Esta semana"
      rail={
        <>
          <ThisWeekCard stats={data.weeklySummary} />
          <Link
            href="/daily"
            className={cn(
              'inline-flex items-center justify-center rounded-md px-6 py-3',
              'text-base font-semibold transition-all duration-150 ease-out-quart focus-ring',
              'bg-[var(--cta-bg)] text-[var(--cta-fg)] hover:bg-[var(--cta-bg-hover)]',
            )}
          >
            {data.streak.completedToday
              ? 'Practicar más'
              : 'Empezar el plan de hoy'}
          </Link>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
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
    </PageLayout>
  )
}
