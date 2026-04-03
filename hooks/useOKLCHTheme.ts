"use client";

import { useEffect, useState } from "react";

const DEFAULT_HUE = 250;
const STORAGE_HUE_KEY = "theme-hue";
const STORAGE_MODE_KEY = "theme-mode";

type ThemeMode = "light" | "dark";

export function useOKLCHTheme() {
  const [hue, setHueState] = useState<number>(DEFAULT_HUE);
  const [mode, setModeState] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage and system preference
  useEffect(() => {
    const savedHue = localStorage.getItem(STORAGE_HUE_KEY);
    const savedMode = localStorage.getItem(STORAGE_MODE_KEY) as ThemeMode | null;

    if (savedHue) {
      const parsedHue = parseInt(savedHue, 10);
      if (!isNaN(parsedHue)) {
        setHueState(parsedHue);
        applyHue(parsedHue);
      }
    }

    if (savedMode && (savedMode === "light" || savedMode === "dark")) {
      setModeState(savedMode);
      applyMode(savedMode);
    } else {
      // Fallback to system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initialMode: ThemeMode = prefersDark ? "dark" : "light";
      setModeState(initialMode);
      applyMode(initialMode);
    }

    setMounted(true);
  }, []);

  const applyHue = (newHue: number) => {
    document.documentElement.style.setProperty("--hue", newHue.toString());
  };

  const applyMode = (newMode: ThemeMode) => {
    if (newMode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const setHue = (newHue: number) => {
    const clampedHue = Math.max(0, Math.min(360, newHue));
    setHueState(clampedHue);
    applyHue(clampedHue);
    localStorage.setItem(STORAGE_HUE_KEY, clampedHue.toString());
  };

  const toggleMode = () => {
    const newMode: ThemeMode = mode === "dark" ? "light" : "dark";
    setModeState(newMode);
    applyMode(newMode);
    localStorage.setItem(STORAGE_MODE_KEY, newMode);
  };

  const resetHue = () => {
    setHue(DEFAULT_HUE);
  };

  return {
    hue,
    setHue,
    resetHue,
    mode,
    toggleMode,
    mounted,
  };
}
