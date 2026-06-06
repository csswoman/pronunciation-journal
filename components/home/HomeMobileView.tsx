// Planned structure:
// <HomeMobileView>
//   <HomeHeaderGreeting />
//   <HomeQuickActionsGrid />
//   <HomeDailyCard />
//   <HomeStreakCard />
//   <HomeReviewCarousel />
// </HomeMobileView>

import HomeHeaderGreeting from "@/components/home/HomeHeaderGreeting";
import HomeQuickActionsGrid from "@/components/home/HomeQuickActionsGrid";
import HomeDailyCard from "@/components/home/HomeDailyCard";
import HomeStreakCard from "@/components/home/HomeStreakCard";
import HomeReviewCarousel from "@/components/home/HomeReviewCarousel";
import type { DailyStreakResult } from "@/lib/daily/streak";
import type { WordBankEntry } from "@/lib/word-bank/types";
import type { SoundDueHome } from "@/lib/home/constants";
import type { ConceptLesson } from "@/hooks/useDailyPlan";

interface HomeMobileViewProps {
  userName: string;
  dateLabel: string;
  streak?: DailyStreakResult;
  conceptLesson?: ConceptLesson | null;
  words?: WordBankEntry[];
  dueCount?: number;
  soundsDue?: SoundDueHome[];
}

export default function HomeMobileView({
  userName,
  dateLabel,
  streak,
  conceptLesson = null,
  words,
  dueCount,
  soundsDue,
}: HomeMobileViewProps) {
  return (
    <div className="flex flex-col gap-6 pt-2 pb-24">
      <HomeHeaderGreeting userName={userName} dateLabel={dateLabel} />
      <HomeQuickActionsGrid />
      <HomeDailyCard conceptLesson={conceptLesson} />
      <HomeStreakCard streak={streak} />
      <HomeReviewCarousel words={words} dueCount={dueCount} soundsDue={soundsDue} />
    </div>
  );
}
