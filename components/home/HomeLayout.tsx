// Planned structure:
// <HomeLayout>
//   <HomePageHeader />
//   <HomeCommandGrid />  — review strip; plan | aside (journal + suggested)
// </HomeLayout>

import HomePageHeader from "@/components/home/HomePageHeader";
import HomeCommandGrid from "@/components/home/HomeCommandGrid";
import HomePrimaryAction from "@/components/home/HomePrimaryAction";
import type { DailyStreakResult } from "@/lib/daily/streak-core";
import type { ConceptLesson } from "@/hooks/useDailyPlan";
import type { DailyGoalProgress, WeakestPhonemeHome } from "@/lib/home/constants";
import type { PrimaryAction } from "@/lib/home/primary-action";
import type { VocabularyProgressSeed } from "@/lib/vocabulary/server-progress";
import type { MiniLesson } from "@/lib/content/schemas";
import type { HomePlacementState } from "@/lib/home/placement-state";
import type { HomePronunciationDiagnosticState } from "@/lib/home/pronunciation-diagnostic-state";

interface HomeLayoutProps {
  streak?: DailyStreakResult;
  profileLevel?: string | null;
  wordsDueCount?: number;
  soundsDueCount?: number;
  conceptLesson?: ConceptLesson | null;
  dailyGoal?: DailyGoalProgress | null;
  weakestPhoneme?: WeakestPhonemeHome | null;
  vocabularyProgress?: VocabularyProgressSeed | null;
  /** Kept for page-server compatibility; lessons live only as plan steps. */
  todaysLesson?: MiniLesson | null;
  secondaryLesson?: MiniLesson | null;
  placementState: HomePlacementState;
  pronunciationDiagnosticState: HomePronunciationDiagnosticState;
  primaryAction: PrimaryAction;
}

export default function HomeLayout({
  streak,
  profileLevel = null,
  wordsDueCount = 0,
  soundsDueCount = 0,
  conceptLesson = null,
  dailyGoal = null,
  weakestPhoneme = null,
  vocabularyProgress = null,
  placementState,
  pronunciationDiagnosticState,
  primaryAction,
}: HomeLayoutProps) {
  const isNewLearner = !placementState.hasMeaningfulProgress;
  const currentStreak = streak?.currentStreak ?? 0;

  return (
    <div className="home-layout home-layout-shell max-w-220 mx-auto">
      <div className="home-layout-sections flex flex-col">
        <HomePageHeader
          streak={streak}
          wordsMastered={vocabularyProgress?.wordBankMastered ?? 0}
          weekMinutes={dailyGoal?.weekMinutes ?? 0}
          dailyGoal={dailyGoal}
          isNewLearner={isNewLearner}
        />
        <HomePrimaryAction action={primaryAction} />
        <HomeCommandGrid
          conceptLesson={conceptLesson}
          profileLevel={profileLevel}
          weakestPhoneme={weakestPhoneme}
          wordsDueCount={wordsDueCount}
          soundsDueCount={soundsDueCount}
          streak={currentStreak}
          placementState={placementState}
          pronunciationDiagnosticState={pronunciationDiagnosticState}
        />
      </div>
    </div>
  );
}
