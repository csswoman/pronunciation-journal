"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { isAnonymousUser } from "@/lib/auth/is-anonymous";
import type { HomePlanStatus } from "@/components/home/HomeDailyCard";
import HomeHeader from "@/components/home/HomeHeader";
import HomeStatsRow from "@/components/home/HomeStatsRow";
import HomeImmersionCard from "@/components/home/HomeImmersionCard";
import HomeExtraExercisesAccordion from "@/components/home/HomeExtraExercisesAccordion";
import HomeRightSidebar from "@/components/home/HomeRightSidebar";
import HomeReviewBanner from "@/components/home/HomeReviewBanner";
import HomePlanDone from "@/components/home/HomePlanDone";
import HomePlacementPrompt from "@/components/home/HomePlacementPrompt";
import HomePronunciationPrompt from "@/components/home/HomePronunciationPrompt";
import HomeActivationStrip from "@/components/home/HomeActivationStrip";
import GuestSaveProgressBanner from "@/components/home/GuestSaveProgressBanner";
import type { ConceptLesson } from "@/hooks/useDailyPlan";
import type { WeakestPhonemeHome } from "@/lib/home/constants";
import type { HomePlacementState } from "@/lib/home/placement-state";
import type { HomePronunciationDiagnosticState } from "@/lib/home/pronunciation-diagnostic-state";
import type { PrimaryAction } from "@/lib/home/primary-action";
import type { SessionArc } from "@/lib/practice/types";

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
      {/* Encabezado con racha y tiempo diario */}
      <HomeHeader
        streakDays={streak ?? 0}
        minutesDone={0}
        goalMinutes={24}
      />

      {/* Cuadrícula principal de 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Columna Principal (Izquierda) */}
        <div className="flex flex-col gap-6 min-w-0">
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

          {/* Tira de estadísticas (Palabras esenciales + En repaso) */}
          <HomeStatsRow
            profileLevel={profileLevel}
            wordsDueCount={wordsDueCount}
            soundsDueCount={soundsDueCount}
          />

          {/* Tarjeta de Registro de inmersión */}
          <HomeImmersionCard />

          {/* Acordeón de Ejercicios extra */}
          <HomeExtraExercisesAccordion unlocked={allDone} />
        </div>

        {/* Sidebar Derecho (Frase del día, Palabra del día, Te tocan hoy) */}
        <HomeRightSidebar
          profileLevel={profileLevel}
          wordsDueCount={wordsDueCount}
          soundsDueCount={soundsDueCount}
          previewWords={previewWords}
        />
      </div>
    </div>
  );
}
