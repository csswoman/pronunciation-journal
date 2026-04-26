"use client";

import type { UserStats } from "@/lib/types";

function formatCompact(value: number) {
  return new Intl.NumberFormat("en", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

function MetricRow({ label, value, colored, highlight }: { label: string; value: string; colored?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid var(--line-divider)" }}>
      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span
        className="text-sm font-bold"
        style={{ color: highlight ? "oklch(0.65 0.18 30)" : colored ? "var(--primary)" : "var(--deep-text)" }}
      >
        {value}
      </span>
    </div>
  );
}

interface Props {
  stats: UserStats | null;
}

export function AllTimeStats({ stats }: Props) {
  const totalXp = stats?.totalXP ?? 0;
  const totalAttempts = stats?.totalAttempts ?? 0;
  const overallAccuracy = stats?.averageAccuracy ?? 0;
  const streak = stats?.currentStreak ?? 0;
  const longestStreak = stats?.longestStreak ?? 0;
  const totalDecks = stats?.totalDecks ?? 0;
  const totalDeckWords = stats?.totalDeckWords ?? 0;
  const dueToday = stats?.deckWordsDueToday ?? 0;

  const isEmpty = totalAttempts === 0 && totalXp === 0;

  return (
    <div
      className="rounded-[26px] p-5"
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--line-divider)",
        boxShadow: "0 1px 3px var(--line-divider), 0 8px 20px var(--line-divider)",
      }}
    >
      <p className="text-base font-bold mb-1" style={{ color: "var(--deep-text)" }}>All-time stats</p>

      {isEmpty ? (
        <p className="text-sm mt-3" style={{ color: "var(--text-secondary)" }}>
          Your stats will appear here after your first practice session.
        </p>
      ) : (
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
      )}
    </div>
  );
}
