"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/hooks/useTheme";

type DarkModeResult = {
  isDark: boolean;
  toggleDarkMode: () => void;
  mounted: boolean;
};

function getPrefersDark() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function useDarkMode(): DarkModeResult {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = useMemo(() => {
    if (!mounted) return false;
    if (theme.mode === "system") {
      return getPrefersDark();
    }
    return theme.mode === "dark";
  }, [theme.mode, mounted]);

  const toggleDarkMode = () => {
    if (theme.mode === "dark") {
      theme.setMode("light");
      return;
    }

    theme.setMode("dark");
  };

  return { isDark, toggleDarkMode, mounted };
}
