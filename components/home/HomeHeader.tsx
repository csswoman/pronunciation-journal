"use client";

// Planned structure:
// <HomeHeader>
//   <blob div /> (decorative)
//   <left col>
//     <HomeHeaderGreeting />
//     <HomeHeaderActions />
//   </left col>
//   <right col>
//     <StatCard streak />
//     <StatCard accuracy />
//     <StatCard time />
//   </right col>
// </HomeHeader>

import { Flame, CircleCheck, Clock } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSoundProgress } from "@/hooks/useSoundProgress";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import HomeHeaderGreeting from "@/components/home/HomeHeaderGreeting";
import HomeHeaderActions from "@/components/home/HomeHeaderActions";

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[var(--surface-sunken)] px-4 py-3 min-w-[120px]">
      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--surface-raised)] shrink-0">
        {icon}
      </span>
      <span className="flex flex-col leading-none gap-0.5">
        <span className="text-[15px] font-bold text-[var(--text-primary)]">{value}</span>
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

  return (
    <div className="relative overflow-hidden rounded-2xl p-5 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5 items-center bg-surface-raised border border-border-subtle">
      {/* Decorative hue blob — style prop required: radial-gradient with CSS var cannot be expressed as a Tailwind utility */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-60"
        style={{ background: "radial-gradient(circle, var(--hue-blob) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 flex flex-col gap-4">
        <HomeHeaderGreeting
          userName={userName}
          dateLabel={dateLabel}
          exercisesReady={15}
          improvedPhoneme="θ"
          improvementPct={8}
        />
        <HomeHeaderActions hasStartedLearning={hasStartedLearning} />
      </div>

      <div className="relative z-10 flex flex-col gap-2 lg:items-end">
        <StatCard
          icon={<Flame size={15} className="text-[var(--warning)]" />}
          value="—"
          label="Day streak"
        />
        <StatCard
          icon={<CircleCheck size={15} className="text-[var(--success)]" />}
          value="—"
          label="Avg accuracy"
        />
        <StatCard
          icon={<Clock size={15} className="text-[var(--primary)]" />}
          value="—"
          label="This week"
        />
      </div>
    </div>
  );
}
