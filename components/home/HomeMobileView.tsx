// Planned structure:
// <HomeMobileView>
//   <HomeHeaderGreeting />
//   <HomeQuickActionsGrid />
//   <HomeDailyCard />
//   <HomeStreakCard />
// </HomeMobileView>

import HomeHeaderGreeting from "@/components/home/HomeHeaderGreeting";
import HomeQuickActionsGrid from "@/components/home/HomeQuickActionsGrid";
import HomeDailyCard from "@/components/home/HomeDailyCard";
import HomeStreakCard from "@/components/home/HomeStreakCard";
import type { DailyStreakResult } from "@/lib/daily/streak";
import type { ConceptLesson } from "@/hooks/useDailyPlan";

interface HomeMobileViewProps {
  userName: string;
  dateLabel: string;
  streak?: DailyStreakResult;
  conceptLesson?: ConceptLesson | null;
}

export default function HomeMobileView({
  userName,
  dateLabel,
  streak,
  conceptLesson = null,
}: HomeMobileViewProps) {
  return (
    <div className="flex flex-col gap-6 pt-2 pb-24">
      <HomeHeaderGreeting userName={userName} dateLabel={dateLabel} />
      <HomeQuickActionsGrid />
      <HomeDailyCard conceptLesson={conceptLesson} />
      <HomeStreakCard streak={streak} />
    </div>
  );
}
