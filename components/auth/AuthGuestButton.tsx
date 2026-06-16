"use client";

import { SOCIAL_BTN } from "@/components/auth/AuthGoogleButton";

interface AuthGuestButtonProps {
  onClick: () => void;
  pending: boolean;
}

export function AuthGuestButton({ onClick, pending }: AuthGuestButtonProps) {
  return (
    <button type="button" onClick={onClick} disabled={pending} className={SOCIAL_BTN}>
      <GuestIcon />
      <span>Continue as guest</span>
    </button>
  );
}

function GuestIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}
