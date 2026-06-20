"use client";

import Link from "next/link";
import { BookOpen, Layers, Moon, Radio, RotateCcw, Sun, User } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/cn";
import { useOKLCHTheme } from "@/hooks/useOKLCHTheme";

const navItems = [
  { name: "Review", href: "/practice/review", icon: RotateCcw },
  { name: "Decks", href: "/practice/decks", icon: Layers },
  { name: "IPA Chart", href: "/ipa", icon: Radio },
  { name: "Ruta", href: "/courses", icon: BookOpen },
  { name: "Profile", href: "/profile", icon: User },
] as const;

const HUE_PRESETS = [
  { label: "Violet", hue: 250 },
  { label: "Blue", hue: 220 },
  { label: "Teal", hue: 185 },
  { label: "Green", hue: 145 },
  { label: "Amber", hue: 70 },
  { label: "Rose", hue: 15 },
  { label: "Pink", hue: 340 },
  { label: "Purple", hue: 290 },
] as const;

interface BottomNavMenuProps {
  open: boolean;
  onClose: () => void;
  isActive: (href: string) => boolean;
}

export default function BottomNavMenu({ open, onClose, isActive }: BottomNavMenuProps) {
  const { hue, setHue, mode, toggleMode, mounted } = useOKLCHTheme();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-[var(--bg-body)]/40 backdrop-blur-sm motion-reduce:backdrop-blur-none"
        role="presentation"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        id="bottom-nav-menu"
        role="dialog"
        aria-modal="true"
        aria-label="More navigation"
        className={cn(
          "fixed left-4 right-4 z-50 overflow-hidden",
          "rounded-[var(--radius-xl)] border border-[var(--line-divider)] bg-[var(--surface-translucent)] shadow-xl backdrop-blur-md",
          "motion-reduce:backdrop-blur-none motion-reduce:animate-none animate-grid-in",
          "bottom-[calc(4.75rem+env(safe-area-inset-bottom))]",
        )}
      >
        {/* Nav links */}
        <div className="p-2">
          <div className="grid grid-cols-2 gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex min-h-11 items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium",
                    "transition-colors duration-(--transition-fast)",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    active
                      ? "bg-primary-soft text-primary"
                      : "text-fg-muted hover:bg-(--btn-hover-bg) hover:text-fg",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon
                    className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-fg-subtle")}
                    aria-hidden
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-3 h-px bg-border-subtle" />

        {/* Preferences */}
        <div className="flex items-center justify-between gap-3 px-3 py-3">
          {/* Hue swatches */}
          <div className="flex items-center gap-0.5 flex-1">
            {HUE_PRESETS.map((preset) => {
              const isSelected = mounted && Math.abs(hue - preset.hue) < 10;
              return (
                <button
                  key={preset.hue}
                  type="button"
                  onClick={() => setHue(preset.hue)}
                  aria-label={preset.label}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex flex-1 items-center justify-center h-10",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  )}
                >
                  <span
                    className={cn(
                      "block rounded-full transition-[transform,outline-color] duration-150",
                      isSelected ? "h-5 w-5 scale-125 outline-2 outline-offset-2" : "h-4 w-4 hover:scale-110",
                    )}
                    style={{
                      backgroundColor: `oklch(0.65 0.15 ${preset.hue})`,
                      outlineColor: isSelected ? `oklch(0.65 0.15 ${preset.hue})` : undefined,
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* Dark/light toggle */}
          {mounted && (
            <button
              type="button"
              onClick={toggleMode}
              aria-label={mode === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              className={cn(
                "shrink-0 flex h-8 w-8 items-center justify-center rounded-sm",
                "border border-border-subtle bg-surface-sunken",
                "text-fg-muted hover:text-fg hover:border-border-default",
                "transition-colors duration-(--transition-fast)",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              )}
            >
              {mode === "dark"
                ? <Moon className="h-4 w-4" aria-hidden />
                : <Sun className="h-4 w-4" aria-hidden />
              }
            </button>
          )}
        </div>
      </div>
    </>
  );
}
