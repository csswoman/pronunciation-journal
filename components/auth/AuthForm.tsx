"use client";

import { ReactNode } from "react";

interface AuthFormProps {
  onSubmit: (e: React.FormEvent) => Promise<void>;
  pending: boolean;
  children: ReactNode;
  isResetMode?: boolean;
}

export function AuthForm({ onSubmit, children, isResetMode }: AuthFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {children}
      {!isResetMode && (
        <>
          <div className="flex items-center gap-3 my-5 text-[11.5px] uppercase tracking-[0.6px]" style={{ color: "var(--text-secondary)" }}>
            <div className="flex-1 h-px" style={{ background: "var(--border-default)" }} />
            O continúa con
            <div className="flex-1 h-px" style={{ background: "var(--border-default)" }} />
          </div>
        </>
      )}
    </form>
  );
}
