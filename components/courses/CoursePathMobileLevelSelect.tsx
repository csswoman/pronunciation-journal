"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { CoursePathLevel } from "@/lib/courses/types";

const DEFAULT_LEVEL = "a1";

interface CoursePathMobileLevelSelectProps {
  levels: CoursePathLevel[];
  electiveTracks?: CoursePathLevel[];
  selectedLevelId: string;
  completedCounts: Record<string, number>;
  isElectiveActive: boolean;
  optionalCompletedCount: number;
  optionalTotalCount: number;
}

export default function CoursePathMobileLevelSelect({
  levels,
  electiveTracks,
  selectedLevelId,
  completedCounts,
  isElectiveActive,
  optionalCompletedCount,
  optionalTotalCount,
}: CoursePathMobileLevelSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find active level
  const activeLevel = levels.find((l) => l.id === selectedLevelId && !isElectiveActive);

  let activeLabel = activeLevel ? activeLevel.spineLabel : "A1";
  let activeTitle = activeLevel
    ? activeLevel.title.replace(new RegExp(activeLabel, "i"), "").trim()
    : "";
  let activeCountStr = "";

  if (isElectiveActive) {
    activeLabel = "Opcionales";
    activeTitle = "Rutas opcionales";
    activeCountStr = `${optionalCompletedCount}/${optionalTotalCount}`;
  } else if (activeLevel) {
    const total = activeLevel.units.reduce((sum, u) => sum + u.lessons.length, 0);
    const completed = completedCounts[activeLevel.id] ?? 0;
    activeCountStr = `${completed}/${total}`;
  }

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative w-full md:hidden">
      {/* Custom Select Trigger Button */}
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Seleccionar nivel del curso"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex items-center justify-between gap-3 w-full px-3.5 py-2.5 rounded-2xl border transition-all cursor-pointer font-display min-h-[44px]",
          "bg-surface-raised border-border-default shadow-2xs hover:border-border-strong focus-ring",
          isOpen && "border-primary ring-2 ring-primary/20"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="bg-primary text-on-primary font-bold text-xs px-2.5 py-0.5 rounded-full shrink-0 font-display">
            {activeLabel}
          </span>
          <span className="text-sm font-bold text-fg truncate">
            {activeTitle ? activeTitle : `Nivel ${activeLabel}`}
          </span>
          {activeCountStr && (
            <span className="text-xs text-fg-muted font-medium shrink-0 font-sans">
              · {activeCountStr}
            </span>
          )}
        </div>
        <ChevronDown
          size={18}
          className={cn(
            "text-fg-muted shrink-0 transition-transform duration-200",
            isOpen && "rotate-180 text-primary"
          )}
          aria-hidden
        />
      </button>

      {/* Compact Dropdown Popover */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Niveles del curso"
          className={cn(
            "absolute top-[calc(100%+6px)] left-0 z-40 w-full max-h-80 overflow-y-auto",
            "rounded-2xl border border-border-default bg-surface-raised p-1.5 shadow-xl animate-fade-in flex flex-col gap-1"
          )}
        >
          {levels.map((level) => {
            const totalCount = level.units.reduce((sum, u) => sum + u.lessons.length, 0);
            const completedCount = completedCounts[level.id] ?? 0;
            const isActive = level.id === selectedLevelId && !isElectiveActive;
            const href = level.id === DEFAULT_LEVEL ? "/courses" : `/courses?level=${level.id}`;
            const titleWithoutSpine = level.title
              .replace(new RegExp(level.spineLabel, "i"), "")
              .trim();

            return (
              <Link
                key={level.id}
                href={href}
                onClick={() => setIsOpen(false)}
                role="option"
                aria-selected={isActive}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl transition-colors no-underline font-display min-h-[44px]",
                  isActive
                    ? "bg-primary/10 text-fg font-bold"
                    : "hover:bg-surface-sunken text-fg font-medium"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-bold shrink-0",
                      isActive
                        ? "bg-primary text-on-primary"
                        : "bg-surface-sunken text-fg-muted"
                    )}
                  >
                    {level.spineLabel}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold leading-tight text-fg truncate">
                      {titleWithoutSpine || `Nivel ${level.spineLabel}`}
                    </span>
                    <span className="text-xs text-fg-muted font-sans leading-tight">
                      {completedCount}/{totalCount} completadas
                    </span>
                  </div>
                </div>
                {isActive && <Check size={16} className="text-primary shrink-0 stroke-[2.5]" aria-hidden />}
              </Link>
            );
          })}

          {electiveTracks && electiveTracks.length > 0 && (
            <Link
              key="electivas"
              href="/courses?level=electivas"
              onClick={() => setIsOpen(false)}
              aria-current={isElectiveActive ? "page" : undefined}
              className={cn(
                "flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl transition-colors no-underline font-display min-h-[44px]",
                isElectiveActive
                  ? "bg-primary/10 text-fg font-bold"
                  : "hover:bg-surface-sunken text-fg font-medium"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-bold shrink-0",
                    isElectiveActive
                      ? "bg-primary text-on-primary"
                      : "bg-surface-sunken text-fg-muted"
                  )}
                >
                  Opcionales
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold leading-tight text-fg truncate">
                    Rutas opcionales
                  </span>
                  <span className="text-xs text-fg-muted font-sans leading-tight">
                    {optionalCompletedCount}/{optionalTotalCount} completadas
                  </span>
                </div>
              </div>
              {isElectiveActive && <Check size={16} className="text-primary shrink-0 stroke-[2.5]" aria-hidden />}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
