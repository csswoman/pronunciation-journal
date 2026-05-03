"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import HomeTheoryOfDay from "@/components/home/HomeTheoryOfDay";
import HomeMinimalPairs from "@/components/home/HomeMinimalPairs";
import HomeShadowingDrill from "@/components/home/HomeShadowingDrill";

const SLIDES = [
  { id: "theory",   label: "Mini Lesson",    component: <HomeTheoryOfDay /> },
  { id: "minimal",  label: "Minimal Pairs",  component: <HomeMinimalPairs /> },
  { id: "shadow",   label: "Shadowing",      component: <HomeShadowingDrill /> },
];

export default function HomeDrillCarousel() {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((i) => (i === 0 ? SLIDES.length - 1 : i - 1));
  const next = () => setCurrent((i) => (i === SLIDES.length - 1 ? 0 : i + 1));

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden">

      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">

        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrent(i)}
              aria-label={s.label}
              className={[
                "h-1.5 rounded-full transition-all duration-200",
                i === current
                  ? "w-5 bg-[var(--primary)]"
                  : "w-1.5 bg-[var(--border-hover)]",
              ].join(" ")}
            />
          ))}
        </div>

        {/* Label + arrows */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            {SLIDES[current].label}
          </span>
          <div className="flex gap-1">
            <button
              onClick={prev}
              aria-label="Previous"
              className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={next}
              aria-label="Next"
              className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Slide — no outer padding, each child Card owns its padding */}
      <div className="[&>*]:rounded-none [&>*]:border-0 [&>*]:shadow-none">
        {SLIDES[current].component}
      </div>

    </div>
  );
}
