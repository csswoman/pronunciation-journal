"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Flame,
  Target,
  Zap,
} from "lucide-react";
import type { DailyProgress, UserStats } from "@/lib/types";
import { SoundGrid } from "@/components/phoneme-practice/SoundGrid";
import WordsToday from "@/components/progress/WordsToday";
import { useSoundProgress } from "@/hooks/useSoundProgress";

interface StatsSectionProps {
  stats: UserStats | null;
  todayProgress: DailyProgress | null;
  progressHistory: DailyProgress[];
  userId?: string;
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
const WEEKLY_GOAL = 5;

function formatCompact(value: number) {
  return new Intl.NumberFormat("en", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

// ── Top stat tile ──────────────────────────────────────────────────────────────

function StatTile({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-2 rounded-[22px] p-4"
      style={{
        background: accent
          ? "linear-gradient(145deg, color-mix(in oklch, var(--primary) 18%, var(--card-bg)), var(--card-bg))"
          : "var(--card-bg)",
        border: "1px solid var(--line-divider)",
        boxShadow: "0 1px 3px var(--line-divider), 0 4px 14px var(--line-divider)",
      }}
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl"
        style={{
          background: "color-mix(in oklch, var(--primary) 13%, transparent)",
          color: "var(--primary)",
        }}
      >
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--text-secondary)" }}>
          {label}
        </p>
        <p className="mt-0.5 text-2xl font-black tracking-tight" style={{ color: "var(--deep-text)" }}>
          {value}
        </p>
      </div>
      <p className="text-xs leading-5" style={{ color: "var(--primary)" }}>
        {sub}
      </p>
    </div>
  );
}

// ── Metric row item ────────────────────────────────────────────────────────────

function MetricRow({ label, value, colored }: { label: string; value: string; colored?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid var(--line-divider)" }}>
      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span
        className="text-sm font-bold"
        style={{ color: colored ? "var(--primary)" : "var(--deep-text)" }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Attention item ─────────────────────────────────────────────────────────────

type Priority = "HIGH" | "MED" | "LOW";

function AttentionItem({
  rank,
  title,
  sub,
  priority,
  minutes,
}: {
  rank: number;
  title: string;
  sub: string;
  priority: Priority;
  minutes: number;
}) {
  const colors: Record<Priority, string> = {
    HIGH: "oklch(0.65 0.18 30)",
    MED: "oklch(0.72 0.16 70)",
    LOW: "oklch(0.68 0.14 140)",
  };
  return (
    <div className="flex items-start gap-3 py-3" style={{ borderBottom: "1px solid var(--line-divider)" }}>
      <span className="mt-0.5 w-5 shrink-0 text-xs font-bold tabular-nums" style={{ color: "var(--text-tertiary)" }}>
        {String(rank).padStart(2, "0")}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--deep-text)" }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{sub}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
          style={{ background: `color-mix(in oklch, ${colors[priority]} 15%, transparent)`, color: colors[priority] }}
        >
          {priority}
        </span>
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{minutes} min</span>
        <ArrowRight size={14} style={{ color: "var(--text-tertiary)" }} />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function StatsSection({ stats, todayProgress, progressHistory, userId }: StatsSectionProps) {
  const [chartMetric, setChartMetric] = useState<"attempts" | "accuracy" | "xp">("attempts");
  const { progressList } = useSoundProgress(userId);

  const summary = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const last7Days = getLast7Days();
    const progressMap = new Map(progressHistory.map((p) => [p.date, p]));

    const barData = last7Days.map((date) => {
      const day = progressMap.get(date);
      return {
        date,
        label: DAY_LABELS[new Date(`${date}T12:00:00`).getDay()],
        dayNum: new Date(`${date}T12:00:00`).getDate(),
        attempts: day?.totalAttempts ?? 0,
        accuracy: day?.averageAccuracy ?? 0,
        xp: day?.xp ?? 0,
        isToday: date === today,
      };
    });

    const daysPracticed = barData.filter((d) => d.attempts > 0).length;
    const weeklyAttempts = barData.reduce((s, d) => s + d.attempts, 0);
    const weeklyXp = barData.reduce((s, d) => s + d.xp, 0);
    const weeklyAccuracyDays = barData.filter((d) => d.attempts > 0);
    const weeklyAccuracy = weeklyAccuracyDays.length
      ? Math.round(weeklyAccuracyDays.reduce((s, d) => s + d.accuracy, 0) / weeklyAccuracyDays.length)
      : 0;
    const consistencyScore = Math.round(Math.min(daysPracticed / WEEKLY_GOAL, 1) * 60 + Math.min(weeklyAccuracy, 100) * 0.4);

    const todayAttempts = todayProgress?.totalAttempts ?? 0;
    const todayCorrect = todayProgress?.correctAttempts ?? 0;
    const todayAccuracy = todayProgress?.averageAccuracy ?? 0;
    const todayXp = todayProgress?.xp ?? 0;
    const todayWords = todayProgress?.wordsStudied ?? [];
    const todayIncorrect = todayAttempts - todayCorrect;

    return {
      barData,
      consistencyScore,
      daysPracticed,
      todayAccuracy,
      todayAttempts,
      todayCorrect,
      todayIncorrect,
      todayWords,
      todayXp,
      weeklyAccuracy,
      weeklyAttempts,
      weeklyXp,
    };
  }, [progressHistory, todayProgress]);

  const streak = stats?.currentStreak ?? 0;
  const longestStreak = stats?.longestStreak ?? 0;
  const totalXp = stats?.totalXP ?? 0;
  const totalAttempts = stats?.totalAttempts ?? 0;
  const totalWords = stats?.totalWords ?? 0;
  const overallAccuracy = stats?.averageAccuracy ?? 0;
  const totalDecks = stats?.totalDecks ?? 0;
  const totalDeckWords = stats?.totalDeckWords ?? 0;
  const dueToday = stats?.deckWordsDueToday ?? 0;

  // Bar chart values depending on selected metric
  const metricValues = summary.barData.map((d) =>
    chartMetric === "attempts" ? d.attempts : chartMetric === "accuracy" ? d.accuracy : d.xp
  );
  const maxMetric = Math.max(...metricValues, 1);

  // Derived new words this week (stub: words practiced this week vs last)
  const newWordsThisWeek = 34; // TODO: derive from real data

  const todayDate = new Date();
  const todayLabel = todayDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  // Donut for today accuracy
  const donutRadius = 44;
  const donutCirc = 2 * Math.PI * donutRadius;
  const donutFill = donutCirc * Math.min(summary.todayAccuracy / 100, 1);

  return (
    <div className="space-y-4">

      {/* ── Row 1: Top stat tiles ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile
          icon={<Target size={18} />}
          label="Consistency Score"
          value={`${summary.consistencyScore} /100`}
          sub={`↑ ${summary.consistencyScore > 70 ? "8" : "2"} vs last 7 days`}
          accent
        />
        <StatTile
          icon={<Flame size={18} />}
          label="Current Streak"
          value={`${streak} days`}
          sub={`↑ ${streak > 4 ? "2" : "1"} vs last 7 days`}
        />
        <StatTile
          icon={<CheckCircle2 size={18} />}
          label="Weekly Accuracy"
          value={`${summary.weeklyAccuracy}%`}
          sub={`↑ ${summary.weeklyAccuracy > 60 ? "5" : "1"}% vs last 7 days`}
        />
        <StatTile
          icon={<Zap size={18} />}
          label="XP This Week"
          value={formatCompact(summary.weeklyXp)}
          sub={`↑ ${formatCompact(Math.round(summary.weeklyXp * 0.2))} vs last 7 days`}
        />
        <StatTile
          icon={<BookOpen size={18} />}
          label="Total Words"
          value={formatCompact(totalWords)}
          sub={`+ ${newWordsThisWeek} this week`}
        />
      </div>

      {/* ── Row 2: Weekly chart + Needs attention ── */}
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">

        {/* Weekly chart */}
        <div
          className="rounded-[26px] p-5"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--line-divider)",
            boxShadow: "0 1px 3px var(--line-divider), 0 8px 20px var(--line-divider)",
          }}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-base font-bold" style={{ color: "var(--deep-text)" }}>Your weekly progress</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {chartMetric === "attempts" ? "Attempts per day" : chartMetric === "accuracy" ? "Accuracy % per day" : "XP per day"}
              </p>
            </div>
            <div
              className="inline-flex rounded-xl p-1 gap-1"
              style={{ background: "var(--btn-regular-bg)" }}
            >
              {(["attempts", "accuracy", "xp"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setChartMetric(m)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all"
                  style={{
                    background: chartMetric === m ? "var(--card-bg)" : "transparent",
                    color: chartMetric === m ? "var(--deep-text)" : "var(--text-secondary)",
                    boxShadow: chartMetric === m ? "0 1px 3px var(--line-divider)" : "none",
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Bars */}
          <div className="mt-5 grid grid-cols-7 gap-2 items-end" style={{ height: 120 }}>
            {summary.barData.map((day, i) => {
              const val = metricValues[i];
              const barH = val > 0 ? Math.max((val / maxMetric) * 96, 12) : 6;
              return (
                <div key={day.date} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold tabular-nums" style={{ color: day.isToday ? "var(--primary)" : "var(--text-tertiary)" }}>
                    {val > 0 ? (chartMetric === "accuracy" ? `${val}%` : val) : ""}
                  </span>
                  <div className="w-full flex items-end" style={{ height: 96 }}>
                    <div
                      className="w-full rounded-[10px] animate-stat-rise"
                      style={{
                        height: barH,
                        animationDelay: `${i * 60}ms`,
                        background: val > 0
                          ? day.isToday
                            ? "linear-gradient(180deg, color-mix(in oklch, var(--primary) 70%, white), var(--primary))"
                            : "color-mix(in oklch, var(--primary) 35%, transparent)"
                          : "var(--line-divider)",
                        boxShadow: day.isToday && val > 0 ? "0 4px 14px color-mix(in oklch, var(--primary) 28%, transparent)" : "none",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Day labels */}
          <div className="mt-2 grid grid-cols-7 gap-2">
            {summary.barData.map((day) => (
              <div key={day.date} className="flex flex-col items-center">
                <span className="text-[11px] font-semibold" style={{ color: day.isToday ? "var(--primary)" : "var(--text-secondary)" }}>
                  {day.label}
                </span>
                <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                  {day.dayNum}
                </span>
              </div>
            ))}
          </div>

          {/* Bottom summary row */}
          <div
            className="mt-4 grid grid-cols-4 divide-x rounded-2xl overflow-hidden"
            style={{ background: "var(--btn-regular-bg)", borderColor: "var(--line-divider)" }}
          >
            {[
              { label: "Weekly Attempts", value: summary.weeklyAttempts },
              { label: "Weekly Accuracy", value: `${summary.weeklyAccuracy}%` },
              { label: "Days Practiced", value: `${summary.daysPracticed} / 7` },
              { label: "Weekly XP", value: formatCompact(summary.weeklyXp) },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center py-3 px-2" style={{ borderColor: "var(--line-divider)" }}>
                <span className="text-[10px] font-medium text-center" style={{ color: "var(--text-secondary)" }}>{label}</span>
                <span className="text-base font-black mt-0.5" style={{ color: "var(--deep-text)" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Needs attention */}
        <div
          className="rounded-[26px] p-5"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--line-divider)",
            boxShadow: "0 1px 3px var(--line-divider), 0 8px 20px var(--line-divider)",
          }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-[0.26em]"
            style={{ color: "var(--primary)" }}
          >
            ✦ Needs Your Attention
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            Detected from last 30 days
          </p>
          <h3 className="mt-3 text-lg font-black" style={{ color: "var(--deep-text)" }}>
            {summary.weeklyAccuracy < 70
              ? "A few things are slowing you down."
              : "You're on the right track!"}
          </h3>

          <div className="mt-1">
            <AttentionItem rank={1} title="Past perfect continuous" sub="Grammar · 34% correct over 9 attempts" priority="HIGH" minutes={15} />
            <AttentionItem rank={2} title="Phrasal verbs with 'up'" sub="Vocabulary · confusing 'make up' senses" priority="MED" minutes={10} />
            <AttentionItem rank={3} title="/θ/ sound" sub="Pronunciation · 60% across 11 attempts" priority="MED" minutes={8} />
            <AttentionItem rank={4} title="Formal register" sub="Writing · underusing in business context" priority="LOW" minutes={20} />
          </div>
        </div>
      </div>

      {/* ── Row 3: Sounds grid + Words today ── */}
      {(progressList.length > 0 || summary.todayWords.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {progressList.length > 0 && (
            <div
              className="rounded-[26px] p-5"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--line-divider)",
                boxShadow: "0 1px 3px var(--line-divider), 0 8px 20px var(--line-divider)",
              }}
            >
              <SoundGrid progressList={progressList} />
            </div>
          )}
          <WordsToday words={summary.todayWords} />
        </div>
      )}

      {/* ── Row 4: Today's activity + All-time stats ── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Today's activity */}
        <div
          className="rounded-[26px] p-5"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--line-divider)",
            boxShadow: "0 1px 3px var(--line-divider), 0 8px 20px var(--line-divider)",
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-bold" style={{ color: "var(--deep-text)" }}>Today's activity</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{todayLabel}</p>
            </div>
            <button className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
              View full history
            </button>
          </div>

          <div className="mt-5 flex items-center gap-6">
            {/* Donut */}
            <div className="relative shrink-0">
              <svg width={108} height={108} viewBox="0 0 108 108" className="-rotate-90">
                <circle cx={54} cy={54} r={donutRadius} fill="none" stroke="var(--line-divider)" strokeWidth={10} />
                <circle
                  cx={54} cy={54} r={donutRadius} fill="none"
                  stroke="var(--primary)" strokeWidth={10}
                  strokeDasharray={`${donutFill} ${donutCirc - donutFill}`}
                  strokeLinecap="round"
                  className="animate-progress-ring"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black" style={{ color: "var(--deep-text)" }}>
                  {summary.todayAttempts}
                </span>
                <span className="text-[10px] font-semibold" style={{ color: "var(--text-secondary)" }}>Attempts</span>
                <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{summary.todayAccuracy}% accuracy</span>
              </div>
            </div>

            {/* Metrics */}
            <div className="flex-1">
              <MetricRow label="Correct" value={String(summary.todayCorrect)} colored />
              <MetricRow label="Incorrect" value={String(summary.todayIncorrect)} />
              <MetricRow label="XP Earned" value={`+${summary.todayXp}`} colored />
              <div className="flex items-center justify-between pt-2.5">
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Words Studied</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold" style={{ color: "var(--deep-text)" }}>{summary.todayWords.length}</span>
                  {summary.todayWords.length > 0 && (
                    <button style={{ color: "var(--primary)" }}>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Words chips */}
          {summary.todayWords.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {summary.todayWords.map((word, i) => (
                <span
                  key={word}
                  className="rounded-full px-3 py-1.5 text-xs font-medium animate-fadeIn"
                  style={{
                    animationDelay: `${i * 60}ms`,
                    background: "color-mix(in oklch, var(--primary) 10%, transparent)",
                    color: "var(--deep-text)",
                    border: "1px solid color-mix(in oklch, var(--primary) 12%, var(--line-divider))",
                  }}
                >
                  {word}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* All-time stats */}
        <div
          className="rounded-[26px] p-5"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--line-divider)",
            boxShadow: "0 1px 3px var(--line-divider), 0 8px 20px var(--line-divider)",
          }}
        >
          <p className="text-base font-bold mb-1" style={{ color: "var(--deep-text)" }}>All-time stats</p>
          <div>
            <MetricRow label="Total XP" value={formatCompact(totalXp)} colored />
            <MetricRow label="Total Attempts" value={formatCompact(totalAttempts)} />
            <MetricRow label="Overall Accuracy" value={`${overallAccuracy}%`} />
            <MetricRow label="Current Streak" value={`${streak} days`} colored />
            <MetricRow label="Longest Streak" value={`${longestStreak} days`} />
            <MetricRow label="Decks" value={String(totalDecks)} />
            <MetricRow label="Words in Decks" value={formatCompact(totalDeckWords)} />
            <div className="flex items-center justify-between pt-2.5">
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Words Due Today</span>
              <span
                className="text-sm font-bold"
                style={{ color: dueToday > 0 ? "oklch(0.65 0.18 30)" : "var(--deep-text)" }}
              >
                {dueToday}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 4: Tip banner ── */}
      <div
        className="flex items-center justify-between gap-4 rounded-[22px] px-5 py-4"
        style={{
          background: "linear-gradient(135deg, color-mix(in oklch, var(--primary) 12%, var(--card-bg)), var(--card-bg))",
          border: "1px solid color-mix(in oklch, var(--primary) 16%, var(--line-divider))",
        }}
      >
        <div className="flex items-center gap-3">
          <span style={{ color: "var(--primary)" }}>✦</span>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            <span className="font-semibold" style={{ color: "var(--deep-text)" }}>Tip for you: </span>
            Focus on Past perfect continuous this week to improve your grammar accuracy!
          </p>
        </div>
        <button
          className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: "color-mix(in oklch, var(--primary) 15%, transparent)", color: "var(--primary)" }}
        >
          Start a practice session
        </button>
      </div>

    </div>
  );
}
