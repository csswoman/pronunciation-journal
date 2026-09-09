"use client";

import {
  ArrowRight,
  Check,
  Flame,
  Play,
  RefreshCw,
  Trophy,
  X,
} from "@/components/icons";
import { cn } from "@/lib/cn";

type Verdict = "correct" | "wrong" | null;
type Side = "A" | "B";

// Sub-components: TrainerControls completion view, in-flight pair controls, quiz verdict bar
export function TrainerControls({
  verdict,
  correctWord,
  isLastPair,
  isDone,
  accuracy,
  onPlayBoth,
  onNextPair,
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
  quizTarget?: Side | null;
  verdict: Verdict;
  correctWord: string;
  isLastPair: boolean;
  isDone: boolean;
  accuracy: number | null;
  onPlayBoth: () => void;
  onNextPair: () => void;
  onReplayClue?: () => void;
  onStartQuiz?: () => void;
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
          <p className="ipa-chart__done-score font-caption font-semibold text-warning flex items-center justify-center gap-1">
            <Flame size={14} className="text-warning shrink-0" aria-hidden />
            <span>Mejor racha consecutiva: <strong>{bestStreak}</strong> aciertos</span>
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
              isSlow && "text-primary font-bold bg-primary-soft border border-primary/30"
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
              isAutoLoop && "text-primary font-bold bg-primary-soft border border-primary/30"
            )}
            title={isAutoLoop ? "Pausar reproducción continua" : "Activar modo escucha continua manos libres"}
            aria-label={isAutoLoop ? "Pausar reproducción continua" : "Activar modo escucha continua"}
          >
            <span>{isAutoLoop ? "⏸ Pausar" : "📻 Continuo"}</span>
          </button>
        ) : null}

        <div className="flex items-center gap-2 ml-auto">
          {verdict ? (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full",
                  verdict === "correct"
                    ? "bg-[var(--success)] text-[var(--on-success,white)]"
                    : "bg-[var(--error)] text-[var(--on-error,white)]",
                )}
              >
                {verdict === "correct" ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
              </span>
              <span className="text-caption font-semibold text-fg">
                {verdict === "correct" ? "¡Correcto!" : `Era «${correctWord}».`}
              </span>
              {verdict === "correct" && streak && streak >= 2 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft border border-warning/30 px-2 py-0.5 text-[11px] font-bold text-warning">
                  <Flame size={11} className="text-warning shrink-0" aria-hidden />
                  <span>{streak}</span>
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={verdict ? onNextRound : onNextPair}
              className="ipa-chart__btn ipa-chart__btn--primary sound-detail__pairs-action sound-detail__pairs-action--next"
            >
              {isLastPair ? (verdict ? "Ver resultado" : "Último") : "Siguiente"}
              <ArrowRight size={13} aria-hidden />
            </button>
            {!embedded ? (
              <kbd className="ipa-chart__kbd ipa-chart__kbd--inline" aria-hidden>
                Enter
              </kbd>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
