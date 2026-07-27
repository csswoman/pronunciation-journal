"use client";

// Planned structure:
// <HomePageHeader>
//   <PageHeader title={greeting} subtitle={retention | orientation} />
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
  /** True until the learner has real practice history. */
  isNewLearner?: boolean;
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

/** Canonical PageHeader for home — greeting + retention or first-visit orientation. */
export default function HomePageHeader({
  streak,
  wordsMastered = 0,
  weekMinutes,
  dailyGoal = null,
  isNewLearner = false,
}: HomePageHeaderProps) {
  const { user } = useAuth();
  const { preferences } = useUserPreferences();

  const isLoggedIn = user && !(user as { is_anonymous?: boolean }).is_anonymous;
  const metadataName =
    typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
  const fullName = preferences?.full_name || metadataName || user?.email?.split("@")[0] || null;
  const userName = isLoggedIn && fullName ? fullName.split(" ")[0] : null;

  const current = streak?.currentStreak ?? 0;
  const week = weekMinutes ?? dailyGoal?.weekMinutes ?? 0;
  const greeting = getGreeting();

  const title = userName ? `${greeting}, ${userName}` : greeting;
  const retention = buildRetentionSubtitle(current, wordsMastered, week);
  const subtitle =
    retention ??
    (isNewLearner
      ? "Tu plan de hoy es el camino más corto — empieza cuando quieras."
      : undefined);

  return <PageHeader title={title} subtitle={subtitle} />;
}
