"use client";

import { Flame, CalendarDays } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSoundProgress } from "@/hooks/useSoundProgress";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import HomeHeaderActions from "@/components/home/HomeHeaderActions";
import type { DailyStreakResult } from "@/lib/daily/streak-core";

interface HomeStatusHeroProps {
  streak?: DailyStreakResult;
  wordsDueCount?: number;
  soundsDueCount?: number;
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomeStatusHero({ streak, wordsDueCount = 0, soundsDueCount = 0 }: HomeStatusHeroProps) {
  const { user } = useAuth();
  const { progressList } = useSoundProgress(user?.id);
  const { preferences } = useUserPreferences();

  const isLoggedIn = user && !(user as { is_anonymous?: boolean }).is_anonymous;
  const fullName = preferences?.full_name || user?.email?.split("@")[0] || "Guest";
  const userName = isLoggedIn ? fullName.split(" ")[0] : "Guest";
  const hasStartedLearning = progressList.length > 0;

  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const current = streak?.currentStreak ?? 0;
  const completedToday = streak?.completedToday ?? false;
  const greeting = getTimeGreeting();

  const totalDue = wordsDueCount + soundsDueCount;

  return (
    <div
      className="rounded-[var(--radius-2xl)] border border-[var(--primary-200)] bg-surface-raised px-8 py-6"
      style={{ backgroundImage: "linear-gradient(135deg, var(--primary-100) 0%, var(--surface-raised) 55%)" }}
    >
      {/* Eyebrow row: date */}
      <p className="mb-4 flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-[var(--text-tertiary)]">
        <CalendarDays size={11} aria-hidden />
        {dateLabel}
      </p>

      {/* Greeting + right stats */}
      <div className="flex items-center justify-between gap-6">
        {/* Left: greeting + CTA */}
        <div className="flex flex-col gap-3">
          <h1 className="text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-tight leading-tight text-[var(--text-primary)]">
            {greeting},{" "}
            <span className="font-[family-name:var(--font-editorial)] font-bold italic text-[var(--primary)]">
              {userName}
            </span>
          </h1>
          <HomeHeaderActions hasStartedLearning={hasStartedLearning} />
        </div>

        {/* Right: stat column */}
        {(current > 0 || totalDue > 0) && (
          <div className="flex shrink-0 items-stretch divide-x divide-[var(--border-subtle)]">
            {current > 0 && (
              <div
                className="flex flex-col items-center gap-0.5 px-6"
                title={completedToday ? "Streak complete today" : "Keep your streak alive"}
              >
                <div className="flex items-center gap-1.5">
                  <Flame
                    size={15}
                    className={completedToday ? "text-[var(--success)]" : "text-[var(--primary)]"}
                    aria-hidden
                  />
                  <span className="text-2xl font-bold tabular-nums leading-none text-[var(--text-primary)]">
                    {current}
                  </span>
                </div>
                <span className="font-caption text-[var(--text-tertiary)]">
                  {current === 1 ? "day streak" : "days streak"}
                </span>
              </div>
            )}
            {totalDue > 0 && (
              <div className="flex flex-col items-center gap-0.5 px-6">
                <span className="text-2xl font-bold tabular-nums leading-none text-[var(--primary)]">
                  {totalDue}
                </span>
                <span className="font-caption text-[var(--text-tertiary)]">to review</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
