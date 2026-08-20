"use client";

// Planned structure:
// <HomeCommandGrid>
//   review / activation (fold owners only)
//   main: focus + plan (+ done) · setup reminders only below plan
//   aside: word · chunk · vocab · pronunciation · speak · journal
// </HomeCommandGrid>

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/components/auth/AuthProvider";
import { isAnonymousUser } from "@/lib/auth/is-anonymous";
import type { HomePlanStatus } from "@/components/home/HomeDailyCard";
import HomeReviewBanner from "@/components/home/HomeReviewBanner";
import EssentialWordsProgressCard from "@/components/home/EssentialWordsProgressCard";
import WeakSoundCard from "@/components/home/WeakSoundCard";
import HomeWordOfDayCard from "@/components/home/HomeWordOfDayCard";
import HomeChunkOfDayCard from "@/components/home/HomeChunkOfDayCard";
import HomeJournalCard from "@/components/home/HomeJournalCard";
import HomeSpeakPrompt from "@/components/home/HomeSpeakPrompt";
import HomePlanDone from "@/components/home/HomePlanDone";
import HomePlacementPrompt from "@/components/home/HomePlacementPrompt";
import HomePronunciationPrompt from "@/components/home/HomePronunciationPrompt";
import HomeActivationStrip from "@/components/home/HomeActivationStrip";
import GuestSaveProgressBanner from "@/components/home/GuestSaveProgressBanner";
import type { ConceptLesson } from "@/hooks/useDailyPlan";
import type { WeakestPhonemeHome } from "@/lib/home/constants";
import type { HomePlacementState } from "@/lib/home/placement-state";
import type { HomePronunciationDiagnosticState } from "@/lib/home/pronunciation-diagnostic-state";
import type { SessionArc } from "@/lib/practice/types";

// Daily plan pulls buildDailyPlan + sync — keep it out of the initial page chunk.
const HomeDailyCard = dynamic(() => import("@/components/home/HomeDailyCard"), {
  loading: () => (
    <div
      className="h-44 animate-pulse rounded-xl border border-border-default bg-daily-card"
      aria-busy="true"
      aria-label="Cargando plan diario"
    />
  ),
});

const LearningFocusCard = dynamic(() => import("@/components/home/LearningFocusCard"), {
  loading: () => (
    <div className="h-20 animate-pulse rounded-xl border border-border-subtle bg-surface-raised" aria-hidden />
  ),
});

interface HomeCommandGridProps {
  conceptLesson: ConceptLesson | null;
  profileLevel: string | null;
  weakestPhoneme?: WeakestPhonemeHome | null;
  wordsDueCount?: number;
  soundsDueCount?: number;
  streak?: number | null;
  placementState: HomePlacementState;
  pronunciationDiagnosticState: HomePronunciationDiagnosticState;
}

export default function HomeCommandGrid({
  conceptLesson,
  profileLevel,
  weakestPhoneme = null,
  wordsDueCount = 0,
  soundsDueCount = 0,
  streak = null,
  placementState,
  pronunciationDiagnosticState,
}: HomeCommandGridProps) {
  const { user } = useAuth();
  const isGuest = isAnonymousUser(user);

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
  // Setup is optional — below the plan, never competing with editorial or practice.
  const showPlacementBelow =
    planSettled && needsPlacement && !showActivation;
  const showPronunciationBelow =
    planSettled && needsPronunciation && !showActivation;
  const showPlanExtras = planSettled && !planEmpty;
  const showPostPlan = showPlanExtras && allDone;
  const showDailyEditorial = planSettled;

  const showGuestSaveStrip = isGuest && planSettled && !showActivation;
  const showSetupBelow = showPlacementBelow || showPronunciationBelow;

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
            showGuestSaveInline={isGuest}
          />
        </div>
      ) : null}

      <div className="home-command-main">
        <LearningFocusCard
          profileLevel={profileLevel}
          routeLevel={null}
          recentTheoryLessonSlug={null}
          weakSoundKey={weakestPhoneme?.ipa ?? null}
        />

        <div className={showPostPlan ? "hidden" : "contents"}>
          <HomeDailyCard
            conceptLesson={conceptLesson}
            reviewDue={showReviewBanner}
            isNewLearner={isNewLearner}
            showFirstSessionHint={showPlanExtras && isNewLearner && !reviewDue}
            onPlanStatusChange={onPlanStatusChange}
          />
        </div>

        {showGuestSaveStrip ? <GuestSaveProgressBanner variant="footer" /> : null}

        {showPostPlan ? (
          <section
            aria-label="Plan completo"
            className="rounded-xl border border-border-subtle bg-daily-card px-[var(--layout-card-pad)] py-[var(--layout-card-pad)]"
          >
            <HomePlanDone stepCount={stepCount} arc={arc} streak={streak} />
          </section>
        ) : null}

        {showSetupBelow ? (
          <div className="home-command-below-plan" aria-label="Ajustes opcionales">
            {showPlacementBelow ? <HomePlacementPrompt compact /> : null}
            {showPronunciationBelow ? <HomePronunciationPrompt compact /> : null}
          </div>
        ) : null}
      </div>

      <aside className="home-command-aside" aria-label="Práctica sugerida">
        {showDailyEditorial ? (
          <>
            <HomeWordOfDayCard />
            <HomeChunkOfDayCard />
          </>
        ) : null}
        {showPlanExtras ? <EssentialWordsProgressCard /> : null}
        <WeakSoundCard weakestPhoneme={weakestPhoneme} />
        {showPlanExtras && !allDone ? <HomeSpeakPrompt arc={arc} /> : null}
        {planSettled ? <HomeJournalCard /> : null}
      </aside>
    </div>
  );
}
