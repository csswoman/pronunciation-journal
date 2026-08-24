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
const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

/** What the user asked for. "system" tracks the OS setting live. */
export type ThemePreference = "light" | "dark" | "system";

type Listener = () => void;

// ── Module-level singleton ──────────────────────────────────────────────────
// All hook instances share this state, so only one layout effect ever calls
// applyMode/applyHue — no race conditions between ThemeProvider and any
// component that also calls useOKLCHTheme().

let _hue: number = DEFAULT_HUE;
let _preference: ThemePreference = "system";
let _mode: ThemeMode = "light";
let _mounted = false;
const _listeners = new Set<Listener>();
let _mediaQuery: MediaQueryList | null = null;

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

/** Recompute the resolved mode from the current preference + OS setting. */
function resolveAndApplyMode() {
  const savedMode = _preference === "system" ? null : _preference;
  _mode = resolveThemeMode(savedMode, _mediaQuery?.matches ?? false);
  applyMode(_mode);
}

function onSystemPreferenceChange() {
  if (_preference !== "system") return;
  resolveAndApplyMode();
  notify();
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

  const savedMode = localStorage.getItem(STORAGE_MODE_KEY);
  _preference = savedMode === "light" || savedMode === "dark" ? savedMode : "system";

  _mediaQuery = window.matchMedia(DARK_MEDIA_QUERY);
  _mediaQuery.addEventListener("change", onSystemPreferenceChange);

  resolveAndApplyMode();

  notify();
}
// ───────────────────────────────────────────────────────────────────────────

export function useOKLCHTheme() {
  // Local state mirrors the singleton so React re-renders on change
  const [hue, setHueLocal] = useState<number>(_hue);
  const [preference, setPreferenceLocal] = useState<ThemePreference>(_preference);
  const [mode, setModeLocal] = useState<ThemeMode>(_mode);
  const [mounted, setMounted] = useState(_mounted);

  // useLayoutEffect: re-apply before paint if hydration touched <html>.
  useLayoutEffect(() => {
    const sync = () => {
      setHueLocal(_hue);
      setPreferenceLocal(_preference);
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

  const setPreference = useCallback((next: ThemePreference) => {
    _preference = next;
    if (next === "system") {
      localStorage.removeItem(STORAGE_MODE_KEY);
    } else {
      localStorage.setItem(STORAGE_MODE_KEY, next);
    }
    resolveAndApplyMode();
    notify();
  }, []);

  const toggleMode = useCallback(() => {
    const next: ThemeMode = _mode === "dark" ? "light" : "dark";
    setPreference(next);
  }, [setPreference]);

  const resetHue = useCallback(() => {
    setHue(DEFAULT_HUE);
  }, [setHue]);

  return { hue, setHue, resetHue, preference, setPreference, mode, toggleMode, mounted };
}
