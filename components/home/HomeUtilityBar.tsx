"use client";

// Planned structure:
// <HomeUtilityBar>
//   greeting (Buenos días/tardes/noches + name)
//   retention: streak (always) · palabras dominadas · min esta semana
// </HomeUtilityBar>

import { Flame } from "@/components/icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import type { DailyStreakResult } from "@/lib/daily/streak-core";
import type { DailyGoalProgress } from "@/lib/home/constants";

interface HomeUtilityBarProps {
  streak?: DailyStreakResult;
  wordsMastered?: number;
  weekMinutes?: number;
  dailyGoal?: DailyGoalProgress | null;
}

function getGreeting(): "Buenos días" | "Buenas tardes" | "Buenas noches" {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default function HomeUtilityBar({
  streak,
  wordsMastered = 0,
  weekMinutes,
  dailyGoal = null,
}: HomeUtilityBarProps) {
  const { user } = useAuth();
  const { preferences } = useUserPreferences();

  const isLoggedIn = user && !(user as { is_anonymous?: boolean }).is_anonymous;
  const fullName = preferences?.full_name || user?.email?.split("@")[0] || null;
  const userName = isLoggedIn && fullName ? fullName.split(" ")[0] : null;

  const current = streak?.currentStreak ?? 0;
  const completedToday = streak?.completedToday ?? false;
  const week = weekMinutes ?? dailyGoal?.weekMinutes ?? 0;
  const greeting = getGreeting();

  return (
    <header className="home-utility-bar flex flex-col gap-1.5 border-b border-border-subtle py-2.5">
      <p className="font-label text-fg">
        {greeting}
        {userName ? (
          <>
            , <span className="text-primary">{userName}</span>
          </>
        ) : null}
      </p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span
          className="inline-flex items-center gap-1 font-caption tabular-nums text-fg"
          title={
            current === 0
              ? "Empieza tu racha hoy"
              : completedToday
                ? "Racha de hoy completa"
                : "Sigue tu racha"
          }
        >
          <Flame
            size={14}
            className={
              current === 0
                ? "text-fg-muted"
                : completedToday
                  ? "text-success"
                  : "text-primary"
            }
            aria-hidden
          />
          {current === 0
            ? "0 días de racha"
            : `${current} ${current === 1 ? "día seguido" : "días seguidos"}`}
        </span>
        <span className="font-caption tabular-nums text-fg">
          {wordsMastered}{" "}
          {wordsMastered === 1 ? "palabra dominada" : "palabras dominadas"}
        </span>
        {week > 0 ? (
          <span className="font-caption tabular-nums text-fg-muted">
            {week} min esta semana
          </span>
        ) : null}
      </div>
    </header>
  );
}
