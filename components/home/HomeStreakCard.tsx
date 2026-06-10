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
              "w-4 h-4 rounded-full grid place-items-center not-italic transition-[background-color,box-shadow] duration-200",
              isToday
                ? completedToday
                  ? "bg-[var(--success)]"
                  : "bg-[var(--primary)] shadow-[0_0_0_3px_var(--accent-dim)]"
                : isOn
                  ? "bg-[var(--success)]"
                  : "bg-[var(--surface-sunken)]",
            ].join(" ")}
          >
            {isOn ? <Check size={8} strokeWidth={3} className="text-white animate-step-done" /> : null}
          </i>
        );
      })}
    </div>
  );
}

export default function HomeStreakCard({ streak }: HomeStreakCardProps) {
  const current = streak?.currentStreak ?? 0;
  const completedToday = streak?.completedToday ?? false;

  return (
    <div
      className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-raised px-4 py-3"
      aria-label={`${current} ${current === 1 ? "day" : "days"} streak`}
    >
      <Flame
        size={16}
        className={[
          "shrink-0 transition-colors duration-300",
          completedToday ? "text-[var(--success)]" : "text-[var(--primary)]",
        ].join(" ")}
        aria-hidden
      />
      <div className="flex items-baseline gap-1.5">
        <span className="type-stat text-sm">{current}</span>
        <span className="font-caption text-[var(--text-secondary)]">
          {current === 1 ? "day" : "days"} streak
        </span>
      </div>
      <div className="ml-auto">
        <WeekDots streakDays={current} completedToday={completedToday} />
      </div>
    </div>
  );
}
