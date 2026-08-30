"use client";

// Planned structure:
// <HomeCommandGrid>
//   <TwoColumnGrid>
//     <Col1: HomeDailyCard (Hero + Plan + CTA fusionados) />
//     <Col2: HomeProgressSidebar (Tu progreso + Te tocan hoy) />
//     <Col1: HomeChunkOfDayCard (Frase del día alineada) />
//     <Col2: HomeWordOfDayCard (Palabra del día alineada) />
//   </TwoColumnGrid>
// </HomeCommandGrid>

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { isAnonymousUser } from "@/lib/auth/is-anonymous";
import type { HomePlanStatus } from "@/components/home/HomeDailyCard";
import HomeProgressSidebar from "@/components/home/HomeProgressSidebar";
import HomeReviewBanner from "@/components/home/HomeReviewBanner";
import HomePlanDone from "@/components/home/HomePlanDone";
import HomePlacementPrompt from "@/components/home/HomePlacementPrompt";
import HomePronunciationPrompt from "@/components/home/HomePronunciationPrompt";
import HomeActivationStrip from "@/components/home/HomeActivationStrip";
import HomeWordOfDayCard from "@/components/home/HomeWordOfDayCard";
import HomeChunkOfDayCard from "@/components/home/HomeChunkOfDayCard";
import GuestSaveProgressBanner from "@/components/home/GuestSaveProgressBanner";
import type { ConceptLesson } from "@/hooks/useDailyPlan";
import type { WeakestPhonemeHome } from "@/lib/home/constants";
import type { HomePlacementState } from "@/lib/home/placement-state";
import type { HomePronunciationDiagnosticState } from "@/lib/home/pronunciation-diagnostic-state";
import type { PrimaryAction } from "@/lib/home/primary-action";
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

const DEFAULT_PRIMARY_ACTION: PrimaryAction = {
  label: "Empezar · 12 min",
  href: "/daily",
  variant: "primary",
};

export interface HomeCommandGridProps {
  primaryAction?: PrimaryAction;
  conceptLesson: ConceptLesson | null;
  profileLevel?: string | null;
  weakestPhoneme?: WeakestPhonemeHome | null;
  wordsDueCount?: number;
  soundsDueCount?: number;
  streak?: number | null;
  previewWords?: Array<{ text: string }>;
  placementState: HomePlacementState;
  pronunciationDiagnosticState: HomePronunciationDiagnosticState;
}

export default function HomeCommandGrid({
  primaryAction = DEFAULT_PRIMARY_ACTION,
  conceptLesson,
  profileLevel = null,
  weakestPhoneme = null,
  wordsDueCount = 0,
  soundsDueCount = 0,
  streak = null,
  previewWords = [],
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
    <div className="flex flex-col gap-6">
      {/* Cuadrícula continua de 2 columnas (≥1024px) / 1 columna en móvil */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Fila 1 - Columna Principal: Tarjeta única Plan de hoy */}
        <div className="flex flex-col gap-4 min-w-0">
          {showReviewBanner ? (
            <HomeReviewBanner
              wordsDueCount={wordsDueCount}
              soundsDueCount={soundsDueCount}
            />
          ) : null}

          {showActivation ? (
            <HomeActivationStrip
              showPlacementLink={needsPlacement}
              showPronunciationLink={needsPronunciation}
              showGuestSaveInline={isGuest}
            />
          ) : null}

          <div className={showPostPlan ? "hidden" : "contents"}>
            <HomeDailyCard
              conceptLesson={conceptLesson}
              reviewDue={showReviewBanner}
              isNewLearner={isNewLearner}
              showFirstSessionHint={showPlanExtras && isNewLearner && !reviewDue}
              onPlanStatusChange={onPlanStatusChange}
              primaryAction={primaryAction}
              weakestPhoneme={weakestPhoneme}
            />
          </div>

          {showGuestSaveStrip ? <GuestSaveProgressBanner variant="footer" /> : null}

          {showPostPlan ? (
            <section
              aria-label="Plan completo"
              className="rounded-xl border border-border-subtle bg-daily-card p-5"
            >
              <HomePlanDone stepCount={stepCount} arc={arc} streak={streak} />
            </section>
          ) : null}

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
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              aria-label="Ajustes opcionales"
            >
              {needsPlacement ? <HomePlacementPrompt compact /> : null}
              {needsPronunciation ? <HomePronunciationPrompt compact /> : null}
            </div>
          ) : null}
        </div>

        {/* Fila 1 - Columna Lateral: Tu progreso + Te tocan hoy */}
        <HomeProgressSidebar
          profileLevel={profileLevel}
          streak={streak}
          wordsDueCount={wordsDueCount}
          soundsDueCount={soundsDueCount}
          previewWords={previewWords}
        />

        {/* Fila 2 - Tarjetas editoriales del día en sub-grid equilibrada de 2 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:col-span-2">
          <HomeChunkOfDayCard />
          <HomeWordOfDayCard profileLevel={profileLevel} />
        </div>
      </div>
    </div>
  );
}
