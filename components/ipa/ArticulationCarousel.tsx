"use client";

// Planned structure:
// <ArticulationCarousel>
//   <ArticulationCarouselNav />     — [<] [Lengua | Labios | Cómo ponerte] [>]
//   <ArticulationTongueSlide />     — tongue morphs rest → posture
//   <ArticulationLipsSlide />       — lips morph rest → posture
//   <ArticulationStepsSlide />      — numbered steps
//   <ArticulationCarouselFooter />  — Pausar/Animar, 1×/0.5×, voicing, dots
// </ArticulationCarousel>

import { useMemo, useState } from "react";
import { getArticulationGuide } from "@/lib/pronunciation/articulation-guide-data";
import type { MotionSpeed } from "@/lib/pronunciation/articulation-motion";
import { IPA_EXTRA } from "@/lib/pronunciation/ipa-data";
import { canonicalizeSoundIpa } from "@/lib/sounds/inventory";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { PhonemeData } from "./data";
import { ArticulationCarouselNav, type SlideIndex } from "./ArticulationCarouselNav";
import { ArticulationCarouselFooter } from "./ArticulationCarouselFooter";
import {
  ArticulationLipsSlide,
  ArticulationStepsSlide,
  ArticulationTongueSlide,
} from "./ArticulationSlides";

interface ArticulationCarouselProps {
  phoneme: PhonemeData;
  /** Increments when the sound starts playing, restarting the motion in sync. */
  replayKey: number;
}

const FALLBACK_STEPS = ["Ajusta la postura de la boca.", "Escucha y repite."];

export function ArticulationCarousel({ phoneme, replayKey }: ArticulationCarouselProps) {
  const [activeSlide, setActiveSlide] = useState<SlideIndex>(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [speed, setSpeed] = useState<MotionSpeed>("normal");
  const reducedMotion = usePrefersReducedMotion();

  const guide = useMemo(() => getArticulationGuide(phoneme.symbol), [phoneme.symbol]);
  const extra = IPA_EXTRA[canonicalizeSoundIpa(phoneme.symbol)];
  const steps = extra?.articulationEs?.length ? extra.articulationEs : FALLBACK_STEPS;

  const diagramProps = guide && {
    guide,
    isAnimating: isAnimating && !reducedMotion,
    speed,
    replayKey,
  };

  return (
    <div className="flex flex-col justify-between gap-4 min-h-77.5 p-4 rounded-2xl border border-black/10 text-black bg-white/90 shadow-xs dark:bg-white/80">
      <ArticulationCarouselNav activeSlide={activeSlide} onSelect={setActiveSlide} />

      <div className="flex flex-1 flex-col items-center justify-center min-h-40 py-2 text-center">
        {activeSlide === 2 || !diagramProps ? (
          <ArticulationStepsSlide steps={steps} />
        ) : activeSlide === 0 ? (
          <ArticulationTongueSlide {...diagramProps} />
        ) : (
          <ArticulationLipsSlide {...diagramProps} />
        )}
      </div>

      <ArticulationCarouselFooter
        isAnimating={isAnimating}
        onToggleAnimating={() => setIsAnimating((prev) => !prev)}
        speed={speed}
        onToggleSpeed={() => setSpeed((prev) => (prev === "normal" ? "slow" : "normal"))}
        voiced={guide?.vocalCordsVibrate ?? true}
        activeSlide={activeSlide}
        onSelect={setActiveSlide}
        showPlayback={activeSlide !== 2 && !!guide && !reducedMotion}
      />
    </div>
  );
}
