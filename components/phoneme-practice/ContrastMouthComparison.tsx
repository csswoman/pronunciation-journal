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
    <div className="rounded-2xl border border-border-default bg-surface-raised transition-colors shadow-xs my-2 overflow-hidden">
      <div className="p-1">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-3 text-left font-label text-body-sm font-semibold rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-focus-ring"
          aria-expanded={open}
        >
          <span className="flex items-center gap-2 flex-wrap">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <Sparkles size={15} aria-hidden />
            </span>
            <span className="text-fg">¿Cómo cambia la boca entre</span>
            <span className="font-ipa text-body-md font-bold text-primary whitespace-nowrap">
              {phonemeA}
            </span>
            <span className="text-fg">y</span>
            <span className="font-ipa text-body-md font-bold text-primary whitespace-nowrap">
              {phonemeB}
            </span>
            <span className="text-fg">?</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-fg-muted font-caption text-xs font-medium rounded-full bg-surface-sunken px-2.5 py-1 shrink-0 border border-border-subtle">
            {open ? "Ocultar" : "Comparar"}
            {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </span>
        </button>
      </div>

      {open && (
        <div className="p-4 pt-3 border-t border-border-subtle animate-in fade-in duration-200">
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
