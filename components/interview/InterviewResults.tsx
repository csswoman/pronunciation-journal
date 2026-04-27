"use client";

import { useEffect, useRef } from "react";
import { RotateCcw, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
import type { ScoringResult } from "@/lib/types";
import type { InterviewTurn } from "./InterviewSession";
import { AccuracyRing } from "./AccuracyRing";
import { primaryBtn, outlineBtn, getThreshold } from "./interview-utils";
import type { ExerciseDifficulty, Level } from "./CandidateRecorder";

interface TurnResult {
  score: ScoringResult;
  transcript: string;
}

interface Props {
  title: string;
  turns: InterviewTurn[];
  results: Map<number, TurnResult>;
  difficulty: ExerciseDifficulty;
  level: Level;
  onReset: () => void;
}

export function InterviewResults({ title, turns, results, difficulty, level, onReset }: Props) {
  const fired = useRef(false);
  const threshold = getThreshold(level, difficulty);

  const candidateTurns = turns
    .map((t, idx) => ({ turn: t, idx }))
    .filter(({ turn }) => turn.role === "candidate");

  const scores = candidateTurns
    .map(({ idx }) => results.get(idx)?.score)
    .filter(Boolean) as ScoringResult[];

  const totalAccuracy = scores.length
    ? Math.round(scores.reduce((sum, s) => sum + s.accuracy, 0) / scores.length)
    : 0;

  const passed = scores.filter((s) => s.accuracy >= threshold).length;
  const failed = scores.length - passed;

  const wordsToImprove = candidateTurns.flatMap(({ idx, turn }) => {
    const result = results.get(idx);
    if (!result) return [];
    return (result.score.wordResults ?? [])
      .filter((w) => w.status === "incorrect" || w.status === "missing")
      .map((w) => ({ word: w.expected, tip: w.phonemes?.tip }));
  });

  const uniqueWords = Array.from(
    new Map(wordsToImprove.map((w) => [w.word.toLowerCase(), w])).values()
  ).slice(0, 12);

  useEffect(() => {
    if (fired.current || totalAccuracy < 50) return;
    fired.current = true;

    const end = Date.now() + (totalAccuracy >= 80 ? 2500 : 1500);
    const colors = ["#a855f7", "#6366f1", "#38bdf8", "#34d399", "#fbbf24"];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [totalAccuracy]);

  const grade =
    totalAccuracy >= 90 ? "Excellent!" :
    totalAccuracy >= 75 ? "Great job!" :
    totalAccuracy >= threshold ? "Good effort!" :
    "Keep practicing!";

  const gradeColor =
    totalAccuracy >= 90 ? "#22c55e" :
    totalAccuracy >= 75 ? "#10b981" :
    totalAccuracy >= threshold ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
      {/* Header */}
      <div
        className="flex-shrink-0 px-4 pt-4 pb-3 flex items-center justify-between gap-3 border-b"
        style={{ borderColor: "var(--line-divider)", background: "var(--card-bg)" }}
      >
        <p className="text-sm font-semibold truncate" style={{ color: "var(--deep-text)" }}>{title}</p>
        <button
          onClick={onReset}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
          style={outlineBtn}
        >
          <RotateCcw size={11} /> New
        </button>
      </div>

      {/* Body */}
      <div
        className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6"
        style={{ background: "var(--muted-bg)" }}
      >
        {/* Score hero */}
        <div
          className="rounded-2xl px-6 py-6 flex flex-col items-center gap-3 text-center"
          style={{ background: "var(--card-bg)", border: "1px solid var(--line-divider)" }}
        >
          <AccuracyRing accuracy={totalAccuracy} size={80} />
          <div>
            <p className="text-xl font-bold" style={{ color: gradeColor }}>{grade}</p>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted-text)" }}>
              Overall pronunciation accuracy
            </p>
          </div>

          {/* Stats row */}
          <div className="flex gap-6 mt-1">
            <div className="flex flex-col items-center gap-0.5">
              <CheckCircle2 size={16} style={{ color: "#22c55e" }} />
              <span className="text-lg font-bold" style={{ color: "var(--deep-text)" }}>{passed}</span>
              <span className="text-xs" style={{ color: "var(--muted-text)" }}>Passed</span>
            </div>
            <div className="w-px" style={{ background: "var(--line-divider)" }} />
            <div className="flex flex-col items-center gap-0.5">
              <AlertCircle size={16} style={{ color: "#ef4444" }} />
              <span className="text-lg font-bold" style={{ color: "var(--deep-text)" }}>{failed}</span>
              <span className="text-xs" style={{ color: "var(--muted-text)" }}>To improve</span>
            </div>
            <div className="w-px" style={{ background: "var(--line-divider)" }} />
            <div className="flex flex-col items-center gap-0.5">
              <TrendingUp size={16} style={{ color: "var(--color-accent)" }} />
              <span className="text-lg font-bold" style={{ color: "var(--deep-text)" }}>{scores.length}</span>
              <span className="text-xs" style={{ color: "var(--muted-text)" }}>Turns</span>
            </div>
          </div>
        </div>

        {/* Per-turn breakdown */}
        {candidateTurns.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide px-1" style={{ color: "var(--muted-text)" }}>
              Turn breakdown
            </p>
            {candidateTurns.map(({ idx, turn }, i) => {
              const result = results.get(idx);
              const acc = result?.score.accuracy ?? null;
              const ok = acc !== null && acc >= threshold;
              return (
                <div
                  key={idx}
                  className="rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{ background: "var(--card-bg)", border: "1px solid var(--line-divider)" }}
                >
                  <span className="text-xs font-bold w-5 text-center flex-shrink-0" style={{ color: "var(--muted-text)" }}>
                    {i + 1}
                  </span>
                  <p className="flex-1 text-xs leading-relaxed min-w-0 truncate" style={{ color: "var(--body-text)" }}>
                    {turn.text}
                  </p>
                  {acc !== null ? (
                    <span
                      className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-lg"
                      style={{
                        background: ok ? "color-mix(in oklch, #22c55e 15%, transparent)" : "color-mix(in oklch, #ef4444 15%, transparent)",
                        color: ok ? "#22c55e" : "#ef4444",
                      }}
                    >
                      {acc}%
                    </span>
                  ) : (
                    <span className="flex-shrink-0 text-xs" style={{ color: "var(--muted-text)" }}>skipped</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Words to improve */}
        {uniqueWords.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide px-1" style={{ color: "var(--muted-text)" }}>
              Words to practice
            </p>
            <div
              className="rounded-2xl px-4 py-4 flex flex-wrap gap-2"
              style={{ background: "var(--card-bg)", border: "1px solid var(--line-divider)" }}
            >
              {uniqueWords.map(({ word, tip }, i) => (
                <span
                  key={i}
                  className="relative group px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: "color-mix(in oklch, #ef4444 12%, transparent)",
                    color: "#ef4444",
                    border: "1px solid color-mix(in oklch, #ef4444 25%, transparent)",
                    ...(tip ? { textDecoration: "underline dotted", textUnderlineOffset: "3px" } : {}),
                  }}
                >
                  {word}
                  {tip && (
                    <span
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-lg"
                      style={{ background: "var(--card-bg)", border: "1px solid var(--line-divider)", color: "var(--body-text)" }}
                    >
                      {tip}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={onReset}
          className="w-full py-3 rounded-2xl text-sm font-semibold transition-all"
          style={primaryBtn}
        >
          Practice again
        </button>
      </div>
    </div>
  );
}
