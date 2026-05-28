"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Headphones } from "lucide-react";
import { MINIMAL_PAIR_CONTRASTS } from "./minimal-pairs-data";
import { ContrastChip } from "./contrast-chip";
import { WordCard } from "./word-card";
import { TrainerControls } from "./trainer-controls";

type Verdict = "correct" | "wrong" | null;
type Side = "A" | "B";

interface ScoreBoard {
  correct: number;
  wrong: number;
}

function speakWord(word: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(word);
  utter.lang = "en-US";
  utter.rate = 0.85;
  if (onEnd) utter.onend = () => onEnd();
  window.speechSynthesis.speak(utter);
}

export default function MinimalPairsTrainer() {
  const [contrastIdx, setContrastIdx] = useState(0);
  const [pairIdx, setPairIdx] = useState(0);
  const [quizTarget, setQuizTarget] = useState<Side | null>(null);
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [playingSide, setPlayingSide] = useState<Side | null>(null);
  const [score, setScore] = useState<ScoreBoard>({ correct: 0, wrong: 0 });
  const lastPlayedRef = useRef<Side | null>(null);

  const contrast = MINIMAL_PAIR_CONTRASTS[contrastIdx];
  const pair = contrast.pairs[pairIdx];

  const playSide = useCallback(
    (side: Side) => {
      setPlayingSide(side);
      const word = side === "A" ? pair.wordA : pair.wordB;
      speakWord(word, () => setPlayingSide(null));
    },
    [pair]
  );

  const resetQuiz = useCallback(() => {
    setQuizTarget(null);
    setVerdict(null);
    lastPlayedRef.current = null;
  }, []);

  const handleContrastChange = useCallback((idx: number) => {
    setContrastIdx(idx);
    setPairIdx(0);
    setQuizTarget(null);
    setVerdict(null);
    setScore({ correct: 0, wrong: 0 });
  }, []);

  const handleNextPair = useCallback(() => {
    setPairIdx((idx) => (idx + 1) % contrast.pairs.length);
    resetQuiz();
  }, [contrast.pairs.length, resetQuiz]);

  const handlePlayBoth = useCallback(() => {
    resetQuiz();
    setPlayingSide("A");
    speakWord(pair.wordA, () => {
      setPlayingSide("B");
      speakWord(pair.wordB, () => setPlayingSide(null));
    });
  }, [pair, resetQuiz]);

  const handleStartQuiz = useCallback(() => {
    const target: Side = Math.random() < 0.5 ? "A" : "B";
    setQuizTarget(target);
    setVerdict(null);
    lastPlayedRef.current = target;
    setPlayingSide(target);
    const word = target === "A" ? pair.wordA : pair.wordB;
    speakWord(word, () => setPlayingSide(null));
  }, [pair]);

  const handleGuess = useCallback(
    (guess: Side) => {
      if (!quizTarget || verdict) return;
      const correct = guess === quizTarget;
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
    const side = lastPlayedRef.current;
    setPlayingSide(side);
    speakWord(side === "A" ? pair.wordA : pair.wordB, () => setPlayingSide(null));
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
    if (!verdict || !quizTarget) return { A: null, B: null };
    return {
      A: quizTarget === "A" ? verdict : verdict === "wrong" ? "wrong" : null,
      B: quizTarget === "B" ? verdict : verdict === "wrong" ? "wrong" : null,
    };
  }, [verdict, quizTarget]);

  const total = score.correct + score.wrong;
  const accuracy = total > 0 ? Math.round((score.correct / total) * 100) : null;
  const correctWord = quizTarget === "A" ? pair.wordA : pair.wordB;

  return (
    <section
      className="rounded-2xl border p-6 lg:p-8 bg-[var(--card-bg)] border-[var(--line-divider)]"
    >
      <header className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl mt-0.5 bg-[var(--btn-regular-bg)]">
            <Headphones size={18} className="text-[var(--text-primary)]" />
          </span>
          <div>
            <h2 className="text-xl font-semibold leading-tight mb-1 text-[var(--text-primary)]">
              Minimal pairs trainer
            </h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Two words that differ by one sound — train your ear to hear the difference.
            </p>
          </div>
        </div>

        {accuracy !== null && (
          <div className="shrink-0 rounded-xl px-4 py-2 text-right animate-chip-appear bg-[var(--btn-regular-bg)]">
            <p className="text-tiny font-bold uppercase tracking-widest mb-0.5 text-[var(--text-tertiary)]">
              Accuracy
            </p>
            <p className="text-lg font-semibold tabular-nums text-[var(--text-primary)]">
              {accuracy}%
              <span className="ml-1.5 text-xs font-normal text-[var(--text-tertiary)]">
                ({score.correct}/{total})
              </span>
            </p>
          </div>
        )}
      </header>

      <div className="flex flex-wrap gap-2 mb-6">
        {MINIMAL_PAIR_CONTRASTS.map((c, idx) => (
          <ContrastChip
            key={c.id}
            contrast={c}
            isActive={idx === contrastIdx}
            onClick={() => handleContrastChange(idx)}
          />
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm leading-snug text-[var(--text-secondary)]">{contrast.hint}</p>
        <span className="shrink-0 ml-3 inline-flex items-center gap-1 text-tiny font-bold uppercase tracking-widest tabular-nums text-[var(--text-tertiary)]">
          Pair <span className="text-[var(--text-primary)]">{pairIdx + 1}</span> / {contrast.pairs.length}
        </span>
      </div>

      <div
        key={`${contrast.id}-${pairIdx}`}
        className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-4 animate-fadeIn"
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

        <div className="flex flex-col items-center justify-center gap-3 px-1">
          <span className="font-serif text-base text-[var(--text-tertiary)]">vs</span>
          <div className="w-px flex-1 bg-[var(--line-divider)]" />
        </div>

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

      <TrainerControls
        quizTarget={quizTarget}
        verdict={verdict}
        correctWord={correctWord}
        onPlayBoth={handlePlayBoth}
        onNextPair={handleNextPair}
        onReplayClue={handleReplayClue}
        onStartQuiz={handleStartQuiz}
      />
    </section>
  );
}
