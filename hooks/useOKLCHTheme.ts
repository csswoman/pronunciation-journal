"use client";

import { useLayoutEffect, useState, useCallback } from "react";
import {
  resolveThemeMode,
  type ThemeMode,
} from "@/lib/theme/resolve-theme-mode";
import { applySplitComplementaryVars } from "@/lib/theme/split-complementary";

const DEFAULT_HUE = 250;
const STORAGE_HUE_KEY = "theme-hue";
const STORAGE_MODE_KEY = "theme-mode";

type Listener = () => void;

// ── Module-level singleton ──────────────────────────────────────────────────
// All hook instances share this state, so only one layout effect ever calls
// applyMode/applyHue — no race conditions between ThemeProvider and any
// component that also calls useOKLCHTheme().

let _hue: number = DEFAULT_HUE;
let _mode: ThemeMode = "light";
let _mounted = false;
const _listeners = new Set<Listener>();

function notify() {
  _listeners.forEach((fn) => fn());
}

function applyHue(newHue: number) {
  applySplitComplementaryVars(document.documentElement, newHue);
}

function applyMode(newMode: ThemeMode) {
  document.documentElement.classList.toggle("dark", newMode === "dark");
  document.documentElement.style.colorScheme = newMode;
}

function initOnce() {
  if (_mounted) return;
  _mounted = true;

  const savedHue = localStorage.getItem(STORAGE_HUE_KEY);
  if (savedHue) {
    const parsed = parseInt(savedHue, 10);
    if (!isNaN(parsed)) {
      _hue = parsed;
    }
  }
  applyHue(_hue);

  _mode = resolveThemeMode(
    localStorage.getItem(STORAGE_MODE_KEY),
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  applyMode(_mode);

  notify();
}
// ───────────────────────────────────────────────────────────────────────────

export function useOKLCHTheme() {
  // Local state mirrors the singleton so React re-renders on change
  const [hue, setHueLocal] = useState<number>(_hue);
  const [mode, setModeLocal] = useState<ThemeMode>(_mode);
  const [mounted, setMounted] = useState(_mounted);

  // useLayoutEffect: re-apply before paint if hydration touched <html>.
  useLayoutEffect(() => {
    const sync = () => {
      setHueLocal(_hue);
      setModeLocal(_mode);
      setMounted(_mounted);
    };
    _listeners.add(sync);
    // Init exactly once across all instances
    initOnce();
    return () => {
      _listeners.delete(sync);
    };
  }, []);

  const setHue = useCallback((newHue: number) => {
    const clamped = Math.max(0, Math.min(360, newHue));
    _hue = clamped;
    applyHue(clamped);
    localStorage.setItem(STORAGE_HUE_KEY, clamped.toString());
    notify();
  }, []);

  const toggleMode = useCallback(() => {
    const next: ThemeMode = _mode === "dark" ? "light" : "dark";
    _mode = next;
    applyMode(next);
    localStorage.setItem(STORAGE_MODE_KEY, next);
    notify();
  }, []);

  const resetHue = useCallback(() => {
    setHue(DEFAULT_HUE);
  }, [setHue]);

  return { hue, setHue, resetHue, mode, toggleMode, mounted };
}
