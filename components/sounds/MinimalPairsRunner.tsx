"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Headphones } from "@/components/icons";
import { speakText } from "@/lib/speech/synthesis";
import { canonicalizeSoundIpa } from "@/lib/sounds/inventory";
import {
  findMinimalPairContrastIndex,
  getMinimalPairsForPhoneme,
  MINIMAL_PAIR_CONTRASTS,
} from "@/lib/sounds/minimal-pairs";
import { TrainerControls } from "./minimal-pairs/TrainerControls";
import { WordCard } from "./minimal-pairs/WordCard";

type Verdict = "correct" | "wrong" | null;
type Side = "A" | "B";

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

export function MinimalPairsRunner({
  initialPhoneme,
  initialContrastId,
  embedded = false,
  onExit,
}: MinimalPairsRunnerProps) {
  const phoneme = initialPhoneme ? canonicalizeSoundIpa(initialPhoneme) : null;
  const contrastIndex = findMinimalPairContrastIndex(initialPhoneme, initialContrastId);
  const contrast = contrastIndex === null ? null : MINIMAL_PAIR_CONTRASTS[contrastIndex];
  const pairs = useMemo(
    () => {
      if (contrast) {
        return contrast.pairs.map((pair) => ({
          ...pair,
          phonemeA: contrast.phonemeA,
          phonemeB: contrast.phonemeB,
        }));
      }
      return phoneme ? getMinimalPairsForPhoneme(phoneme) : [];
    },
    [contrast, phoneme],
  );
  const [pairIdx, setPairIdx] = useState(0);
  const [quizTarget, setQuizTarget] = useState<Side | null>(null);
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [guessed, setGuessed] = useState<Side | null>(null);
  const [playingSide, setPlayingSide] = useState<Side | null>(null);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [isDone, setIsDone] = useState(false);
  const lastPlayedRef = useRef<Side | null>(null);
  const quizActionsRef = useRef<HTMLDivElement>(null);

  const pair = pairs[pairIdx];

  const resetRound = useCallback(() => {
    setQuizTarget(null);
    setVerdict(null);
    setGuessed(null);
    lastPlayedRef.current = null;
  }, []);

  const speakWord = useCallback((word: string, onEnd?: () => void) => {
    speakText(word, { onEnd });
  }, []);

  const playSide = useCallback((side: Side) => {
    if (!pair) return;
    if (playingSide === side) {
      window.speechSynthesis?.cancel();
      setPlayingSide(null);
      return;
    }
    setPlayingSide(side);
    speakWord(side === "A" ? pair.wordA : pair.wordB, () => setPlayingSide(null));
  }, [pair, playingSide, speakWord]);

  const handlePlayBoth = useCallback(() => {
    if (!pair) return;
    if (playingSide !== null) {
      window.speechSynthesis?.cancel();
      setPlayingSide(null);
      return;
    }
    resetRound();
    setPlayingSide("A");
    speakWord(pair.wordA, () => {
      setPlayingSide("B");
      speakWord(pair.wordB, () => setPlayingSide(null));
    });
  }, [pair, playingSide, resetRound, speakWord]);

  const handleStartQuiz = useCallback(() => {
    if (!pair) return;
    const target: Side = Math.random() < 0.5 ? "A" : "B";
    window.speechSynthesis?.cancel();
    setPlayingSide(null);
    setQuizTarget(target);
    setVerdict(null);
    setGuessed(null);
    lastPlayedRef.current = target;
    speakWord(target === "A" ? pair.wordA : pair.wordB);
  }, [pair, speakWord]);

  const handleGuess = useCallback((guess: Side) => {
    if (!quizTarget || verdict) return;
    const correct = guess === quizTarget;
    setGuessed(guess);
    setVerdict(correct ? "correct" : "wrong");
    setScore((current) => ({
      correct: current.correct + Number(correct),
      wrong: current.wrong + Number(!correct),
    }));
  }, [quizTarget, verdict]);

  const goToNextPair = useCallback((startQuiz = false) => {
    if (!pair) return;
    if (pairIdx === pairs.length - 1) {
      setIsDone(true);
      setQuizTarget(null);
      return;
    }
    const nextIdx = pairIdx + 1;
    const nextPair = pairs[nextIdx];
    setPairIdx(nextIdx);
    resetRound();
    if (!startQuiz) return;
    const target: Side = Math.random() < 0.5 ? "A" : "B";
    setQuizTarget(target);
    lastPlayedRef.current = target;
    window.setTimeout(() => speakWord(target === "A" ? nextPair.wordA : nextPair.wordB), 80);
  }, [pair, pairIdx, pairs, resetRound, speakWord]);

  const handleReplayClue = useCallback(() => {
    if (!pair || !lastPlayedRef.current) return;
    speakWord(lastPlayedRef.current === "A" ? pair.wordA : pair.wordB);
  }, [pair, speakWord]);

  useEffect(() => {
    if (!quizTarget || verdict) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement | null)?.closest("input, textarea, select")) return;
      if (event.key.toLowerCase() === "a") handleGuess("A");
      if (event.key.toLowerCase() === "b") handleGuess("B");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleGuess, quizTarget, verdict]);

  useEffect(() => {
    if (!quizTarget) return;
    const frame = window.requestAnimationFrame(() => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      quizActionsRef.current?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "end",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [quizTarget]);

  const highlights = useMemo<{ A: Verdict; B: Verdict }>(() => {
    if (!verdict || !quizTarget || !guessed) return { A: null, B: null };
    return {
      A: quizTarget === "A" ? "correct" : guessed === "A" ? "wrong" : null,
      B: quizTarget === "B" ? "correct" : guessed === "B" ? "wrong" : null,
    };
  }, [guessed, quizTarget, verdict]);

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

  const total = score.correct + score.wrong;
  const accuracy = total ? Math.round((score.correct / total) * 100) : null;
  const isLastPair = pairIdx === pairs.length - 1;
  const correctWord = quizTarget === "A" ? pair.wordA : pair.wordB;

  return (
    <section
      id={embedded ? "sound-detail-minimal-pairs-practice" : undefined}
      className={embedded ? "sound-detail__pairs-practice" : "ipa-chart__section"}
      aria-label={`Pares mínimos para ${phoneme}`}
    >
      {embedded ? (
        <div className="sound-detail__pairs-practice-nav">
          <span className="font-kicker font-bold tabular-nums text-fg-subtle">
            Par <span className="text-fg">{pairIdx + 1}</span> de {pairs.length}
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
      ) : (
        <header className="ipa-chart__mp-head">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="ipa-chart__mp-icon shrink-0" aria-hidden><Headphones size={18} /></span>
            <div>
              <h2 className="ipa-chart__section-title">Pares mínimos {phoneme}</h2>
              <p className="ipa-chart__lead">Entrena solo los contrastes de este sonido.</p>
            </div>
          </div>
          {accuracy !== null ? <span className="font-kicker text-fg-subtle">Precisión {accuracy}%</span> : null}
        </header>
      )}

      {!isDone ? (
        <>
          {!embedded ? (
            <div className="mb-3 flex items-center justify-end">
              <span className="font-kicker font-bold tabular-nums text-fg-subtle">
                Par <span className="text-fg">{pairIdx + 1}</span> de {pairs.length}
              </span>
            </div>
          ) : null}
          <div
            key={`${phoneme}-${pairIdx}`}
            className={`ipa-chart__mpcards ${embedded ? "sound-detail__mpcards" : ""} animate-fadeIn`}
          >
            <WordCard word={pair.wordA} symbol={pair.phonemeA} side="A" isPlaying={playingSide === "A"} highlight={highlights.A} selectable={quizTarget !== null && verdict === null} compact={embedded} onPlay={() => playSide("A")} onPick={() => handleGuess("A")} />
            <span className="ipa-chart__mpvs">vs</span>
            <WordCard word={pair.wordB} symbol={pair.phonemeB} side="B" isPlaying={playingSide === "B"} highlight={highlights.B} selectable={quizTarget !== null && verdict === null} compact={embedded} onPlay={() => playSide("B")} onPick={() => handleGuess("B")} />
          </div>
        </>
      ) : null}

      <div ref={quizActionsRef} className="sound-detail__quiz-actions">
        <TrainerControls
          quizTarget={quizTarget}
          verdict={verdict}
          correctWord={correctWord}
          isLastPair={isLastPair}
          isDone={isDone}
          accuracy={accuracy}
          onPlayBoth={handlePlayBoth}
          onNextPair={() => goToNextPair()}
          onReplayClue={handleReplayClue}
          onStartQuiz={handleStartQuiz}
          onNextRound={() => goToNextPair(true)}
          onRestart={() => { setPairIdx(0); resetRound(); setScore({ correct: 0, wrong: 0 }); setIsDone(false); }}
          embedded={embedded}
        />
      </div>
    </section>
  );
}
