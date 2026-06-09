"use client";

import { Flame } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSoundProgress } from "@/hooks/useSoundProgress";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import HomeHeaderGreeting from "@/components/home/HomeHeaderGreeting";
import HomeHeaderActions from "@/components/home/HomeHeaderActions";
import type { DailyStreakResult } from "@/lib/daily/streak";

interface HomeStatusHeroProps {
  streak?: DailyStreakResult;
}

export default function HomeStatusHero({ streak }: HomeStatusHeroProps) {
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

  const current = streak?.currentStreak ?? 0;
  const completedToday = streak?.completedToday ?? false;

  return (
    <div className="flex items-start justify-between gap-4 pt-2 pb-2">
      <div className="flex flex-col gap-3">
        <HomeHeaderGreeting userName={userName} dateLabel={dateLabel} />
        <HomeHeaderActions hasStartedLearning={hasStartedLearning} />
      </div>
      {current > 0 && (
        <div
          className="animate-home-in flex shrink-0 items-center gap-1.5 rounded-[var(--radius-full)] border border-border-subtle bg-surface-raised px-3 py-1.5"
          title={completedToday ? "Streak complete today" : "Keep your streak alive"}
        >
          <Flame
            size={14}
            className={[
              "transition-colors duration-300",
              completedToday ? "text-[var(--success)]" : "text-[var(--primary)]",
            ].join(" ")}
            aria-hidden
          />
          <span className="font-label tabular-nums text-[var(--text-primary)]">{current}</span>
          <span className="font-caption text-[var(--text-tertiary)]">
            {current === 1 ? "day" : "days"}
          </span>
        </div>
      )}
    </div>
  );
}
