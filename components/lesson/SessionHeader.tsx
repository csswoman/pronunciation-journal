"use client";

import Button from "@/components/ui/Button";
import { H1 } from "@/components/ui/Typography";
import type { Phase } from "./ActiveLessonPage";
import type { DifficultyMode } from "./lesson-lobby-types";

interface Props {
  title: string;
  currentIndex: number;
  totalWords: number;
  phase: Phase;
  diffMode: DifficultyMode;
  onDiffChange: (mode: DifficultyMode) => void;
  onBack: () => void;
}

export default function SessionHeader({
  title,
  currentIndex,
  totalWords,
  phase,
  diffMode,
  onDiffChange,
  onBack,
}: Props) {
  return (
    <header
      className="sticky top-0 z-10 border-b border-border-subtle backdrop-blur-md"
      style={{ background: "linear-gradient(180deg, color-mix(in_oklch,var(--card-bg)_92%,var(--on-primary)), var(--card-bg))" }}
    >
      <div className="px-6 py-3 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Button
            onClick={onBack}
            className="rounded-xl p-2.5 transition-colors text-fg-muted hover:bg-surface-sunken"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>

          <div className="text-center min-w-0">
            <H1 className="text-body-lg font-semibold leading-tight tracking-tight truncate">{title}</H1>
            {phase !== "complete" && (
              <p className="text-caption leading-5 text-fg-muted">
                {currentIndex + 1} / {totalWords}
              </p>
            )}
          </div>

          <div
            className="inline-flex rounded-2xl border border-border-subtle bg-surface-sunken p-0.5 text-sm font-semibold shrink-0"
          >
            <Button
              onClick={() => onDiffChange("chill")}
              variant={diffMode === "chill" ? "secondary" : "ghost"}
              size="sm"
              className="text-tiny"
            >
              Chill
            </Button>
            <Button
              onClick={() => onDiffChange("master")}
              variant={diffMode === "master" ? "primary" : "ghost"}
              size="sm"
              className="text-tiny"
            >
              Master
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
