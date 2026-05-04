"use client";

import {
  BookOpen,
  Brain,
  CheckCircle2,
  Flame,
  Sparkles,
} from "lucide-react";
import AIEngagementWidget from "@/components/practice/AIEngagementWidget";

export interface ProgressDay {
  date: string;
  label: string;
  attempts: number;
  accuracy: number;
  xp: number;
  isToday: boolean;
}

interface ProgressOverviewProps {
  barData: ProgressDay[];
  consistencyScore: number;
  currentStreak: number;
  longestStreak: number;
  maxAttempts: number;
  todayAccuracy: number;
  todayAttempts: number;
  todayCorrect: number;
  todayWords: string[];
  todayXp: number;
  totalXp: number;
  weeklyAttempts: number;
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

function MetricCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div
      className="rounded-[22px] p-4"
      style={{
        background:
          "linear-gradient(180deg, color-mix(in oklch, var(--btn-regular-bg) 82%, var(--card-bg)), var(--card-bg))",
        border: "1px solid var(--line-divider)",
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl"
          style={{
            background: "color-mix(in oklch, var(--primary) 14%, transparent)",
            color: "var(--primary)",
          }}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-secondary)" }}>
            {label}
          </p>
          <p className="text-2xl font-black tracking-tight" style={{ color: "var(--deep-text)" }}>
            {value}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
        {helper}
      </p>
    </div>
  );
}

