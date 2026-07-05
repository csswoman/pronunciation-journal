'use client'

// Planned structure:
// <HomeLayout>
//   mobile: <HomeMobileView />
//   desktop: <HomeTodaySection /> + <HomeReviewsSection /> + <HomeLearnSection />
// </HomeLayout>

import HomeDailyCard from '@/components/home/HomeDailyCard'
import HomeStatusHero from '@/components/home/HomeStatusHero'
import HomeMobileView from '@/components/home/HomeMobileView'
import HomeTodaySection from '@/components/home/HomeTodaySection'
import HomeReviewsSection from '@/components/home/HomeReviewsSection'
import HomeLearnSection from '@/components/home/HomeLearnSection'
import type { DailyStreakResult } from '@/lib/daily/streak-core'
import type { ConceptLesson } from '@/hooks/useDailyPlan'
import type { DailyGoalProgress, WeakestPhonemeHome, ReviewQueueSummary } from '@/lib/home/constants'
import type { VocabularyProgressSeed } from '@/lib/vocabulary/server-progress'
import type { MiniLesson, LanguageConcept } from '@/lib/content/schemas'

interface HomeLayoutProps {
  streak?: DailyStreakResult
  wordsDueCount?: number
  soundsDueCount?: number
  conceptLesson?: ConceptLesson | null
  dailyGoal?: DailyGoalProgress | null
  weakestPhoneme?: WeakestPhonemeHome | null
  reviewQueue?: ReviewQueueSummary
  vocabularyProgress?: VocabularyProgressSeed | null
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
  vocabularyProgress = null,
  todaysLesson = null,
  todaysConcept = null,
}: HomeLayoutProps) {
  return (
    <>
      <div className="md:hidden">
        <HomeMobileView
          streak={streak}
          wordsDueCount={wordsDueCount}
          soundsDueCount={soundsDueCount}
          dailyCard={<HomeDailyCard conceptLesson={conceptLesson} />}
        />
      </div>

      <div className="hidden md:block">
        <HomeStatusHero streak={streak} wordsDueCount={wordsDueCount} soundsDueCount={soundsDueCount} />
        <HomeTodaySection
          streak={streak}
          dailyGoal={dailyGoal}
          dailyCard={<HomeDailyCard conceptLesson={conceptLesson} />}
        />
        <HomeReviewsSection
          reviewQueue={reviewQueue}
          vocabulary={vocabularyProgress}
          weakestPhoneme={weakestPhoneme}
        />
        <HomeLearnSection lesson={todaysLesson} concept={todaysConcept} />
      </div>
    </>
  )
}
