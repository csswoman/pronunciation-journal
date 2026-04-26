"use client";

import type { DailyProgress, UserStats } from "@/lib/types";
import { SoundGrid } from "@/components/phoneme-practice/SoundGrid";
import WordsToday from "@/components/progress/WordsToday";
import { useSoundProgress } from "@/hooks/useSoundProgress";
import { StatTiles } from "@/components/layout/stats/StatTiles";
import { WeeklyChart, deriveWeeklySummary } from "@/components/layout/stats/WeeklyChart";
import { NeedsAttention } from "@/components/layout/stats/NeedsAttention";
import { TodayActivity } from "@/components/layout/stats/TodayActivity";
import { AllTimeStats } from "@/components/layout/stats/AllTimeStats";
import { GuestBanner } from "@/components/layout/stats/GuestBanner";

interface StatsSectionProps {
  stats: UserStats | null;
  todayProgress: DailyProgress | null | undefined;
  progressHistory: DailyProgress[];
  userId?: string;
  loading?: boolean;
}

export default function StatsSection({ stats, todayProgress, progressHistory, userId, loading }: StatsSectionProps) {
  const { progressList } = useSoundProgress(userId);

  // Guest: show CTA banner with blurred preview
  if (!userId) {
    return <GuestBanner />;
  }

  const { weeklyAccuracy, weeklyXp, consistencyScore } = deriveWeeklySummary(progressHistory);

  // Count new words studied this week across all days
  const newWordsThisWeek = progressHistory.reduce((acc, day) => acc + (day.wordsStudied?.length ?? 0), 0);

  const words = todayProgress?.wordsStudied ?? [];

  return (
    <div className="space-y-4">

      {/* Row 1: Top stat tiles */}
      <StatTiles
        stats={stats}
        consistencyScore={consistencyScore}
        weeklyAccuracy={weeklyAccuracy}
        weeklyXp={weeklyXp}
        newWordsThisWeek={newWordsThisWeek}
        loading={loading}
      />

      {/* Row 2: Weekly chart + Needs attention */}
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <WeeklyChart progressHistory={progressHistory} />
        <NeedsAttention progressList={progressList} weeklyAccuracy={weeklyAccuracy} />
      </div>

      {/* Row 3: Sound grid + Words today — only when there's data */}
      {(progressList.length > 0 || words.length > 0) && (
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
          <WordsToday words={words} />
        </div>
      )}

      {/* Row 4: Today's activity + All-time stats */}
      <div className="grid gap-4 lg:grid-cols-2">
        <TodayActivity todayProgress={todayProgress} />
        <AllTimeStats stats={stats} />
      </div>

      {/* Row 5: Tip banner */}
      <TipBanner progressList={progressList} weeklyAccuracy={weeklyAccuracy} />

    </div>
  );
}

function TipBanner({
  progressList,
  weeklyAccuracy,
}: {
  progressList: ReturnType<typeof useSoundProgress>["progressList"];
  weeklyAccuracy: number;
}) {
  // Pick the weakest practiced sound for the tip
  const weakest = progressList
    .filter((p) => p.total_attempts > 0 && p.status !== "mastered")
    .map((p) => ({
      ...p,
      accuracy: Math.round((p.correct_answers / p.total_attempts) * 100),
    }))
    .sort((a, b) => a.accuracy - b.accuracy)[0];

  const tipText = weakest
    ? `Focus on the /${weakest.sounds.ipa}/ sound this week — you're at ${weakest.accuracy}% accuracy.`
    : weeklyAccuracy < 70
    ? "Try practicing phoneme exercises daily to boost your weekly accuracy."
    : "Great work! Keep your streak going by practicing a little each day.";

  return (
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
          {tipText}
        </p>
      </div>
      <button
        className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
        style={{ background: "color-mix(in oklch, var(--primary) 15%, transparent)", color: "var(--primary)" }}
        onClick={() => window.location.href = "/practice"}
      >
        Start a practice session
      </button>
    </div>
  );
}
