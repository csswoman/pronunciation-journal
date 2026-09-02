"use client";

import { Flame } from "@/components/icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { isPermanentUser } from "@/lib/auth/is-anonymous";

interface HomeHeaderProps {
  streakDays?: number;
}

function getGreeting(): "Buenos días" | "Buenas tardes" | "Buenas noches" {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default function HomeHeader({ streakDays = 0 }: HomeHeaderProps) {
  const { user } = useAuth();
  const { preferences } = useUserPreferences();

  const metadataName =
    typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
  const fullName = preferences?.full_name || metadataName || user?.email?.split("@")[0] || null;
  const userName = isPermanentUser(user) && fullName ? fullName.split(" ")[0] : null;

  const greeting = getGreeting();
  const greetingText = userName ? `${greeting}, ${userName}` : greeting;

  return (
    <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="font-body-sm text-fg-muted">{greetingText}</span>
        <h1 className="font-heading text-heading-lg font-bold text-fg">Tu sesión de hoy</h1>
      </div>

      {/* Streak lives here as a single quiet marker; the daily-minutes goal and
          vocabulary/review counts have their own homes (sidebar + HomeStatsRow),
          so the header no longer restates them. */}
      {streakDays > 0 ? (
        <div className="flex shrink-0 items-center gap-1.5 self-center rounded-lg border border-border-subtle bg-surface-raised px-3 py-1.5 shadow-xs">
          <Flame size={16} className="text-racha" aria-hidden />
          <span className="font-sans text-body-sm font-bold tabular-nums text-fg">
            {streakDays}
          </span>
          <span className="font-body-sm text-fg-muted">
            {streakDays === 1 ? "día de racha" : "días de racha"}
          </span>
        </div>
      ) : null}
    </header>
  );
}
