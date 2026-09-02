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
          "focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 font-label text-on-primary transition-colors",
          "hover:bg-primary-hover disabled:opacity-50",
        )}
      >
        <GuestIcon />
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
