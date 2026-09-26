// Planned structure:
// <ThemeToggle>
//   button with Sun/Moon icon toggling between light and dark modes via useOKLCHTheme
"use client";

import { Sun, Moon } from "lucide-react";
import { useOKLCHTheme } from "@/hooks/useOKLCHTheme";
import { cn } from "@/lib/cn";

interface ThemeToggleProps {
  className?: string;
  variant?: "icon" | "labeled";
}

export function ThemeToggle({ className, variant = "icon" }: ThemeToggleProps) {
  const { mode, toggleMode, mounted } = useOKLCHTheme();

  if (!mounted) {
    return (
      <div
        className={cn(
          variant === "icon" ? "size-9 rounded-full" : "h-8 px-3 rounded-full",
          "border border-transparent",
          className
        )}
        aria-hidden="true"
      />
    );
  }

  const isDark = mode === "dark";
  const label = isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro";

  if (variant === "labeled") {
    return (
      <button
        type="button"
        onClick={toggleMode}
        aria-label={label}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-strong)] cursor-pointer focus-ring",
          className
        )}
      >
        {isDark ? (
          <>
            <Sun className="size-3.5" aria-hidden="true" />
            <span>Modo claro</span>
          </>
        ) : (
          <>
            <Moon className="size-3.5" aria-hidden="true" />
            <span>Modo oscuro</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-secondary)] transition-all hover:border-[var(--border-strong)] hover:text-[var(--text-strong)] active:scale-95 cursor-pointer focus-ring",
        className
      )}
    >
      {isDark ? (
        <Sun className="size-4 text-amber-400" aria-hidden="true" />
      ) : (
        <Moon className="size-4 text-indigo-600" aria-hidden="true" />
      )}
    </button>
  );
}
