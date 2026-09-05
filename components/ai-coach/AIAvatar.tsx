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
        "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-primary shadow-[0_4px_12px_-4px_color-mix(in_oklch,var(--primary)_55%,transparent)]",
        className,
      )}
      aria-hidden
    >
      <Sparkles
        size={16}
        strokeWidth={2}
        className={cn("text-on-primary", state === "thinking" && "animate-pulse")}
      />
      <span className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_1px_0_0_rgb(255_255_255_/_0.25)]" />
    </div>
  );
}
