"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { themes, ThemeName, DEFAULT_THEME, applyTheme, resolveThemeName } from "@/lib/themes";

type Mode = "light" | "dark" | "system";

interface ThemeContextType {
  currentTheme: ThemeName;
  mode: Mode;
  setTheme: (t: ThemeName) => void;
  setMode: (m: Mode) => void;
  applyTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_THEME_KEY = "app:theme";
const STORAGE_MODE_KEY = "app:theme:mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_THEME_KEY);
      if (raw) return resolveThemeName(raw);
    } catch (e) {
      // ignore
    }
    return DEFAULT_THEME;
  });

  const [mode, setModeState] = useState<Mode>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_MODE_KEY) as Mode | null;
      return (raw as Mode) ?? "system";
    } catch (e) {
      return "system";
    }
  });

  // apply on mount and whenever theme/mode changes
  useEffect(() => {
    applyTheme(currentTheme, mode === "system" ? "auto" : (mode as "light" | "dark"));
  }, [currentTheme, mode]);

  // Listen to system preference changes when mode === system
  useEffect(() => {
    if (mode !== "system" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme(currentTheme, "auto");
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [mode, currentTheme]);

  const setTheme = (t: ThemeName) => {
    const name = resolveThemeName(t);
    setCurrentTheme(name);
    try {
      localStorage.setItem(STORAGE_THEME_KEY, name);
    } catch (e) {
      // ignore
    }
  };

  const setMode = (m: Mode) => {
    setModeState(m);
    try {
      localStorage.setItem(STORAGE_MODE_KEY, m);
    } catch (e) {
      // ignore
    }
  };

  const value = useMemo(
    () => ({
      currentTheme,
      mode,
      setTheme,
      setMode,
      applyTheme: () => applyTheme(currentTheme, mode === "system" ? "auto" : (mode as "light" | "dark")),
    }),
    [currentTheme, mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export default ThemeProvider;
