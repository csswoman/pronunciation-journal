"use client";

// Planned structure:
// <StageProgressBar>
//   {stages.map} <StageSegment> (label + track + optional jump tooltip)
// </StageProgressBar>

import { useState } from "react";
import type { LessonStageId } from "./lesson-lobby-types";

const STAGE_IDS: LessonStageId[] = ["guided", "pronunciation", "speed"];

const STAGE_LABELS: Record<LessonStageId, string> = {
  guided: "Listen & Repeat",
  pronunciation: "Speak Free",
  speed: "Quick Quiz",
};

const JUMP_CAPTIONS: Record<LessonStageId, string> = {
  guided: "Go back to guided practice.",
  pronunciation: "You'll skip the guided practice.",
  speed: "Skip straight to the quick quiz.",
};

interface Props {
  currentStageIndex: number;
  wordProgress: number; // 0–1, fill of the active segment
  onJumpStage: (index: number) => void;
}

export function StageProgressBar({ currentStageIndex, wordProgress, onJumpStage }: Props) {
  const [tooltip, setTooltip] = useState<number | null>(null);

  return (
    <div className="px-6 py-3 border-b border-border-subtle bg-surface-base">
      <div className="flex gap-3">
        {STAGE_IDS.map((stageId, i) => {
          const isCompleted = i < currentStageIndex;
          const isActive = i === currentStageIndex;
          const isFuture = i > currentStageIndex;
          const fillPct = isCompleted ? 100 : isActive ? Math.round(wordProgress * 100) : 0;

          return (
            <div key={stageId} className="relative flex-1">
              <button
                onClick={() => i !== currentStageIndex && setTooltip(tooltip === i ? null : i)}
                className="w-full text-left"
                aria-label={`${i !== currentStageIndex ? "Jump to" : "Current stage:"} ${STAGE_LABELS[stageId]}`}
              >
                <span
                  className={`block text-tiny font-medium mb-1.5 transition-colors ${
                    isFuture ? "text-fg-subtle" : isActive ? "text-fg" : "text-fg-muted"
                  }`}
                >
                  {STAGE_LABELS[stageId]}
                </span>
                <div className="h-1.5 rounded-full overflow-hidden bg-[color-mix(in_oklch,var(--primary)_15%,transparent)]">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
              </button>

              {tooltip === i && (
                <JumpTooltip
                  label={STAGE_LABELS[stageId]}
                  caption={JUMP_CAPTIONS[stageId]}
                  onConfirm={() => { onJumpStage(i); setTooltip(null); }}
                  onCancel={() => setTooltip(null)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function JumpTooltip({
  label,
  caption,
  onConfirm,
  onCancel,
}: {
  label: string;
  caption: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="absolute top-full left-0 mt-2 z-20 min-w-[190px] rounded-xl border border-border-subtle bg-surface-raised p-3 shadow-card">
      <p className="text-body-sm font-medium text-fg mb-1">Skip to {label}?</p>
      <p className="text-caption text-fg-muted mb-3">{caption}</p>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          className="flex-1 rounded-lg bg-primary py-1.5 text-caption font-medium text-on-primary hover:opacity-90 transition-opacity"
        >
          Skip
        </button>
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg bg-surface-sunken py-1.5 text-caption font-medium text-fg"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
