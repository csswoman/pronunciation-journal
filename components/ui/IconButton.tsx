import React from "react";
import { cn } from "@/lib/cn";

// Planned structure:
// <IconButton> — circular icon-only button (audio playback, neutral actions)

type IconButtonVariant = "audio" | "audio-sm" | "neutral";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: IconButtonVariant;
  "aria-label": string;
}

const variantStyles: Record<IconButtonVariant, string> = {
  audio: "size-[58px] bg-accent text-on-accent hover:bg-accent-hover",
  "audio-sm": "size-[34px] bg-accent text-on-accent hover:bg-accent-hover",
  neutral: "size-12 bg-ej-field text-ink hover:bg-ej-border",
};

export default function IconButton({
  icon,
  variant = "neutral",
  className = "",
  disabled,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        "focus-ring inline-flex shrink-0 items-center justify-center rounded-full",
        "transition-all duration-150 ease-out-quart active:translate-y-[-1px]",
        variantStyles[variant],
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className
      )}
      {...props}
    >
      {icon}
    </button>
  );
}
