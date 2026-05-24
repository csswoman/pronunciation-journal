import Image from 'next/image'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getProgressPageData } from '@/lib/progress/queries'
import PageLayout from '@/components/layout/PageLayout'
import PageHeader from '@/components/layout/PageHeader'
import Section from '@/components/layout/Section'
import { GuestBanner } from '@/components/layout/stats/GuestBanner'
import { StreakCard } from '@/components/progress/StreakCard'
import { DailyCompletionRate } from '@/components/progress/DailyCompletionRate'
import { AccuracyTrend } from '@/components/progress/AccuracyTrend'
import { SkillProfileCard } from '@/components/progress/SkillProfileCard'

export default async function ProgressPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <PageLayout
      hero={
        <PageHeader
          badge="Daily Wins"
          title="Your Progress"
          subtitle="Keep Climbing"
          description="See your streak, consistency, and skill profile at a glance."
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
        {!user ? (
          <GuestBanner />
        ) : (
          <ProgressDashboard userId={user.id} />
        )}
      </Section>
    </PageLayout>
  )
}

async function ProgressDashboard({ userId }: { userId: string }) {
  const data = await getProgressPageData(userId)

  return (
    <div className="space-y-4">
      {/* Row 1: Streak + Daily Completion + Accuracy */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StreakCard streak={data.streak} />
        <DailyCompletionRate stats={data.dailyCompletion} />
        <AccuracyTrend stats={data.accuracy} />
      </div>

      {/* Row 2: Skill profile (full width) */}
      <SkillProfileCard data={data.skillProfile} />

      {/* CTA */}
      <div className="flex justify-center pt-2">
        <Link
          href="/daily"
          className="rounded-2xl px-8 py-3 text-sm font-semibold transition-opacity hover:opacity-85"
          style={{ background: 'var(--primary)', color: 'var(--primary-fg)' }}
        >
          {data.streak.completedToday ? 'Practice more' : 'Start today\'s daily'}
        </Link>
      </div>
    </div>
  )
}
