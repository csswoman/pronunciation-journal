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
      className="w-full flex items-center justify-between px-[var(--space-4)] py-[var(--space-3)] rounded-[var(--radius-md)] text-left transition-all disabled:opacity-50 border border-border-default text-fg-muted hover:bg-surface-sunken hover:border-border-strong hover:text-fg focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
    >
      <div className="flex items-center gap-[var(--space-3)]">
        <User className="w-5 h-5 text-fg-subtle" />
        <p className="text-sm font-medium">Continue as guest</p>
      </div>
      <ArrowRight className="w-5 h-5 text-fg-subtle" />
    </button>
  );
}
