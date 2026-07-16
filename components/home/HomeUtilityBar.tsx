// Planned structure:
// <HomeUtilityBar>
//   retention stats: streak · palabras dominadas · min esta semana
// </HomeUtilityBar>

import { Flame } from "@/components/icons";
import type { DailyStreakResult } from "@/lib/daily/streak-core";
import type { DailyGoalProgress } from "@/lib/home/constants";

interface HomeUtilityBarProps {
  streak?: DailyStreakResult;
  wordsMastered?: number;
  weekMinutes?: number;
  dailyGoal?: DailyGoalProgress | null;
}

export default function HomeUtilityBar({
  streak,
  wordsMastered = 0,
  weekMinutes,
  dailyGoal = null,
}: HomeUtilityBarProps) {
  const current = streak?.currentStreak ?? 0;
  const completedToday = streak?.completedToday ?? false;
  const week = weekMinutes ?? dailyGoal?.weekMinutes ?? 0;

  const hasAny = current > 0 || wordsMastered > 0 || week > 0;

  if (!hasAny) {
    return (
      <header className="home-utility-bar border-b border-border-subtle py-2">
        <p className="font-caption text-fg-muted">Empieza hoy para ver tu progreso</p>
      </header>
    );
  }

  return (
    <header className="home-utility-bar flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border-subtle py-2">
      {current > 0 ? (
        <span
          className="inline-flex items-center gap-1 font-caption tabular-nums text-fg"
          title={completedToday ? "Racha de hoy completa" : "Sigue tu racha"}
        >
          <Flame
            size={14}
            className={completedToday ? "text-success" : "text-primary"}
            aria-hidden
          />
          {current} {current === 1 ? "día seguido" : "días seguidos"}
        </span>
      ) : null}
      {wordsMastered > 0 ? (
        <span className="font-caption tabular-nums text-fg">
          {wordsMastered}{" "}
          {wordsMastered === 1 ? "palabra dominada" : "palabras dominadas"}
        </span>
      ) : null}
      {week > 0 ? (
        <span className="font-caption tabular-nums text-fg-muted">
          {week} min esta semana
        </span>
      ) : null}
    </header>
  );
}
