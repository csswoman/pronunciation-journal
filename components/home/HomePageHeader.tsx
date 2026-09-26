"use client";

// Planned structure:
// <HomePageHeader>
//   greeting + retention (incl. streak as text signal, not a header button)
// </HomePageHeader>

import PageHeader from "@/components/layout/PageHeader";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { isPermanentUser } from "@/lib/auth/is-anonymous";
import type { DailyGoalProgress } from "@/lib/home/constants";

interface HomePageHeaderProps {
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

function buildSubtitle(week: number, isNewLearner: boolean): string | undefined {
  if (week > 0) return `${week} min esta semana`;
  if (isNewLearner) {
    return "Tu plan de hoy es el camino más corto — empieza cuando quieras.";
  }
  return undefined;
}

/** Canonical home header. */
export default function HomePageHeader({
  weekMinutes,
  dailyGoal = null,
  isNewLearner = false,
}: HomePageHeaderProps) {
  const { user } = useAuth();
  const { preferences } = useUserPreferences();

  const metadataName =
    typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
  const fullName = preferences?.full_name || metadataName || user?.email?.split("@")[0] || null;
  const userName = isPermanentUser(user) && fullName ? fullName.split(" ")[0] : null;

  const week = weekMinutes ?? dailyGoal?.weekMinutes ?? 0;
  const greeting = getGreeting();

  const title = userName ? `${greeting}, ${userName}` : greeting;
  const subtitle = buildSubtitle(week, isNewLearner);

  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
    />
  );
}
