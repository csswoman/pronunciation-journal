"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Square,
  HelpCircle,
  ArrowRight,
  Check,
  X,
  RotateCcw,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  MINIMAL_PAIR_CONTRASTS,
  type MinimalPairContrast,
} from "./minimal-pairs-data";

type Verdict = "correct" | "wrong" | null;
type Side = "A" | "B";

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

function ContrastChip({
  contrast,
  isActive,
  onClick,
}: {
  contrast: MinimalPairContrast;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium",
        "transition-all duration-150 hover:-translate-y-0.5",
        "active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
      )}
      style={{
        backgroundColor: isActive ? "var(--text-primary)" : "var(--card-bg)",
        borderColor: isActive ? "var(--text-primary)" : "var(--line-divider)",
        color: isActive ? "var(--card-bg)" : "var(--text-primary)",
      }}
    >
      <span className="font-serif text-base">{contrast.phonemeA}</span>
      <span className="text-tiny uppercase tracking-widest opacity-60">vs</span>
      <span className="font-serif text-base">{contrast.phonemeB}</span>
    </button>
  );
}

function WordCard({
  word,
  symbol,
  side,
  isPlaying,
  highlight,
  selectable,
  selected,
  onPlay,
  onPick,
}: {
  word: string;
  symbol: string;
  side: Side;
  isPlaying: boolean;
  highlight: Verdict;
  selectable: boolean;
  selected: boolean;
  onPlay: () => void;
  onPick: () => void;
}) {
  const isCorrect = highlight === "correct";
  const isWrong = highlight === "wrong";

  const borderColor = isCorrect
    ? "var(--success)"
    : isWrong
    ? "var(--error)"
    : selected
    ? "var(--primary)"
    : "var(--border-default)";

  const bgColor = isCorrect
    ? "var(--success-soft)"
    : isWrong
    ? "var(--error-soft)"
    : selected
    ? "var(--primary-soft)"
    : "var(--card-bg)";

  return (
    <button
      type="button"
      onClick={selectable ? onPick : onPlay}
      className={cn(
        "group relative flex-1 min-w-0 flex flex-col items-center justify-center",
        "rounded-2xl border-2 px-6 py-7 min-h-[180px]",
        "transition-[background-color,border-color,transform,box-shadow] duration-200 ease-out",
        "hover:-translate-y-1 hover:shadow-[0_8px_20px_-10px_rgba(0,0,0,0.2)]",
        "active:translate-y-0 active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      )}
      style={{
        backgroundColor: bgColor,
        borderColor,
        boxShadow: highlight ? `0 0 0 3px ${borderColor}33` : undefined,
      }}
    >
      <span
        className="absolute top-3 left-3 inline-flex items-center justify-center w-5 h-5 rounded-md text-tiny font-bold"
        style={{
          backgroundColor: "var(--btn-regular-bg)",
          color: "var(--text-tertiary)",
        }}
      >
        {side}
      </span>

      <span
        className="font-serif text-2xl leading-none mb-3"
        style={{ color: "var(--text-secondary)" }}
      >
        {symbol}
      </span>

      <span
        className="text-3xl font-semibold tracking-tight"
        style={{ color: "var(--text-primary)" }}
      >
        {word}
      </span>

      <span
        className="absolute bottom-3 right-3 inline-flex items-center justify-center w-8 h-8 rounded-full transition-all"
        style={{
          backgroundColor: isPlaying ? "var(--primary)" : "var(--text-primary)",
          color: "var(--card-bg)",
        }}
        aria-hidden
      >
        {isPlaying ? (
          <Square size={11} fill="currentColor" />
        ) : (
          <Play size={11} fill="currentColor" />
        )}
      </span>

      {isCorrect && (
        <span
          className="absolute top-3 right-3 inline-flex items-center justify-center w-6 h-6 rounded-full text-white animate-chip-appear"
          style={{ backgroundColor: "var(--success)" }}
          aria-label="Correct"
        >
          <Check size={13} strokeWidth={3} />
        </span>
      )}
      {isWrong && (
        <span
          className="absolute top-3 right-3 inline-flex items-center justify-center w-6 h-6 rounded-full text-white animate-chip-appear"
          style={{ backgroundColor: "var(--error)" }}
          aria-label="Wrong"
        >
          <X size={13} strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

interface ScoreBoard {
  correct: number;
  wrong: number;
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

  const handleReplayQuiz = useCallback(() => {
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
      if (key === "a") {
        event.preventDefault();
        handleGuess("A");
      } else if (key === "b") {
        event.preventDefault();
        handleGuess("B");
      }
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

  const accuracy =
    score.correct + score.wrong > 0
      ? Math.round((score.correct / (score.correct + score.wrong)) * 100)
      : null;

  return (
    <section
      className="rounded-2xl border p-6 lg:p-8"
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--line-divider)",
      }}
    >
      <header className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <span
            className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl mt-0.5"
            style={{ backgroundColor: "var(--btn-regular-bg)" }}
          >
            <Headphones size={18} style={{ color: "var(--text-primary)" }} />
          </span>
          <div>
            <h2 className="text-xl font-semibold leading-tight mb-1" style={{ color: "var(--text-primary)" }}>
              Minimal pairs trainer
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Two words that differ in a single sound — train your ear to hear the difference.
            </p>
          </div>
        </div>

        {accuracy !== null && (
          <div
            className="shrink-0 rounded-xl px-4 py-2 text-right animate-chip-appear"
            style={{ backgroundColor: "var(--btn-regular-bg)" }}
          >
            <p className="text-tiny font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--text-tertiary)" }}>
              Accuracy
            </p>
            <p className="text-lg font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
              {accuracy}%
              <span className="ml-1.5 text-xs font-normal" style={{ color: "var(--text-tertiary)" }}>
                ({score.correct}/{score.correct + score.wrong})
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
        <p className="text-sm leading-snug" style={{ color: "var(--text-secondary)" }}>
          {contrast.hint}
        </p>
        <span
          className="shrink-0 ml-3 inline-flex items-center gap-1 text-tiny font-bold uppercase tracking-widest tabular-nums"
          style={{ color: "var(--text-tertiary)" }}
        >
          Pair <span style={{ color: "var(--text-primary)" }}>{pairIdx + 1}</span> / {contrast.pairs.length}
        </span>
      </div>

      <div key={`${contrast.id}-${pairIdx}`} className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-4 animate-fadeIn">
        <WordCard
          word={pair.wordA}
          symbol={contrast.phonemeA}
          side="A"
          isPlaying={playingSide === "A"}
          highlight={highlights.A}
          selectable={quizTarget !== null && verdict === null}
          selected={false}
          onPlay={() => playSide("A")}
          onPick={() => handleGuess("A")}
        />

        <div className="flex flex-col items-center justify-center gap-3 px-1">
          <span
            className="font-serif text-base"
            style={{ color: "var(--text-tertiary)" }}
          >
            vs
          </span>
          <div className="w-px flex-1" style={{ backgroundColor: "var(--line-divider)" }} />
        </div>

        <WordCard
          word={pair.wordB}
          symbol={contrast.phonemeB}
          side="B"
          isPlaying={playingSide === "B"}
          highlight={highlights.B}
          selectable={quizTarget !== null && verdict === null}
          selected={false}
          onPlay={() => playSide("B")}
          onPick={() => handleGuess("B")}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePlayBoth}
            className="inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-all duration-150 hover:bg-[var(--btn-regular-bg)] active:scale-[0.97]"
            style={{
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
          >
            <Play size={13} fill="currentColor" />
            Play both
          </button>
          <button
            type="button"
            onClick={handleNextPair}
            className="inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-all duration-150 hover:bg-[var(--btn-regular-bg)] active:scale-[0.97]"
            style={{
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
          >
            Next pair
            <ArrowRight size={13} />
          </button>
        </div>

        {quizTarget && (
          <button
            type="button"
            onClick={handleReplayQuiz}
            className="inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-all duration-150 hover:bg-[var(--btn-regular-bg)] active:scale-[0.97]"
            style={{
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
          >
            <RotateCcw size={13} />
            Replay clue
          </button>
        )}
      </div>

      <div
        className="mt-6 pt-6 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        style={{ borderColor: "var(--line-divider)" }}
      >
        {!quizTarget ? (
          <>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Quiz mode — we play one word, you tell us which.
            </p>
            <button
              type="button"
              onClick={handleStartQuiz}
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--on-primary)",
              }}
            >
              <HelpCircle size={14} />
              Hear one — guess which
            </button>
          </>
        ) : verdict ? (
          <>
            <div className="flex items-center gap-2.5">
              <span
                className="inline-flex items-center justify-center w-7 h-7 rounded-full"
                style={{
                  backgroundColor:
                    verdict === "correct" ? "var(--success)" : "var(--error)",
                  color: "white",
                }}
              >
                {verdict === "correct" ? (
                  <Check size={14} strokeWidth={3} />
                ) : (
                  <X size={14} strokeWidth={3} />
                )}
              </span>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {verdict === "correct"
                  ? "¡Correcto!"
                  : `Era "${quizTarget === "A" ? pair.wordA : pair.wordB}".`}
              </p>
            </div>
            <button
              type="button"
              onClick={handleStartQuiz}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: "var(--text-primary)",
                color: "var(--card-bg)",
              }}
            >
              Otra ronda
              <ArrowRight size={13} />
            </button>
          </>
        ) : (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            ¿Cuál escuchaste? Toca la card o usa{" "}
            <kbd
              className="inline-flex items-center justify-center px-1.5 py-0.5 rounded border text-tiny font-semibold mx-0.5"
              style={{
                backgroundColor: "var(--card-bg)",
                borderColor: "var(--line-divider)",
              }}
            >
              A
            </kbd>{" "}
            /{" "}
            <kbd
              className="inline-flex items-center justify-center px-1.5 py-0.5 rounded border text-tiny font-semibold mx-0.5"
              style={{
                backgroundColor: "var(--card-bg)",
                borderColor: "var(--line-divider)",
              }}
            >
              B
            </kbd>
          </p>
        )}
      </div>
    </section>
  );
}
