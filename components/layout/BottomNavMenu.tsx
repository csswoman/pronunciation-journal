"use client";

import Link from "next/link";
import { BookOpen, Layers, Radio, RotateCcw, User } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/cn";

const menuItems = [
  { name: "Review", href: "/practice/review", icon: RotateCcw },
  { name: "Decks", href: "/practice/decks", icon: Layers },
  { name: "IPA Chart", href: "/ipa", icon: Radio },
  { name: "Courses", href: "/courses", icon: BookOpen },
  { name: "Profile", href: "/profile", icon: User },
] as const;

interface BottomNavMenuProps {
  open: boolean;
  onClose: () => void;
  isActive: (href: string) => boolean;
}

export default function BottomNavMenu({ open, onClose, isActive }: BottomNavMenuProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

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
          "fixed left-4 right-4 z-50 max-h-[calc(100vh-7.5rem-env(safe-area-inset-bottom))] overflow-y-auto",
          "rounded-[var(--radius-xl)] border border-[var(--line-divider)] bg-[var(--surface-translucent)] p-3 shadow-xl backdrop-blur-md motion-reduce:backdrop-blur-none motion-reduce:animate-none animate-grid-in",
          "bottom-[calc(4.75rem+env(safe-area-inset-bottom))]",
        )}
      >
        <div className="grid grid-cols-2 gap-1.5">
          {menuItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex min-h-11 items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors duration-[var(--transition-fast)]",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
                  active
                    ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                    : "text-fg-muted hover:bg-[var(--btn-hover-bg)] hover:text-fg",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={cn("h-4 w-4 shrink-0", active ? "text-[var(--primary)]" : "text-fg-subtle")}
                  aria-hidden
                />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
