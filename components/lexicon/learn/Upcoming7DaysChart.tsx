// Planned structure:
// <Upcoming7DaysChart>
//   <div (Card Container)>
//     <div (Header Row: Kicker + "repasos")>
//     <div (7-Day Bar Chart Grid)>
//       <div (Day Column × 7)>
//         <span (Count Number)>
//         <div (Vertical Bar)>
//         <span (Day Label)>
//   </div>
// </Upcoming7DaysChart>

import { useMemo } from "react";

interface DayReview {
  dayLabel: string;
  count: number;
  isToday?: boolean;
}

interface Upcoming7DaysChartProps {
  todayReviewsCount?: number;
  upcomingReviews?: number[];
}

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function Upcoming7DaysChart({
  todayReviewsCount = 0,
  upcomingReviews = [0, 0, 0, 0, 0, 0],
}: Upcoming7DaysChartProps) {
  const days: DayReview[] = useMemo(() => {
    const today = new Date();
    const result: DayReview[] = [
      { dayLabel: "Hoy", count: todayReviewsCount, isToday: true },
    ];
    for (let i = 1; i <= 6; i++) {
      const nextDay = new Date(today);
      nextDay.setDate(today.getDate() + i);
      const dayLabel = DAY_NAMES[nextDay.getDay()] ?? "";
      const count = upcomingReviews[i - 1] ?? 0;
      result.push({ dayLabel, count });
    }
    return result;
  }, [todayReviewsCount, upcomingReviews]);

  const maxCount = Math.max(...days.map((d) => d.count), 0);

  return (
    <div className="rounded-2xl bg-surface-raised border border-border-subtle/80 p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-kicker text-caption font-bold text-fg-subtle uppercase tracking-wider">
          PRÓXIMOS 7 DÍAS
        </h4>
        <span className="text-caption text-fg-muted font-medium">repasos</span>
      </div>

      <div className="flex items-end justify-between gap-1.5 h-36 pt-6 px-1">
        {days.map((day) => {
          const heightPct = maxCount > 0 && day.count > 0 ? Math.max(15, Math.round((day.count / maxCount) * 100)) : 0;
          return (
            <div key={day.dayLabel} className="flex flex-col items-center flex-1 h-full justify-end">
              <span className="text-[11px] font-bold font-mono text-fg-muted mb-1 select-none">
                {day.count}
              </span>
              <div className="w-full max-w-[28px] bg-surface-sunken rounded-t-md overflow-hidden flex items-end h-full">
                <div
                  className={`w-full rounded-t-md transition-all duration-300 ${
                    day.isToday ? "bg-accent-purple" : "bg-stone-300 dark:bg-stone-700"
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <span className={`text-[11px] font-medium mt-2 select-none ${day.isToday ? "text-fg font-bold" : "text-fg-muted"}`}>
                {day.dayLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
