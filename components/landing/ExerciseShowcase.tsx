// Planned structure:
// <ExerciseShowcase>
//   tablist row (4 tabs + pause/play button)
//   story progress bar (4 segments with CSS linear fill)
//   slide viewport (min-h 440px)
//   screen reader summary text (sr-only)
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, Volume2, Type, Layers, Grid } from "lucide-react";
import { AudioSlide } from "@/components/landing/slides/AudioSlide";
import { WordSlide } from "@/components/landing/slides/WordSlide";
import { ChunkSlide } from "@/components/landing/slides/ChunkSlide";
import { WordSearchSlide } from "@/components/landing/slides/WordSearchSlide";

const TABS = [
  { label: "Audio", icon: Volume2 },
  { label: "Palabras", icon: Type },
  { label: "Chunks", icon: Layers },
  { label: "Juegos", icon: Grid },
] as const;

export function ExerciseShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const userPausedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleNextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % 4);
  }, []);

  const handleSelectTab = (index: number) => {
    setActiveIndex(index);
  };

  const togglePause = () => {
    setIsPaused((prev) => {
      const next = !prev;
      userPausedRef.current = next;
      return next;
    });
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else if (!userPausedRef.current) {
        setIsPaused(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const el = containerRef.current;
    let observer: IntersectionObserver | null = null;

    if (el) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) {
            setIsPaused(true);
          } else if (!userPausedRef.current && !document.hidden) {
            setIsPaused(false);
          }
        },
        { threshold: 0.2 }
      );
      observer.observe(el);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (observer && el) observer.unobserve(el);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-live="off"
      className={`relative flex w-full flex-col gap-4 rounded-[28px] bg-white dark:bg-[var(--surface)] border border-black/5 dark:border-[var(--border)] p-6 sm:p-8 shadow-xl shadow-black/5 transition-colors duration-200 ${
        isPaused ? "is-paused" : ""
      }`}
    >
      {/* Screen reader fallback text */}
      <span className="sr-only">
        Demostración interactiva de los 4 tipos de ejercicio de English Journal:
        Audio (escuchar y repetir con feedback de forma débil), Palabras (contraste entre pronunciación fuerte y débil real), Chunks (ordenar frases por bloques naturales) y Juegos (sopa de letras de vocabulario).
      </span>

      {/* 1. Tablist Row */}
      <div role="tablist" aria-label="Tipos de ejercicio" className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-1.5 sm:gap-2">
          {TABS.map((tab, idx) => {
            const isActive = activeIndex === idx;
            const Icon = tab.icon;

            return (
              <button
                key={tab.label}
                type="button"
                role="tab"
                id={`tab-${idx}`}
                aria-selected={isActive}
                aria-controls={`tabpanel-${idx}`}
                onClick={() => handleSelectTab(idx)}
                className={`flex h-11 flex-1 items-center justify-center rounded-full text-xs font-semibold sm:text-sm transition-colors duration-200 focus-ring ${
                  isActive
                    ? "bg-[var(--ink)] dark:bg-white text-white dark:text-[var(--ink)] shadow-xs"
                    : "bg-[var(--surface-raised)] text-[var(--ink-secondary)] dark:text-[var(--text-secondary)] hover:text-[var(--ink)] dark:hover:text-white border border-[var(--border)]"
                }`}
              >
                <Icon className="size-4 sm:hidden" strokeWidth={2} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sr-only sm:hidden">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Pause/Play Toggle Button */}
        <button
          type="button"
          onClick={togglePause}
          aria-label={
            isPaused
              ? "Reanudar la demostración"
              : "Pausar la demostración"
          }
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--ink)] dark:text-[var(--text)] transition-colors hover:bg-[var(--border)] focus-ring"
        >
          {isPaused ? (
            <Play className="size-4 fill-current ml-0.5" strokeWidth={2} />
          ) : (
            <Pause className="size-4 fill-current" strokeWidth={2} />
          )}
        </button>
      </div>

      {/* 2. Story Progress Bar */}
      <div className="flex h-1 gap-1.5" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, idx) => {
          const isPast = idx < activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <div
              key={idx}
              className="h-full flex-1 overflow-hidden rounded-full bg-[var(--border)] dark:bg-[var(--border-strong)]"
            >
              {isPast && <div className="h-full w-full rounded-full bg-[var(--ink)] dark:bg-white" />}
              {isCurrent && (
                <div
                  onAnimationEnd={(e) => {
                    if (e.animationName === "ejBar") {
                      handleNextSlide();
                    }
                  }}
                  className="ej-progress h-full rounded-full bg-[var(--ink)] dark:bg-white"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Slide Viewport (Generous Height min-h-[440px]) */}
      <div
        id={`tabpanel-${activeIndex}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeIndex}`}
        className="relative flex min-h-[420px] sm:min-h-[440px] w-full flex-col justify-between overflow-hidden pt-2"
      >
        {activeIndex === 0 && <AudioSlide key={0} />}
        {activeIndex === 1 && <WordSlide key={1} />}
        {activeIndex === 2 && <ChunkSlide key={2} />}
        {activeIndex === 3 && <WordSearchSlide key={3} />}
      </div>
    </div>
  );
}
