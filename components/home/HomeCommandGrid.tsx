"use client";

// Planned structure:
// <HomeCommandGrid>
//   <HomeCommandReview />     — full-width strip
//   <HomeCommandMain>
//     <HomeDailyCard />
//     <HomeLearnRow />        — under plan (fills left)
//   </HomeCommandMain>
//   <HomeCommandAside>
//     Pronunciación → Core → WOTD
//   </HomeCommandAside>
// </HomeCommandGrid>

import { useCallback, useState } from "react";
import HomeDailyCard from "@/components/home/HomeDailyCard";
import HomeReviewBanner from "@/components/home/HomeReviewBanner";
import HomeLearnRow from "@/components/home/HomeLearnRow";
import Core1000ProgressCard from "@/components/home/Core1000ProgressCard";
import WeakSoundCard from "@/components/home/WeakSoundCard";
import HomeWordOfDayCard from "@/components/home/HomeWordOfDayCard";
import HomePlacementPrompt from "@/components/home/HomePlacementPrompt";
import HomePronunciationPrompt from "@/components/home/HomePronunciationPrompt";
import type { ConceptLesson } from "@/hooks/useDailyPlan";
import type { WeakestPhonemeHome } from "@/lib/home/constants";
import type { MiniLesson } from "@/lib/content/schemas";
import type { HomePlacementState } from "@/lib/home/placement-state";
import type { HomePronunciationDiagnosticState } from "@/lib/home/pronunciation-diagnostic-state";

interface HomeCommandGridProps {
  conceptLesson: ConceptLesson | null;
  weakestPhoneme?: WeakestPhonemeHome | null;
  todaysLesson: MiniLesson | null;
  secondaryLesson?: MiniLesson | null;
  wordsDueCount?: number;
  soundsDueCount?: number;
  placementState: HomePlacementState;
  pronunciationDiagnosticState: HomePronunciationDiagnosticState;
}

export default function HomeCommandGrid({
  conceptLesson,
  weakestPhoneme = null,
  todaysLesson,
  secondaryLesson = null,
  wordsDueCount = 0,
  soundsDueCount = 0,
  placementState,
  pronunciationDiagnosticState,
}: HomeCommandGridProps) {
  const [planEmpty, setPlanEmpty] = useState(false);
  const onPlanEmptyChange = useCallback((empty: boolean) => {
    setPlanEmpty(empty);
  }, []);

  const reviewDue = wordsDueCount + soundsDueCount > 0;
  const showPlacementSetup = !placementState.hasPlacement && !placementState.hasMeaningfulProgress;
  const showPlacementReminder = !placementState.hasPlacement && placementState.hasMeaningfulProgress;
  const showPronunciationSetup =
    !pronunciationDiagnosticState.hasPronunciationDiagnostic && !placementState.hasMeaningfulProgress;
  const showPronunciationReminder =
    !pronunciationDiagnosticState.hasPronunciationDiagnostic && placementState.hasMeaningfulProgress;

  return (
    <div className="home-command-grid">
      {reviewDue ? (
        <div className="home-command-review">
          <HomeReviewBanner
            wordsDueCount={wordsDueCount}
            soundsDueCount={soundsDueCount}
          />
        </div>
      ) : null}

      {showPlacementSetup ? (
        <div className="home-command-review">
          <HomePlacementPrompt />
        </div>
      ) : null}

      {showPronunciationSetup ? (
        <div className="home-command-review">
          <HomePronunciationPrompt />
        </div>
      ) : null}

      <div className="home-command-main">
        <HomeDailyCard
          conceptLesson={conceptLesson}
          reviewDue={reviewDue}
          onPlanEmptyChange={onPlanEmptyChange}
        />
        {!planEmpty ? (
          <HomeLearnRow primary={todaysLesson} secondary={secondaryLesson} />
        ) : null}
      </div>

      <aside className="home-command-aside" aria-label="Práctica sugerida">
        <WeakSoundCard weakestPhoneme={weakestPhoneme} />
        {!planEmpty ? (
          <>
            <Core1000ProgressCard />
            <HomeWordOfDayCard />
          </>
        ) : null}
        {showPlacementReminder ? <HomePlacementPrompt compact /> : null}
        {showPronunciationReminder ? <HomePronunciationPrompt compact /> : null}
      </aside>
    </div>
  );
}
