// Planned structure:
// <HomeLayout>
//   <HomePageHeader />
//   <HomeReviewBanner />
//   <HomeCommandGrid />
// </HomeLayout>

import HomePageHeader from "@/components/home/HomePageHeader";
import HomeReviewBanner from "@/components/home/HomeReviewBanner";
import HomeCommandGrid from "@/components/home/HomeCommandGrid";
import type { DailyStreakResult } from "@/lib/daily/streak-core";
import type { ConceptLesson } from "@/hooks/useDailyPlan";
import type { DailyGoalProgress, WeakestPhonemeHome, ReviewQueueSummary } from "@/lib/home/constants";
import type { VocabularyProgressSeed } from "@/lib/vocabulary/server-progress";
import type { MiniLesson } from "@/lib/content/schemas";

interface HomeLayoutProps {
  streak?: DailyStreakResult;
  wordsDueCount?: number;
  soundsDueCount?: number;
  conceptLesson?: ConceptLesson | null;
  dailyGoal?: DailyGoalProgress | null;
  weakestPhoneme?: WeakestPhonemeHome | null;
  reviewQueue?: ReviewQueueSummary;
  vocabularyProgress?: VocabularyProgressSeed | null;
  todaysLesson?: MiniLesson | null;
  secondaryLesson?: MiniLesson | null;
}

export default function HomeLayout({
  streak,
  wordsDueCount = 0,
  soundsDueCount = 0,
  conceptLesson = null,
  dailyGoal = null,
  weakestPhoneme = null,
  vocabularyProgress = null,
  todaysLesson = null,
  secondaryLesson = null,
}: HomeLayoutProps) {
  return (
    <div className="home-layout home-layout-shell">
      <div className="home-layout-sections flex flex-col">
        <HomePageHeader
          streak={streak}
          wordsMastered={vocabularyProgress?.wordBankMastered ?? 0}
          weekMinutes={dailyGoal?.weekMinutes ?? 0}
          dailyGoal={dailyGoal}
        />
        <HomeReviewBanner wordsDueCount={wordsDueCount} soundsDueCount={soundsDueCount} />
        <HomeCommandGrid
          conceptLesson={conceptLesson}
          weakestPhoneme={weakestPhoneme}
          todaysLesson={todaysLesson}
          secondaryLesson={secondaryLesson}
        />
      </div>
    </div>
  );
}
