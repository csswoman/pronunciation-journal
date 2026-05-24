"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Play, HelpCircle, ArrowRight, Check, X } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  MINIMAL_PAIR_CONTRASTS,
  type MinimalPairContrast,
} from "./minimal-pairs-data";

type Verdict = "correct" | "wrong" | null;

function speakWord(word: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(word);
  utter.lang = "en-US";
  utter.rate = 0.85;
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
        "shrink-0 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all",
        isActive ? "" : "hover:bg-[var(--btn-regular-bg)]"
      )}
      style={{
        backgroundColor: isActive ? "var(--text-primary)" : "var(--card-bg)",
        borderColor: isActive ? "var(--text-primary)" : "var(--line-divider)",
        color: isActive ? "var(--card-bg)" : "var(--text-primary)",
      }}
    >
      <span className="font-serif">{contrast.phonemeA}</span>
      <span className="text-tiny uppercase opacity-60">vs</span>
      <span className="font-serif">{contrast.phonemeB}</span>
    </button>
  );
}

function WordCard({
  word,
  symbol,
  onPlay,
  highlight,
}: {
  word: string;
  symbol: string;
  onPlay: () => void;
  highlight: Verdict;
}) {
  const ringColor =
    highlight === "correct"
      ? "var(--success)"
      : highlight === "wrong"
      ? "var(--error)"
      : "var(--line-divider)";

  return (
    <button
      type="button"
      onClick={onPlay}
      className="flex-1 min-w-0 flex flex-col items-center justify-center rounded-xl border px-4 py-5 transition-all duration-150 hover:scale-[1.02] hover:shadow-sm"
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: ringColor,
        boxShadow: highlight ? `0 0 0 1px ${ringColor}` : undefined,
      }}
    >
      <span className="font-serif text-2xl leading-none text-fg mb-1">
        {symbol}
      </span>
      <span
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: "var(--text-secondary)" }}
      >
        {word}
      </span>
    </button>
  );
}

