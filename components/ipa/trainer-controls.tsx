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
      <div className="ipa-chart__mpfoot">
        <button
          type="button"
          onClick={onPlayBoth}
          className="ipa-chart__btn ipa-chart__btn--ghost"
        >
          <Play size={13} fill="currentColor" aria-hidden />
          Reproducir ambos
        </button>
        <button
          type="button"
          onClick={onNextPair}
          className="ipa-chart__btn ipa-chart__btn--ghost"
        >
          Siguiente par
          <ArrowRight size={13} aria-hidden />
        </button>

        {quizTarget && (
          <button
            type="button"
            onClick={onReplayClue}
            className="ipa-chart__btn ipa-chart__btn--ghost"
          >
            <RotateCcw size={13} aria-hidden />
            Repetir pista
          </button>
        )}

        {!quizTarget && (
          <button
            type="button"
            onClick={onStartQuiz}
            className="ipa-chart__btn ipa-chart__btn--primary ipa-chart__mpfoot-quiz"
          >
            <HelpCircle size={14} aria-hidden />
            Escucha una — adivina cuál
          </button>
        )}
      </div>

      {quizTarget && (
        <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {verdict ? (
            <>
              <div className="flex items-center gap-2.5">
                <span
                  className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white"
                  style={{
                    backgroundColor:
                      verdict === "correct" ? "var(--success)" : "var(--error)",
                  }}
                >
                  {verdict === "correct" ? (
                    <Check size={14} strokeWidth={3} />
                  ) : (
                    <X size={14} strokeWidth={3} />
                  )}
                </span>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {verdict === "correct"
                    ? "¡Correcto!"
                    : `Era «${correctWord}».`}
                </p>
              </div>
              <button
                type="button"
                onClick={onStartQuiz}
                className="ipa-chart__btn ipa-chart__btn--primary"
              >
                Otra ronda
                <ArrowRight size={13} aria-hidden />
              </button>
            </>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              ¿Cuál escuchaste? Toca una tarjeta o pulsa{" "}
              <kbd className="ipa-chart__kbd">A</kbd> / <kbd className="ipa-chart__kbd">B</kbd>
            </p>
          )}
        </div>
      )}
    </>
  );
}
