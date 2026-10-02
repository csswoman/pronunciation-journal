"use client";

// Planned structure:
// <PronunciationFeedback>
//   <UnderstandingSection />
//   <ScoreHero />
//   <ProgressBar />
//   <WordFeedbackPanel />       (palabras por color + diagnóstico por palabra)
//   <SentenceListenButtons />   (frase normal / lenta)
//   <SelfPlaybackAudioBar />    (comparación nativo vs. mi voz de la frase)
// </PronunciationFeedback>

import type { WordResult } from "@/lib/types";
import ProgressBar from "@/components/ui/ProgressBar";
import { feedbackFromScoringResult } from "@/lib/pronunciation/feedback/from-scoring";
import { getLearnerTargetCopy } from "@/lib/pronunciation/assessment/learner-copy";
import { isActionablePronunciationFeedbackCopyEnabled } from "@/lib/pronunciation/feedback/copy-flag";
import { useWordFeedback } from "@/hooks/useWordFeedback";
import { WordFeedbackPanel } from "@/components/pronunciation-feedback/WordFeedbackPanel";
import { SentenceListenButtons } from "@/components/pronunciation-feedback/SentenceListenButtons";
import { SelfPlaybackAudioBar } from "@/components/pronunciation/SelfPlaybackAudioBar";

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
  /** `compact` pliega «Cómo se hace» y oculta la leyenda (espacios reducidos). */
  variant?: "full" | "compact";
}

export default function PronunciationFeedback({
  wordResults,
  accuracy,
  feedback,
  xpEarned,
  transcript = "",
  userAudioUrl = null,
  showPhonemeDetail = true,
  variant = "full",
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
  const words = useWordFeedback(wordResults);
  const fullSentence = wordResults
    .map((w) => w.expected || w.got)
    .filter(Boolean)
    .join(" ");

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
            ) : (
              <p className="mb-0 mt-2 text-body-sm font-semibold text-fg">
                Sin sonidos que corregir por ahora — buen dominio de esta frase.
              </p>
            )}
          </>
        ) : (
          // Copy accionable desactivada por flag: no inventar contenido — al
          // menos nombrar el resultado real en vez de un texto vacío fijo.
          <p className="m-0 text-body-sm font-semibold text-fg">
            {accuracy >= 80
              ? 'Buena pronunciación en esta frase.'
              : 'Hay sonidos por practicar en esta frase.'}
          </p>
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

      {/* Palabras por color con diagnóstico del sonido fallado */}
      {showPhonemeDetail && (
        <>
          <WordFeedbackPanel words={words} variant={variant} />
          <SentenceListenButtons sentence={fullSentence} />
          {userAudioUrl && (
            <SelfPlaybackAudioBar
              targetWord={fullSentence}
              userAudioUrl={userAudioUrl}
              className="max-w-none"
            />
          )}
        </>
      )}
    </div>
  );
}
