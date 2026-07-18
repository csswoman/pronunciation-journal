// Planned structure:
// <HomeLayout>
//   <HomePageHeader />
//   <HomeCommandGrid />  — review strip full-width; plan | aside
// </HomeLayout>

import HomePageHeader from "@/components/home/HomePageHeader";
import HomeCommandGrid from "@/components/home/HomeCommandGrid";
import type { DailyStreakResult } from "@/lib/daily/streak-core";
import type { ConceptLesson } from "@/hooks/useDailyPlan";
import type { DailyGoalProgress, WeakestPhonemeHome } from "@/lib/home/constants";
import type { VocabularyProgressSeed } from "@/lib/vocabulary/server-progress";
import type { MiniLesson } from "@/lib/content/schemas";

interface HomeLayoutProps {
  streak?: DailyStreakResult;
  wordsDueCount?: number;
  soundsDueCount?: number;
  conceptLesson?: ConceptLesson | null;
  dailyGoal?: DailyGoalProgress | null;
  weakestPhoneme?: WeakestPhonemeHome | null;
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
        <HomeCommandGrid
          conceptLesson={conceptLesson}
          weakestPhoneme={weakestPhoneme}
          todaysLesson={todaysLesson}
          secondaryLesson={secondaryLesson}
          wordsDueCount={wordsDueCount}
          soundsDueCount={soundsDueCount}
        />
      </div>
    </div>
  );
}
