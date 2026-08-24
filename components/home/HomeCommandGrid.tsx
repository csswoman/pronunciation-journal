"use client";

// Planned structure:
// <HomeCommandGrid>
//   review / activation (fold owners only)
//   main: plan (+ done) · quiet route link · phrase of the day
//   aside: pronunciation · word · vocab
// </HomeCommandGrid>

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { isAnonymousUser } from "@/lib/auth/is-anonymous";
import type { HomePlanStatus } from "@/components/home/HomeDailyCard";
import HomeReviewBanner from "@/components/home/HomeReviewBanner";
import EssentialWordsProgressCard from "@/components/home/EssentialWordsProgressCard";
import WeakSoundCard from "@/components/home/WeakSoundCard";
import HomeWordOfDayCard from "@/components/home/HomeWordOfDayCard";
import HomeChunkOfDayCard from "@/components/home/HomeChunkOfDayCard";
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
  const showPlanExtras = planSettled && !planEmpty;
  const showPostPlan = showPlanExtras && allDone;
  /** Active incomplete plan owns the fold — defer assessments / speak / guest save. */
  const activePlanSession = showPlanExtras && !allDone;

  const showSetupPair =
    planSettled &&
    !showActivation &&
    !activePlanSession &&
    (needsPlacement || needsPronunciation);
  const showQuietRouteLink =
    activePlanSession && (needsPlacement || needsPronunciation);
  const showGuestSaveStrip =
    isGuest && planSettled && !showActivation && (allDone || !isNewLearner);

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

        <div className="home-command-below-plan">
          {showQuietRouteLink ? (
            <p className="font-body-sm text-pretty text-fg-muted">
              Si quieres afinar la ruta primero:{" "}
              {needsPlacement ? (
                <Link
                  href="/assessment"
                  className="focus-ring font-medium text-fg underline-offset-2 hover:underline"
                >
                  prueba de nivel
                </Link>
              ) : null}
              {needsPlacement && needsPronunciation ? " · " : null}
              {needsPronunciation ? (
                <Link
                  href="/assessment/pronunciation"
                  className="focus-ring font-medium text-fg underline-offset-2 hover:underline"
                >
                  diagnóstico oral
                </Link>
              ) : null}
            </p>
          ) : null}

          {showSetupPair ? (
            <div
              className="home-command-setup-pair"
              aria-label="Ajustes opcionales"
            >
              {needsPlacement ? <HomePlacementPrompt compact /> : null}
              {needsPronunciation ? <HomePronunciationPrompt compact /> : null}
            </div>
          ) : null}

          <HomeChunkOfDayCard />
        </div>
      </div>

      <aside className="home-command-aside flex flex-col gap-4" aria-label="Práctica sugerida">
        <WeakSoundCard weakestPhoneme={weakestPhoneme} />
        <HomeWordOfDayCard profileLevel={profileLevel} />
        <EssentialWordsProgressCard profileLevel={profileLevel} />
      </aside>
    </div>
  );
}
