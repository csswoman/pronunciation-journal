"use client";

import { User, ArrowRight } from "lucide-react";

interface AuthGuestButtonProps {
  onClick: () => void;
  pending: boolean;
}

export function AuthGuestButton({ onClick, pending }: AuthGuestButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="auth-guest-btn w-full flex items-center justify-between px-[var(--space-4)] py-[var(--space-3)] rounded-[var(--radius-md)] text-left transition-all disabled:opacity-50"
      style={{ background: "transparent", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
    >
      <div className="flex items-center gap-[var(--space-3)]">
        <User className="w-[18px] h-[18px] text-[var(--text-tertiary)]" />
        <p style={{ font: "var(--font-body-sm)", fontWeight: 500 }}>Continue as guest</p>
      </div>
      <ArrowRight className="w-[18px] h-[18px] text-[var(--text-tertiary)]" />
      <style>{`
        .auth-guest-btn:hover {
          background: var(--surface-sunken);
          border-color: var(--border-strong);
          color: var(--text-primary);
        }
        .auth-guest-btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
      `}</style>
    </button>
  );
}
