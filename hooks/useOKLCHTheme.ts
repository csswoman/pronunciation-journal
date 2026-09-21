"use client";

import { useLayoutEffect, useState, useCallback } from "react";
import {
  resolveThemeMode,
  type ThemeMode,
} from "@/lib/theme/resolve-theme-mode";
import {
  ACCENT_PRESETS,
  DEFAULT_ACCENT_ID,
  isValidAccent,
  type AccentId,
} from "@/lib/theme/accent-presets";

const STORAGE_ACCENT_KEY = "theme-accent";
const STORAGE_MODE_KEY = "theme-mode";
const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

export type ThemePreference = "light" | "dark" | "system";

type Listener = () => void;

let _accent: AccentId = DEFAULT_ACCENT_ID;
let _preference: ThemePreference = "system";
let _mode: ThemeMode = "light";
let _mounted = false;
const _listeners = new Set<Listener>();
let _mediaQuery: MediaQueryList | null = null;

function notify() {
  _listeners.forEach((fn) => fn());
}

function applyAccent(accent: AccentId) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-accent", accent);
  }
}

function applyMode(newMode: ThemeMode) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", newMode);
    document.documentElement.classList.toggle("dark", newMode === "dark");
    document.documentElement.style.colorScheme = newMode;
  }
}

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

  const savedAccent = localStorage.getItem(STORAGE_ACCENT_KEY);
  if (isValidAccent(savedAccent)) {
    _accent = savedAccent;
  }
  applyAccent(_accent);

  const savedMode = localStorage.getItem(STORAGE_MODE_KEY);
  _preference = savedMode === "light" || savedMode === "dark" ? savedMode : "system";

  _mediaQuery = window.matchMedia(DARK_MEDIA_QUERY);
  _mediaQuery.addEventListener("change", onSystemPreferenceChange);

  resolveAndApplyMode();

  notify();
}

export function useOKLCHTheme() {
  const [accent, setAccentLocal] = useState<AccentId>(_accent);
  const [preference, setPreferenceLocal] = useState<ThemePreference>(_preference);
  const [mode, setModeLocal] = useState<ThemeMode>(_mode);
  const [mounted, setMounted] = useState(_mounted);

  useLayoutEffect(() => {
    const sync = () => {
      setAccentLocal(_accent);
      setPreferenceLocal(_preference);
      setModeLocal(_mode);
      setMounted(_mounted);
    };
    _listeners.add(sync);
    initOnce();
    return () => {
      _listeners.delete(sync);
    };
  }, []);

  const setAccent = useCallback((nextAccent: AccentId) => {
    _accent = nextAccent;
    applyAccent(nextAccent);
    localStorage.setItem(STORAGE_ACCENT_KEY, nextAccent);
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

  // Backwards compatibility aliases during migration
  const hue = 250;
  const setHue = useCallback(() => {}, []);
  const resetHue = useCallback(() => setAccent(DEFAULT_ACCENT_ID), [setAccent]);

  return {
    accent,
    setAccent,
    preference,
    setPreference,
    mode,
    toggleMode,
    mounted,
    // Aliases
    hue,
    setHue,
    resetHue,
    ACCENT_PRESETS,
  };
}

export { useOKLCHTheme as useTheme };

/**
 * useAppearance() — thin wrapper over useOKLCHTheme() matching the shape
 * from docs/design-system/README.md §Color (`theme`, `accent`, `setTheme`,
 * `setAccent`). `theme` here is the resolved light/dark mode (`mode` in the
 * underlying hook), not the raw "light|dark|system" preference — components
 * that need the three-way preference (e.g. a "usar el del sistema" option)
 * should use `useOKLCHTheme()`/`useTheme()` directly instead.
 */
export function useAppearance() {
  const { mode, setPreference, accent, setAccent } = useOKLCHTheme();
  return {
    theme: mode,
    accent,
    setTheme: setPreference,
    setAccent,
  };
}
