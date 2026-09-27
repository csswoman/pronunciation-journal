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
  dueForReview = 25,
  onSelectDeck,
}: LearnDashboardProps) {
  const { activeLessons, unstartedLessons } = useMemo(() => {
    // Default active categories matching mockup if no progress exists yet
    const activeIds = ["frontend-dev", "artificial-intelligence", "data-science", "backend-infra"];
    const active = lessons.filter((l) => activeIds.includes(l.id) || l.wordsReviewing > 0 || l.wordsCompleted > 0);
    const unstarted = lessons.filter((l) => !active.some((a) => a.id === l.id));
    return { activeLessons: active, unstartedLessons: unstarted };
  }, [lessons]);

  const { masteredCount, learningCount, unstartedCount } = useMemo(() => {
    const totalWords = lessons.reduce((sum, l) => sum + l.totalWords, 0) || 695;
    const mastered = lessons.reduce((sum, l) => sum + l.wordsCompleted, 0);
    const learning = 29; // Matches mockup baseline learning count
    const unstarted = Math.max(0, totalWords - mastered - learning);
    return { masteredCount: mastered, learningCount: learning, unstartedCount: unstarted };
  }, [lessons]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
      {/* Main left column */}
      <div className="lg:col-span-8 space-y-8">
        <LearnHeroSessionCard
          dueForReview={dueForReview > 0 ? dueForReview : 25}
          newCardsLimit={5}
          activeDecksCount={activeLessons.length}
          onStartSession={() => onSelectDeck(activeLessons[0]?.id ?? "frontend-dev")}
          onStartReviewOnly={() => onSelectDeck("frontend-dev")}
        />

        <ActiveDecksList
          lessons={activeLessons}
          onSelectDeck={onSelectDeck}
        />

        <UnstartedDecksBar
          unstartedLessons={unstartedLessons}
          onAddDeck={() => {
            if (unstartedLessons[0]) onSelectDeck(unstartedLessons[0].id);
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
          todayReviewsCount={dueForReview > 0 ? dueForReview : 25}
        />

        <LearnSettingsCard />
      </div>
    </div>
  );
}
