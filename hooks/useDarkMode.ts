"use client";

import { useState, useEffect } from "react";

export function useDarkMode() {
  // Initialize state based on actual DOM state to prevent hydration mismatch
  // The theme-init script runs before React hydrates, so we check the DOM directly
  const [isDark, setIsDark] = useState(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    // Sync with current state after mount
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
    
    if (document.documentElement.classList.contains("dark")) {
      localStorage.theme = "dark";
      setIsDark(true);
    } else {
      localStorage.theme = "light";
      setIsDark(false);
    }
  };

  return { isDark, toggleDarkMode };
}

