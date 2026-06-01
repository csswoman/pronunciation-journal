"use client";

import { Briefcase } from "lucide-react";

interface InterviewAvatarProps {
  pulsing?: boolean;
}

/** Interviewer avatar — matches AI Coach rounded-square style. */
export function InterviewAvatar({ pulsing = false }: InterviewAvatarProps) {
  return (
    <div
      className="relative w-7 h-7 rounded-[9px] flex-shrink-0 flex items-center justify-center"
      style={{
        background: "var(--gradient-primary)",
        boxShadow: "0 4px 12px -4px color-mix(in srgb, var(--primary) 55%, transparent)",
      }}
      aria-hidden
    >
      <Briefcase
        size={14}
        strokeWidth={2.25}
        className={`text-white ${pulsing ? "animate-pulse" : ""}`}
      />
      <span
        className="absolute inset-0 rounded-[9px]"
        style={{ boxShadow: "inset 0 1px 0 0 rgb(255 255 255 / 0.25)" }}
      />
    </div>
  );
}
