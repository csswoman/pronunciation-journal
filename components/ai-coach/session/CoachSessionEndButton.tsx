"use client";

import { Flag } from "@/components/icons";
import { cn } from "@/lib/cn";

// Planned structure:
// <CoachSessionEndButton>
//   <button>
//     <Flag />
//     Terminar
//   </button>
// </CoachSessionEndButton>

/** Below this, there is nothing worth summarising. */
const MIN_USER_TURNS = 3;

interface CoachSessionEndButtonProps {
  userTurns: number;
  isStreaming: boolean;
  onEnd: () => void;
}

export default function CoachSessionEndButton({
  userTurns,
  isStreaming,
  onEnd,
}: CoachSessionEndButtonProps) {
  if (userTurns < MIN_USER_TURNS) return null;

  return (
    <button
      type="button"
      disabled={isStreaming}
      onClick={onEnd}
      title="Terminar y ver el resumen"
      className={cn(
        "flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border-subtle",
        "bg-surface-base px-2.5 text-caption font-medium text-fg-muted",
        "transition-colors duration-150 focus-ring",
        "hover:border-primary hover:bg-primary-soft hover:text-primary",
        "disabled:cursor-default disabled:opacity-50",
      )}
    >
      <Flag size={13} strokeWidth={2} aria-hidden />
      Terminar
    </button>
  );
}
