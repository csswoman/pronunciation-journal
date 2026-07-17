"use client";

// Planned structure:
// <HomePageHeader>
//   <PageHeader title={greeting} subtitle={retention?} />
// </HomePageHeader>

import PageHeader from "@/components/layout/PageHeader";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import type { DailyStreakResult } from "@/lib/daily/streak-core";
import type { DailyGoalProgress } from "@/lib/home/constants";

interface HomePageHeaderProps {
  streak?: DailyStreakResult;
  wordsMastered?: number;
  weekMinutes?: number;
  dailyGoal?: DailyGoalProgress | null;
}

function getGreeting(): "Buenos días" | "Buenas tardes" | "Buenas noches" {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

/** Only non-zero retention — never "0 días · 0 dominadas" above the fold. */
function buildRetentionSubtitle(
  current: number,
  wordsMastered: number,
  week: number,
): string | undefined {
  const parts: string[] = [];

  if (current > 0) {
    parts.push(
      `${current} ${current === 1 ? "día seguido" : "días seguidos"}`,
    );
  }

  if (wordsMastered > 0) {
    parts.push(
      `${wordsMastered} ${wordsMastered === 1 ? "palabra dominada" : "palabras dominadas"}`,
    );
  }

  if (week > 0) {
    parts.push(`${week} min esta semana`);
  }

  return parts.length > 0 ? parts.join(" · ") : undefined;
}

/** Canonical PageHeader for home — greeting + quiet non-zero retention. */
export default function HomePageHeader({
  streak,
  wordsMastered = 0,
  weekMinutes,
  dailyGoal = null,
}: HomePageHeaderProps) {
  const { user } = useAuth();
  const { preferences } = useUserPreferences();

  const isLoggedIn = user && !(user as { is_anonymous?: boolean }).is_anonymous;
  const fullName = preferences?.full_name || user?.email?.split("@")[0] || null;
  const userName = isLoggedIn && fullName ? fullName.split(" ")[0] : null;

  const current = streak?.currentStreak ?? 0;
  const week = weekMinutes ?? dailyGoal?.weekMinutes ?? 0;
  const greeting = getGreeting();

  const title = userName ? `${greeting}, ${userName}` : greeting;
  const subtitle = buildRetentionSubtitle(current, wordsMastered, week);

  return <PageHeader title={title} subtitle={subtitle} />;
}
