"use client";

import { Flame } from "@/components/icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { isPermanentUser } from "@/lib/auth/is-anonymous";

interface HomeHeaderProps {
  streakDays?: number;
  minutesDone?: number;
  goalMinutes?: number;
}

function getGreeting(): "Buenos días" | "Buenas tardes" | "Buenas noches" {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default function HomeHeader({
  streakDays = 0,
  minutesDone = 0,
  goalMinutes = 24,
}: HomeHeaderProps) {
  const { user } = useAuth();
  const { preferences } = useUserPreferences();

  const metadataName =
    typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
  const fullName = preferences?.full_name || metadataName || user?.email?.split("@")[0] || null;
  const userName = isPermanentUser(user) && fullName ? fullName.split(" ")[0] : null;

  const greeting = getGreeting();
  const greetingText = userName ? `${greeting}, ${userName}` : greeting;

  return (
    <header className="flex items-start justify-between gap-4 py-2">
      <div className="flex flex-col gap-0.5">
        <span className="font-body-sm text-fg-muted">{greetingText}</span>
        <h1 className="font-heading text-heading-lg font-bold text-fg">Plan de hoy</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Streak badge */}
        <div className="flex items-center gap-1.5 rounded-lg bg-surface-raised border border-border-subtle px-3 py-1.5 shadow-xs">
          <Flame size={16} className="text-racha" aria-hidden />
          <span className="font-sans text-body-sm font-bold tabular-nums text-fg">
            {streakDays}
          </span>
          <span className="font-body-sm text-fg-muted">racha</span>
        </div>

        {/* Daily minutes target badge */}
        <div className="flex flex-col items-end rounded-lg bg-surface-raised border border-border-subtle px-3 py-1.5 shadow-xs">
          <div className="font-sans text-body-sm font-bold tabular-nums text-fg">
            {minutesDone}
            <span className="text-fg-muted">/{goalMinutes}</span>
          </div>
          <span className="font-label text-[11px] text-fg-muted">min hoy</span>
        </div>
      </div>
    </header>
  );
}
