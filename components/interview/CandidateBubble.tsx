"use client";

import { RotateCcw, ChevronRight } from "lucide-react";
import type { ScoringResult } from "@/lib/types";
import type { ExerciseDifficulty, Level } from "./CandidateRecorder";
import { AccuracyRing } from "./AccuracyRing";
import { WordChip } from "./WordChip";
import { InlineRecorder } from "./InlineRecorder";
import { getThreshold, outlineBtn, primaryBtn } from "./interview-utils";
import { speakPromise } from "./interview-utils";

interface TurnResult {
  score: ScoringResult;
  transcript: string;
}

interface Props {
  text: string;
  isActive: boolean;
  isListening: boolean;
  turnResult?: TurnResult;
  difficulty: ExerciseDifficulty;
  level: Level;
  isDone: boolean;
  idx: number;
  onRecordDone: (score: ScoringResult, transcript: string) => void;
  onListen: () => void;
  onRetry: () => void;
  onNext: () => void;
}

export function CandidateBubble({
  text, isActive, isListening, turnResult, difficulty, level, isDone,
  idx, onRecordDone, onListen, onRetry, onNext,
}: Props) {
  const threshold = getThreshold(level, difficulty);

  return (
    <div className="flex items-start gap-3 max-w-[85%] self-end flex-row-reverse">
      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm mt-1"
        style={{ background: "color-mix(in oklch, var(--color-accent) 15%, transparent)" }}>
        🗣️
      </div>
      <div className="flex flex-col gap-1.5 flex-1 items-end">
        <div className="flex items-center gap-2 mr-1">
          <span className="text-xs font-medium" style={{ color: "var(--muted-text)" }}>You</span>
          {isActive && !turnResult && (
            <span className="relative group">
              <button
                onClick={onNext}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs transition-all"
                style={outlineBtn}
              >
                Skip
              </button>
              <span className="absolute bottom-full right-0 mb-1.5 px-2 py-1 rounded-lg text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-lg"
                style={{ background: "var(--card-bg)", border: "1px solid var(--line-divider)", color: "var(--body-text)" }}>
                Skip this line
              </span>
            </span>
          )}
        </div>

        <div className="w-full rounded-2xl rounded-tr-sm px-4 py-3"
          style={{
            background: "var(--card-bg)",
            border: `1.5px solid ${isActive && !turnResult ? "var(--color-accent)" : "var(--line-divider)"}`,
          }}>
          <p className="text-sm leading-relaxed font-medium" style={{ color: "var(--deep-text)" }}>{text}</p>

          {turnResult && (
            <div className="mt-3 pt-3 flex flex-col gap-3" style={{ borderTop: "1px solid var(--line-divider)" }}>
              <div className="flex items-center gap-3">
                <AccuracyRing accuracy={turnResult.score.accuracy} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold" style={{
                    color: turnResult.score.accuracy >= threshold ? "var(--score-excellent)"
                      : turnResult.score.accuracy >= threshold * 0.75 ? "var(--score-acceptable)" : "var(--score-poor)",
                  }}>
                    {turnResult.score.accuracy >= 90 ? "Excellent!" :
                      turnResult.score.accuracy >= threshold ? "Meets the bar." :
                      turnResult.score.accuracy >= threshold * 0.75 ? "Almost there." :
                      "Keep practicing."}
                  </p>
                </div>
              </div>
              {turnResult.score.wordResults?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {turnResult.score.wordResults.map((w, i) => (
                    <WordChip key={i} word={w.expected} status={w.status}
                      tip={w.phonemes?.tip ?? undefined}
                      onPlay={() => speakPromise(w.expected)} />
                  ))}
                </div>
              )}
              {turnResult.score.wordResults?.some((w) => w.phonemes?.tip) && (
                <p className="text-xs" style={{ color: "var(--muted-text)" }}>Hover underlined words for tips.</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={onRetry}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={outlineBtn}
                >
                  <RotateCcw size={11} /> Retry
                </button>
                {isActive && (
                  <button
                    onClick={onNext}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold"
                    style={primaryBtn}
                  >
                    {isDone ? "Finish" : <>Next <ChevronRight size={12} /></>}
                  </button>
                )}
              </div>
            </div>
          )}

          {isActive && !turnResult && (
            <InlineRecorder
              key={idx}
              targetText={text}
              difficulty={difficulty}
              level={level}
              onDone={onRecordDone}
              onListen={onListen}
              isListening={isListening}
            />
          )}
        </div>
      </div>
    </div>
  );
}
