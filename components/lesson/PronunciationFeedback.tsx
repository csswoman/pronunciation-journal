"use client";

import type { WordResult } from "@/lib/types";
import ProgressBar from "@/components/ui/ProgressBar";
import { feedbackFromScoringResult } from "@/lib/pronunciation/feedback/from-scoring";
import { getLearnerTargetCopy } from "@/lib/pronunciation/assessment/learner-copy";
import { isActionablePronunciationFeedbackCopyEnabled } from "@/lib/pronunciation/feedback/copy-flag";
import {
  PhonemeChip,
  PhonemeChips,
  buildDetailedTip,
} from "./PronunciationFeedbackChips";

interface PronunciationFeedbackProps {
  wordResults: WordResult[];
  accuracy: number;
  feedback: { message: string; emoji: string; color: string };
  xpEarned: number;
  /** Transcript from the STT evaluator; used only for signal-honest feedback. */
  transcript?: string;
  /**
   * When false, hides the per-word phoneme breakdown and the "sounds to
   * practice" chips, leaving only the score summary. Use when a richer
   * breakdown (e.g. PhonemeFeedbackTable) is rendered separately, to avoid
   * showing the same phoneme data twice. Defaults to true.
   */
  showPhonemeDetail?: boolean;
}

export default function PronunciationFeedback({
  wordResults,
  accuracy,
  feedback,
  xpEarned,
  transcript = "",
  showPhonemeDetail = true,
}: PronunciationFeedbackProps) {
  const problemWords = wordResults.filter(
    (r) =>
      r.status !== "extra" &&
      r.phonemes?.alignment?.some((p) => p.status === "incorrect" || p.status === "missing"),
  );
  const actionableFeedback = feedbackFromScoringResult({
    accuracy,
    transcript,
    wordResults,
  });
  const priorityCopy = actionableFeedback.priority
    ? getLearnerTargetCopy(actionableFeedback.priority.targetId)
    : null;
  const feedbackCopyEnabled = isActionablePronunciationFeedbackCopyEnabled();

  return (
    <div className="w-full animate-fadeIn space-y-5">
      <section aria-live="polite" className="rounded-md border border-border-subtle bg-surface-raised px-4 py-3">
        {feedbackCopyEnabled ? (
          <>
            <p className="m-0 font-kicker text-fg-subtle">LO QUE ENTENDIMOS</p>
            <p className="mt-1 text-body-sm leading-relaxed text-fg-muted">{actionableFeedback.summaryEs}</p>
            <p className="mb-0 mt-2 text-body-sm font-semibold text-fg">
              {priorityCopy ? `Siguiente foco: ${priorityCopy.title}` : "Repite una vez para reunir más evidencia."}
            </p>
          </>
        ) : (
          <p className="m-0 text-body-sm font-semibold text-fg">Siguiente práctica</p>
        )}
      </section>

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
              : "var(--admonitions-color-caution)"
        }
      />

      {showPhonemeDetail && (
        <div className="space-y-2">
          {wordResults.map((result, idx) => {
            const hasPhonemes = (result.phonemes?.alignment?.length ?? 0) > 0;
            const tip = buildDetailedTip(result);

            return (
              <div
                key={idx}
                className="rounded-xl px-3 py-2.5 border text-body-sm"
                style={{
                  backgroundColor:
                    result.status === "correct"
                      ? "color-mix(in srgb, var(--admonitions-color-tip) 10%, transparent)"
                      : result.status === "incorrect"
                        ? "color-mix(in srgb, var(--admonitions-color-caution) 8%, transparent)"
                        : "color-mix(in srgb, var(--admonitions-color-warning) 8%, transparent)",
                  borderColor:
                    result.status === "correct"
                      ? "color-mix(in srgb, var(--admonitions-color-tip) 25%, transparent)"
                      : result.status === "incorrect"
                        ? "color-mix(in srgb, var(--admonitions-color-caution) 25%, transparent)"
                        : "color-mix(in srgb, var(--admonitions-color-warning) 25%, transparent)",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-medium text-fg">
                    <span>
                      {result.status === "correct"
                        ? "✅"
                        : result.status === "incorrect"
                          ? "❌"
                          : result.status === "missing"
                            ? "⬜"
                            : "➕"}
                    </span>
                    <span>{result.expected || result.got}</span>
                  </div>
                  {result.status === "incorrect" && result.got && (
                    <span className="text-caption text-fg-subtle">
                      escuchado: &ldquo;{result.got}&rdquo;
                    </span>
                  )}
                </div>

                {hasPhonemes && <PhonemeChips alignment={result.phonemes!.alignment} />}

                {tip && (
                  <p className="text-caption mt-2 leading-relaxed text-fg-muted">💡 {tip}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showPhonemeDetail && problemWords.length > 0 && (
        <div
          className="rounded-xl px-4 py-3 border text-body-sm space-y-2"
          style={{
            backgroundColor: "color-mix(in srgb, var(--primary) 6%, transparent)",
            borderColor: "color-mix(in srgb, var(--primary) 20%, transparent)",
          }}
        >
          <p className="font-semibold text-caption uppercase tracking-wide text-primary">
            Escucha el modelo antes de repetir
          </p>
          {problemWords.map((r, i) => {
            const failed = r.phonemes!.alignment.filter(
              (p) => p.status === "incorrect" || p.status === "missing",
            );
            return (
              <div key={i} className="flex flex-wrap items-center gap-1.5">
                <span className="text-caption text-fg-muted">{r.expected}:</span>
                {failed.map((p, j) => (
                  <PhonemeChip key={j} p={p} />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
