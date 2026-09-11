"use client";

import { TrainerControls } from "./TrainerControls";
import { WordCard } from "./WordCard";
import { useMinimalPairsRunner } from "./useMinimalPairsRunner";
import { ContrastMouthComparison } from "@/components/phoneme-practice/ContrastMouthComparison";
import { cn } from "@/lib/cn";

export type { Side, Verdict } from "./useMinimalPairsRunner";

// Planned structure:
// <MinimalPairsRunner>
//   <RunnerNav />
//   <WordCard A | WordCard B />
//   <TrainerControls />
// </MinimalPairsRunner>

export interface MinimalPairsRunnerProps {
  /** The runner only practices pairs declared for this phoneme. */
  initialPhoneme?: string;
  /** Kept for deep-link compatibility; it cannot add unrelated pairs. */
  initialContrastId?: string;
  /** Renders the same exercise inside SoundDetail, without session chrome. */
  embedded?: boolean;
  /** Returns the inline exercise to its pair preview. */
  onExit?: () => void;
}

function RunnerNav({
  embedded,
  phoneme,
  contrastLabel,
  pairIdx,
  pairsLength,
  accuracy,
  onExit,
}: {
  embedded: boolean;
  phoneme: string;
  contrastLabel: string | null;
  pairIdx: number;
  pairsLength: number;
  accuracy: number | null;
  onExit?: () => void;
}) {
  if (embedded) {
    return (
      <div className="sound-detail__pairs-practice-nav">
        <span className="font-kicker font-bold tabular-nums text-fg-subtle">
          Par <span className="text-fg">{pairIdx + 1}</span> de {pairsLength}
        </span>
        <div>
          {accuracy !== null ? <span className="font-kicker text-fg-subtle">{accuracy}%</span> : null}
          {onExit ? (
            <button type="button" className="sound-detail__pairs-back" onClick={onExit}>
              Ver pares
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="sound-detail__pairs-practice-nav">
      <span className="font-ipa text-h3 font-bold text-fg">
        {contrastLabel ?? phoneme}
      </span>
      <span className="font-kicker tabular-nums text-fg-subtle">
        Par {pairIdx + 1} de {pairsLength}{accuracy !== null ? ` · ${accuracy}%` : ""}
      </span>
    </div>
  );
}


export function MinimalPairsRunner({
  initialPhoneme,
  initialContrastId,
  embedded = false,
  onExit,
}: MinimalPairsRunnerProps) {
  const session = useMinimalPairsRunner(initialPhoneme, initialContrastId);
  const {
    phoneme,
    contrast,
    pair,
    pairs,
    pairIdx,
    quizTarget,
    verdict,
    playingSide,
    streak,
    bestStreak,
    isDone,
    isSlow,
    isAutoLoop,
    quizActionsRef,
    highlights,
    accuracy,
    isLastPair,
    correctWord,
    playSide,
    handlePlayBoth,
    handleStartQuiz,
    handleGuess,
    goToNextPair,
    handleReplayClue,
    handleRestart,
    setIsSlow,
    setIsAutoLoop,
  } = session;

  if (!phoneme || !pair) {
    return (
      <section className="ipa-chart__section" aria-label="Pares mínimos">
        <h2 className="ipa-chart__section-title">Pares mínimos</h2>
        <p className="ipa-chart__lead">
          {phoneme
            ? `Todavía no hay pares mínimos definidos para ${phoneme}.`
            : "Elige un sonido desde Sonidos para practicar sus pares mínimos."}
        </p>
      </section>
    );
  }

  const contrastLabel = contrast
    ? `${contrast.phonemeA} vs ${contrast.phonemeB}`
    : null;

  return (
    <section
      id={embedded ? "sound-detail-minimal-pairs-practice" : undefined}
      className={embedded ? "sound-detail__pairs-practice" : "sound-lab__minimal-pairs-runner"}
      aria-label={`Pares mínimos para ${phoneme}`}
    >
      <RunnerNav
        embedded={embedded}
        phoneme={phoneme}
        contrastLabel={contrastLabel}
        pairIdx={pairIdx}
        pairsLength={pairs.length}
        accuracy={accuracy}
        onExit={onExit}
      />

      {/* Asistente integrado: ¿Cómo cambia la boca? */}
      {contrast ? (
        <ContrastMouthComparison
          phonemeA={contrast.phonemeA}
          phonemeB={contrast.phonemeB}
        />
      ) : null}

      {!isDone ? (
        <div className="space-y-4">
          {/* Tarjetas A/B para escuchar palabras */}
          <div
            key={`${phoneme}-${pairIdx}`}
            className={`${embedded ? "ipa-chart__mpcards sound-detail__mpcards" : "sound-lab__pair-cards"} animate-fadeIn`}
          >
            <WordCard
              word={pair.wordA}
              symbol={pair.phonemeA}
              side="A"
              isPlaying={playingSide === "A"}
              highlight={null}
              selectable={false}
              compact={embedded}
              workspace={!embedded}
              onPlay={() => playSide("A")}
              onPick={() => playSide("A")}
            />
            {embedded ? <span className="ipa-chart__mpvs">vs</span> : null}
            <WordCard
              word={pair.wordB}
              symbol={pair.phonemeB}
              side="B"
              isPlaying={playingSide === "B"}
              highlight={null}
              selectable={false}
              compact={embedded}
              workspace={!embedded}
              onPlay={() => playSide("B")}
              onPick={() => playSide("B")}
            />
          </div>

          {/* Paso de discriminación auditiva: Escucha un audio, ¿cuál dijo? */}
          <div className="rounded-2xl border border-border-default bg-surface-sunken p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-body-sm font-semibold text-fg">
                Escucha un audio, ¿cuál dijo?
              </span>
              <button
                type="button"
                onClick={quizTarget ? handleReplayClue : handleStartQuiz}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-semibold bg-surface-raised border border-border-default hover:border-border-strong text-fg shadow-2xs transition-colors"
              >
                <span className="text-primary">▶</span>
                {quizTarget ? "Repetir audio" : "Reproducir audio"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!quizTarget && verdict === null}
                onClick={() => handleGuess("A")}
                className={cn(
                  "relative flex flex-col items-center justify-center p-3 rounded-xl border font-semibold text-body-sm transition-all duration-150 shadow-2xs",
                  highlights.A === "correct"
                    ? "bg-[var(--success-soft,#dcfce7)] border-[var(--success,#22c55e)] text-[var(--success,#15803d)] ring-2 ring-[var(--success,#22c55e)]/30"
                    : highlights.A === "wrong"
                      ? "bg-[var(--error-soft,#fee2e2)] border-[var(--error,#ef4444)] text-[var(--error,#b91c1c)]"
                      : "bg-surface-raised border-border-default text-fg hover:border-primary/50 hover:bg-surface-raised/80",
                  (!quizTarget && verdict === null) && "opacity-60 cursor-not-allowed"
                )}
              >
                <span className="font-caption text-xs opacity-70 mb-0.5">Opción A</span>
                <span className="font-medium">{pair.wordA}</span>
                {highlights.A === "correct" && (
                  <span className="text-caption text-xs mt-0.5 font-bold">✓ Correcto</span>
                )}
                {highlights.A === "wrong" && (
                  <span className="text-caption text-xs mt-0.5 font-bold">✕ Incorrecto</span>
                )}
              </button>

              <button
                type="button"
                disabled={!quizTarget && verdict === null}
                onClick={() => handleGuess("B")}
                className={cn(
                  "relative flex flex-col items-center justify-center p-3 rounded-xl border font-semibold text-body-sm transition-all duration-150 shadow-2xs",
                  highlights.B === "correct"
                    ? "bg-[var(--success-soft,#dcfce7)] border-[var(--success,#22c55e)] text-[var(--success,#15803d)] ring-2 ring-[var(--success,#22c55e)]/30"
                    : highlights.B === "wrong"
                      ? "bg-[var(--error-soft,#fee2e2)] border-[var(--error,#ef4444)] text-[var(--error,#b91c1c)]"
                      : "bg-surface-raised border-border-default text-fg hover:border-primary/50 hover:bg-surface-raised/80",
                  (!quizTarget && verdict === null) && "opacity-60 cursor-not-allowed"
                )}
              >
                <span className="font-caption text-xs opacity-70 mb-0.5">Opción B</span>
                <span className="font-medium">{pair.wordB}</span>
                {highlights.B === "correct" && (
                  <span className="text-caption text-xs mt-0.5 font-bold">✓ Correcto</span>
                )}
                {highlights.B === "wrong" && (
                  <span className="text-caption text-xs mt-0.5 font-bold">✕ Incorrecto</span>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div ref={quizActionsRef} className="sound-detail__quiz-actions">
        <TrainerControls
          quizTarget={quizTarget}
          verdict={verdict}
          correctWord={correctWord ?? ""}
          isLastPair={isLastPair}
          isDone={isDone}
          accuracy={accuracy}
          onPlayBoth={handlePlayBoth}
          onNextPair={() => goToNextPair(true)}
          onReplayClue={handleReplayClue}
          onStartQuiz={handleStartQuiz}
          onNextRound={() => goToNextPair(true)}
          onRestart={handleRestart}
          isSlow={isSlow}
          onToggleSlow={() => setIsSlow((prev) => !prev)}
          isAutoLoop={isAutoLoop}
          onToggleAutoLoop={() => setIsAutoLoop((prev) => !prev)}
          streak={streak}
          bestStreak={bestStreak}
          embedded={embedded}
        />
      </div>
    </section>
  );
}
