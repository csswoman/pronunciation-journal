"use client";

import { Mic } from "lucide-react";
import { ReactNode } from "react";

interface AuthCardProps {
  children: ReactNode;
}

export function AuthCard({ children }: AuthCardProps) {
  return (
    <div
      className="w-full max-w-[400px] rounded-[var(--radius-lg)] p-[var(--space-8)] relative z-10 mx-auto"
      style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div className="flex flex-col items-center text-center mb-[var(--space-6)]">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "var(--primary)" }}
        >
          <Mic className="w-6 h-6" style={{ color: "var(--on-primary)" }} />
        </div>
        <h1 className="mt-[var(--space-3)]" style={{ font: "var(--font-h2)", color: "var(--text-primary)", fontWeight: 600 }}>
          English Journal
        </h1>
        <p className="mt-[var(--space-2)]" style={{ font: "var(--font-body-sm)", color: "var(--text-secondary)" }}>
          Practice pronunciation. Track your progress.
        </p>
      </div>

      {children}
    </div>
  );
}
