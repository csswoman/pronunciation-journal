"use client";

import { useEffect, useRef, useState } from "react";
import { useOKLCHTheme } from "@/hooks/useOKLCHTheme";

export default function ThemeControl({ iconOnly = false }: { iconOnly?: boolean }) {
  const { hue, setHue, resetHue, mode, toggleMode, mounted } = useOKLCHTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  if (!mounted) return null;

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-lg text-xs font-medium transition-colors duration-150 hover:bg-[var(--btn-plain-bg-hover)] ${iconOnly ? "w-full justify-center h-9 px-0" : "w-full px-3 py-2"}`}
        style={{ color: "var(--text-secondary)" }}
        title={`Theme · ${hue}°`}
      >
        <span
          className="w-3.5 h-3.5 rounded-full flex-shrink-0 ring-1 ring-black/10 dark:ring-white/10"
          style={{ background: `oklch(0.65 0.15 ${hue})` }}
        />
        {!iconOnly && (
          <span>
            Theme&nbsp;·&nbsp;{hue}°
          </span>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div
          className="absolute bottom-full left-0 mb-2 w-56 rounded-xl p-4 shadow-lg border z-50
                     animate-in fade-in zoom-in-95 duration-150 origin-bottom-left"
          style={{
            background: "var(--float-panel-bg)",
            borderColor: "var(--line-divider)",
          }}
        >
          {/* Color bar */}
          <div
            className="h-2 rounded-full mb-4"
            style={{ background: "var(--color-selection-bar)" }}
          />

          {/* Slider */}
          <input
            type="range"
            min="0"
            max="360"
            value={hue}
            onChange={(e) => setHue(parseInt(e.target.value, 10))}
            className="w-full appearance-none cursor-pointer color-selection-slider mb-3"
            title={`Hue: ${hue}°`}
          />

          {/* Controls row */}
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md"
              style={{
                background: "var(--btn-regular-bg)",
                color: "var(--btn-content)",
              }}
            >
              {hue}°
            </span>

            <div className="flex items-center gap-1">
              {/* Reset */}
              <button
                onClick={resetHue}
                className="w-7 h-7 flex items-center justify-center rounded-md transition-colors hover:bg-[var(--btn-plain-bg-hover)]"
                style={{ color: "var(--text-secondary)" }}
                title="Reset hue"
                aria-label="Reset theme color"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.26-3.673a.75.75 0 00-1.061 0l-.312.311V5.82a.75.75 0 00-1.5 0v4.243c0 .414.336.75.75.75h4.242a.75.75 0 000-1.5h-2.43l.311-.31a7 7 0 00-11.712-3.138.75.75 0 101.449.39 5.5 5.5 0 019.263 2.454z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Dark mode toggle */}
              <button
                onClick={toggleMode}
                className="w-7 h-7 flex items-center justify-center rounded-md transition-colors hover:bg-[var(--btn-plain-bg-hover)]"
                style={{ color: "var(--text-secondary)" }}
                title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
                aria-label="Toggle dark mode"
              >
                {mode === "dark" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
