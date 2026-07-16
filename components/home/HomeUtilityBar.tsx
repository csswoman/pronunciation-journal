"use client";

// Planned structure:
// <HomeUtilityBar>
//   mono metadata (date · greeting · name · streak)
//   <HomeHeaderActions />
// </HomeUtilityBar>

import { Flame } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSoundProgress } from "@/hooks/useSoundProgress";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import HomeHeaderActions from "@/components/home/HomeHeaderActions";
import type { DailyStreakResult } from "@/lib/daily/streak-core";

interface HomeUtilityBarProps {
  streak?: DailyStreakResult;
}

function getTimeOfDay(): "morning" | "afternoon" | "evening" {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export default function HomeUtilityBar({ streak }: HomeUtilityBarProps) {
  const { user } = useAuth();
  const { progressList } = useSoundProgress(user?.id);
  const { preferences } = useUserPreferences();

  const isLoggedIn = user && !(user as { is_anonymous?: boolean }).is_anonymous;
  const fullName = preferences?.full_name || user?.email?.split("@")[0] || "Guest";
  const userName = isLoggedIn ? fullName.split(" ")[0] : "Guest";
  const hasStartedLearning = progressList.length > 0;

  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeOfDay = getTimeOfDay();
  const current = streak?.currentStreak ?? 0;
  const completedToday = streak?.completedToday ?? false;

  return (
    <header className="home-utility-bar flex items-center justify-between gap-4 border-b border-border-subtle py-3">
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <p className="font-mono text-caption tabular-nums text-fg-muted">
          {dateLabel} · {timeOfDay} · {userName.toLowerCase()}
        </p>
        {current > 0 && (
          <span
            className="inline-flex items-center gap-1 font-caption tabular-nums text-fg"
            title={completedToday ? "Streak complete today" : "Keep your streak alive"}
          >
            <Flame
              size={14}
              className={completedToday ? "text-success" : "text-primary"}
              aria-hidden
            />
            {current}
          </span>
        )}
      </div>
      <div className="shrink-0">
        <HomeHeaderActions hasStartedLearning={hasStartedLearning} />
      </div>
    </header>
  );
}
