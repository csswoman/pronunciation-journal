'use client'

// Planned structure:
// <HomeLayout>
//   [if session.mode === 'step'] <DailyStepSession />
//   [if session.mode === 'done'] <SessionRecapCard />
//   [if session.mode === 'idle'] <HomeCommandGrid />
// </HomeLayout>

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import HomeCommandGrid from "@/components/home/HomeCommandGrid";
import SessionRecapCard from "@/components/daily/SessionRecapCard";
import { useAuth } from "@/components/auth/AuthProvider";
import { useDailyPlan, type ConceptLesson } from "@/hooks/useDailyPlan";
import { useDailySessionRunner } from "@/hooks/useDailySessionRunner";
import type { DailyStreakResult } from "@/lib/daily/streak-core";
import type { DailyGoalProgress, WeakestPhonemeHome } from "@/lib/home/constants";
import type { PrimaryAction } from "@/lib/home/primary-action";
import type { VocabularyProgressSeed } from "@/lib/vocabulary/server-progress";
import type { MiniLesson } from "@/lib/content/schemas";
import type { HomePlacementState } from "@/lib/home/placement-state";
import type { HomePronunciationDiagnosticState } from "@/lib/home/pronunciation-diagnostic-state";

const DailyStepSession = dynamic(
  () => import('@/components/daily/DailyStepSession'),
  {
    loading: () => (
      <div className="p-8 text-center text-fg-muted font-caption">
        Cargando sesión…
      </div>
    ),
  },
)

interface HomeLayoutProps {
  streak?: DailyStreakResult;
  profileLevel?: string | null;
  wordsDueCount?: number;
  soundsDueCount?: number;
  conceptLesson?: ConceptLesson | null;
  dailyGoal?: DailyGoalProgress | null;
  weakestPhoneme?: WeakestPhonemeHome | null;
  vocabularyProgress?: VocabularyProgressSeed | null;
  todaysLesson?: MiniLesson | null;
  secondaryLesson?: MiniLesson | null;
  placementState: HomePlacementState;
  pronunciationDiagnosticState: HomePronunciationDiagnosticState;
  primaryAction: PrimaryAction;
  previewWords?: Array<{ text: string }>;
}

export default function HomeLayout({
  streak,
  profileLevel = null,
  wordsDueCount = 0,
  soundsDueCount = 0,
  conceptLesson = null,
  weakestPhoneme = null,
  placementState,
  pronunciationDiagnosticState,
  primaryAction,
  previewWords = [],
}: HomeLayoutProps) {
  const { user } = useAuth()
  const dailyPlan = useDailyPlan({
    conceptLesson,
    autoLoad: false,
  })

  useEffect(() => {
    if (user && dailyPlan.status === 'idle') void dailyPlan.load()
  }, [user, dailyPlan.status, dailyPlan.load])

  useEffect(() => {
    if (dailyPlan.allDone) dailyPlan.celebrate()
  }, [dailyPlan.allDone, dailyPlan.celebrate])

  const runner = useDailySessionRunner({
    steps: dailyPlan.steps,
    markDone: dailyPlan.markDone,
    getStepStatus: dailyPlan.getStepStatus,
  })

  const currentStreak = streak?.currentStreak ?? 0;

  if (runner.view.mode === 'step') {
    const { step, exerciseIndex } = runner.view
    const stepIndex = dailyPlan.steps.findIndex((s) => s.id === step.id)
    return (
      <DailyStepSession
        step={step}
        allSteps={dailyPlan.steps}
        stepIndex={stepIndex >= 0 ? stepIndex : 0}
        sessionKey={runner.sessionKey}
        initialExerciseIndex={exerciseIndex}
        onComplete={() => void runner.completeStep(step.id)}
        onExit={runner.exitStep}
      />
    )
  }

  if (runner.view.mode === 'done') {
    return (
      <SessionRecapCard
        arc={dailyPlan.arc}
        stepCount={dailyPlan.steps.length}
        dueTomorrow={null}
        streak={currentStreak}
        onBackHome={runner.exitStep}
      />
    )
  }

  return (
    <HomeCommandGrid
      primaryAction={primaryAction}
      conceptLesson={conceptLesson}
      profileLevel={profileLevel}
      weakestPhoneme={weakestPhoneme}
      wordsDueCount={wordsDueCount}
      soundsDueCount={soundsDueCount}
      streak={currentStreak}
      previewWords={previewWords}
      placementState={placementState}
      pronunciationDiagnosticState={pronunciationDiagnosticState}
      onStartStep={runner.startStep}
      planState={dailyPlan}
    />
  );
}
