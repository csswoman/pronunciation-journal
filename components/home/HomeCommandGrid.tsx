// Planned structure:
// <HomeCommandGrid>
//   <HomeCommandMain>
//     <HomeDailyCard />
//     <HomeLearnRow />
//   </HomeCommandMain>
//   <HomeCommandAside>
//     <Core1000ProgressCard />
//     <WeakSoundCard />
//     <HomeWordOfDayCard />
//     <HomeAiPracticeCard />
//   </HomeCommandAside>
// </HomeCommandGrid>

import type { ReactNode } from "react";
import HomeDailyCard from "@/components/home/HomeDailyCard";
import HomeLearnRow from "@/components/home/HomeLearnRow";
import Core1000ProgressCard from "@/components/home/Core1000ProgressCard";
import WeakSoundCard from "@/components/home/WeakSoundCard";
import HomeWordOfDayCard from "@/components/home/HomeWordOfDayCard";
import HomeAiPracticeCard from "@/components/home/HomeAiPracticeCard";
import type { ConceptLesson } from "@/hooks/useDailyPlan";
import type { WeakestPhonemeHome } from "@/lib/home/constants";
import type { MiniLesson, LanguageConcept } from "@/lib/content/schemas";

interface HomeCommandGridProps {
  conceptLesson: ConceptLesson | null;
  weakestPhoneme?: WeakestPhonemeHome | null;
  todaysLesson: MiniLesson | null;
  todaysConcept: LanguageConcept | null;
  dailyCard?: ReactNode;
}

export default function HomeCommandGrid({
  conceptLesson,
  weakestPhoneme = null,
  todaysLesson,
  todaysConcept,
  dailyCard,
}: HomeCommandGridProps) {
  return (
    <div className="home-command-grid">
      <div className="home-command-main">
        {dailyCard ?? <HomeDailyCard conceptLesson={conceptLesson} />}
        <HomeLearnRow lesson={todaysLesson} concept={todaysConcept} />
      </div>
      <aside className="home-command-aside">
        <Core1000ProgressCard />
        <WeakSoundCard weakestPhoneme={weakestPhoneme} />
        <HomeWordOfDayCard />
        <HomeAiPracticeCard />
      </aside>
    </div>
  );
}
