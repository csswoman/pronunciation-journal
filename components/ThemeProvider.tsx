"use client";

import { useOKLCHTheme } from "@/hooks/useOKLCHTheme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize OKLCH theme on client-side
  // The hook handles all theme logic including localStorage persistence
  useOKLCHTheme();
  
  return <>{children}</>;
}

export { useOKLCHTheme as useTheme };

