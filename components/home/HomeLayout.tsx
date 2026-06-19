'use client'

// Planned structure:
// <HomeLayout>
//   <HomeDailyCard />           — single instance, shared across breakpoints
//   mobile: <HomeMobileView />
//   desktop: <HomeTodaySection /> + <HomeReviewsSection /> + <HomeLearnSection />
// </HomeLayout>

import { useMediaQuery } from '@/hooks/useMediaQuery'
import HomeDailyCard from '@/components/home/HomeDailyCard'
import HomeStatusHero from '@/components/home/HomeStatusHero'
import HomeMobileView from '@/components/home/HomeMobileView'
import HomeTodaySection from '@/components/home/HomeTodaySection'
import HomeReviewsSection from '@/components/home/HomeReviewsSection'
import HomeLearnSection from '@/components/home/HomeLearnSection'
import type { DailyStreakResult } from '@/lib/daily/streak-core'
import type { ConceptLesson } from '@/hooks/useDailyPlan'
import type { DailyGoalProgress, WeakestPhonemeHome, ReviewQueueSummary } from '@/lib/home/constants'
import type { LexiconRetentionStats } from '@/lib/lexicon/server-progress'
import type { MiniLesson, LanguageConcept } from '@/lib/content/schemas'

interface HomeLayoutProps {
  streak?: DailyStreakResult
  wordsDueCount?: number
  soundsDueCount?: number
  conceptLesson?: ConceptLesson | null
  dailyGoal?: DailyGoalProgress | null
  weakestPhoneme?: WeakestPhonemeHome | null
  reviewQueue?: ReviewQueueSummary
  lexiconRetention?: LexiconRetentionStats | null
  todaysLesson?: MiniLesson | null
  todaysConcept?: LanguageConcept | null
}

export default function HomeLayout({
  streak,
  wordsDueCount = 0,
  soundsDueCount = 0,
  conceptLesson = null,
  dailyGoal = null,
  weakestPhoneme = null,
  reviewQueue = { total: 0, newAvailable: 0, sources: [], preview: [] },
  lexiconRetention = null,
  todaysLesson = null,
  todaysConcept = null,
}: HomeLayoutProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const dailyCard = <HomeDailyCard conceptLesson={conceptLesson} />

  if (isDesktop) {
    return (
      <>
        <HomeStatusHero streak={streak} wordsDueCount={wordsDueCount} soundsDueCount={soundsDueCount} />
        <HomeTodaySection streak={streak} dailyGoal={dailyGoal} dailyCard={dailyCard} />
        <HomeReviewsSection
          reviewQueue={reviewQueue}
          lexicon={lexiconRetention}
          weakestPhoneme={weakestPhoneme}
        />
        <HomeLearnSection lesson={todaysLesson} concept={todaysConcept} />
      </>
    )
  }

  return (
    <HomeMobileView
      streak={streak}
      wordsDueCount={wordsDueCount}
      soundsDueCount={soundsDueCount}
      dailyCard={dailyCard}
    />
  )
}
