"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useSoundProgress } from "@/hooks/useSoundProgress";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import HomeHeaderGreeting from "@/components/home/HomeHeaderGreeting";
import HomeHeaderActions from "@/components/home/HomeHeaderActions";
import HomeGoalRing from "@/components/home/HomeGoalRing";
import HomeStreakBadge from "@/components/home/HomeStreakBadge";
import type { DailyStreakResult } from "@/lib/daily/streak";
import {
  DEFAULT_DAILY_GOAL_MINUTES,
  type DailyGoalProgress,
} from "@/lib/home/constants";

interface HomeStatusHeroProps {
  dueCount?: number;
  streak?: DailyStreakResult;
  dailyGoal?: DailyGoalProgress | null;
}

export default function HomeStatusHero({
  dueCount = 0,
  streak,
  dailyGoal,
}: HomeStatusHeroProps) {
  const { user } = useAuth();
  const { progressList } = useSoundProgress(user?.id);
  const { preferences } = useUserPreferences();

  const fullName = preferences?.full_name || user?.email?.split("@")[0] || "Guest";
  const userName = fullName.split(" ")[0];
  const hasStartedLearning = progressList.length > 0;

  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const minutesDone = dailyGoal?.minutesDone ?? 0;
  const goalMinutes = dailyGoal?.goalMinutes ?? DEFAULT_DAILY_GOAL_MINUTES;
  const ringPercent = dailyGoal?.percent ?? 0;
  const goalReached = minutesDone >= goalMinutes;

  const insight = (() => {
    const minutesBit = (
      <>
        You&apos;re at{" "}
        <b className="font-semibold text-[var(--primary)]">
          {minutesDone} of {goalMinutes} min
        </b>{" "}
        on your daily goal.
      </>
    );

    if (goalReached && dueCount === 0) {
      return <>Goal reached! {minutesBit}</>;
    }

    if (dueCount > 0) {
      return (
        <>
          {minutesBit}{" "}
          <b className="font-semibold text-[var(--primary)]">
            {dueCount} item{dueCount !== 1 ? "s" : ""}
          </b>{" "}
          left to review.
        </>
      );
    }

    if (goalReached) {
      return <>{minutesBit} No reviews pending.</>;
    }

    return (
      <>
        {minutesBit} Start your daily plan or add words from the Lexicon.
      </>
    );
  })();

  return (
    <div className="flex flex-wrap items-center justify-between gap-8 pt-2 pb-2">
      <div className="flex-1 min-w-[240px] flex flex-col gap-4">
        <HomeHeaderGreeting userName={userName} dateLabel={dateLabel} hideSubtitle />
        <p className="text-sm text-[var(--text-secondary)] max-w-md leading-relaxed -mt-2">{insight}</p>
        <HomeHeaderActions hasStartedLearning={hasStartedLearning} />
      </div>

      <div className="flex items-center gap-5 shrink-0">
        <HomeStreakBadge streak={streak} />
        <HomeGoalRing percent={ringPercent} />
      </div>
    </div>
  );
}
