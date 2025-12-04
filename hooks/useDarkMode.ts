"use client";

import { useState, useEffect } from "react";

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Sync with current state
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleDarkMode = () => {
    // Toggle dark class (siguiendo la documentación de Tailwind)
    document.documentElement.classList.toggle("dark");
    
    // Save to localStorage
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