export default function ProgressOverview({
  barData,
  consistencyScore,
  currentStreak,
  longestStreak,
  maxAttempts,
  todayAccuracy,
  todayAttempts,
  todayCorrect,
  todayWords,
  todayXp,
  totalXp,
  weeklyAttempts,
}: ProgressOverviewProps) {
  return (
    <div
      className="overflow-hidden rounded-[30px] p-5 sm:p-6 lg:p-7"
      style={{
        background:
          "radial-gradient(circle at top right, color-mix(in oklch, var(--primary) 14%, transparent), transparent 34%), linear-gradient(180deg, var(--card-bg), color-mix(in oklch, var(--btn-regular-bg) 72%, var(--card-bg)))",
        boxShadow: "0 1px 3px var(--line-divider), 0 10px 26px var(--line-divider)",
      }}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-tiny font-semibold uppercase tracking-[0.28em]" style={{ color: "var(--primary)" }}>
              Progress Snapshot
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl" style={{ color: "var(--deep-text)" }}>
              Clear momentum, less noise.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-7 sm:text-body" style={{ color: "var(--text-secondary)" }}>
              Your progress now highlights rhythm, quality, and study load without repeating the same numbers in every block.
            </p>
          </div>

          <div
            className="min-w-[210px] rounded-[26px] p-4 animate-fadeIn"
            style={{
              background: "color-mix(in oklch, var(--primary) 10%, transparent)",
              border: "1px solid color-mix(in oklch, var(--primary) 18%, var(--line-divider))",
            }}
          >
            <div className="flex items-center gap-2">
              <Sparkles size={16} style={{ color: "var(--primary)" }} />
              <span className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--primary)" }}>
                Focus Today
              </span>
            </div>
            <p className="mt-3 text-3xl font-black tracking-tight" style={{ color: "var(--deep-text)" }}>
              {consistencyScore}
            </p>
            <p className="mt-1 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
              Consistency score based on active days and weekly accuracy.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            icon={<Flame size={18} />}
            label="Streak"
            value={`${currentStreak} days`}
            helper={longestStreak > currentStreak ? `Best streak: ${longestStreak} days.` : "You are matching your best pace."}
          />
          <MetricCard
            icon={<CheckCircle2 size={18} />}
            label="Today"
            value={`${todayCorrect}/${todayAttempts || 0}`}
            helper={todayAttempts > 0 ? `${todayAccuracy}% accuracy in today's practice.` : "No attempts logged today yet."}
          />
          <MetricCard
            icon={<Brain size={18} />}
            label="XP Flow"
            value={`+${todayXp}`}
            helper={`${formatCompact(totalXp)} total XP earned so far.`}
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div
            className="rounded-[26px] p-4 sm:p-5"
            style={{
              background: "color-mix(in oklch, var(--card-bg) 92%, var(--btn-regular-bg))",
              border: "1px solid var(--line-divider)",
            }}
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-secondary)" }}>
                  Weekly Activity
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                  Attempts over the last 7 days
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black tracking-tight" style={{ color: "var(--deep-text)" }}>
                  {weeklyAttempts}
                </p>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  weekly attempts
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-7 gap-2 sm:gap-3">
              {barData.map((day, index) => {
                const barHeight = day.attempts > 0
                  ? Math.max((day.attempts / maxAttempts) * 120, 18)
                  : 10;

                return (
                  <div key={day.date} className="flex min-w-0 flex-col items-center gap-2">
                    <span
                      className="text-tiny font-semibold"
                      style={{ color: day.isToday ? "var(--primary)" : "var(--text-tertiary)" }}
                    >
                      {day.attempts > 0 ? day.attempts : ""}
                    </span>
                    <div
                      className="flex w-full items-end rounded-[18px] px-1.5 py-1"
                      style={{
                        height: 140,
                        background: "linear-gradient(180deg, transparent, color-mix(in oklch, var(--primary) 4%, transparent))",
                      }}
                    >
                      <div
                        className="w-full rounded-[14px] animate-stat-rise"
                        style={{
                          height: `${barHeight}px`,
                          animationDelay: `${index * 70}ms`,
                          background: day.attempts > 0
                            ? day.isToday
                              ? "linear-gradient(180deg, color-mix(in oklch, var(--primary) 72%, var(--on-primary)), var(--primary))"
                              : "linear-gradient(180deg, color-mix(in oklch, var(--primary) 38%, var(--on-primary)), color-mix(in oklch, var(--primary) 72%, transparent))"
                            : "var(--line-divider)",
                          boxShadow: day.isToday
                            ? "0 10px 22px color-mix(in oklch, var(--primary) 18%, transparent)"
                            : "none",
                          opacity: day.attempts > 0 ? 1 : 0.55,
                        }}
                      />
                    </div>
                    <span
                      className="text-tiny font-semibold"
                      style={{ color: day.isToday ? "var(--primary)" : "var(--text-secondary)" }}
                    >
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div
              className="rounded-[26px] p-5"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--line-divider)",
                boxShadow: "0 1px 3px var(--line-divider), 0 8px 18px var(--line-divider)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-secondary)" }}>
                    Today's Vocabulary
                  </p>
                  <p className="mt-1 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
                    Quick glance at the words you touched today.
                  </p>
                </div>
                <div
                  className="flex h-10 min-w-10 items-center justify-center rounded-2xl animate-float-soft"
                  style={{
                    background: "color-mix(in oklch, var(--primary) 15%, transparent)",
                    color: "var(--primary)",
                  }}
                >
                  <BookOpen size={18} />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {todayWords.length > 0 ? (
                  todayWords.map((word, index) => (
                    <span
                      key={word}
                      className="rounded-full px-3 py-2 text-sm font-medium animate-fadeIn"
                      style={{
                        animationDelay: `${index * 80}ms`,
                        background: "color-mix(in oklch, var(--primary) 10%, transparent)",
                        color: "var(--deep-text)",
                        border: "1px solid color-mix(in oklch, var(--primary) 12%, var(--line-divider))",
                      }}
                    >
                      {word}
                    </span>
                  ))
                ) : (
                  <div
                    className="w-full rounded-2xl p-4 text-sm leading-6"
                    style={{
                      background: "var(--btn-regular-bg)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Start one practice block and your studied words will appear here.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <AIEngagementWidget />
      </div>
    </div>
  );
}

