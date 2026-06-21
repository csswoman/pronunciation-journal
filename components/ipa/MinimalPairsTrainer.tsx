"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Headphones } from "lucide-react";
import { MINIMAL_PAIR_CONTRASTS } from "./minimal-pairs-data";
import { speakWord } from "./speak-word";
import { ContrastChip } from "./contrast-chip";
import { WordCard } from "./word-card";
import { TrainerControls } from "./trainer-controls";

type Verdict = "correct" | "wrong" | null;
type Side = "A" | "B";

interface ScoreBoard {
  correct: number;
  wrong: number;
}

export default function MinimalPairsTrainer() {
  const [contrastIdx, setContrastIdx] = useState(0);
  const [pairIdx, setPairIdx] = useState(0);
  const [quizTarget, setQuizTarget] = useState<Side | null>(null);
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [guessed, setGuessed] = useState<Side | null>(null);
  const [playingSide, setPlayingSide] = useState<Side | null>(null);
  const [score, setScore] = useState<ScoreBoard>({ correct: 0, wrong: 0 });
  const [isDone, setIsDone] = useState(false);
  const lastPlayedRef = useRef<Side | null>(null);
  // quizPlaying: true while the hidden clue is being spoken (no card animation shown)
  const quizPlayingRef = useRef(false);

  const contrast = MINIMAL_PAIR_CONTRASTS[contrastIdx];
  const pair = contrast.pairs[pairIdx];

  const playSide = useCallback(
    (side: Side) => {
      if (playingSide === side) {
        window.speechSynthesis?.cancel();
        setPlayingSide(null);
        return;
      }
      setPlayingSide(side);
      const word = side === "A" ? pair.wordA : pair.wordB;
      speakWord(word, () => setPlayingSide(null));
    },
    [pair, playingSide]
  );

  const resetQuiz = useCallback(() => {
    setQuizTarget(null);
    setVerdict(null);
    setGuessed(null);
    lastPlayedRef.current = null;
  }, []);

  const handleContrastChange = useCallback((idx: number) => {
    setContrastIdx(idx);
    setPairIdx(0);
    setQuizTarget(null);
    setVerdict(null);
    setScore({ correct: 0, wrong: 0 });
    setIsDone(false);
  }, []);

  const handleNextPair = useCallback(() => {
    if (pairIdx === contrast.pairs.length - 1) {
      setIsDone(true);
      setQuizTarget(null);
      return;
    }
    setPairIdx((idx) => idx + 1);
    resetQuiz();
  }, [pairIdx, contrast.pairs.length, resetQuiz]);

  const handlePlayBoth = useCallback(() => {
    if (playingSide !== null) {
      window.speechSynthesis?.cancel();
      setPlayingSide(null);
      return;
    }
    resetQuiz();
    setPlayingSide("A");
    speakWord(pair.wordA, () => {
      setPlayingSide("B");
      speakWord(pair.wordB, () => setPlayingSide(null));
    });
  }, [pair, playingSide, resetQuiz]);

  const handleStartQuiz = useCallback(() => {
    window.speechSynthesis?.cancel();
    setPlayingSide(null);
    const target: Side = Math.random() < 0.5 ? "A" : "B";
    setQuizTarget(target);
    setVerdict(null);
    setGuessed(null);
    lastPlayedRef.current = target;
    quizPlayingRef.current = true;
    const word = target === "A" ? pair.wordA : pair.wordB;
    speakWord(word, () => { quizPlayingRef.current = false; });
  }, [pair]);

  const handleNextRound = useCallback(() => {
    const isLast = pairIdx === contrast.pairs.length - 1;
    if (isLast) {
      setIsDone(true);
      setQuizTarget(null);
      return;
    }
    const nextIdx = pairIdx + 1;
    const nextPair = contrast.pairs[nextIdx];
    const target: Side = Math.random() < 0.5 ? "A" : "B";
    setPairIdx(nextIdx);
    setVerdict(null);
    setGuessed(null);
    setQuizTarget(target);
    lastPlayedRef.current = target;
    quizPlayingRef.current = true;
    window.speechSynthesis?.cancel();
    setTimeout(() => speakWord(
      target === "A" ? nextPair.wordA : nextPair.wordB,
      () => { quizPlayingRef.current = false; }
    ), 80);
  }, [pairIdx, contrast.pairs]);

  const handleGuess = useCallback(
    (guess: Side) => {
      if (!quizTarget || verdict) return;
      const correct = guess === quizTarget;
      setGuessed(guess);
      setVerdict(correct ? "correct" : "wrong");
      setScore((s) => ({
        correct: s.correct + (correct ? 1 : 0),
        wrong: s.wrong + (correct ? 0 : 1),
      }));
    },
    [quizTarget, verdict]
  );

  const handleReplayClue = useCallback(() => {
    if (!lastPlayedRef.current) return;
    window.speechSynthesis?.cancel();
    setPlayingSide(null);
    quizPlayingRef.current = true;
    const word = lastPlayedRef.current === "A" ? pair.wordA : pair.wordB;
    speakWord(word, () => { quizPlayingRef.current = false; });
  }, [pair]);

  useEffect(() => {
    if (!quizTarget || verdict) return;
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (target?.isContentEditable) return;
      const key = event.key.toLowerCase();
      if (key === "a") { event.preventDefault(); handleGuess("A"); }
      else if (key === "b") { event.preventDefault(); handleGuess("B"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [quizTarget, verdict, handleGuess]);

  const highlights = useMemo<{ A: Verdict; B: Verdict }>(() => {
    if (!verdict || !quizTarget || !guessed) return { A: null, B: null };
    return {
      A: quizTarget === "A" ? "correct" : guessed === "A" ? "wrong" : null,
      B: quizTarget === "B" ? "correct" : guessed === "B" ? "wrong" : null,
    };
  }, [verdict, quizTarget, guessed]);

  const handleRestart = useCallback(() => {
    setPairIdx(0);
    setQuizTarget(null);
    setVerdict(null);
    setGuessed(null);
    setScore({ correct: 0, wrong: 0 });
    setIsDone(false);
    lastPlayedRef.current = null;
  }, []);

  const handleNextContrast = useCallback(() => {
    const nextIdx = (contrastIdx + 1) % MINIMAL_PAIR_CONTRASTS.length;
    handleContrastChange(nextIdx);
  }, [contrastIdx, handleContrastChange]);

  const total = score.correct + score.wrong;
  const accuracy = total > 0 ? Math.round((score.correct / total) * 100) : null;
  const correctWord = quizTarget === "A" ? pair.wordA : pair.wordB;
  const isLastPair = pairIdx === contrast.pairs.length - 1;

  return (
    <section id="minimal-pairs" className="ipa-chart__section">
      <header className="ipa-chart__mp-head">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="ipa-chart__mp-icon shrink-0" aria-hidden>
            <Headphones size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="ipa-chart__section-title">Pares mínimos</h2>
            <p className="ipa-chart__lead">Entrena tu oído con un solo sonido.</p>
          </div>
        </div>

        {accuracy !== null && (
          <div className="shrink-0 rounded-xl px-3 py-1.5 text-right animate-chip-appear bg-surface-sunken border border-border-subtle">
            <p className="text-tiny font-bold uppercase tracking-widest mb-0.5 text-fg-subtle">
              Precisión
            </p>
            <p className="text-lg font-semibold tabular-nums text-fg">
              {accuracy}%
              <span className="ml-1.5 text-xs font-normal text-fg-subtle">
                ({score.correct}/{total})
              </span>
            </p>
          </div>
        )}
      </header>

      <div className="ipa-chart__mpchips">
        {MINIMAL_PAIR_CONTRASTS.map((c, idx) => (
          <ContrastChip
            key={c.id}
            contrast={c}
            isActive={idx === contrastIdx}
            onClick={() => handleContrastChange(idx)}
          />
        ))}
      </div>

      {!isDone && (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm leading-snug text-fg-muted">{contrast.hint}</p>
            <span className="shrink-0 text-tiny font-bold uppercase tracking-widest tabular-nums text-fg-subtle">
              Par <span className="text-fg">{pairIdx + 1}</span> /{" "}
              {contrast.pairs.length}
            </span>
          </div>

          <div
            key={`${contrast.id}-${pairIdx}`}
            className="ipa-chart__mpcards animate-fadeIn"
          >
            <WordCard
              word={pair.wordA}
              symbol={contrast.phonemeA}
              side="A"
              isPlaying={playingSide === "A"}
              highlight={highlights.A}
              selectable={quizTarget !== null && verdict === null}
              onPlay={() => playSide("A")}
              onPick={() => handleGuess("A")}
            />

            <span className="ipa-chart__mpvs">vs</span>

            <WordCard
              word={pair.wordB}
              symbol={contrast.phonemeB}
              side="B"
              isPlaying={playingSide === "B"}
              highlight={highlights.B}
              selectable={quizTarget !== null && verdict === null}
              onPlay={() => playSide("B")}
              onPick={() => handleGuess("B")}
            />
          </div>
        </>
      )}

      <TrainerControls
        quizTarget={quizTarget}
        verdict={verdict}
        correctWord={correctWord}
        isLastPair={isLastPair}
        isDone={isDone}
        accuracy={accuracy}
        onPlayBoth={handlePlayBoth}
        onNextPair={handleNextPair}
        onReplayClue={handleReplayClue}
        onStartQuiz={handleStartQuiz}
        onNextRound={handleNextRound}
        onRestart={handleRestart}
        onNextContrast={handleNextContrast}
      />
    </section>
  );
}
