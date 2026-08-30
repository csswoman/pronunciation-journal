"use client";

import { useMemo, useState } from "react";
import { ArticulationMouthGuide } from "@/components/pronunciation/ArticulationMouthGuide";
import { getArticulationGuide } from "@/lib/pronunciation/articulation-guide-data";
import { getArticulationContrast } from "@/lib/pronunciation/articulation-contrast";
import { ContrastControlBar } from "./ContrastControlBar";
import { ContrastDifferenceSummary } from "./ContrastDifferenceSummary";
import { ChevronDown, ChevronUp, Sparkles } from "@/components/icons";

// Planned structure:
// <ContrastMouthComparison>
//   <DisclosureHeader />              — title + expand toggle
//   <ContrastControlBar />            — one playback control for both sounds
//   <ContrastDifferenceSummary />     — names the articulatory difference
//   <ArticulationMouthGuide x2 />     — the two mouths, side by side
// </ContrastMouthComparison>
interface Props {
  phonemeA: string;
  phonemeB: string;
}

export function ContrastMouthComparison({ phonemeA, phonemeB }: Props) {
  const [open, setOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);
  const [speed, setSpeed] = useState<"normal" | "slow">("normal");

  const guideA = useMemo(() => getArticulationGuide(phonemeA), [phonemeA]);
  const guideB = useMemo(() => getArticulationGuide(phonemeB), [phonemeB]);

  const contrast = useMemo(
    () => (guideA && guideB ? getArticulationContrast(guideA, guideB) : null),
    [guideA, guideB],
  );

  return (
    <div className="rounded-md border border-border-subtle bg-surface-raised p-3.5 my-2">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex flex-1 items-center justify-between gap-2 text-left font-label text-body-sm font-semibold text-primary hover:underline"
          aria-expanded={open}
        >
          <span className="flex items-center gap-2 flex-wrap">
            <Sparkles size={16} className="text-primary shrink-0" aria-hidden />
            <span>¿Cómo cambia la boca entre</span>
            <span className="font-ipa text-body-md font-bold text-fg whitespace-nowrap">
              {phonemeA}
            </span>
            <span>y</span>
            <span className="font-ipa text-body-md font-bold text-fg whitespace-nowrap">
              {phonemeB}
            </span>
            <span>?</span>
          </span>
          <span className="inline-flex items-center gap-1 text-fg-muted font-caption shrink-0">
            {open ? "Ocultar" : "Ver comparación"}
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </button>
      </div>

      {open && (
        <div className="pt-3 mt-2 border-t border-border-subtle animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <p className="font-caption text-fg-muted">
              Ambas bocas se animan a la vez para que compares la misma fase del sonido.
            </p>
            <ContrastControlBar
              isAnimating={isAnimating}
              onToggleAnimating={() => setIsAnimating((prev) => !prev)}
              speed={speed}
              onToggleSpeed={() => setSpeed((prev) => (prev === "normal" ? "slow" : "normal"))}
            />
          </div>

          {contrast && (
            <div className="mb-3">
              <ContrastDifferenceSummary
                contrast={contrast}
                phonemeA={phonemeA}
                phonemeB={phonemeB}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ArticulationMouthGuide
              symbolOrIpa={phonemeA}
              compact
              isAnimating={isAnimating}
              speed={speed}
              highlight={contrast?.changed}
              referencePosition={guideB?.tonguePosition}
            />
            <ArticulationMouthGuide
              symbolOrIpa={phonemeB}
              compact
              isAnimating={isAnimating}
              speed={speed}
              highlight={contrast?.changed}
              referencePosition={guideA?.tonguePosition}
            />
          </div>
        </div>
      )}
    </div>
  );
}
