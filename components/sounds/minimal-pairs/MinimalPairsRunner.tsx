"use client";

import { TrainerControls } from "./TrainerControls";
import { WordCard } from "./WordCard";
import { useMinimalPairsRunner } from "./useMinimalPairsRunner";

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

      {!isDone ? (
        <div
          key={`${phoneme}-${pairIdx}`}
          className={`${embedded ? "ipa-chart__mpcards sound-detail__mpcards" : "sound-lab__pair-cards"} animate-fadeIn`}
        >
          <WordCard
            word={pair.wordA}
            symbol={pair.phonemeA}
            side="A"
            isPlaying={playingSide === "A"}
            highlight={highlights.A}
            selectable={quizTarget !== null && verdict === null}
            compact={embedded}
            workspace={!embedded}
            onPlay={() => playSide("A")}
            onPick={() => handleGuess("A")}
          />
          {embedded ? <span className="ipa-chart__mpvs">vs</span> : null}
          <WordCard
            word={pair.wordB}
            symbol={pair.phonemeB}
            side="B"
            isPlaying={playingSide === "B"}
            highlight={highlights.B}
            selectable={quizTarget !== null && verdict === null}
            compact={embedded}
            workspace={!embedded}
            onPlay={() => playSide("B")}
            onPick={() => handleGuess("B")}
          />
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
          onNextPair={() => goToNextPair()}
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
