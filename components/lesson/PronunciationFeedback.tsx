"use client";

import type { WordResult, PhonemeAlignment } from "@/lib/types";
import { playIpaSound } from "@/lib/pronunciation/ipa-audio";
import ProgressBar from "@/components/ui/ProgressBar";
import { feedbackFromScoringResult } from '@/lib/pronunciation/feedback/from-scoring'
import { getLearnerTargetCopy } from '@/lib/pronunciation/assessment/learner-copy'

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

// ── Phoneme chip — explicit audio control for touch and keyboard ────────────

function PhonemeChip({ p }: { p: PhonemeAlignment }) {
  const display = p.ipa ?? p.phoneme.toLowerCase();
  const isProblematic = p.status === "incorrect" || p.status === "missing";

  let bg = "color-mix(in srgb, var(--admonitions-color-tip) 20%, transparent)";
  let border = "var(--admonitions-color-tip)";
  let color = "var(--admonitions-color-tip)";

  if (p.status === "missing") {
    bg = "transparent";
    border = "var(--admonitions-color-warning)";
    color = "var(--admonitions-color-warning)";
  } else if (p.status === "incorrect") {
    bg = "color-mix(in srgb, var(--admonitions-color-caution) 20%, transparent)";
    border = "var(--admonitions-color-caution)";
    color = "var(--admonitions-color-caution)";
  }

  const label =
    p.status === "incorrect"
      ? `Escuchar el modelo /${display}/; el texto reconocido fue /${p.gotIpa ?? p.got}/`
      : p.status === "missing"
      ? `Escuchar el modelo /${display}/; no apareció en el texto reconocido`
      : `Escuchar el modelo /${display}/`;

  return (
    <button
      type="button"
      onClick={() => p.ipa && playIpaSound(p.ipa)}
      aria-label={label}
      className="inline-flex min-h-11 min-w-11 items-center justify-center gap-0.5 rounded-sm border px-2 py-1 font-ipa text-sm transition-colors focus-ring"
      style={{
        backgroundColor: bg,
        borderColor: border,
        color,
        textDecoration: p.status === "missing" ? "line-through" : "none",
        cursor: "pointer",
      }}
    >
      /{display}/
      {isProblematic && (
        <svg className="ml-0.5 w-2.5 h-2.5 opacity-50" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
        </svg>
      )}
    </button>
  );
}

function PhonemeChips({ alignment }: { alignment: PhonemeAlignment[] }) {
  if (alignment.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {alignment.map((p, i) => <PhonemeChip key={i} p={p} />)}
    </div>
  );
}

// ── Tip builder ───────────────────────────────────────────────────────────────

function buildDetailedTip(result: WordResult): string | null {
  const alignment = result.phonemes?.alignment;
  if (!alignment || alignment.length === 0) return result.phonemes?.tip ?? null;

  const problems: string[] = [];
  for (const p of alignment) {
    const exp = p.ipa ?? `/${p.phoneme}/`;
    if (p.status === "incorrect" && p.got) {
      const got = p.gotIpa ?? `/${p.got}/`;
      problems.push(`/${exp}/ → escuchado /${got}/`);
    } else if (p.status === "missing") {
      problems.push(`falta /${exp}/`);
    }
  }
  if (problems.length === 0) return null;
  return problems.join(" · ");
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PronunciationFeedback({
  wordResults,
  accuracy,
  feedback,
  xpEarned,
  transcript = '',
  showPhonemeDetail = true,
}: PronunciationFeedbackProps) {
  const problemWords = wordResults.filter(
    (r) =>
      r.status !== "extra" &&
      r.phonemes?.alignment?.some((p) => p.status === "incorrect" || p.status === "missing")
  );
  const actionableFeedback = feedbackFromScoringResult({
    accuracy,
    transcript,
    wordResults,
  });
  const priorityCopy = actionableFeedback.priority
    ? getLearnerTargetCopy(actionableFeedback.priority.targetId)
    : null;

  return (
    <div className="w-full animate-fadeIn space-y-5">
      <section aria-live="polite" className="rounded-md border border-border-subtle bg-surface-raised px-4 py-3">
        <p className="m-0 font-kicker text-fg-subtle">LO QUE ENTENDIMOS</p>
        <p className="mt-1 text-sm leading-relaxed text-fg-muted">{actionableFeedback.summaryEs}</p>
        {priorityCopy ? (
          <p className="mb-0 mt-2 text-sm font-semibold text-fg">
            Siguiente foco: {priorityCopy.title}
          </p>
        ) : (
          <p className="mb-0 mt-2 text-sm font-semibold text-fg">
            Repite una vez para reunir más evidencia.
          </p>
        )}
      </section>
      {/* Score */}
      <div className="text-center">
        <div className="text-5xl font-bold mb-1">
          <span className={feedback.color}>{accuracy}%</span>
        </div>
        <p className={`text-lg font-medium ${feedback.color}`}>
          {feedback.emoji ? `${feedback.emoji} ` : ""}
          {feedback.message}
        </p>
        {xpEarned > 0 && (
          <p className="text-sm mt-1 text-fg-muted">
            +{xpEarned} XP
          </p>
        )}
      </div>

      {/* Accuracy bar */}
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

      {/* Word results */}
      {showPhonemeDetail && (
      <div className="space-y-2">
        {wordResults.map((result, idx) => {
          const hasPhonemes = (result.phonemes?.alignment?.length ?? 0) > 0;
          const tip = buildDetailedTip(result);

          return (
            <div
              key={idx}
              className="rounded-xl px-3 py-2.5 border text-sm"
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
              {/* Word row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-medium text-fg">
                  <span>
                    {result.status === "correct" ? "✅"
                      : result.status === "incorrect" ? "❌"
                      : result.status === "missing" ? "⬜"
                      : "➕"}
                  </span>
                  <span>{result.expected || result.got}</span>
                </div>
                {result.status === "incorrect" && result.got && (
                  <span className="text-xs text-fg-subtle">
                    escuchado: &ldquo;{result.got}&rdquo;
                  </span>
                )}
              </div>

              {/* Phoneme chips */}
              {hasPhonemes && <PhonemeChips alignment={result.phonemes!.alignment} />}

              {/* Tip */}
              {tip && (
                <p className="text-xs mt-2 leading-relaxed text-fg-muted">
                  💡 {tip}
                </p>
              )}
            </div>
          );
        })}
      </div>
      )}

      {/* Sounds to practice */}
      {showPhonemeDetail && problemWords.length > 0 && (
        <div
          className="rounded-xl px-4 py-3 border text-sm space-y-2"
          style={{
            backgroundColor: "color-mix(in srgb, var(--primary) 6%, transparent)",
            borderColor: "color-mix(in srgb, var(--primary) 20%, transparent)",
          }}
        >
          <p className="font-semibold text-xs uppercase tracking-wide text-primary">
            Escucha el modelo antes de repetir
          </p>
          {problemWords.map((r, i) => {
            const failed = r.phonemes!.alignment.filter(
              (p) => p.status === "incorrect" || p.status === "missing"
            );
            return (
              <div key={i} className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-fg-muted">
                  {r.expected}:
                </span>
                {failed.map((p, j) => <PhonemeChip key={j} p={p} />)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
