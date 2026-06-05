import { Check, Flame } from "lucide-react";
import type { DailyStreakResult } from "@/lib/daily/streak";

interface HomeStreakCardProps {
  streak?: DailyStreakResult;
}

function WeekDots({ streakDays, completedToday }: { streakDays: number; completedToday: boolean }) {
  const filled = Math.min(6, Math.max(0, streakDays - (completedToday ? 1 : 0)));

  return (
    <div className="flex gap-2" aria-hidden>
      {Array.from({ length: 7 }).map((_, i) => {
        const isToday = i === 6;
        const isOn = !isToday && i < filled;
        return (
          <i
            key={i}
            className={[
              "w-4 h-4 rounded-full grid place-items-center not-italic",
              isToday
                ? completedToday
                  ? "bg-[var(--warning)]"
                  : "bg-[var(--primary)] shadow-[0_0_0_3px_var(--accent-dim)]"
                : isOn
                  ? "bg-[var(--warning)]"
                  : "bg-[var(--surface-sunken)]",
            ].join(" ")}
          >
            {isOn ? <Check size={8} strokeWidth={3} className="text-white" /> : null}
          </i>
        );
      })}
    </div>
  );
}

export default function HomeStreakCard({ streak }: HomeStreakCardProps) {
  const current = streak?.currentStreak ?? 0;
  const completedToday = streak?.completedToday ?? false;

  const message = completedToday
    ? "Goal reached today!"
    : current > 0
      ? "Keep it going!"
      : "Start your streak today.";

  return (
    <div
      className="flex items-center gap-4 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised px-5 py-5"
      aria-label={`${current} ${current === 1 ? "day" : "days"} streak`}
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[var(--hue-icon-bg)]">
        <Flame size={20} className="text-[var(--primary)]" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-bold text-[var(--text-primary)]">{current}</span>
          <span className="text-sm text-[var(--text-secondary)]">
            {current === 1 ? "day" : "days"} streak
          </span>
        </div>
        <WeekDots streakDays={current} completedToday={completedToday} />
        <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">{message}</p>
      </div>
    </div>
  );
}
