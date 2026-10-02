"use client";

import { useState, type KeyboardEvent } from "react";
import type { IntonationSentence } from "@/lib/speech/intonation-patterns";
import type { IntonationAssessment } from "@/lib/speech/pitch-detector";
import Badge from "@/components/ui/Badge";
import { RhythmicSentenceDisplay } from "./RhythmicSentenceDisplay";
import { Volume2 } from "@/components/icons";
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
  const [activeFilter, setActiveFilter] = useState<"all" | "rising" | "falling" | "fall-rise">("all");
  const [showAll, setShowAll] = useState(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      onSelect((idx + 1) % patterns.length);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      onSelect((idx - 1 + patterns.length) % patterns.length);
    }
  };

  const risingCount = patterns.filter((p) => p.pattern === "rising").length;
  const fallingCount = patterns.filter((p) => p.pattern === "falling").length;
  const fallRiseCount = patterns.filter((p) => p.pattern === "fall-rise" || p.pattern === "rise-fall").length;

  const filteredPatterns = patterns.filter((p) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "rising") return p.pattern === "rising";
    if (activeFilter === "falling") return p.pattern === "falling";
    if (activeFilter === "fall-rise") return p.pattern === "fall-rise" || p.pattern === "rise-fall";
    return true;
  });

  const displayedPatterns = showAll || activeFilter !== "all" ? filteredPatterns : filteredPatterns.slice(0, 5);

  return (
    <aside
      aria-label="Patrones de entonación disponibles"
      className="flex flex-col gap-3.5 rounded-3xl border border-border-subtle bg-surface p-4 sm:p-5 shadow-xs w-full"
    >
      <div className="flex items-center justify-between pb-0.5">
        <span className="font-mono text-xs uppercase tracking-wider text-fg-muted font-bold">
          PATRONES MELÓDICOS
        </span>
        <span className="font-mono text-xs h-7 w-7 rounded-full bg-surface-sunken border border-border-subtle text-fg font-bold flex items-center justify-center shadow-2xs">
          {patterns.length}
        </span>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pb-0.5">
        <button
          type="button"
          onClick={() => {
            setActiveFilter((f) => (f === "rising" ? "all" : "rising"));
          }}
          className={cn(
            "px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer",
            activeFilter === "rising"
              ? "bg-primary text-on-primary shadow-xs"
              : "bg-surface-sunken border border-border-subtle text-fg hover:bg-surface-base",
          )}
        >
          Ascendente ↗ {risingCount}
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveFilter((f) => (f === "falling" ? "all" : "falling"));
          }}
          className={cn(
            "px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer",
            activeFilter === "falling"
              ? "bg-primary text-on-primary shadow-xs"
              : "bg-surface-sunken border border-border-subtle text-fg hover:bg-surface-base",
          )}
        >
          Descendente ↘ {fallingCount}
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveFilter((f) => (f === "fall-rise" ? "all" : "fall-rise"));
          }}
          className={cn(
            "px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer",
            activeFilter === "fall-rise"
              ? "bg-primary text-on-primary shadow-xs"
              : "bg-surface-sunken border border-border-subtle text-fg hover:bg-surface-base",
          )}
        >
          Caída-subida ↘↗ {fallRiseCount}
        </button>
      </div>

      {/* Pattern list */}
      <div
        role="tablist"
        aria-orientation="vertical"
        className="flex flex-col gap-1.5 pt-0.5"
      >
        {displayedPatterns.map((item) => {
          const originalIdx = patterns.findIndex((p) => p.id === item.id);
          const isSelected = selectedIndex === originalIdx;
          const arrow =
            item.pattern === "rising"
              ? "↗"
              : item.pattern === "falling"
              ? "↘"
              : item.pattern === "fall-rise"
              ? "↘↗"
              : "↗↘";

          const titleText = item.shortTitleEs ?? item.patternNameEs;
          const quoteText = item.shortQuote ?? `"${item.text}"`;

          if (isSelected) {
            return (
              <button
                key={item.id}
                role="tab"
                id={`pattern-tab-${originalIdx}`}
                aria-selected="true"
                aria-controls="intonation-trainer-content"
                tabIndex={0}
                type="button"
                onClick={() => onSelect(originalIdx)}
                onKeyDown={(e) => handleKeyDown(e, originalIdx)}
                className="flex items-center justify-between text-left w-full rounded-2xl p-3.5 sm:p-4 bg-[var(--sky)] shadow-xs cursor-pointer select-none transition-all border border-ink/10"
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/20 text-ink font-bold text-base shrink-0">
                    {arrow}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-display font-bold text-base text-ink truncate">
                      {titleText}
                    </span>
                    <span className="font-sans text-sm text-ink/75 truncate mt-0.5">
                      {quoteText}
                    </span>
                  </div>
                </div>
                <span className="shrink-0 bg-ink text-paper font-black text-xs tracking-wider uppercase px-3.5 py-1.5 rounded-full shadow-2xs">
                  AHORA
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              role="tab"
              id={`pattern-tab-${originalIdx}`}
              aria-selected="false"
              aria-controls="intonation-trainer-content"
              tabIndex={-1}
              type="button"
              onClick={() => onSelect(originalIdx)}
              onKeyDown={(e) => handleKeyDown(e, originalIdx)}
              className="flex items-center justify-between text-left w-full rounded-xl p-3.5 bg-transparent hover:bg-surface-sunken/60 border-b border-border-subtle/30 transition-colors cursor-pointer select-none"
            >
              <div className="flex items-center gap-3.5 min-w-0 pr-2">
                <span className="text-sm font-bold text-fg shrink-0 w-6 text-center">
                  {arrow}
                </span>
                <span className="font-sans font-bold text-base text-fg truncate">
                  {titleText}
                </span>
              </div>
              <span className="font-mono text-sm text-fg-muted shrink-0 text-right">
                {quoteText}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setShowAll((prev) => !prev)}
        className="w-full py-3 px-5 rounded-full bg-surface-sunken hover:bg-border-subtle text-fg font-bold text-sm sm:text-base transition-colors text-center cursor-pointer mt-1 border border-border-subtle"
      >
        {showAll || activeFilter !== "all"
          ? "Ver menos"
          : `Ver los ${patterns.length} patrones`}
      </button>
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
        "flex flex-col gap-2 rounded-xl border p-3.5 transition-all duration-200 shadow-xs",
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
          <span className="font-mono ts-badge px-2 py-0.5 rounded-md bg-surface-raised border border-border-subtle text-fg text-xs">
            Puntaje: {assessment.scorePct}%
          </span>
        </div>
      </div>

      <p className="font-sans text-fg text-pretty leading-relaxed text-xs sm:text-sm">
        {assessment.feedbackEs}
      </p>
    </div>
  );
}

export function IntonationSentenceHeader({
  sentence,
  onPlay,
  isPlaying,
  currentIndex = 1,
  totalCount = 9,
}: {
  sentence: IntonationSentence;
  onPlay: () => void;
  isPlaying: boolean;
  currentIndex?: number;
  totalCount?: number;
}) {
  const patternUpper =
    sentence.pattern === "rising"
      ? "ASCENDENTE ↗"
      : sentence.pattern === "falling"
      ? "DESCENDENTE ↘"
      : sentence.pattern === "fall-rise"
      ? "CAÍDA-SUBIDA ↘↗"
      : "SUBIDA-CAÍDA ↗↘";

  const categoryLabel = (sentence.shortTitleEs ?? sentence.category).toLowerCase();

  return (
    <div className="flex flex-col gap-3">
      {/* Top Header Bar inside PastelCard */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-ink text-paper font-bold text-xs px-3.5 py-1 rounded-full uppercase tracking-wider shadow-2xs">
            {patternUpper}
          </span>
          <span className="pastel-card-chip font-medium text-xs px-3.5 py-1 rounded-full border border-ink/10">
            {categoryLabel}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-semibold text-ink-secondary">
            {currentIndex} de {totalCount}
          </span>
          <button
            type="button"
            onClick={onPlay}
            disabled={isPlaying}
            aria-label={isPlaying ? "Reproduciendo oración" : "Escuchar oración"}
            className="flex items-center justify-center h-10 w-10 rounded-full bg-ink hover:bg-ink-secondary text-paper transition-all cursor-pointer active:scale-95 shadow-xs disabled:opacity-50"
          >
            <Volume2 className={cn("h-5 w-5", isPlaying && "animate-pulse")} />
          </button>
        </div>
      </div>

      {/* Main sentence text & description */}
      <div>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-ink tracking-tight my-1">
          &ldquo;{sentence.text}&rdquo;
        </h2>
        <p className="font-sans text-sm sm:text-base text-ink-secondary font-normal leading-relaxed max-w-2xl mt-1">
          {sentence.descriptionEs}
        </p>
      </div>

      {/* Box EL COMPÁS */}
      <div className="mt-1">
        <RhythmicSentenceDisplay
          sentence={sentence.text}
          showAudio={false}
          compactHeader={true}
          showLegend={false}
          className="pastel-card-panel rounded-2xl p-4 sm:p-5 border border-ink/10 shadow-xs"
        />
      </div>
    </div>
  );
}
