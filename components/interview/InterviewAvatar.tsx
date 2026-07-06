"use client";

import { Briefcase } from "lucide-react";

interface InterviewAvatarProps {
  pulsing?: boolean;
}

/** Interviewer avatar — matches AI Coach rounded-square style. */
export function InterviewAvatar({ pulsing = false }: InterviewAvatarProps) {
  return (
    <div
      className="relative w-7 h-7 rounded-md flex-shrink-0 flex items-center justify-center bg-[var(--gradient-primary)] shadow-[0_4px_12px_-4px_color-mix(in_srgb,var(--primary)_55%,transparent)]"
      aria-hidden
    >
      <Briefcase
        size={14}
        strokeWidth={2.25}
        className={`text-white ${pulsing ? "animate-pulse" : ""}`}
      />
      <span
        className="absolute inset-0 rounded-md shadow-[inset_0_1px_0_0_rgb(255_255_255_/_0.25)]"
      />
    </div>
  );
}
