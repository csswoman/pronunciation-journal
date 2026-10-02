"use client";

// Planned structure:
// <ArticulationCarouselNav>
//   <ArrowButton prev />
//   <SlideTabs />          — Lengua | Labios | Cómo ponerte
//   <ArrowButton next />
// </ArticulationCarouselNav>

import { ChevronLeft, ChevronRight } from "@/components/icons";
import { cn } from "@/lib/cn";

export type SlideIndex = 0 | 1 | 2;

export const SLIDE_TABS: { id: SlideIndex; label: string }[] = [
  { id: 0, label: "Lengua" },
  { id: 1, label: "Labios" },
  { id: 2, label: "Cómo ponerte" },
];

interface Props {
  activeSlide: SlideIndex;
  onSelect: (slide: SlideIndex) => void;
}

const ARROW_CLASS =
  "press-feedback flex shrink-0 items-center justify-center size-8 rounded-full border border-black/20 text-black hover:bg-black/5 transition-all";

export function ArticulationCarouselNav({ activeSlide, onSelect }: Props) {
  const prev = (activeSlide === 0 ? 2 : activeSlide - 1) as SlideIndex;
  const next = (activeSlide === 2 ? 0 : activeSlide + 1) as SlideIndex;

  return (
    <div className="flex items-center justify-between gap-2">
      <button type="button" onClick={() => onSelect(prev)} className={ARROW_CLASS} aria-label="Diapositiva anterior">
        <ChevronLeft size={16} />
      </button>

      <div className="flex items-center gap-1 p-1 rounded-full bg-black/5" role="tablist">
        {SLIDE_TABS.map((tab) => {
          const isActive = activeSlide === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(tab.id)}
              className={cn(
                "px-3 py-1 rounded-full ts-pill transition-all",
                isActive ? "bg-black text-white shadow-xs" : "text-black/70 hover:bg-black/5",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <button type="button" onClick={() => onSelect(next)} className={ARROW_CLASS} aria-label="Diapositiva siguiente">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
