"use client";

// Planned structure:
// <HomeHeader>
//   <blob div /> (decorative)
//   <left col>
//     <HomeHeaderGreeting />
//     <stat pills: streak · accuracy · time />
//     <HomeHeaderActions />
//   </left col>
//   <right col>
//     <CardsDueWidget />
//     <TaskProgressRing />
//   </right col>
// </HomeHeader>

import { Flame, Target, Clock } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSoundProgress } from "@/hooks/useSoundProgress";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import HomeHeaderGreeting from "@/components/home/HomeHeaderGreeting";
import HomeHeaderActions from "@/components/home/HomeHeaderActions";
import CardsDueWidget from "@/components/home/CardsDueWidget";
import TaskProgressRing from "@/components/home/TaskProgressRing";

interface StatPillProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

function StatPill({ icon, value, label }: StatPillProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="icon-wrap-hue flex items-center justify-center w-7 h-7 rounded-lg shrink-0">
        {icon}
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[13px] font-semibold text-[var(--text-primary)]">{value}</span>
        <span className="text-[11px] text-[var(--text-tertiary)]">{label}</span>
      </span>
    </div>
  );
}

export default function HomeHeader() {
  const { user } = useAuth();
  const { progressList } = useSoundProgress(user?.id);
  const { preferences } = useUserPreferences();

  const fullName = preferences?.full_name || user?.email?.split("@")[0] || "Guest";
  const userName = fullName.split(" ")[0];
  const hasStartedLearning = progressList.length > 0;

  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  // No accuracy field available on progress objects; show placeholder
  const avgAccuracy = null;

  return (
    <div className="relative overflow-hidden rounded-2xl p-5 grid grid-cols-1 lg:grid-cols-2 gap-5 items-center bg-surface-raised border border-border-subtle">
      {/* Decorative hue blob — style prop required: radial-gradient with CSS var cannot be expressed as a Tailwind utility */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-60"
        style={{ background: "radial-gradient(circle, var(--hue-blob) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 flex flex-col gap-4">
        <HomeHeaderGreeting userName={userName} dateLabel={dateLabel} />

        <div className="flex items-center gap-5 flex-wrap">
          <StatPill
            icon={<Flame size={14} className="text-[var(--warning)]" />}
            value="—"
            label="day streak"
          />
          <StatPill
            icon={<Target size={14} className="text-[var(--success)]" />}
            value={avgAccuracy !== null ? `${avgAccuracy}%` : "—"}
            label="accuracy"
          />
          <StatPill
            icon={<Clock size={14} className="text-[var(--primary)]" />}
            value="—"
            label="today"
          />
        </div>

        <HomeHeaderActions hasStartedLearning={hasStartedLearning} />
      </div>

      <div className="relative z-10 flex items-center justify-end gap-4">
        <CardsDueWidget />
        <TaskProgressRing />
      </div>
    </div>
  );
}
