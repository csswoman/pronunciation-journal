"use client";
import Button from "@/components/ui/Button";

import { useOKLCHTheme } from "@/hooks/useOKLCHTheme";
import { useEffect, useState } from "react";

interface ThemeColorControllerProps {
  isExpanded: boolean;
}

export default function ThemeColorController({ isExpanded }: ThemeColorControllerProps) {
  const { hue, setHue, resetHue, mode, toggleMode, mounted } = useOKLCHTheme();
  const [isDragging, setIsDragging] = useState(false);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHue(parseInt(e.target.value, 10));
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div className="px-4 py-4 space-y-4 transition-all" style={{ borderTop: '1px solid var(--border)' }}>
      {!mounted ? (
        <div className="h-20 rounded-md animate-pulse" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
      ) : (
        <>
          {/* Theme Color Label with Reset Icon and Value Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isExpanded && (
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Theme Color
                </span>
              )}
              <Button
                onClick={resetHue}
                className="w-6 h-6 flex items-center justify-center rounded-md transition-all hover:opacity-80"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                title="Reset to default hue"
                aria-label="Reset theme color"
              >
                <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>↺</span>
              </Button>
            </div>
            {isExpanded && (
              <div
                className="px-2 py-1 rounded-md text-sm font-semibold"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
              >
                {hue}°
              </div>
            )}
          </div>

          {/* Color Selection Slider */}
          <input
            type="range"
            min="0"
            max="360"
            value={hue}
            onChange={handleSliderChange}
            onMouseDown={handleMouseDown}
            className="w-full appearance-none cursor-pointer color-selection-slider"
            title={`Hue: ${hue}°`}
          />

          {/* Dark Mode Toggle */}
          <Button
            onClick={toggleMode}
            className="w-full p-2 rounded-md transition-all hover:opacity-80"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
            title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
            aria-label="Toggle dark mode"
          >
            {mode === "dark" ? (
              /* Sun icon — visible in dark mode, click to go light */
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                style={{ color: 'var(--primary)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
              </svg>
            ) : (
              /* Moon icon — visible in light mode, click to go dark */
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                style={{ color: 'var(--text-primary)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              </svg>
            )}
          </Button>

          {/* Collapsed View - Just show color dot */}
          {!isExpanded && (
            <div className="flex justify-center">
              <div
                className="w-8 h-8 rounded-full shadow-md transition-all"
                style={{
                  background: `oklch(0.65 0.15 ${hue})`,
                  borderColor: 'var(--border)',
                  borderWidth: '2px',
                }}
                title={`Current hue: ${hue}°`}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

