import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// Planned structure:
// <Chip> — pill-shaped label/status token (English Journal design system)

export type ChipTone = "sky" | "butter" | "coral" | "lilac" | "mint";
export type ChipVariant = "ink" | "outline" | "status" | "neutral" | ChipTone;

interface ChipProps {
  children: ReactNode;
  variant?: ChipVariant;
  className?: string;
}

const toneClasses: Record<ChipTone, string> = {
  sky: "bg-sky-deep text-ink",
  butter: "bg-butter-deep text-ink",
  coral: "bg-coral-deep text-ink",
  lilac: "bg-lilac-deep text-ink",
  mint: "bg-mint-deep text-ink",
};

const baseVariantClasses: Record<"ink" | "outline" | "status" | "neutral", string> = {
  ink: "bg-ink text-paper",
  outline: "bg-transparent text-ink border border-ink",
  status: "bg-accent text-on-accent",
  neutral: "bg-ej-field text-ej-text",
};

const variantClasses: Record<ChipVariant, string> = {
  ...baseVariantClasses,
  ...toneClasses,
};

export default function Chip({ children, variant = "neutral", className }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-semibold",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
