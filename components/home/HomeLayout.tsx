// Planned structure:
// <HomeLayout>
//   mobile: <HomeMobileView />
//   desktop: <HomeUtilityBar /> + <HomeReviewBanner /> + <HomeCommandGrid />
// </HomeLayout>

import HomeDailyCard from "@/components/home/HomeDailyCard";
import HomeMobileView from "@/components/home/HomeMobileView";
import HomeUtilityBar from "@/components/home/HomeUtilityBar";
import HomeReviewBanner from "@/components/home/HomeReviewBanner";
import HomeCommandGrid from "@/components/home/HomeCommandGrid";
import type { DailyStreakResult } from "@/lib/daily/streak-core";
import type { ConceptLesson } from "@/hooks/useDailyPlan";
import type { DailyGoalProgress, WeakestPhonemeHome, ReviewQueueSummary } from "@/lib/home/constants";
import type { VocabularyProgressSeed } from "@/lib/vocabulary/server-progress";
import type { MiniLesson, LanguageConcept } from "@/lib/content/schemas";

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
  todaysConcept?: LanguageConcept | null;
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
  void dailyGoal;
  void reviewQueue;
  void vocabularyProgress;

  return (
    <div className="home-layout home-layout-shell">
      <div className="md:hidden">
        <HomeMobileView
          streak={streak}
          wordsDueCount={wordsDueCount}
          soundsDueCount={soundsDueCount}
          weakestPhoneme={weakestPhoneme}
          dailyCard={<HomeDailyCard conceptLesson={conceptLesson} />}
        />
      </div>

      <div className="home-layout-sections hidden md:flex">
        <HomeUtilityBar streak={streak} />
        <HomeReviewBanner wordsDueCount={wordsDueCount} soundsDueCount={soundsDueCount} />
        <HomeCommandGrid
          conceptLesson={conceptLesson}
          weakestPhoneme={weakestPhoneme}
          todaysLesson={todaysLesson}
          todaysConcept={todaysConcept}
        />
      </div>
    </div>
  );
}
