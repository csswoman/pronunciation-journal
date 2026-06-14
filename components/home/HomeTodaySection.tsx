// Planned structure:
// <HomeTodaySection>
//   <HomeSectionHeader />
//   main column: <HomeDailyCard />
//   sidebar: <HomeWordOfDayCard /> + <HomeAiPracticeCard /> + <HomeStreakCard /> + optional <HomeGoalRing />
// </HomeTodaySection>

import type { ReactNode } from "react";
import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import HomeWordOfDayCard from "@/components/home/HomeWordOfDayCard";
import HomeAiPracticeCard from "@/components/home/HomeAiPracticeCard";
import HomeStreakCard from "@/components/home/HomeStreakCard";
import HomeGoalRing from "@/components/home/HomeGoalRing";
import type { DailyStreakResult } from "@/lib/daily/streak";
import type { DailyGoalProgress } from "@/lib/home/constants";

interface HomeTodaySectionProps {
  streak?: DailyStreakResult;
  dailyGoal?: DailyGoalProgress | null;
  dailyCard: ReactNode;
}

export default function HomeTodaySection({
  streak,
  dailyGoal = null,
  dailyCard,
}: HomeTodaySectionProps) {
  return (
    <section className="mt-8">
      <HomeSectionHeader
        number="01"
        title="What to do today"
        subtitle="one session, the right next step"
        size="lg"
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.7fr_1fr]">
        {dailyCard}
        <div className="flex flex-col gap-4">
          <HomeWordOfDayCard />
          <HomeAiPracticeCard />
          {dailyGoal != null && (
            <div className="flex items-center gap-4 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-5">
              <HomeGoalRing percent={dailyGoal.percent} size={88} />
              <div className="flex flex-col gap-0.5">
                <p className="font-label font-semibold text-[var(--text-primary)]">
                  {dailyGoal.minutesDone} / {dailyGoal.goalMinutes} min
                </p>
                <p className="font-caption text-[var(--text-secondary)]">
                  {dailyGoal.percent >= 100
                    ? "Goal reached today!"
                    : `${dailyGoal.goalMinutes - dailyGoal.minutesDone} min to go`}
                </p>
              </div>
            </div>
          )}
          <HomeStreakCard streak={streak} />
        </div>
      </div>
    </section>
  );
}
