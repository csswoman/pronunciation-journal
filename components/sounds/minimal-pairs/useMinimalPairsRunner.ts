"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { speakText } from "@/lib/speech/synthesis";
import { canonicalizeSoundIpa } from "@/lib/sounds/inventory";
import {
  findMinimalPairContrastIndex,
  getMinimalPairsForPhoneme,
  MINIMAL_PAIR_CONTRASTS,
} from "@/lib/sounds/minimal-pairs";
import { useMinimalPairsInteractions } from "./useMinimalPairsInteractions";
import type { Side, Verdict } from "./minimal-pairs-types";

export type { Side, Verdict } from "./minimal-pairs-types";

export function useMinimalPairsRunner(
  initialPhoneme?: string,
  initialContrastId?: string,
) {
  const contrastIndex = findMinimalPairContrastIndex(initialPhoneme, initialContrastId);
  const contrast = contrastIndex === null ? null : MINIMAL_PAIR_CONTRASTS[contrastIndex];
  const phoneme = initialPhoneme
    ? canonicalizeSoundIpa(initialPhoneme)
    : contrast
      ? contrast.phonemeA
      : null;
  const pairs = useMemo(() => {
    if (contrast) {
      return contrast.pairs.map((pair) => ({
        ...pair,
        phonemeA: contrast.phonemeA,
        phonemeB: contrast.phonemeB,
      }));
    }
    return phoneme ? getMinimalPairsForPhoneme(phoneme) : [];
  }, [contrast, phoneme]);
  const [pairIdx, setPairIdx] = useState(0);
  const [quizTarget, setQuizTarget] = useState<Side | null>(null);
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [guessed, setGuessed] = useState<Side | null>(null);
  const [playingSide, setPlayingSide] = useState<Side | null>(null);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [isSlow, setIsSlow] = useState(false);
  const [isAutoLoop, setIsAutoLoop] = useState(false);
  const lastPlayedRef = useRef<Side | null>(null);
  const quizActionsRef = useRef<HTMLDivElement>(null);
  const loopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const pair = pairs[pairIdx];

  const resetRound = useCallback(() => {
    setQuizTarget(null);
    setVerdict(null);
    setGuessed(null);
    lastPlayedRef.current = null;
  }, []);

  const speakWord = useCallback((word: string, onEnd?: () => void) => {
    speakText(word, { rate: isSlow ? 0.7 : 0.95, onEnd });
  }, [isSlow]);

  useEffect(() => {
    if (!isAutoLoop || isDone || !pair) {
      if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current);
      return;
    }

    setPlayingSide("A");
    speakWord(pair.wordA, () => {
      loopTimeoutRef.current = setTimeout(() => {
        setPlayingSide("B");
        speakWord(pair.wordB, () => {
          setPlayingSide(null);
          loopTimeoutRef.current = setTimeout(() => {
            setPairIdx((prev) => (prev < pairs.length - 1 ? prev + 1 : 0));
          }, 1800);
        });
      }, 700);
    });

    return () => {
      if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current);
    };
  }, [isAutoLoop, pairIdx, isDone, pair, speakWord, pairs.length]);

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
    if (correct) {
      setStreak((s) => {
        const next = s + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
    } else {
      setStreak(0);
    }
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

  useMinimalPairsInteractions({
    quizTarget,
    verdict,
    quizActionsRef,
    handleGuess,
    goToNextPair,
  });

  const highlights = useMemo<{ A: Verdict; B: Verdict }>(() => {
    if (!verdict || !quizTarget || !guessed) return { A: null, B: null };
    return {
      A: quizTarget === "A" ? "correct" : guessed === "A" ? "wrong" : null,
      B: quizTarget === "B" ? "correct" : guessed === "B" ? "wrong" : null,
    };
  }, [guessed, quizTarget, verdict]);

  const total = score.correct + score.wrong;
  const accuracy = total ? Math.round((score.correct / total) * 100) : null;
  const isLastPair = pairIdx === pairs.length - 1;
  const correctWord = quizTarget === "A" ? pair?.wordA : pair?.wordB;

  const handleRestart = useCallback(() => {
    setPairIdx(0);
    resetRound();
    setScore({ correct: 0, wrong: 0 });
    setStreak(0);
    setBestStreak(0);
    setIsDone(false);
  }, [resetRound]);

  return {
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
  };
}

