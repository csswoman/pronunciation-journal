"use client";

import { useMemo } from "react";
import ProgressInsights from "@/components/layout/ProgressInsights";
import ProgressOverview from "@/components/layout/ProgressOverview";
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
const WEEKLY_GOAL = 5;

export default function StatsSection({ stats, todayProgress, progressHistory }: StatsSectionProps) {
  const summary = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const last7Days = getLast7Days();
    const progressMap = new Map(progressHistory.map((p) => [p.date, p]));

    const barData = last7Days.map((date) => {
      const day = progressMap.get(date);

      return {
        date,
        label: DAY_LABELS[new Date(`${date}T12:00:00`).getDay()],
        attempts: day?.totalAttempts ?? 0,
        accuracy: day?.averageAccuracy ?? 0,
        xp: day?.xp ?? 0,
        isToday: date === today,
      };
    });

    const maxAttempts = Math.max(...barData.map((day) => day.attempts), 1);
    const daysPracticed = barData.filter((day) => day.attempts > 0).length;
    const weeklyAttempts = barData.reduce((sum, day) => sum + day.attempts, 0);
    const weeklyXp = barData.reduce((sum, day) => sum + day.xp, 0);
    const weeklyAccuracyDays = barData.filter((day) => day.attempts > 0);
    const weeklyAccuracy = weeklyAccuracyDays.length
      ? Math.round(weeklyAccuracyDays.reduce((sum, day) => sum + day.accuracy, 0) / weeklyAccuracyDays.length)
      : 0;
    const todayAttempts = todayProgress?.totalAttempts ?? 0;
    const todayCorrect = todayProgress?.correctAttempts ?? 0;
    const todayAccuracy = todayProgress?.averageAccuracy ?? 0;
    const todayXp = todayProgress?.xp ?? 0;
    const todayWords = todayProgress?.wordsStudied ?? [];
    const consistencyScore = Math.round(
      Math.min(daysPracticed / WEEKLY_GOAL, 1) * 60 + Math.min(weeklyAccuracy, 100) * 0.4
    );

    return {
      barData,
      consistencyScore,
      daysPracticed,
      maxAttempts,
      todayAccuracy,
      todayAttempts,
      todayCorrect,
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

  return (
    <div className="space-y-5">
      <ProgressOverview
        barData={summary.barData}
        consistencyScore={summary.consistencyScore}
        currentStreak={streak}
        longestStreak={longestStreak}
        maxAttempts={summary.maxAttempts}
        todayAccuracy={summary.todayAccuracy}
        todayAttempts={summary.todayAttempts}
        todayCorrect={summary.todayCorrect}
        todayWords={summary.todayWords}
        todayXp={summary.todayXp}
        totalXp={totalXp}
        weeklyAttempts={summary.weeklyAttempts}
      />

      <ProgressInsights
        currentStreak={streak}
        dueToday={dueToday}
        overallAccuracy={overallAccuracy}
        todayAccuracy={summary.todayAccuracy}
        todayAttempts={summary.todayAttempts}
        todayCorrect={summary.todayCorrect}
        totalAttempts={totalAttempts}
        totalDecks={totalDecks}
        totalDeckWords={totalDeckWords}
        totalWords={totalWords}
        totalXp={totalXp}
        weeklyAccuracy={summary.weeklyAccuracy}
        weeklyAttempts={summary.weeklyAttempts}
        weeklyGoal={summary.daysPracticed}
        weeklyXp={summary.weeklyXp}
      />
    </div>
  );
}
