import { useMemo } from "react";
import { LearnHeroSessionCard } from "./LearnHeroSessionCard";
import { ActiveDecksList } from "./ActiveDecksList";
import { UnstartedDecksBar } from "./UnstartedDecksBar";
import { MemoryStatsCard } from "./MemoryStatsCard";
import { Upcoming7DaysChart } from "./Upcoming7DaysChart";
import { LearnSettingsCard } from "./LearnSettingsCard";
import type { LessonViewModel } from "@/lib/lexicon/types";

// Planned structure:
// <LearnDashboard>
//   <div (2-Column Responsive Layout)>
//     <div (Left Main Column: HeroCard + ActiveDecksList + UnstartedDecksBar)>
//     <div (Right Sidebar Column: MemoryStatsCard + Upcoming7DaysChart + LearnSettingsCard)>
//   </div>
// </LearnDashboard>

interface LearnDashboardProps {
  lessons: LessonViewModel[];
  dueForReview?: number;
  onSelectDeck: (categoryId: string) => void;
}

export function LearnDashboard({
  lessons,
  dueForReview = 0,
  onSelectDeck,
}: LearnDashboardProps) {
  const { activeLessons, unstartedLessons } = useMemo(() => {
    const active = lessons.filter((l) => l.wordsReviewing > 0 || l.wordsCompleted > 0);
    const unstarted = lessons.filter((l) => !active.some((a) => a.id === l.id));
    return { activeLessons: active, unstartedLessons: unstarted };
  }, [lessons]);

  const { masteredCount, learningCount, unstartedCount } = useMemo(() => {
    const totalWords = lessons.reduce((sum, l) => sum + l.totalWords, 0);
    const mastered = lessons.reduce((sum, l) => sum + l.wordsCompleted, 0);
    const learning = lessons.reduce((sum, l) => sum + l.wordsReviewing, 0);
    const unstarted = Math.max(0, totalWords - mastered - learning);
    return { masteredCount: mastered, learningCount: learning, unstartedCount: unstarted };
  }, [lessons]);

  const defaultDeckId = activeLessons[0]?.id ?? unstartedLessons[0]?.id ?? "frontend-dev";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
      {/* Main left column */}
      <div className="lg:col-span-8 space-y-8">
        <LearnHeroSessionCard
          dueForReview={dueForReview}
          newCardsLimit={5}
          activeDecksCount={activeLessons.length}
          onStartSession={() => onSelectDeck(defaultDeckId)}
          onStartReviewOnly={() => {
            if (activeLessons[0]) onSelectDeck(activeLessons[0].id);
          }}
        />

        <ActiveDecksList
          lessons={activeLessons}
          onSelectDeck={onSelectDeck}
        />

        <UnstartedDecksBar
          unstartedLessons={unstartedLessons}
          onAddDeck={(categoryId) => {
            const target = categoryId ?? unstartedLessons[0]?.id;
            if (target) onSelectDeck(target);
          }}
        />
      </div>

      {/* Right sidebar column */}
      <div className="lg:col-span-4 space-y-6">
        <MemoryStatsCard
          masteredCount={masteredCount}
          learningCount={learningCount}
          unstartedCount={unstartedCount}
        />

        <Upcoming7DaysChart
          todayReviewsCount={dueForReview}
        />

        <LearnSettingsCard />
      </div>
    </div>
  );
}
