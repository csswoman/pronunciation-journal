// Planned structure:
// <HomeLayout>
//   <HomeCommandGrid />
// </HomeLayout>

import HomeCommandGrid from "@/components/home/HomeCommandGrid";
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
  todaysLesson?: MiniLesson | null;
  secondaryLesson?: MiniLesson | null;
  placementState: HomePlacementState;
  pronunciationDiagnosticState: HomePronunciationDiagnosticState;
  primaryAction: PrimaryAction;
  previewWords?: Array<{ text: string }>;
}

export default function HomeLayout({
  streak,
  profileLevel = null,
  wordsDueCount = 0,
  soundsDueCount = 0,
  conceptLesson = null,
  weakestPhoneme = null,
  placementState,
  pronunciationDiagnosticState,
  primaryAction,
  previewWords = [],
}: HomeLayoutProps) {
  const currentStreak = streak?.currentStreak ?? 0;

  return (
    <HomeCommandGrid
      primaryAction={primaryAction}
      conceptLesson={conceptLesson}
      profileLevel={profileLevel}
      weakestPhoneme={weakestPhoneme}
      wordsDueCount={wordsDueCount}
      soundsDueCount={soundsDueCount}
      streak={currentStreak}
      previewWords={previewWords}
      placementState={placementState}
      pronunciationDiagnosticState={pronunciationDiagnosticState}
    />
  );
}
