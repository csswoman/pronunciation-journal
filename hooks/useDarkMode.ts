"use client";

import { useState, useEffect } from "react";

export function useDarkMode() {
  // Initialize as false to match server-side render
  // This prevents hydration mismatch
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only set the actual state after component mounts on client
    setMounted(true);
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

  return { isDark, toggleDarkMode, mounted };
}

