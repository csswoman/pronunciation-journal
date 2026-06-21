"use client";

import { Play, ArrowRight, RotateCcw, HelpCircle, Check, X, RefreshCw, Trophy } from "lucide-react";
import { cn } from "@/lib/cn";

type Verdict = "correct" | "wrong" | null;
type Side = "A" | "B";

interface TrainerControlsProps {
  quizTarget: Side | null;
  verdict: Verdict;
  correctWord: string;
  isLastPair: boolean;
  isDone: boolean;
  accuracy: number | null;
  onPlayBoth: () => void;
  onNextPair: () => void;
  onReplayClue: () => void;
  onStartQuiz: () => void;
  onNextRound: () => void;
  onRestart: () => void;
  onNextContrast: () => void;
}

export function TrainerControls({
  quizTarget,
  verdict,
  correctWord,
  isLastPair,
  isDone,
  accuracy,
  onPlayBoth,
  onNextPair,
  onReplayClue,
  onStartQuiz,
  onNextRound,
  onRestart,
  onNextContrast,
}: TrainerControlsProps) {
  if (isDone) {
    return (
      <div className="ipa-chart__done">
        <span className="ipa-chart__done-icon" aria-hidden><Trophy size={28} /></span>
        <p className="ipa-chart__done-title">¡Set completo!</p>
        {accuracy !== null && (
          <p className="ipa-chart__done-score">
            Precisión: <strong>{accuracy}%</strong>
          </p>
        )}
        <div className="ipa-chart__done-actions">
          <button
            type="button"
            onClick={onRestart}
            className="ipa-chart__btn ipa-chart__btn--ghost"
          >
            <RefreshCw size={13} aria-hidden />
            Repetir
          </button>
          <button
            type="button"
            onClick={onNextContrast}
            className="ipa-chart__btn ipa-chart__btn--primary"
          >
            Siguiente contraste
            <ArrowRight size={13} aria-hidden />
          </button>
        </div>
      </div>
    );
  }

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
          {isLastPair ? "Último par" : "Siguiente par"}
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
        <div className="mt-4 pt-4 border-t border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {verdict ? (
            <>
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-7 h-7 rounded-full",
                    verdict === "correct"
                      ? "bg-[var(--success)] text-[var(--on-success,white)]"
                      : "bg-[var(--error)] text-[var(--on-error,white)]"
                  )}
                >
                  {verdict === "correct" ? (
                    <Check size={14} strokeWidth={3} />
                  ) : (
                    <X size={14} strokeWidth={3} />
                  )}
                </span>
                <p className="text-sm font-medium text-fg">
                  {verdict === "correct"
                    ? "¡Correcto!"
                    : `Era «${correctWord}».`}
                </p>
              </div>
              <button
                type="button"
                onClick={onNextRound}
                className="ipa-chart__btn ipa-chart__btn--primary"
              >
                {isLastPair ? "Ver resultado" : "Siguiente"}
                <ArrowRight size={13} aria-hidden />
              </button>
            </>
          ) : (
            <p className="text-sm text-fg-muted">
              ¿Cuál escuchaste? Toca una tarjeta o pulsa{" "}
              <kbd className="ipa-chart__kbd">A</kbd> / <kbd className="ipa-chart__kbd">B</kbd>
            </p>
          )}
        </div>
      )}
    </>
  );
}
