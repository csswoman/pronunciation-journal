"use client";

// Planned structure:
// <IntonationParts>
//   <IntonationPatternPills />
//   <IntonationAssessmentCard />
// </IntonationParts>

import type { IntonationSentence } from "@/lib/speech/intonation-patterns";
import type { IntonationAssessment } from "@/lib/speech/pitch-detector";
import { Volume2 } from "@/components/icons";
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
  return (
    <div className="flex flex-wrap gap-2">
      {patterns.map((item, idx) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(idx)}
          className={cn(
            "rounded-full px-3.5 py-1.5 font-label text-xs transition-colors",
            selectedIndex === idx
              ? "bg-primary text-on-primary font-semibold shadow-sm"
              : "bg-surface-raised border border-border-default text-fg-muted hover:text-fg hover:bg-surface-sunken",
          )}
        >
          {item.patternNameEs}
        </button>
      ))}
    </div>
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
        "flex flex-col gap-2 rounded-xl border p-4 transition-all duration-200",
        assessment.matched
          ? "border-success/40 bg-success-soft"
          : "border-warning/40 bg-warning-soft",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "font-label text-sm font-bold",
            assessment.matched ? "text-success" : "text-warning",
          )}
        >
          {assessment.matched ? "✓ ¡Entonación lograda!" : "⚠ Revisa la curva"}
        </span>
        <div className="flex items-center gap-2">
          {isSaved && (
            <span className="font-caption text-xs font-semibold px-2 py-0.5 rounded-full bg-success/20 text-success">
              ✓ Guardado (+XP)
            </span>
          )}
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-surface-raised text-fg">
            Puntaje: {assessment.scorePct}%
          </span>
        </div>
      </div>
      <p className="text-body-sm text-fg text-pretty">{assessment.feedbackEs}</p>
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="font-caption uppercase tracking-wider text-xs font-semibold text-primary">
            {sentence.patternNameEs}
          </span>
          <h2 className="text-h2 font-bold text-fg mt-1 text-pretty">
            &ldquo;{sentence.text}&rdquo;
          </h2>
          <p className="text-body-sm text-fg-muted mt-1 text-pretty">
            {sentence.descriptionEs}
          </p>
        </div>

        <button
          type="button"
          onClick={onPlay}
          disabled={isPlaying}
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border-default bg-surface-base text-primary transition-transform hover:scale-105 active:scale-95",
            isPlaying && "animate-pulse border-primary",
          )}
          title="Escuchar modelo nativo"
        >
          <Volume2 size={24} />
        </button>
      </div>

      <RhythmicSentenceDisplay
        sentence={sentence.text}
        showAudio={false}
      />
    </div>
  );
}
