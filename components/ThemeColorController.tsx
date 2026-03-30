"use client";

import { useOKLCHTheme } from "@/hooks/useOKLCHTheme";
import { useEffect, useState } from "react";

interface ThemeColorControllerProps {
  isExpanded: boolean;
}

export default function ThemeColorController({ isExpanded }: ThemeColorControllerProps) {
  const { hue, setHue, resetHue, mode, toggleMode, mounted } = useOKLCHTheme();
  const [isDragging, setIsDragging] = useState(false);

  if (!mounted) return null;

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

  // Generate rainbow gradient for the slider
  const rainbowGradient = Array.from({ length: 361 }, (_, i) => {
    const h = i;
    return `hsl(${h}, 100%, 50%)`;
  })
    .join(", ");

  return (
    <div className="px-4 py-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
      {/* Theme Color Label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {isExpanded ? "Theme Color" : ""}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-gray-500 dark:text-gray-400"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
          </svg>
          <span className="text-xs text-gray-500 dark:text-gray-600 ml-auto">
            {isExpanded ? hue : ""}
          </span>
        </div>
      </div>

      {/* Hue Slider */}
      <div className="space-y-2">
        <input
          type="range"
          min="0"
          max="360"
          value={hue}
          onChange={handleSliderChange}
          onMouseDown={handleMouseDown}
          className="w-full h-2 bg-gradient-to-r appearance-none rounded-lg cursor-pointer slider-thumb accent-color-slider"
          style={{
            backgroundImage: `linear-gradient(to right, ${rainbowGradient})`,
          }}
          title={`Hue: ${hue}°`}
        />

        {/* Hue Value Display */}
        {isExpanded && (
          <div className="text-center text-xs text-gray-600 dark:text-gray-400 font-mono">
            {hue}°
          </div>
        )}
      </div>

      {/* Color Preview Box */}
      <div className="flex gap-2">
        {/* Light mode preview */}
        <div className="flex-1 h-16 rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden">
          <div
            className="w-full h-full"
            style={{
              background: `oklch(0.65 0.15 ${hue})`,
            }}
            title="Light mode accent"
          />
        </div>

        {/* Dark mode preview */}
        <div className="flex-1 h-16 rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden bg-gray-900">
          <div
            className="w-full h-full"
            style={{
              background: `oklch(0.7 0.14 ${hue})`,
            }}
            title="Dark mode accent"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleMode}
          className="flex-1 p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
          aria-label="Toggle dark mode"
        >
          {mode === "dark" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mx-auto text-yellow-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 3v1m0 16v1m9-9h-1m-16 0H1m15.364 1.636l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mx-auto text-gray-700"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* Reset Button */}
        <button
          onClick={resetHue}
          className="flex-1 p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Reset to default hue (250°)"
          aria-label="Reset theme color"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mx-auto text-gray-700 dark:text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Collapsed View - Just show color dot */}
      {!isExpanded && (
        <div className="flex justify-center">
          <div
            className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 shadow-md"
            style={{
              background: `oklch(0.65 0.15 ${hue})`,
            }}
            title={`Current hue: ${hue}°`}
          />
        </div>
      )}
    </div>
  );
}
