"use client";

// Planned structure:
// <IntonationParts>
//   <IntonationPatternPills />
//   <IntonationSentenceHeader />
//   <IntonationAssessmentCard />
// </IntonationParts>

import type { KeyboardEvent } from "react";
import type { IntonationSentence } from "@/lib/speech/intonation-patterns";
import type { IntonationAssessment } from "@/lib/speech/pitch-detector";
import { ListenButton } from "@/components/ui/ListenButton";
import Badge from "@/components/ui/Badge";
import { RhythmicSentenceDisplay } from "./RhythmicSentenceDisplay";
import { cn } from "@/lib/cn";

export function IntonationPatternPills({
  patterns,
  selectedIndex,
  onSelect,
}: {
  patterns: IntonationSentence[];
  selectedIndex: number;
  onSelect: (idx: number) => void;
}) {
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      onSelect((idx + 1) % patterns.length);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      onSelect((idx - 1 + patterns.length) % patterns.length);
    }
  };

  return (
    <aside
      aria-label="Patrones de entonación disponibles"
      className="flex flex-col gap-3 rounded-2xl border border-border-default bg-surface-raised p-4 shadow-xs"
    >
      <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2.5">
        <span className="font-kicker text-xs uppercase tracking-wider text-fg-muted font-semibold">
          Patrones Melódicos
        </span>
        <span className="font-mono text-xs text-primary font-bold">
          {patterns.length} patrones
        </span>
      </div>

      <div
        role="tablist"
        aria-orientation="vertical"
        className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto no-scrollbar pb-1 lg:pb-0 max-h-[640px]"
      >
        {patterns.map((item, idx) => {
          const isSelected = selectedIndex === idx;
          const arrow =
            item.pattern === "rising"
              ? "↗"
              : item.pattern === "falling"
              ? "↘"
              : item.pattern === "fall-rise"
              ? "↘↗"
              : "↗↘";

          return (
            <button
              key={item.id}
              role="tab"
              id={`pattern-tab-${idx}`}
              aria-selected={isSelected}
              aria-controls="intonation-trainer-content"
              tabIndex={isSelected ? 0 : -1}
              type="button"
              onClick={() => onSelect(idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={cn(
                "flex flex-col text-left shrink-0 lg:shrink w-auto lg:w-full rounded-xl p-3 transition-all cursor-pointer border select-none min-w-[220px] lg:min-w-0 touch-manipulation focus-ring",
                isSelected
                  ? "bg-surface-base border-primary shadow-xs ring-1 ring-primary/40"
                  : "bg-surface-base/50 border-border-subtle hover:border-border-default hover:bg-surface-base",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "font-label text-xs sm:text-body-sm font-semibold truncate",
                    isSelected ? "text-primary" : "text-fg",
                  )}
                >
                  {item.patternNameEs}
                </span>
                <span
                  className={cn(
                    "font-mono text-xs px-1.5 py-0.5 rounded shrink-0",
                    isSelected
                      ? "bg-primary text-on-primary font-bold"
                      : "bg-surface-sunken text-fg-muted font-medium",
                  )}
                >
                  {arrow}
                </span>
              </div>
              <span className="font-sans text-caption text-fg-muted mt-1 truncate">
                {item.descriptionEs}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export function IntonationAssessmentCard({
  assessment,
  isSaved,
}: {
  assessment: IntonationAssessment;
  isSaved?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 rounded-xl border p-4 transition-all duration-200 shadow-xs",
        assessment.matched
          ? "border-success/40 bg-success-soft"
          : "border-warning/40 bg-warning-soft",
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge
          label={assessment.matched ? "✓ ¡Entonación lograda!" : "⚠ Revisa la curva"}
          variant={assessment.matched ? "success" : "warning"}
          size="sm"
          dot
        />

        <div className="flex items-center gap-2">
          {isSaved && (
            <Badge label="✓ Guardado (+XP)" variant="success" size="sm" />
          )}
          <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-md bg-surface-raised border border-border-subtle text-fg">
            Puntaje: {assessment.scorePct}%
          </span>
        </div>
      </div>

      <p className="text-body-sm text-fg text-pretty leading-relaxed">
        {assessment.feedbackEs}
      </p>
    </div>
  );
}

export function IntonationSentenceHeader({
  sentence,
  onPlay,
  isPlaying,
}: {
  sentence: IntonationSentence;
  onPlay: () => void;
  isPlaying: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <span className="font-kicker text-primary text-xs uppercase tracking-wider font-semibold">
            {sentence.patternNameEs}
          </span>
          <h2 className="text-h1 sm:text-display-word font-bold text-fg mt-1 text-pretty tracking-tight">
            &ldquo;{sentence.text}&rdquo;
          </h2>
          <p className="text-body-sm text-fg-muted mt-1.5 text-pretty leading-relaxed max-w-2xl">
            {sentence.descriptionEs}
          </p>
        </div>

        <div className="shrink-0 self-start sm:self-auto">
          <ListenButton
            onPlay={onPlay}
            disabled={isPlaying}
            aria-pressed={isPlaying}
            label={isPlaying ? "Reproduciendo…" : "Escuchar modelo"}
          />
        </div>
      </div>

      {/* Rhythmic display seamlessly embedded without card-in-card redundancy */}
      <div className="pt-2 border-t border-border-subtle/50">
        <RhythmicSentenceDisplay
          sentence={sentence.text}
          showAudio={false}
          className="border-0 bg-transparent p-0 shadow-none"
        />
      </div>
    </div>
  );
}
