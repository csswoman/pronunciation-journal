"use client";

import { useEffect, useRef, useState } from "react";
import { useOKLCHTheme } from "@/hooks/useOKLCHTheme";
import Button from "@/components/ui/Button";

export default function ThemeControl() {
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
      <Button
        onClick={() => setOpen((v) => !v)}
        variant="ghost"
        size="sm"
        className="w-full justify-start text-xs text-[var(--text-secondary)]"
        icon={
          <span
            className="w-3.5 h-3.5 rounded-full flex-shrink-0 ring-1 ring-black/10 dark:ring-overlay-weak"
            style={{ background: `oklch(0.65 0.15 ${hue})` }}
          />
        }
      >
        <span>
          Theme&nbsp;·&nbsp;{hue}°
        </span>
      </Button>

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
              <Button
                onClick={resetHue}
                variant="ghost"
                size="icon"
                title="Reset hue"
                aria-label="Reset theme color"
                className="text-[var(--text-secondary)]"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                }
              >
              </Button>

              {/* Dark mode toggle */}
              <Button
                onClick={toggleMode}
                variant="ghost"
                size="icon"
                title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
                aria-label="Toggle dark mode"
                className="text-[var(--text-secondary)]"
                icon={
                  mode === "dark" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                    </svg>
                  )
                }
              >
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
