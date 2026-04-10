"use client";

import { useEffect, useState, useCallback } from "react";

const DEFAULT_HUE = 250;
const STORAGE_HUE_KEY = "theme-hue";
const STORAGE_MODE_KEY = "theme-mode";

type ThemeMode = "light" | "dark";
type Listener = () => void;

// ── Module-level singleton ──────────────────────────────────────────────────
// All hook instances share this state, so only one useEffect ever calls
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
  document.documentElement.style.setProperty("--hue", newHue.toString());
}

function applyMode(newMode: ThemeMode) {
  if (newMode === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

function initOnce() {
  if (_mounted) return;
  _mounted = true;

  const savedHue = localStorage.getItem(STORAGE_HUE_KEY);
  if (savedHue) {
    const parsed = parseInt(savedHue, 10);
    if (!isNaN(parsed)) {
      _hue = parsed;
      applyHue(_hue);
    }
  }

  const savedMode = localStorage.getItem(STORAGE_MODE_KEY) as ThemeMode | null;
  if (savedMode === "light" || savedMode === "dark") {
    _mode = savedMode;
  } else {
    _mode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  applyMode(_mode);

  notify();
}
// ───────────────────────────────────────────────────────────────────────────

export function useOKLCHTheme() {
  // Local state mirrors the singleton so React re-renders on change
  const [hue, setHueLocal] = useState<number>(_hue);
  const [mode, setModeLocal] = useState<ThemeMode>(_mode);
  const [mounted, setMounted] = useState(_mounted);

  // Subscribe to singleton changes
  useEffect(() => {
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
