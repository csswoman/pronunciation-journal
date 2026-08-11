"use client";

import { Briefcase } from "@/components/icons";

interface InterviewAvatarProps {
  pulsing?: boolean;
}

/** Interviewer avatar — matches AI Coach rounded-square style. */
export function InterviewAvatar({ pulsing = false }: InterviewAvatarProps) {
  return (
    <div
      className="relative flex size-7 shrink-0 items-center justify-center rounded-md bg-gradient-primary shadow-[0_4px_12px_-4px_color-mix(in_oklch,var(--primary)_55%,transparent)]"
      aria-hidden
    >
      <Briefcase
        size={14}
        strokeWidth={2.25}
        className={`text-on-primary ${pulsing ? "animate-pulse" : ""}`}
      />
      <span
        className="absolute inset-0 rounded-md shadow-[inset_0_1px_0_0_rgb(255_255_255_/_0.25)]"
      />
    </div>
  );
}
