"use client";

import { useState } from "react";
import { ArrowLeft, Info } from "lucide-react";

const STAGE_NAMES = ["Listen & Repeat", "Speak Free", "Quick Quiz"];

interface Props {
  pattern: string;
  wordIndex: number;
  totalWords: number;
  stageIndex: number;
  totalStages: number;
  diffMode: "chill" | "master";
  onDiffChange: (mode: "chill" | "master") => void;
  onBack: () => void;
}

export default function ExerciseTopBar({
  pattern,
  wordIndex,
  totalWords,
  stageIndex,
  totalStages,
  diffMode,
  onDiffChange,
  onBack,
}: Props) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <header className="h-14 flex items-center justify-between px-space-6 bg-surface-raised border-b border-border-subtle shrink-0">
      {/* Left: back + breadcrumb */}
      <div className="flex items-center gap-space-3 min-w-0">
        <button
          onClick={onBack}
          className="shrink-0 flex items-center gap-space-1 rounded-full px-space-3 py-space-1 bg-surface-sunken text-fg-muted hover:text-fg transition-colors text-body-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-body-sm text-fg-muted truncate">
          <span className="font-semibold text-fg">&ldquo;{pattern}&rdquo;</span>
          {" "}—{" "}Pattern
          <span className="mx-space-2 text-border-strong">·</span>
          word {wordIndex}/{totalWords}
          <span className="mx-space-2 text-border-strong">·</span>
          stage {stageIndex + 1}/{totalStages} — {STAGE_NAMES[stageIndex]}
        </span>
      </div>

      {/* Right: difficulty toggle */}
      <div className="flex items-center gap-space-2 shrink-0">
        <div className="relative">
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="p-1 text-fg-subtle hover:text-fg-muted transition-colors"
            aria-label="Difficulty info"
          >
            <Info className="w-4 h-4" />
          </button>
          {showTooltip && (
            <div className="absolute right-0 top-7 z-30 w-52 rounded-lg bg-surface-tooltip text-on-primary px-space-3 py-space-2 text-caption shadow-lg">
              <strong>Chill:</strong> IPA visible.<br />
              <strong>Master:</strong> audio only.
            </div>
          )}
        </div>

        <div className="inline-flex rounded-full border border-border-subtle bg-surface-sunken p-0.5 text-body-sm font-semibold">
          <button
            onClick={() => onDiffChange("chill")}
            className={`rounded-full px-space-4 py-space-1 transition-colors text-body-sm ${
              diffMode === "chill"
                ? "bg-surface-raised text-fg shadow-sm"
                : "text-fg-muted hover:text-fg"
            }`}
          >
            Chill
          </button>
          <button
            onClick={() => onDiffChange("master")}
            className={`rounded-full px-space-4 py-space-1 transition-colors text-body-sm ${
              diffMode === "master"
                ? "bg-primary text-on-primary"
                : "text-fg-muted hover:text-fg"
            }`}
          >
            Master
          </button>
        </div>
      </div>
    </header>
  );
}
