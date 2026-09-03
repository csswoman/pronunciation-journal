"use client";

// Planned structure:
// <PronunciationFeedback>
//   <UnderstandingSection />
//   <ScoreHero />
//   <ProgressBar />
//   <SentenceContinuousFeedback />
// </PronunciationFeedback>

import type { WordResult } from "@/lib/types";
import ProgressBar from "@/components/ui/ProgressBar";
import { feedbackFromScoringResult } from "@/lib/pronunciation/feedback/from-scoring";
import { getLearnerTargetCopy } from "@/lib/pronunciation/assessment/learner-copy";
import { isActionablePronunciationFeedbackCopyEnabled } from "@/lib/pronunciation/feedback/copy-flag";
import { useSyllableFeedback } from "@/hooks/useSyllableFeedback";
import { SentenceContinuousFeedback } from "./SentenceContinuousFeedback";

interface PronunciationFeedbackProps {
  wordResults: WordResult[];
  accuracy: number;
  feedback: { message: string; emoji: string; color: string };
  xpEarned: number;
  /** Transcript from the STT evaluator; used only for signal-honest feedback. */
  transcript?: string;
  userAudioUrl?: string | null;
  /**
   * When false, hides the per-word phoneme breakdown and the "sounds to
   * practice" chips, leaving only the score summary. Defaults to true.
   */
  showPhonemeDetail?: boolean;
}

export default function PronunciationFeedback({
  wordResults,
  accuracy,
  feedback,
  xpEarned,
  transcript = "",
  userAudioUrl = null,
  showPhonemeDetail = true,
}: PronunciationFeedbackProps) {
  const actionableFeedback = feedbackFromScoringResult({
    accuracy,
    transcript,
    wordResults,
  });
  const priorityCopy = actionableFeedback.priority
    ? getLearnerTargetCopy(actionableFeedback.priority.targetId)
    : null;
  const feedbackCopyEnabled = isActionablePronunciationFeedbackCopyEnabled();
  const syllableMap = useSyllableFeedback(wordResults);

  return (
    <div className="w-full animate-fadeIn space-y-4">
      {/* Tarjeta de entendimiento accionable */}
      <section aria-live="polite" className="rounded-md border border-border-subtle bg-surface-raised px-4 py-3">
        <p className="sr-only">Resultado: {accuracy}%, {feedback.message}.</p>
        {feedbackCopyEnabled ? (
          <>
            <p className="m-0 font-kicker text-fg-subtle">LO QUE ENTENDIMOS</p>
            <p className="mt-1 text-body-sm leading-relaxed text-fg-muted">{actionableFeedback.summaryEs}</p>
            {priorityCopy ? (
              <p className="mb-0 mt-2 text-body-sm font-semibold text-fg">
                Siguiente foco: {priorityCopy.title}
              </p>
            ) : accuracy < 85 ? (
              <p className="mb-0 mt-2 text-body-sm font-semibold text-fg">
                Repite una vez para reunir más evidencia.
              </p>
            ) : null}
          </>
        ) : (
          <p className="m-0 text-body-sm font-semibold text-fg">Siguiente práctica</p>
        )}
      </section>

      {/* Puntuación y porcentaje */}
      <div className="text-center">
        <div className="mb-1 text-h1 font-bold tabular-nums">
          <span className={feedback.color}>{accuracy}%</span>
        </div>
        <p className={`text-h4 font-medium ${feedback.color}`}>
          {feedback.emoji ? `${feedback.emoji} ` : ""}
          {feedback.message}
        </p>
        {xpEarned > 0 && (
          <p className="mt-1 text-caption text-fg-muted">+{xpEarned} XP</p>
        )}
      </div>

      <ProgressBar
        value={accuracy}
        height="md"
        color={
          accuracy >= 80
            ? "var(--admonitions-color-tip)"
            : accuracy >= 60
              ? "var(--admonitions-color-warning)"
              : "var(--error)"
        }
      />

      {/* Feedback continuo en una línea de frase con IPA y desglose clicable */}
      {showPhonemeDetail && (
        <SentenceContinuousFeedback
          wordResults={wordResults}
          syllableMap={syllableMap}
          userAudioUrl={userAudioUrl}
        />
      )}
    </div>
  );
}