export default function MinimalPairsTrainer() {
  const [contrastIdx, setContrastIdx] = useState(0);
  const [pairIdx, setPairIdx] = useState(0);
  const [quizTarget, setQuizTarget] = useState<"A" | "B" | null>(null);
  const [verdict, setVerdict] = useState<Verdict>(null);
  const lastPlayedRef = useRef<"A" | "B" | null>(null);

  const contrast = MINIMAL_PAIR_CONTRASTS[contrastIdx];
  const pair = contrast.pairs[pairIdx];

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
  }, []);

  const handleNextPair = useCallback(() => {
    setPairIdx((idx) => (idx + 1) % contrast.pairs.length);
    resetQuiz();
  }, [contrast.pairs.length, resetQuiz]);

  const handlePlayBoth = useCallback(() => {
    speakWord(pair.wordA);
    setTimeout(() => speakWord(pair.wordB), 800);
    resetQuiz();
  }, [pair, resetQuiz]);

  const handleStartQuiz = useCallback(() => {
    const target = Math.random() < 0.5 ? "A" : "B";
    setQuizTarget(target);
    setVerdict(null);
    lastPlayedRef.current = target;
    speakWord(target === "A" ? pair.wordA : pair.wordB);
  }, [pair]);

  const handleGuess = useCallback(
    (guess: "A" | "B") => {
      if (!quizTarget) return;
      setVerdict(guess === quizTarget ? "correct" : "wrong");
    },
    [quizTarget]
  );

  const highlights = useMemo<{ A: Verdict; B: Verdict }>(() => {
    if (!verdict || !quizTarget) return { A: null, B: null };
    return {
      A: quizTarget === "A" ? verdict : verdict === "wrong" ? "wrong" : null,
      B: quizTarget === "B" ? verdict : verdict === "wrong" ? "wrong" : null,
    };
  }, [verdict, quizTarget]);

  return (
    <section
      className="rounded-2xl border p-6"
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--line-divider)",
      }}
    >
      <header className="mb-5">
        <h2 className="text-lg font-semibold text-fg mb-1">
          Minimal pairs trainer
        </h2>
        <p className="text-sm text-fg-muted">
          Two words that differ in a single sound — train your ear to hear the difference.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 mb-5">
        {MINIMAL_PAIR_CONTRASTS.map((c, idx) => (
          <ContrastChip
            key={c.id}
            contrast={c}
            isActive={idx === contrastIdx}
            onClick={() => handleContrastChange(idx)}
          />
        ))}
      </div>

      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: "var(--btn-regular-bg)" }}
      >
        <div className="flex items-center gap-3">
          <WordCard
            word={pair.wordA}
            symbol={contrast.phonemeA}
            onPlay={() => speakWord(pair.wordA)}
            highlight={highlights.A}
          />

          <div className="shrink-0 flex flex-col items-center gap-2 px-2 min-w-[160px]">
            <span
              className="text-tiny font-bold uppercase tracking-widest"
              style={{ color: "var(--text-secondary)" }}
            >
              vs
            </span>
            <p className="text-xs text-center text-fg-muted leading-snug">
              {contrast.hint}
            </p>
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={handlePlayBoth}
                className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--card-bg)]"
                style={{
                  backgroundColor: "var(--card-bg)",
                  borderColor: "var(--line-divider)",
                  color: "var(--text-primary)",
                }}
              >
                <Play size={12} fill="currentColor" />
                Play both
              </button>
              <button
                type="button"
                onClick={handleNextPair}
                className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--card-bg)]"
                style={{
                  backgroundColor: "var(--card-bg)",
                  borderColor: "var(--line-divider)",
                  color: "var(--text-primary)",
                }}
              >
                Next pair
                <ArrowRight size={12} />
              </button>
            </div>
          </div>

          <WordCard
            word={pair.wordB}
            symbol={contrast.phonemeB}
            onPlay={() => speakWord(pair.wordB)}
            highlight={highlights.B}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col items-center gap-3">
        {!quizTarget ? (
          <button
            type="button"
            onClick={handleStartQuiz}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-on-primary transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: "var(--primary)" }}
          >
            <HelpCircle size={14} />
            Hear one — guess which
          </button>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <p className="text-xs text-fg-muted">
              {verdict
                ? verdict === "correct"
                  ? "¡Correcto!"
                  : `No — era "${quizTarget === "A" ? pair.wordA : pair.wordB}"`
                : "¿Cuál escuchaste?"}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleGuess("A")}
                disabled={verdict !== null}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-colors hover:bg-[var(--btn-regular-bg)]"
                style={{
                  backgroundColor: "var(--card-bg)",
                  borderColor: "var(--line-divider)",
                  color: "var(--text-primary)",
                }}
              >
                {pair.wordA}
              </button>
              <button
                type="button"
                onClick={() => handleGuess("B")}
                disabled={verdict !== null}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-colors hover:bg-[var(--btn-regular-bg)]"
                style={{
                  backgroundColor: "var(--card-bg)",
                  borderColor: "var(--line-divider)",
                  color: "var(--text-primary)",
                }}
              >
                {pair.wordB}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (lastPlayedRef.current) {
                    speakWord(lastPlayedRef.current === "A" ? pair.wordA : pair.wordB);
                  }
                }}
                aria-label="Replay"
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors hover:bg-[var(--btn-regular-bg)]"
                style={{
                  backgroundColor: "var(--card-bg)",
                  borderColor: "var(--line-divider)",
                  color: "var(--text-primary)",
                }}
              >
                <Play size={12} fill="currentColor" />
              </button>
            </div>
            {verdict && (
              <button
                type="button"
                onClick={handleStartQuiz}
                className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors hover:opacity-70"
                style={{ color: "var(--text-secondary)" }}
              >
                {verdict === "correct" ? (
                  <Check size={12} />
                ) : (
                  <X size={12} />
                )}
                Otra ronda
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
