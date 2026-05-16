"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useSoundProgress } from "@/hooks/useSoundProgress";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import HomeHeaderGreeting from "@/components/home/HomeHeaderGreeting";
import HomeHeaderActions from "@/components/home/HomeHeaderActions";
import CardsDueWidget from "@/components/home/CardsDueWidget";
import TaskProgressRing from "@/components/home/TaskProgressRing";

// TODO: replace with real data from hooks
const CARDS_DUE = 12;
const CARDS_DONE = 4;
const TASKS_COMPLETED = 2;
const TASKS_TOTAL = 5;

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
    <div className="relative overflow-hidden rounded-2xl p-5 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center bg-gradient-to-br from-surface-raised to-surface-sunken">
      <div className="relative z-10 flex flex-col gap-4">
        <HomeHeaderGreeting userName={userName} dateLabel={dateLabel} />
        <HomeHeaderActions hasStartedLearning={hasStartedLearning} />
      </div>

      <div className="relative z-10 flex items-center justify-end gap-4">
        <CardsDueWidget due={CARDS_DUE} done={CARDS_DONE} />
        <TaskProgressRing completed={TASKS_COMPLETED} total={TASKS_TOTAL} />
      </div>
    </div>
  );
}
