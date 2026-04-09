"use client";

import { useState } from "react";
import {
  Activity,
  BookOpen,
  Brain,
  CheckCircle2,
  Flame,
  Layers3,
  Target,
  TrendingUp,
} from "lucide-react";

type InsightTab = "momentum" | "performance" | "library";

interface ProgressInsightsProps {
  currentStreak: number;
  dueToday: number;
  overallAccuracy: number;
  todayAccuracy: number;
  todayAttempts: number;
  todayCorrect: number;
  totalAttempts: number;
  totalDecks: number;
  totalDeckWords: number;
  totalWords: number;
  totalXp: number;
  weeklyAccuracy: number;
  weeklyAttempts: number;
  weeklyGoal: number;
  weeklyXp: number;
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

function CircleMeter({ value, label, hint }: { value: number; label: string; hint: string }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.max(0, Math.min(value / 100, 1));
  const dash = circumference * percent;

  return (
    <div className="relative mx-auto h-[132px] w-[132px] animate-fadeIn">
      <svg width="132" height="132" viewBox="0 0 132 132" className="-rotate-90">
        <defs>
          <linearGradient id="insight-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="color-mix(in oklch, var(--primary) 70%, white)" />
            <stop offset="100%" stopColor="var(--primary)" />
          </linearGradient>
        </defs>
        <circle cx="66" cy="66" r={radius} fill="none" stroke="var(--line-divider)" strokeWidth="12" />
        <circle
          cx="66"
          cy="66"
          r={radius}
          fill="none"
          stroke="url(#insight-ring)"
          strokeWidth="12"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          className="animate-progress-ring"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-black tracking-tight" style={{ color: "var(--deep-text)" }}>
          {Math.round(value)}%
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--text-secondary)" }}>
          {label}
        </span>
        <span className="mt-1 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
          {hint}
        </span>
      </div>
    </div>
  );
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

export default function ProgressInsights({
  currentStreak,
  dueToday,
  overallAccuracy,
  todayAccuracy,
  todayAttempts,
  todayCorrect,
  totalAttempts,
  totalDecks,
  totalDeckWords,
  totalWords,
  totalXp,
  weeklyAccuracy,
  weeklyAttempts,
  weeklyGoal,
  weeklyXp,
}: ProgressInsightsProps) {
  const [activeTab, setActiveTab] = useState<InsightTab>("momentum");

  const tabs: Array<{ id: InsightTab; label: string; icon: React.ReactNode }> = [
    { id: "momentum", label: "Momentum", icon: <TrendingUp size={16} /> },
    { id: "performance", label: "Performance", icon: <Target size={16} /> },
    { id: "library", label: "Library", icon: <Layers3 size={16} /> },
  ];

  return (
    <div
      className="rounded-[30px] p-5 sm:p-6"
      style={{
        background: "var(--card-bg)",
        boxShadow: "0 1px 3px var(--line-divider), 0 10px 24px var(--line-divider)",
      }}
    >
      <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--line-divider)" }}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--primary)" }}>
            Insight Panels
          </p>
          <h3 className="mt-2 text-2xl font-black tracking-tight" style={{ color: "var(--deep-text)" }}>
            One card, three ways to read your progress
          </h3>
        </div>

        <div
          className="inline-flex w-full flex-wrap gap-2 rounded-2xl p-1 sm:w-auto"
          style={{ background: "var(--btn-regular-bg)" }}
        >
          {tabs.map((tab) => {
            const active = tab.id === activeTab;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200"
                style={{
                  background: active ? "var(--card-bg)" : "transparent",
                  color: active ? "var(--deep-text)" : "var(--text-secondary)",
                  boxShadow: active ? "0 1px 3px var(--line-divider)" : "none",
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "momentum" && (
        <div className="grid gap-4 pt-5 lg:grid-cols-3 animate-fadeIn">
          <MetricCard
            icon={<Flame size={18} />}
            label="Current streak"
            value={`${currentStreak}`}
            helper={`You have practiced ${weeklyGoal} of the last 7 days.`}
          />
          <MetricCard
            icon={<TrendingUp size={18} />}
            label="7-day average"
            value={`${weeklyAccuracy}%`}
            helper="A blended view of recent quality, so you can spot sustainable momentum."
          />
          <MetricCard
            icon={<Activity size={18} />}
            label="Weekly load"
            value={`${weeklyAttempts}`}
            helper={`${weeklyXp} XP collected this week across your practice sessions.`}
          />
        </div>
      )}

      {activeTab === "performance" && (
        <div className="grid gap-5 pt-5 lg:grid-cols-[0.85fr_1.15fr] animate-fadeIn">
          <div
            className="rounded-[26px] p-5"
            style={{
              background: "linear-gradient(180deg, color-mix(in oklch, var(--primary) 10%, transparent), transparent)",
              border: "1px solid var(--line-divider)",
            }}
          >
            <CircleMeter value={overallAccuracy} label="accuracy" hint="overall average" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard
              icon={<Target size={18} />}
              label="Today's accuracy"
              value={`${todayAccuracy}%`}
              helper={todayAttempts > 0 ? `${todayCorrect} correct answers out of ${todayAttempts}.` : "No performance data yet today."}
            />
            <MetricCard
              icon={<TrendingUp size={18} />}
              label="7-day average"
              value={`${weeklyAccuracy}%`}
              helper="Your recent quality trend over the last week."
            />
            <MetricCard
              icon={<CheckCircle2 size={18} />}
              label="Lifetime attempts"
              value={formatCompact(totalAttempts)}
              helper={`${formatCompact(totalWords)} studied words contributing to your history.`}
            />
            <MetricCard
              icon={<Brain size={18} />}
              label="Total XP"
              value={formatCompact(totalXp)}
              helper="A cumulative view of all your practice effort."
            />
          </div>
        </div>
      )}

      {activeTab === "library" && (
        <div className="grid gap-4 pt-5 lg:grid-cols-3 animate-fadeIn">
          <MetricCard
            icon={<Layers3 size={18} />}
            label="Decks"
            value={`${totalDecks}`}
            helper="Your active learning containers across the app."
          />
          <MetricCard
            icon={<BookOpen size={18} />}
            label="Saved words"
            value={formatCompact(totalDeckWords)}
            helper="Vocabulary already organized in your decks."
          />
          <MetricCard
            icon={<Activity size={18} />}
            label="Due today"
            value={`${dueToday}`}
            helper={dueToday > 0 ? "Cards ready for review when you want a focused session." : "Nothing urgent waiting for review right now."}
          />
        </div>
      )}
    </div>
  );
}
