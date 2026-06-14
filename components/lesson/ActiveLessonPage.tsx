"use client";

// Planned structure:
// <ActiveLessonPage>
//   <SessionHeader />          ← sticky top bar, difficulty toggle
//   <LessonContextStrip />     ← auto-collapsing info strip
//   <StageTransitionOverlay /> ← success banner between stages
//   <StageProgressBar />       ← 3-segment labeled progress bar
//   <main>
//     Stage 1 & 2: <WordCard /> + <AudioWaveform /> + <RecordingControls /> + <FeedbackSection />
//     Stage 3:     <QuizStage />
//     Done:        <CompleteSection />
//   </main>
// </ActiveLessonPage>

import { useState, useEffect, useRef } from "react";
import { useActiveLessonSetup } from "@/hooks/useActiveLessonSetup";
import { useLessonSession } from "@/hooks/useLessonSession";
import PageLayout from "@/components/layout/PageLayout";
import SessionHeader from "./SessionHeader";
import CompleteSection from "./CompleteSection";
import { LessonContextStrip } from "./LessonContextStrip";
import { StageProgressBar } from "./StageProgressBar";
import { StageTransitionOverlay } from "./StageTransitionOverlay";
import { QuizStage } from "./QuizStage";
import { PronounceStageRenderer } from "./PronounceStageRenderer";
import LoadingSpinner from "./LoadingSpinner";
import { H1 } from "@/components/ui/Typography";
import { LESSON_STAGES } from "./lesson-lobby-types";
import type { LessonStageId, DifficultyMode } from "./lesson-lobby-types";

export type Phase = "ready" | "recording" | "processing" | "feedback" | "no-audio" | "complete";

const STAGE_IDS: LessonStageId[] = ["guided", "pronunciation", "speed"];

interface Props {
  backHref: string;
}

export default function ActiveLessonPage({ backHref }: Props) {
  const [diffMode, setDiffMode] = useState<DifficultyMode>("chill");
  const [scoringThreshold, setScoringThreshold] = useState(70);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [showTransitionOverlay, setShowTransitionOverlay] = useState(false);
  const hasStarted = useRef(false);
  // devStageOverride: set via window for quick dev testing; null means normal flow
  const [devStage] = useState<number | null>(null);

  const setup = useActiveLessonSetup(
    () => {},
    setScoringThreshold,
  );

  const activeStageIndex = devStage ?? currentStageIndex;

  const session = useLessonSession({
    lessonId: setup.lessonId,
    lessonData: setup.lessonData,
    activeStage: STAGE_IDS[activeStageIndex],
    isDynamic: setup.isDynamic,
    scoringThreshold,
    setStageMastery: setup.setStageMastery,
    advanceOffset: setup.advanceOffset,
  });

  // Auto-start guided stage once lesson data is available
  useEffect(() => {
    if (!setup.fullLesson || hasStarted.current) return;
    hasStarted.current = true;
    setup.handleSelectStage("guided", diffMode);
  }, [setup.fullLesson]);

  // Auto-advance to next stage when session completes a non-final stage
  useEffect(() => {
    if (session.phase !== "complete") return;
    if (activeStageIndex >= 2) return; // Stage 3 complete → show CompleteSection naturally
    setShowTransitionOverlay(true);
    const t = setTimeout(() => {
      const nextIdx = activeStageIndex + 1;
      setCurrentStageIndex(nextIdx);
      setShowTransitionOverlay(false);
      setup.handleSelectStage(STAGE_IDS[nextIdx], diffMode);
    }, 1800);
    return () => clearTimeout(t);
  }, [session.phase]);

  function handleJumpStage(targetIndex: number) {
    if (targetIndex === activeStageIndex) return;
    setCurrentStageIndex(targetIndex);
    setShowTransitionOverlay(false);
    setup.handleSelectStage(STAGE_IDS[targetIndex], diffMode);
  }

  function handleDiffChange(mode: DifficultyMode) {
    setDiffMode(mode);
    setup.handleSelectStage(STAGE_IDS[activeStageIndex], mode);
  }

  const wordProgress = session.totalWords > 0
    ? session.currentIndex / session.totalWords
    : 0;

  const stagesCompleted = LESSON_STAGES.filter(
    (s) => setup.stageMastery[s.id].pct >= 80,
  ).length;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (setup.fullLesson === undefined) return <LoadingSpinner />;

  if (!setup.fullLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-base">
        <div className="text-center">
          <H1 className="text-h2 mb-2">Lesson not found</H1>
          <a href={backHref} className="text-primary">← Back</a>
        </div>
      </div>
    );
  }

  if (!setup.lessonData) return <LoadingSpinner />;

  // ── Final stage complete → show summary ─────────────────────────────────
  if (session.phase === "complete" && activeStageIndex >= 2) {
    return (
      <PageLayout variant="lesson" hero={
        <SessionHeader
          title={setup.lessonData.title}
          currentIndex={session.totalWords - 1}
          totalWords={session.totalWords}
          phase="complete"
          diffMode={diffMode}
          onDiffChange={handleDiffChange}
          onBack={() => { window.location.href = backHref; }}
        />
      }>
        <main className="py-10 px-6 w-full lg:px-8">
          <CompleteSection
            wordAttempts={session.wordAttempts}
            sessionAccuracy={session.sessionAccuracy}
            totalXP={session.totalXP}
            totalWords={session.totalWords}
            isDynamic={setup.isDynamic}
            backHref={backHref}
            lessonData={setup.lessonData}
            onBackToLobby={() => { window.location.href = backHref; }}
            onRetryLesson={() => {
              setCurrentStageIndex(0);
              hasStarted.current = false;
              setup.handleSelectStage("guided", diffMode);
            }}
          />
        </main>
      </PageLayout>
    );
  }

  // ── Active session ────────────────────────────────────────────────────────
  return (
    <PageLayout variant="lesson" hero={
      <SessionHeader
        title={setup.lessonData.title}
        currentIndex={session.currentIndex}
        totalWords={session.totalWords}
        phase={session.phase}
        diffMode={diffMode}
        onDiffChange={handleDiffChange}
        onBack={() => { window.location.href = backHref; }}
      />
    }>
      <LessonContextStrip
        lesson={setup.fullLesson}
        stagesCompleted={stagesCompleted}
        totalStages={3}
        onSkipIntro={() => {}}
        onKnowLesson={() => handleJumpStage(2)}
      />

      <StageTransitionOverlay
        completedStage={STAGE_IDS[Math.max(0, activeStageIndex - 1)]}
        nextStage={STAGE_IDS[Math.min(2, activeStageIndex)]}
        visible={showTransitionOverlay}
        onDismiss={() => setShowTransitionOverlay(false)}
      />

      <StageProgressBar
        currentStageIndex={activeStageIndex}
        wordProgress={wordProgress}
        onJumpStage={handleJumpStage}
      />

      <main className="py-10 px-6 w-full lg:px-8">
        {/* Stage 3 — Quick Quiz */}
        {activeStageIndex === 2 && session.phase !== "complete" && (
          <QuizStage
            words={setup.lessonData.words}
            onComplete={() => session.setPhase("complete")}
          />
        )}

        {/* Stages 1 & 2 — Word practice */}
        {activeStageIndex < 2 && session.phase !== "complete" && session.currentWord && (
          <PronounceStageRenderer
            session={session}
            isHintMode={activeStageIndex === 1}
          />
        )}
      </main>
    </PageLayout>
  );
}
