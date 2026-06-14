"use client";

import AudioWaveform from "@/components/lesson/AudioWaveform";
import WordCard from "./WordCard";
import RecordingControls from "./RecordingControls";
import FeedbackSection from "./FeedbackSection";
import type { UseLessonSessionReturn as LessonSession } from "@/hooks/useLessonSession";

interface PronounceStageRendererProps {
  session: LessonSession;
  isHintMode: boolean; // true for stage 1 (no hints), false for stage 2
}

export function PronounceStageRenderer({
  session,
  isHintMode,
}: PronounceStageRendererProps) {
  if (!session.currentWord) return null;

  return (
    <div className="flex flex-col items-center space-y-10">
      {isHintMode && (
        <span className="rounded-full bg-[color-mix(in_oklch,var(--warning)_12%,transparent)] px-3 py-1 text-tiny font-semibold text-warning">
          NO HINTS
        </span>
      )}
      <WordCard
        word={session.currentWord.word}
        ipa={session.currentWord.ipa}
        hint={session.currentWord.hint}
        audioUrl={session.wordAudioUrl}
        isFav={session.isFav}
        onToggleFavorite={session.handleToggleFavorite}
        isHintMode={isHintMode}
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
  );
}
