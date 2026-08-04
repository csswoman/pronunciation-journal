"use client";

// Planned structure:
// <HomeCommandGrid>
//   review strip
//   main: plan + word-of-day  OR  HomePlanDone when practice complete
//   aside: journal · speak · pronunciation · vocab
// </HomeCommandGrid>

import { useCallback, useState } from "react";
import HomeDailyCard, { type HomePlanStatus } from "@/components/home/HomeDailyCard";
import HomeReviewBanner from "@/components/home/HomeReviewBanner";
import EssentialWordsProgressCard from "@/components/home/EssentialWordsProgressCard";
import WeakSoundCard from "@/components/home/WeakSoundCard";
import HomeWordOfDayCard from "@/components/home/HomeWordOfDayCard";
import HomeJournalCard from "@/components/home/HomeJournalCard";
import HomeSpeakPrompt from "@/components/home/HomeSpeakPrompt";
import HomePlanDone from "@/components/home/HomePlanDone";
import HomePlacementPrompt from "@/components/home/HomePlacementPrompt";
import HomePronunciationPrompt from "@/components/home/HomePronunciationPrompt";
import HomeActivationStrip from "@/components/home/HomeActivationStrip";
import type { ConceptLesson } from "@/hooks/useDailyPlan";
import type { WeakestPhonemeHome } from "@/lib/home/constants";
import type { HomePlacementState } from "@/lib/home/placement-state";
import type { HomePronunciationDiagnosticState } from "@/lib/home/pronunciation-diagnostic-state";
import type { SessionArc } from "@/lib/practice/types";

interface HomeCommandGridProps {
  conceptLesson: ConceptLesson | null;
  weakestPhoneme?: WeakestPhonemeHome | null;
  wordsDueCount?: number;
  soundsDueCount?: number;
  streak?: number | null;
  placementState: HomePlacementState;
  pronunciationDiagnosticState: HomePronunciationDiagnosticState;
}

export default function HomeCommandGrid({
  conceptLesson,
  weakestPhoneme = null,
  wordsDueCount = 0,
  soundsDueCount = 0,
  streak = null,
  placementState,
  pronunciationDiagnosticState,
}: HomeCommandGridProps) {
  const [planEmpty, setPlanEmpty] = useState(false);
  const [planSettled, setPlanSettled] = useState(false);
  const [reviewIsEntry, setReviewIsEntry] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const [arc, setArc] = useState<SessionArc | undefined>(undefined);
  const [stepCount, setStepCount] = useState(0);

  const onPlanStatusChange = useCallback((next: HomePlanStatus) => {
    setPlanEmpty(next.empty);
    setPlanSettled(next.settled);
    setReviewIsEntry(next.reviewIsEntry);
    setAllDone(next.allDone);
    setArc(next.arc);
    setStepCount(next.stepCount);
  }, []);

  const reviewDue = wordsDueCount + soundsDueCount > 0;
  const showReviewBanner = reviewDue && planSettled && !reviewIsEntry;
  const isNewLearner = !placementState.hasMeaningfulProgress;
  const needsPlacement = !placementState.hasPlacement;
  const needsPronunciation = !pronunciationDiagnosticState.hasPronunciationDiagnostic;
  const showActivation = planSettled && !reviewDue && planEmpty && isNewLearner;
  const setupOwnsFold = planSettled && !reviewDue && planEmpty && !showActivation;
  const showPlacementBanner = needsPlacement && setupOwnsFold;
  const showPronunciationBanner = needsPronunciation && setupOwnsFold;
  const showPlacementAside =
    planSettled && needsPlacement && !showPlacementBanner && !showActivation;
  const showPronunciationAside =
    planSettled && needsPronunciation && !showPronunciationBanner && !showActivation;
  const showPlanExtras = planSettled && !planEmpty;
  const showPostPlan = showPlanExtras && allDone;

  return (
    <div className="home-command-grid">
      {showReviewBanner ? (
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
        {/* Keep mounted so allDone keeps updating; hide when post-plan owns the column. */}
        <div className={showPostPlan ? "hidden" : "contents"}>
          <HomeDailyCard
            conceptLesson={conceptLesson}
            reviewDue={showReviewBanner}
            isNewLearner={isNewLearner}
            showFirstSessionHint={showPlanExtras && isNewLearner && !reviewDue}
            onPlanStatusChange={onPlanStatusChange}
          />
        </div>

        {showPostPlan ? (
          <section
            aria-label="Plan completo"
            className="rounded-xl border border-border-subtle bg-daily-card px-[var(--layout-card-pad)] py-[var(--layout-card-pad)]"
          >
            <HomePlanDone stepCount={stepCount} arc={arc} streak={streak} />
          </section>
        ) : null}

        {showPlanExtras ? <HomeWordOfDayCard /> : null}
      </div>

      <aside className="home-command-aside" aria-label="Práctica sugerida">
        {planSettled ? <HomeJournalCard /> : null}
        {showPlanExtras && !allDone ? <HomeSpeakPrompt arc={arc} /> : null}
        <WeakSoundCard weakestPhoneme={weakestPhoneme} />
        {showPlanExtras ? <EssentialWordsProgressCard /> : null}
        {showPlacementAside ? <HomePlacementPrompt compact /> : null}
        {showPronunciationAside ? <HomePronunciationPrompt compact /> : null}
      </aside>
    </div>
  );
}
