import Image from 'next/image'
import { getUser } from '@/lib/supabase/getUser'
import { getSkillProfile } from '@/lib/skill-profile/queries'
import { createServerSupabaseClient } from '@/lib/supabase/getUser'
import Container from '@/components/layout/Container'
import Section from '@/components/layout/Section'
import PageHeader from '@/components/layout/PageHeader'
import StatsSection from '@/components/layout/StatsSection'
import AchievementsSection from '@/components/progress/AchievementsSection'
import JourneyToFluiditySection from '@/components/progress/JourneyToFluiditySection'
import MasteredSection from '@/components/progress/MasteredSection'
import SkillRadar from '@/components/skill-profile/SkillRadar'
import type { UserStats, DailyProgress } from '@/lib/types'
import type { MasteredSoundInfo } from '@/hooks/useMasteredSounds'

export default async function ProgressPage() {
  const user = await getUser()

  if (!user) {
    return (
      <div className="p-6 text-gray-400">
        <p>Please log in to view your progress.</p>
      </div>
    )
  }

  const profile = await getSkillProfile(user.id)

  // Fetch mastered sounds for the section
  const supabase = await createServerSupabaseClient()
  const { data: masteredData } = await supabase
    .from('user_sound_progress')
    .select('*, sounds(*)')
    .eq('user_id', user.id)
    .eq('status', 'mastered')
    .order('last_practiced', { ascending: false })

  const now = new Date()
  const mastered: MasteredSoundInfo[] = (masteredData ?? []).map((p: any) => {
    const total = p.total_attempts ?? 0
    const correct = p.correct_answers ?? 0
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
    const nextReviewDate = p.next_review ? new Date(p.next_review) : null
    const dueForReview = nextReviewDate ? nextReviewDate <= now : true

    function intervalLabel(nextReview: string | null): string {
      if (!nextReview) return 'Pendiente'
      const diffDays = Math.ceil((new Date(nextReview).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays <= 0) return 'Hoy'
      if (diffDays === 1) return 'Mañana'
      if (diffDays < 7) return `En ${diffDays} días`
      if (diffDays < 14) return 'En 1 semana'
      if (diffDays < 31) return `En ${Math.ceil(diffDays / 7)} semanas`
      return 'En 1 mes+'
    }

    return {
      ...p,
      accuracy,
      dueForReview,
      nextReviewDate,
      intervalLabel: intervalLabel(p.next_review),
    }
  })

  // Map Skill Profile → UserStats
  const stats: UserStats = {
    currentStreak: profile.streak.current,
    longestStreak: profile.streak.best,
    totalAttempts: profile.skills.pronunciation.attempts + profile.skills.listening.attempts,
    averageAccuracy: profile.overallScore,
    totalDecks: 0, // Keep as is or fetch separately
    totalDeckWords: 0,
    deckWordsDueToday: profile.soundsDueToday,
    totalXP: 0, // Not in Skill Profile yet
    totalWords: profile.streak.totalSounds,
    lastStudyDate: new Date().toISOString(),
  }

  const todayProgress: DailyProgress = {
    date: new Date().toISOString().split('T')[0],
    totalAttempts: profile.today.attempts,
    correctAttempts: profile.today.correct,
    averageAccuracy: profile.today.accuracy,
    xp: 0, // Not tracked yet
    wordsStudied: [],
  }

  const progressHistory: DailyProgress[] = profile.trend7d.map(t => ({
    date: t.date,
    totalAttempts: t.attempts,
    correctAttempts: Math.round((t.accuracy / 100) * t.attempts),
    averageAccuracy: t.accuracy,
    xp: 0,
    wordsStudied: [],
  }))

  return (
    <div className="py-8 pb-24">
      <Container>
        <PageHeader
          badge="Daily Wins"
          title="Your Progress"
          subtitle="Keep Climbing"
          description="See your streak, points, and momentum at a glance."
          illustration={
            <Image
              src="/illustrations/xp-points.svg"
              alt="XP points illustration"
              width={624}
              height={368}
              priority
              className="w-[300px] xl:w-[340px] h-auto"
            />
          }
        />
      </Container>

      <Container>
        <Section spacing="lg" className="mt-8">
          {/* Skill Radar + Insight */}
          <div className="w-full mb-8">
            <SkillRadar profile={profile} />
          </div>

          {/* Existing sections */}
          <StatsSection
            stats={stats}
            todayProgress={todayProgress}
            progressHistory={progressHistory}
          />

          <MasteredSection mastered={mastered} />

          <AchievementsSection />

          <JourneyToFluiditySection />
        </Section>
      </Container>
    </div>
  )
}
