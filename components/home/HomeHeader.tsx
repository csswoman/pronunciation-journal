"use client";

import { Flame, CircleCheck, Clock } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSoundProgress } from "@/hooks/useSoundProgress";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import HomeHeaderGreeting from "@/components/home/HomeHeaderGreeting";
import HomeHeaderActions from "@/components/home/HomeHeaderActions";
import StatCard from "@/components/home/StatCard";

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

      <div className="relative z-10 flex flex-row flex-wrap gap-2 lg:flex-col lg:items-end">
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
