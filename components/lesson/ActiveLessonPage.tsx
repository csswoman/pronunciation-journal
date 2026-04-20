"use client";

import { useState } from "react";
import { useActiveLessonSetup } from "@/hooks/useActiveLessonSetup";
import { useLessonSession } from "@/hooks/useLessonSession";
import AudioWaveform from "@/components/lesson/AudioWaveform";
import { LessonLobby } from "@/components/lesson/LessonLobby";
import PageLayout from "@/components/layout/PageLayout";
import SessionHeader from "./SessionHeader";
import WordCard from "./WordCard";
import RecordingControls from "./RecordingControls";
import FeedbackSection from "./FeedbackSection";
import CompleteSection from "./CompleteSection";

export type Phase = "ready" | "recording" | "processing" | "feedback" | "no-audio" | "complete";

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--page-bg)" }}>
      <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24" style={{ color: "var(--primary)" }}>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}

interface Props {
  backHref: string;
}

export default function ActiveLessonPage({ backHref }: Props) {
  const [scoringThreshold, setScoringThreshold] = useState(70);

  const setup = useActiveLessonSetup(
    () => session.setPhase("ready"),
    setScoringThreshold,
  );

  const session = useLessonSession({
    lessonId: setup.lessonId,
    lessonData: setup.lessonData,
    activeStage: setup.activeStage,
    isDynamic: setup.isDynamic,
    scoringThreshold,
    setStageMastery: setup.setStageMastery,
    advanceOffset: setup.advanceOffset,
  });

  // ── Loading states ────────────────────────────────────────────────────────

  if (setup.fullLesson === undefined) return <LoadingSpinner />;

  if (setup.view === "lobby" && setup.fullLesson) {
    return (
      <PageLayout variant="lesson">
        <LessonLobby
          lesson={setup.fullLesson}
          totalWords={setup.fullLesson.words.length}
          sessionChunk={setup.sessionChunk}
          totalChunks={setup.totalChunks}
          mastery={setup.stageMastery}
          onSelectStage={setup.handleSelectStage}
          backHref={backHref}
        />
      </PageLayout>
    );
  }

  if (setup.lessonData === undefined) return <LoadingSpinner />;

  if (!setup.lessonData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--page-bg)" }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--deep-text)" }}>Lesson not found</h1>
          <a href={backHref} style={{ color: "var(--primary)" }}>← Back</a>
        </div>
      </div>
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
        onBack={setup.handleBackToLobby}
      />
    }>
      <main className="py-10 px-6 w-full lg:px-8">
        {session.phase === "complete" && (
          <CompleteSection
            wordAttempts={session.wordAttempts}
            sessionAccuracy={session.sessionAccuracy}
            totalXP={session.totalXP}
            totalWords={session.totalWords}
            isDynamic={setup.isDynamic}
            backHref={backHref}
            lessonData={setup.lessonData}
            onBackToLobby={setup.handleBackToLobby}
            onRetryLesson={() => {
              session.resetLesson();
              session.startLesson(setup.lessonData!);
              session.setPhase("ready");
            }}
          />
        )}

        {session.phase !== "complete" && session.currentWord && (
          <div className="flex flex-col items-center space-y-10">
            <WordCard
              word={session.currentWord.word}
              ipa={session.currentWord.ipa}
              hint={session.currentWord.hint}
              audioUrl={session.wordAudioUrl}
              isFav={session.isFav}
              onToggleFavorite={session.handleToggleFavorite}
            />

            <div className="w-full">
              <AudioWaveform isRecording={session.isRecording} stream={session.stream} />
            </div>

            <RecordingControls
              phase={session.phase}
              currentIndex={session.currentIndex}
              totalWords={session.totalWords}
              onStart={session.handleStartRecording}
              onStop={session.handleStopRecording}
              onCancel={session.handleCancelRecording}
              onRetry={session.handleRetry}
              onSkip={session.handleSkip}
              onMarkKnown={session.handleMarkKnown}
            />

            {session.phase === "feedback" && session.scoringResult && session.feedback && (
              <FeedbackSection
                scoringResult={session.scoringResult}
                feedback={session.feedback}
                xpEarned={session.xpEarned}
                currentIndex={session.currentIndex}
                totalWords={session.totalWords}
                onRetry={session.handleRetry}
                onNext={session.handleNext}
              />
            )}
          </div>
        )}
      </main>
    </PageLayout>
  );
}
