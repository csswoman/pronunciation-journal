"use client";

import { RotateCcw, ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";
import type { ScoringResult } from "@/lib/types";
import type { ExerciseDifficulty, Level } from "./CandidateRecorder";
import { AccuracyRing } from "./AccuracyRing";
import { WordChip } from "./WordChip";
import { InlineRecorder } from "./InlineRecorder";
import { getThreshold } from "./interview-utils";
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
    <div className="flex items-start gap-2.5 max-w-[88%] self-end flex-row-reverse">
      <div
        className="w-7 h-7 rounded-md flex-shrink-0 flex items-center justify-center text-[11px] font-bold"
        style={{
          background: "color-mix(in srgb, var(--primary) 12%, transparent)",
          color: "var(--primary)",
          border: "1px solid color-mix(in srgb, var(--primary) 18%, transparent)",
        }}
        aria-hidden
      >
        Y
      </div>
      <div className="flex flex-col gap-1.5 min-w-0 flex-1 items-end">
        {isActive && !turnResult && (
          <span className="relative group mr-0.5">
            <Button variant="outline" size="sm" onClick={onNext}>Skip</Button>
            <span
              className="absolute bottom-full right-0 mb-1.5 px-2 py-1 rounded-lg text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20"
              style={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              Skip this line
            </span>
          </span>
        )}

        <div
          className="w-full rounded-lg rounded-tr-sm px-3.5 py-2.5"
          style={{
            fontSize: "15px",
            background: "color-mix(in srgb, var(--primary) 12%, var(--surface-raised))",
            color: "var(--text-primary)",
            border: `1px solid ${
              isActive && !turnResult
                ? "color-mix(in srgb, var(--primary) 40%, transparent)"
                : "color-mix(in srgb, var(--primary) 18%, transparent)"
            }`,
          }}
        >
          <p className="leading-[1.65] font-medium">{text}</p>

          {turnResult && (
            <div className="mt-3 pt-3 flex flex-col gap-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
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
                <Button variant="outline" size="sm" icon={<RotateCcw size={11} />} onClick={onRetry}>Retry</Button>
                {isActive && (
                  <Button variant="primary" size="sm" onClick={onNext} className="flex-1"
                    icon={!isDone ? <ChevronRight size={12} /> : undefined} iconPosition="right">
                    {isDone ? "Finish" : "Next"}
                  </Button>
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
