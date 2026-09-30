"use client";

import { Sparkles } from "@/components/icons";
import { cn } from "@/lib/cn";

// Planned structure:
// <AIAvatar>
//   <SparklesIcon />
// </AIAvatar>

interface AIAvatarProps {
  state?: "idle" | "thinking";
  size?: number;
  className?: string;
}

export default function AIAvatar({
  state = "idle",
  className,
}: AIAvatarProps) {
  return (
    <div
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--ej-mint,#a3e635)] text-ink shadow-xs",
        className,
      )}
      aria-hidden
    >
      <Sparkles
        size={16}
        strokeWidth={2}
        className={cn("text-ink", state === "thinking" && "animate-pulse")}
      />
    </div>
  );
}
