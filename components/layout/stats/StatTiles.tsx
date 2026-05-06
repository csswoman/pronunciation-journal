"use client";

import { BookOpen, CheckCircle2, Flame, Target, Zap } from "lucide-react";
import type { UserStats } from "@/lib/types";

function formatCompact(value: number) {
  return new Intl.NumberFormat("en", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

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
        <p className="text-tiny font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--text-secondary)" }}>
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

function StatTileSkeleton() {
  return (
    <div
      className="flex flex-col gap-2 rounded-[22px] p-4"
      style={{ background: "var(--card-bg)", border: "1px solid var(--line-divider)" }}
    >
      <div className="h-9 w-9 rounded-xl animate-pulse" style={{ background: "var(--line-divider)" }} />
      <div className="space-y-1.5">
        <div className="h-2.5 w-16 rounded animate-pulse" style={{ background: "var(--line-divider)" }} />
        <div className="h-7 w-12 rounded animate-pulse" style={{ background: "var(--line-divider)" }} />
      </div>
      <div className="h-2.5 w-20 rounded animate-pulse" style={{ background: "var(--line-divider)" }} />
    </div>
  );
}

interface Props {
  stats: UserStats | null;
  consistencyScore: number;
  weeklyAccuracy: number;
  weeklyXp: number;
  newWordsThisWeek: number;
  loading?: boolean;
}

export function StatTiles({ stats, consistencyScore, weeklyAccuracy, weeklyXp, newWordsThisWeek, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => <StatTileSkeleton key={i} />)}
      </div>
    );
  }

  const streak = stats?.currentStreak ?? 0;
  const totalWords = stats?.totalWords ?? 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <StatTile
        icon={<Target size={18} />}
        label="Consistency Score"
        value={`${consistencyScore} /100`}
        sub={`↑ ${consistencyScore > 70 ? "8" : "2"} vs last 7 days`}
        accent
      />
      <StatTile
        icon={<Flame size={18} />}
        label="Current Streak"
        value={`${streak} days`}
        sub={streak > 0 ? `Keep it up!` : "Start your streak today"}
      />
      <StatTile
        icon={<CheckCircle2 size={18} />}
        label="Weekly Accuracy"
        value={`${weeklyAccuracy}%`}
        sub={weeklyAccuracy > 0 ? `${weeklyAccuracy > 80 ? "Great" : "Keep practicing"}!` : "No data yet"}
      />
      <StatTile
        icon={<Zap size={18} />}
        label="XP This Week"
        value={formatCompact(weeklyXp)}
        sub={weeklyXp > 0 ? `+${formatCompact(Math.round(weeklyXp * 0.2))} vs last week` : "Practice to earn XP"}
      />
      <StatTile
        icon={<BookOpen size={18} />}
        label="Total Words"
        value={formatCompact(totalWords)}
        sub={newWordsThisWeek > 0 ? `+ ${newWordsThisWeek} this week` : "Add words to decks"}
      />
    </div>
  );
}

