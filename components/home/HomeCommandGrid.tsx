"use client";

// Planned structure:
// <HomeCommandGrid>
//   <HomeCommandReview />     — review | first-visit activation
//   <HomeCommandMain>
//     <HomeDailyCard />
//     <HomeLearnRow />
//   </HomeCommandMain>
//   <HomeCommandAside />
// </HomeCommandGrid>

import { useCallback, useState } from "react";
import HomeDailyCard from "@/components/home/HomeDailyCard";
import HomeReviewBanner from "@/components/home/HomeReviewBanner";
import HomeLearnRow from "@/components/home/HomeLearnRow";
import EssentialWordsProgressCard from "@/components/home/EssentialWordsProgressCard";
import WeakSoundCard from "@/components/home/WeakSoundCard";
import HomeWordOfDayCard from "@/components/home/HomeWordOfDayCard";
import HomePlacementPrompt from "@/components/home/HomePlacementPrompt";
import HomePronunciationPrompt from "@/components/home/HomePronunciationPrompt";
import HomeActivationStrip from "@/components/home/HomeActivationStrip";
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
  const [planSettled, setPlanSettled] = useState(false);
  const onPlanStatusChange = useCallback((next: { empty: boolean; settled: boolean }) => {
    setPlanEmpty(next.empty);
    setPlanSettled(next.settled);
  }, []);

  const reviewDue = wordsDueCount + soundsDueCount > 0;
  const isNewLearner = !placementState.hasMeaningfulProgress;
  const needsPlacement = !placementState.hasPlacement;
  const needsPronunciation = !pronunciationDiagnosticState.hasPronunciationDiagnostic;
  // Empty plan + no review + no practice yet → one activation path to value.
  const showActivation = planSettled && !reviewDue && planEmpty && isNewLearner;
  // Full-width assessment banners only if somehow empty without activation path.
  const setupOwnsFold = planSettled && !reviewDue && planEmpty && !showActivation;
  const showPlacementBanner = needsPlacement && setupOwnsFold;
  const showPronunciationBanner = needsPronunciation && setupOwnsFold;
  // Aside reminders when plan/review owns the fold (or after activation is done).
  const showPlacementAside =
    planSettled && needsPlacement && !showPlacementBanner && !showActivation;
  const showPronunciationAside =
    planSettled && needsPronunciation && !showPronunciationBanner && !showActivation;
  const showPlanExtras = planSettled && !planEmpty;

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

      {showActivation ? (
        <div className="home-command-review">
          <HomeActivationStrip
            showPlacementLink={needsPlacement}
            showPronunciationLink={needsPronunciation}
          />
        </div>
      ) : null}

      {showPlacementBanner ? (
        <div className="home-command-review">
          <HomePlacementPrompt />
        </div>
      ) : null}

      {showPronunciationBanner ? (
        <div className="home-command-review">
          <HomePronunciationPrompt demoteCta={showPlacementBanner} />
        </div>
      ) : null}

      <div className="home-command-main">
        <HomeDailyCard
          conceptLesson={conceptLesson}
          reviewDue={reviewDue}
          isNewLearner={isNewLearner}
          showFirstSessionHint={showPlanExtras && isNewLearner && !reviewDue}
          onPlanStatusChange={onPlanStatusChange}
        />
        {showPlanExtras ? (
          <HomeLearnRow primary={todaysLesson} secondary={secondaryLesson} />
        ) : null}
      </div>

      <aside className="home-command-aside" aria-label="Práctica sugerida">
        <WeakSoundCard weakestPhoneme={weakestPhoneme} />
        {showPlanExtras ? (
          <>
            <EssentialWordsProgressCard />
            <HomeWordOfDayCard />
          </>
        ) : null}
        {showPlacementAside ? <HomePlacementPrompt compact /> : null}
        {showPronunciationAside ? <HomePronunciationPrompt compact /> : null}
      </aside>
    </div>
  );
}
