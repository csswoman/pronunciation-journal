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
  isSlow,
  onToggleSlow,
  isAutoLoop,
  onToggleAutoLoop,
  streak,
  bestStreak,
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
  isSlow?: boolean;
  onToggleSlow?: () => void;
  isAutoLoop?: boolean;
  onToggleAutoLoop?: () => void;
  streak?: number;
  bestStreak?: number;
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
        {bestStreak && bestStreak >= 2 ? (
          <p className="ipa-chart__done-score text-caption font-semibold text-amber-600 dark:text-amber-400">
            🔥 Mejor racha consecutiva: <strong>{bestStreak}</strong> aciertos
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
          {embedded ? "Escuchar ambos" : "Escuchar ambas"}
        </button>
        {onToggleSlow ? (
          <button
            type="button"
            onClick={onToggleSlow}
            className={cn(
              "ipa-chart__btn ipa-chart__btn--ghost",
              isSlow && "text-primary font-bold bg-primary-soft border border-primary/30",
            )}
            title={isSlow ? "Velocidad lenta activa (0.75x)" : "Cambiar a velocidad lenta"}
            aria-label={isSlow ? "Velocidad lenta activa" : "Cambiar a velocidad lenta"}
          >
            <span>🐢 {isSlow ? "0.75x" : "1.0x"}</span>
          </button>
        ) : null}
        {onToggleAutoLoop ? (
          <button
            type="button"
            onClick={onToggleAutoLoop}
            className={cn(
              "ipa-chart__btn ipa-chart__btn--ghost",
              isAutoLoop && "text-primary font-bold bg-primary-soft border border-primary/30 animate-pulse",
            )}
            title={isAutoLoop ? "Pausar reproducción continua" : "Activar modo escucha continua manos libres"}
            aria-label={isAutoLoop ? "Pausar reproducción continua" : "Activar modo escucha continua"}
          >
            <span>{isAutoLoop ? "⏸ Pausar" : "📻 Continuo"}</span>
          </button>
        ) : null}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onNextPair}
            className="ipa-chart__btn ipa-chart__btn--ghost sound-detail__pairs-action sound-detail__pairs-action--next"
          >
            {isLastPair ? "Último" : "Siguiente"}
            <ArrowRight size={13} aria-hidden />
          </button>
          {!embedded ? (
            <kbd className="ipa-chart__kbd ipa-chart__kbd--inline" aria-hidden>
              Enter
            </kbd>
          ) : null}
        </div>
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
            {embedded ? "Escuchar una opción" : "Escuchar una opción"}
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
                {verdict === "correct" && streak && streak >= 2 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400 animate-pulse">
                    <span>🔥</span>
                    <span>Racha: {streak}</span>
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={onNextRound} className="ipa-chart__btn ipa-chart__btn--primary">
                  {isLastPair ? "Ver resultado" : "Siguiente"}
                  <ArrowRight size={13} aria-hidden />
                </button>
                {!embedded ? (
                  <kbd className="ipa-chart__kbd ipa-chart__kbd--inline" aria-hidden>
                    Enter
                  </kbd>
                ) : null}
              </div>
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
