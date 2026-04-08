"use client";

import type { DailyProgress, UserStats } from "@/lib/types";

interface StatsSectionProps {
  stats: UserStats | null;
  todayProgress: DailyProgress | null;
  progressHistory: DailyProgress[];
}

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function StatsSection({ stats, todayProgress, progressHistory }: StatsSectionProps) {
  const today = new Date().toISOString().split("T")[0];
  const last7Days = getLast7Days();

  const progressMap = new Map(progressHistory.map((p) => [p.date, p]));

  const barData = last7Days.map((date) => ({
    date,
    label: DAY_LABELS[new Date(date + "T12:00:00").getDay()],
    attempts: progressMap.get(date)?.totalAttempts ?? 0,
    accuracy: progressMap.get(date)?.averageAccuracy ?? 0,
    isToday: date === today,
  }));

  const maxAttempts = Math.max(...barData.map((d) => d.attempts), 1);

  const WEEKLY_GOAL = 5;
  const daysPracticed = barData.filter((d) => d.attempts > 0).length;
  const goalPercent = Math.min(daysPracticed / WEEKLY_GOAL, 1);

  // Donut chart
  const RADIUS = 38;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeDash = CIRCUMFERENCE * goalPercent;
  const strokeGap = CIRCUMFERENCE - strokeDash;

  const streak = stats?.currentStreak ?? 0;
  const accuracy = stats?.averageAccuracy ?? 0;
  const xp = stats?.totalXP ?? 0;
  const todayWords = todayProgress?.wordsStudied.length ?? 0;

  const miniStats = [
    { icon: "🔥", label: "Day Streak", value: streak, suffix: "", bg: "#FFF3E0", color: "#C07800" },
    { icon: "🎯", label: "Accuracy", value: accuracy, suffix: "%", bg: "#E0F5EE", color: "#0F7A56" },
    { icon: "⚡", label: "XP Earned", value: xp, suffix: "", bg: "#EEE8FF", color: "#6B3FD4" },
    { icon: "📚", label: "Today's Words", value: todayWords, suffix: "", bg: "#FFE8EE", color: "#C0294A" },
  ];

  const deckStats = [
    { icon: "🗂️", label: "My Decks", value: stats?.totalDecks ?? 0, suffix: "", bg: "#E8F4FD", color: "#1565C0" },
    { icon: "📖", label: "Total Words", value: stats?.totalDeckWords ?? 0, suffix: "", bg: "#F3E8FF", color: "#6B21A8" },
    { icon: "⏰", label: "Due Today", value: stats?.deckWordsDueToday ?? 0, suffix: "", bg: "#FFF8E1", color: "#B45309" },
  ];

  return (
    <div className="space-y-4">
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Weekly Activity Bar Chart */}
        <div
          className="lg:col-span-2 rounded-2xl p-5"
          style={{
            background: "var(--card-bg)",
            boxShadow: "0 1px 3px var(--line-divider), 0 4px 12px var(--line-divider)",
          }}
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-wider mb-1"
            style={{ color: "var(--text-secondary)" }}
          >
            Weekly Activity
          </p>
          <p className="text-xs mb-5" style={{ color: "var(--text-tertiary)" }}>
            Exercises completed each day
          </p>

          {/* Bars */}
          <div className="flex items-end gap-1.5 h-32 px-1">
            {barData.map((d) => {
              const barH = d.attempts > 0 ? Math.max((d.attempts / maxAttempts) * 104, 12) : 5;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                  {/* Attempt count label */}
                  <span
                    className="text-[10px] font-semibold leading-none"
                    style={{ color: d.isToday ? "var(--primary)" : "var(--text-tertiary)", minHeight: 14 }}
                  >
                    {d.attempts > 0 ? d.attempts : ""}
                  </span>

                  {/* Bar */}
                  <div className="w-full relative flex items-end" style={{ height: 104 }}>
                    <div
                      className="w-full rounded-t-lg transition-all duration-500"
                      style={{
                        height: barH,
                        background: d.isToday
                          ? "var(--primary)"
                          : d.attempts > 0
                          ? "oklch(.75 .12 var(--hue, 250))"
                          : "var(--line-divider)",
                        opacity: d.isToday ? 1 : d.attempts > 0 ? 0.55 : 0.4,
                      }}
                    />
                  </div>

                  {/* Day label */}
                  <span
                    className="text-[10px] font-medium"
                    style={{
                      color: d.isToday ? "var(--primary)" : "var(--text-tertiary)",
                      fontWeight: d.isToday ? 700 : 500,
                    }}
                  >
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: "1px solid var(--line-divider)" }}>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--primary)" }} />
              <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "oklch(.75 .12 var(--hue, 250))", opacity: 0.55 }} />
              <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--line-divider)", opacity: 0.4 }} />
              <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>No activity</span>
            </div>
          </div>
        </div>

        {/* Weekly Goal Donut */}
        <div
          className="rounded-2xl p-5 flex flex-col"
          style={{
            background: "var(--card-bg)",
            boxShadow: "0 1px 3px var(--line-divider), 0 4px 12px var(--line-divider)",
          }}
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-wider mb-1"
            style={{ color: "var(--text-secondary)" }}
          >
            Weekly Goal
          </p>
          <p className="text-xs mb-4" style={{ color: "var(--text-tertiary)" }}>
            Active days this week
          </p>

          {/* Ring */}
          <div className="flex flex-col items-center flex-1 justify-center">
            <div className="relative">
              <svg width="110" height="110" viewBox="0 0 110 110">
                {/* Track */}
                <circle
                  cx="55" cy="55" r={RADIUS}
                  fill="none"
                  stroke="var(--line-divider)"
                  strokeWidth="11"
                />
                {/* Progress */}
                {strokeDash > 0 && (
                  <circle
                    cx="55" cy="55" r={RADIUS}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="11"
                    strokeDasharray={`${strokeDash} ${strokeGap}`}
                    strokeLinecap="round"
                    transform="rotate(-90 55 55)"
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-2xl font-extrabold leading-none"
                  style={{ color: "var(--text-primary)" }}
                >
                  {daysPracticed}
                  <span className="text-sm font-medium" style={{ color: "var(--text-tertiary)" }}>
                    /{WEEKLY_GOAL}
                  </span>
                </span>
                <span className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                  days
                </span>
              </div>
            </div>

            <p
              className="text-xs text-center mt-3 font-medium"
              style={{ color: daysPracticed >= WEEKLY_GOAL ? "#0F7A56" : "var(--text-secondary)" }}
            >
              {daysPracticed >= WEEKLY_GOAL
                ? "Weekly goal reached!"
                : `${WEEKLY_GOAL - daysPracticed} more day${WEEKLY_GOAL - daysPracticed !== 1 ? "s" : ""} to reach goal`}
            </p>
          </div>

          {/* Mini progress steps */}
          <div className="flex gap-1.5 mt-4 justify-center">
            {Array.from({ length: WEEKLY_GOAL }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-1.5 rounded-full transition-all"
                style={{
                  background: i < daysPracticed ? "var(--primary)" : "var(--line-divider)",
                  opacity: i < daysPracticed ? 1 : 0.5,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Mini stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {miniStats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl px-4 py-3.5 flex items-center gap-3"
            style={{ background: s.bg }}
          >
            <span className="text-2xl">{s.icon}</span>
            <div>
              <div
                className="font-extrabold text-xl leading-none tracking-tight"
                style={{ color: s.color }}
              >
                {s.value}
                {s.suffix && (
                  <span className="text-sm font-semibold opacity-70">{s.suffix}</span>
                )}
              </div>
              <div
                className="text-[11px] font-medium mt-0.5"
                style={{ color: s.color, opacity: 0.72 }}
              >
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Decks stats row */}
      <div className="space-y-2">
        <p
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-secondary)" }}
        >
          Decks
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {deckStats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl px-4 py-3.5 flex items-center gap-3"
              style={{ background: s.bg }}
            >
              <span className="text-2xl">{s.icon}</span>
              <div>
                <div
                  className="font-extrabold text-xl leading-none tracking-tight"
                  style={{ color: s.color }}
                >
                  {s.value}
                  {s.suffix && (
                    <span className="text-sm font-semibold opacity-70">{s.suffix}</span>
                  )}
                </div>
                <div
                  className="text-[11px] font-medium mt-0.5"
                  style={{ color: s.color, opacity: 0.72 }}
                >
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
