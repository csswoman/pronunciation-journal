import { Check, Flame } from "lucide-react";
import type { DailyStreakResult } from "@/lib/daily/streak";

interface HomeStreakBadgeProps {
  streak?: DailyStreakResult;
}

function WeekDots({ streakDays, completedToday }: { streakDays: number; completedToday: boolean }) {
  const filled = Math.min(6, Math.max(0, streakDays - (completedToday ? 1 : 0)));

  return (
    <div className="flex gap-1.5 mt-1.5 justify-center" aria-hidden>
      {Array.from({ length: 7 }).map((_, i) => {
        const isToday = i === 6;
        const isOn = !isToday && i < filled;
        return (
          <i
            key={i}
            className={[
              "w-3 h-3 rounded-full grid place-items-center text-[9px] not-italic",
              isToday
                ? completedToday
                  ? "bg-[var(--warning)] text-[var(--warning-value)]"
                  : "bg-[var(--primary)] shadow-[0_0_0_3px_var(--accent-dim)]"
                : isOn
                  ? "bg-[var(--warning)] text-[var(--on-primary)]"
                  : "bg-[var(--bg-tertiary)]",
            ].join(" ")}
          >
            {isOn ? <Check size={7} strokeWidth={3} /> : null}
          </i>
        );
      })}
    </div>
  );
}

export default function HomeStreakBadge({ streak }: HomeStreakBadgeProps) {
  const current = streak?.currentStreak ?? 0;
  const completedToday = streak?.completedToday ?? false;

  return (
    <div className="text-center shrink-0">
      <Flame size={20} className="text-[var(--warning)] mx-auto" aria-hidden />
      <b
        className="text-2xl font-bold block leading-none text-[var(--text-primary)] mt-0.5"
        aria-label={`${current} ${current === 1 ? 'day' : 'days'} streak`}
      >
        {current}
      </b>
      <span className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest">
        {current === 1 ? "day" : "days"}
      </span>
      <WeekDots streakDays={current} completedToday={completedToday} />
    </div>
  );
}
