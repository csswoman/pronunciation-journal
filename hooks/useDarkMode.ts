"use client";

import { useState, useEffect } from "react";

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check current state from DOM
    const hasDarkClass = document.documentElement.classList.contains("dark");
    setIsDark(hasDarkClass);
  }, []);

  const toggleDarkMode = () => {
    const currentIsDark = document.documentElement.classList.contains("dark");
    const newIsDark = !currentIsDark;
    
    // Update DOM immediately
    if (newIsDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    
    // Update state
    setIsDark(newIsDark);
  };

  return { isDark, toggleDarkMode, mounted };
}

