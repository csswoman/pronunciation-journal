// Planned structure:
// <HomeCommandGrid>
//   <HomeCommandMain>
//     <HomeDailyCard />
//   </HomeCommandMain>
//   <HomeCommandAside>
//     <WeakSoundCard />
//     <HomeWordOfDayCard />
//   </HomeCommandAside>
//   <HomeCommandFooter>
//     <HomeLearnRow />
//     <Core1000ProgressCard />
//   </HomeCommandFooter>
// </HomeCommandGrid>

import type { ReactNode } from "react";
import HomeDailyCard from "@/components/home/HomeDailyCard";
import HomeLearnRow from "@/components/home/HomeLearnRow";
import Core1000ProgressCard from "@/components/home/Core1000ProgressCard";
import WeakSoundCard from "@/components/home/WeakSoundCard";
import HomeWordOfDayCard from "@/components/home/HomeWordOfDayCard";
import type { ConceptLesson } from "@/hooks/useDailyPlan";
import type { WeakestPhonemeHome } from "@/lib/home/constants";
import type { MiniLesson } from "@/lib/content/schemas";

interface HomeCommandGridProps {
  conceptLesson: ConceptLesson | null;
  weakestPhoneme?: WeakestPhonemeHome | null;
  todaysLesson: MiniLesson | null;
  secondaryLesson?: MiniLesson | null;
  dailyCard?: ReactNode;
}

export default function HomeCommandGrid({
  conceptLesson,
  weakestPhoneme = null,
  todaysLesson,
  secondaryLesson = null,
  dailyCard,
}: HomeCommandGridProps) {
  return (
    <div className="home-command-grid">
      <div className="home-command-main">
        {dailyCard ?? <HomeDailyCard conceptLesson={conceptLesson} />}
      </div>
      <aside className="home-command-aside">
        <WeakSoundCard weakestPhoneme={weakestPhoneme} />
        <HomeWordOfDayCard />
      </aside>
      <div className="home-command-footer">
        <HomeLearnRow primary={todaysLesson} secondary={secondaryLesson} />
        <Core1000ProgressCard />
      </div>
    </div>
  );
}
