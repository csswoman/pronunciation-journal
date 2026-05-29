"use client";

import { Play, ArrowRight, RotateCcw, HelpCircle, Check, X } from "lucide-react";

type Verdict = "correct" | "wrong" | null;
type Side = "A" | "B";

interface TrainerControlsProps {
  quizTarget: Side | null;
  verdict: Verdict;
  correctWord: string;
  onPlayBoth: () => void;
  onNextPair: () => void;
  onReplayClue: () => void;
  onStartQuiz: () => void;
}

const btnBase =
  "inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-all duration-150 hover:bg-[var(--btn-regular-bg)] active:scale-[0.97] bg-[var(--card-bg)] border-[var(--border-default)] text-[var(--text-primary)]";

export function TrainerControls({
  quizTarget,
  verdict,
  correctWord,
  onPlayBoth,
  onNextPair,
  onReplayClue,
  onStartQuiz,
}: TrainerControlsProps) {
  return (
    <>
      {/* Action row */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onPlayBoth} className={btnBase}>
            <Play size={13} fill="currentColor" />
            Play both
          </button>
          <button type="button" onClick={onNextPair} className={btnBase}>
            Next pair
            <ArrowRight size={13} />
          </button>
        </div>

        {quizTarget && (
          <button type="button" onClick={onReplayClue} className={btnBase}>
            <RotateCcw size={13} />
            Replay clue
          </button>
        )}
      </div>

      {/* Quiz CTA / feedback row */}
      <div
        className="mt-6 pt-6 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-[var(--line-divider)]"
      >
        {!quizTarget ? (
          <>
            <p className="text-sm text-[var(--text-secondary)]">
              Quiz mode — we play one word, you tell us which.
            </p>
            <button
              type="button"
              onClick={onStartQuiz}
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] bg-[var(--primary)] text-[var(--on-primary)]"
            >
              <HelpCircle size={14} />
              Hear one — guess which
            </button>
          </>
        ) : verdict ? (
          <>
            <div className="flex items-center gap-2.5">
              <span
                className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white"
                style={{ backgroundColor: verdict === "correct" ? "var(--success)" : "var(--error)" }}
              >
                {verdict === "correct" ? (
                  <Check size={14} strokeWidth={3} />
                ) : (
                  <X size={14} strokeWidth={3} />
                )}
              </span>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {verdict === "correct"
                  ? "Correct!"
                  : `It was "${correctWord}".`}
              </p>
            </div>
            <button
              type="button"
              onClick={onStartQuiz}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] bg-[var(--text-primary)] text-[var(--card-bg)]"
            >
              Try another
              <ArrowRight size={13} />
            </button>
          </>
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">
            Which one did you hear? Tap a card or press{" "}
            <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded border text-tiny font-semibold mx-0.5 bg-[var(--card-bg)] border-[var(--line-divider)]">
              A
            </kbd>
            {" "}/{" "}
            <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded border text-tiny font-semibold mx-0.5 bg-[var(--card-bg)] border-[var(--line-divider)]">
              B
            </kbd>
          </p>
        )}
      </div>
    </>
  );
}
