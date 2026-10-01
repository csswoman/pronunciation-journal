"use client";

// Planned structure:
// <ArticulationCarouselFooter>
//   <PlaybackToggle />     — Pausar / Animar
//   <SpeedToggle />        — 1× / 0.5×
//   <VoicingBadge />       — Con voz / Sin voz
//   <SlideDots />
// </ArticulationCarouselFooter>

import { Pause, Play, Sparkles, Timer } from "@/components/icons";
import type { MotionSpeed } from "@/lib/pronunciation/articulation-motion";
import { cn } from "@/lib/cn";
import { SLIDE_TABS, type SlideIndex } from "./ArticulationCarouselNav";

interface Props {
  isAnimating: boolean;
  onToggleAnimating: () => void;
  speed: MotionSpeed;
  onToggleSpeed: () => void;
  voiced: boolean;
  activeSlide: SlideIndex;
  onSelect: (slide: SlideIndex) => void;
  /** Hidden on the steps slide, where there is nothing to animate. */
  showPlayback: boolean;
}

const CHIP_CLASS =
  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full ts-pill text-black bg-black/5 hover:bg-black/10 transition-all";

export function ArticulationCarouselFooter({
  isAnimating,
  onToggleAnimating,
  speed,
  onToggleSpeed,
  voiced,
  activeSlide,
  onSelect,
  showPlayback,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/10">
      <div className="flex items-center gap-1.5">
        {showPlayback && (
          <>
            <button type="button" onClick={onToggleAnimating} aria-pressed={!isAnimating} className={CHIP_CLASS}>
              {isAnimating ? <Pause size={12} /> : <Play size={12} />}
              <span>{isAnimating ? "Pausar" : "Animar"}</span>
            </button>
            <button
              type="button"
              onClick={onToggleSpeed}
              className={CHIP_CLASS}
              aria-label={speed === "slow" ? "Velocidad normal" : "Más lento"}
            >
              <Timer size={11} />
              <span>{speed === "slow" ? "0.5×" : "1×"}</span>
            </button>
          </>
        )}
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full ts-badge font-semibold",
            voiced ? "bg-amber-100 text-amber-900 border border-amber-300/60" : "bg-black/5 text-black/70",
          )}
          title={voiced ? "Las cuerdas vocales vibran" : "Solo aire, sin vibración"}
        >
          {voiced && <Sparkles size={11} className="text-amber-700" aria-hidden />}
          <span>{voiced ? "Con voz" : "Sin voz"}</span>
        </span>
      </div>

      <div className="flex items-center gap-1">
        {SLIDE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            className={cn(
              "transition-all",
              activeSlide === tab.id
                ? "w-4 h-1.5 rounded-full bg-black"
                : "size-1.5 rounded-full bg-black/30 hover:bg-black/60",
            )}
            aria-label={`Ir a la diapositiva ${tab.id + 1}: ${tab.label}`}
          />
        ))}
      </div>
    </div>
  );
}
