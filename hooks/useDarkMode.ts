"use client";

import { useState, useEffect } from "react";

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
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

