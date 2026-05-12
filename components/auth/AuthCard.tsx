"use client";

import { Mic } from "lucide-react";
import { ReactNode } from "react";
import { H1 } from "@/components/ui/Typography";

interface AuthCardProps {
  children: ReactNode;
}

export function AuthCard({ children }: AuthCardProps) {
  return (
    <div
      className="w-full max-w-[400px] rounded-[var(--radius-lg)] p-[var(--space-8)] relative z-10 mx-auto bg-surface-raised border border-border-subtle"
    >
      <div className="flex flex-col items-center text-center mb-[var(--space-6)]">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 bg-primary"
        >
          <Mic className="w-6 h-6 text-on-primary" />
        </div>
        <H1 className="mt-[var(--space-3)] text-fg font-semibold">
          English Journal
        </H1>
        <p className="mt-[var(--space-2)] text-fg-muted text-sm">
          Practice pronunciation. Track your progress.
        </p>
      </div>

      {children}
    </div>
  );
}
