"use client";

import { cn } from "@/lib/cn";
import { SOCIAL_BTN } from "@/components/auth/AuthGoogleButton";

interface AuthGuestButtonProps {
  onClick: () => void;
  pending: boolean;
  /** Primary explore CTA vs secondary social-row style. */
  variant?: "primary" | "social";
  label?: string;
}

export function AuthGuestButton({
  onClick,
  pending,
  variant = "social",
  label = "Probar una sesión",
}: AuthGuestButtonProps) {
  if (variant === "primary") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className={cn(
          "w-full h-12 rounded-full bg-[var(--cta-bg)] hover:bg-[var(--cta-bg-hover)] text-[var(--cta-fg)] font-semibold text-base flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] shadow-xs focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:opacity-50 select-none",
        )}
      >
        <PlayIcon />
        <span>{pending ? "Entrando…" : label}</span>
      </button>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={pending} className={SOCIAL_BTN}>
      <GuestIcon />
      <span>{pending ? "Entrando…" : label}</span>
    </button>
  );
}

function PlayIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="shrink-0"
    >
      <polygon points="6,3 20,12 6,21" />
    </svg>
  );
}

function GuestIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

