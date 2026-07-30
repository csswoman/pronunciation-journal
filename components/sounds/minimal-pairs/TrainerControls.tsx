"use client";

import {
  ArrowRight,
  Check,
  HelpCircle,
  Play,
  RefreshCw,
  RotateCcw,
  Trophy,
  X,
} from "@/components/icons";
import { cn } from "@/lib/cn";

type Verdict = "correct" | "wrong" | null;
type Side = "A" | "B";

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
  embedded = false,
}: {
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
  onNextContrast?: () => void;
  embedded?: boolean;
}) {
  if (isDone) {
    return (
      <div className="ipa-chart__done">
        <span className="ipa-chart__done-icon" aria-hidden>
          <Trophy size={28} />
        </span>
        <p className="ipa-chart__done-title">¡Set completo!</p>
        {accuracy !== null ? (
          <p className="ipa-chart__done-score">
            Precisión: <strong>{accuracy}%</strong>
          </p>
        ) : null}
        <div className="ipa-chart__done-actions">
          <button type="button" onClick={onRestart} className="ipa-chart__btn ipa-chart__btn--ghost">
            <RefreshCw size={13} aria-hidden />
            Repetir
          </button>
          {onNextContrast ? (
            <button type="button" onClick={onNextContrast} className="ipa-chart__btn ipa-chart__btn--primary">
              Siguiente contraste
              <ArrowRight size={13} aria-hidden />
            </button>
          ) : null}
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
          className="ipa-chart__btn ipa-chart__btn--ghost sound-detail__pairs-action sound-detail__pairs-action--listen"
        >
          <Play size={13} fill="currentColor" aria-hidden />
          {embedded ? "Escuchar ambos" : "Reproducir ambos"}
        </button>
        <button
          type="button"
          onClick={onNextPair}
          className="ipa-chart__btn ipa-chart__btn--ghost sound-detail__pairs-action sound-detail__pairs-action--next"
        >
          {isLastPair ? "Último par" : "Siguiente par"}
          <ArrowRight size={13} aria-hidden />
        </button>
        {quizTarget ? (
          <button
            type="button"
            onClick={onReplayClue}
            className="ipa-chart__btn ipa-chart__btn--ghost sound-detail__pairs-action sound-detail__pairs-action--replay"
          >
            <RotateCcw size={13} aria-hidden />
            Repetir pista
          </button>
        ) : (
          <button
            type="button"
            onClick={onStartQuiz}
            className="ipa-chart__btn ipa-chart__btn--primary ipa-chart__mpfoot-quiz sound-detail__pairs-action sound-detail__pairs-action--quiz"
          >
            <HelpCircle size={14} aria-hidden />
            {embedded ? "Escuchar una opción" : "Escucha una, adivina cuál"}
          </button>
        )}
      </div>

      {quizTarget ? (
        <div className="mt-4 flex flex-col items-start justify-between gap-3 border-t border-border-subtle pt-4 sm:flex-row sm:items-center">
          {verdict ? (
            <>
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-full",
                    verdict === "correct"
                      ? "bg-[var(--success)] text-[var(--on-success,white)]"
                      : "bg-[var(--error)] text-[var(--on-error,white)]",
                  )}
                >
                  {verdict === "correct" ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                </span>
                <p className="text-body-sm font-medium text-fg">
                  {verdict === "correct" ? "¡Correcto!" : `Era «${correctWord}».`}
                </p>
              </div>
              <button type="button" onClick={onNextRound} className="ipa-chart__btn ipa-chart__btn--primary">
                {isLastPair ? "Ver resultado" : "Siguiente"}
                <ArrowRight size={13} aria-hidden />
              </button>
            </>
          ) : (
            <p className="text-body-sm text-fg-muted" role="status">
              {embedded ? "Elige la palabra que oíste." : <>¿Qué palabra oíste? Elige una opción o pulsa <kbd className="ipa-chart__kbd">A</kbd> / <kbd className="ipa-chart__kbd">B</kbd></>}
            </p>
          )}
        </div>
      ) : null}
    </>
  );
}
