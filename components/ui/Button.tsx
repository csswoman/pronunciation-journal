import React from "react";
import { cn } from "@/lib/cn";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "soft"
  | "ghost"
  | "success"
  | "error"
  | "warning"
  | "info"
  // Deprecated variants (mapped to new ones for backwards compatibility)
  | "danger"
  | "outline"
  | "elevated"
  | "dashed"
  | "chip"
  | "segmented"
  | "ghost-danger";

type ButtonSize = "sm" | "md" | "lg" | "icon" | "iconLg" | "icon-sm" | "icon-lg";
type IconPosition = "left" | "right";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: IconPosition;
  fullWidth?: boolean;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  // CTA button: dark ink on parchment (primary interactive affordance)
  primary: cn(
    "bg-[var(--cta-bg)] text-[var(--cta-fg)]",
    "hover:bg-[oklch(0.26_0.008_250)] shadow-none",
    "active:translate-y-[-1px] active:shadow-md"
  ),

  // Secondary: surface-raised background, primary text
  secondary: cn(
    "bg-[var(--surface-raised)] text-[var(--fg-primary)]",
    "border border-[var(--border-default)]",
    "hover:bg-[var(--surface-sunken)]",
    "active:translate-y-[-1px] active:shadow-md"
  ),

  // Soft: primary-soft background, primary text
  soft: cn(
    "bg-[var(--primary-soft)] text-[var(--primary)]",
    "hover:bg-[oklch(0.90_0.04_var(--hue))]",
    "active:translate-y-[-1px] active:shadow-md"
  ),

  // Ghost: transparent, secondary text
  ghost: cn(
    "bg-transparent text-[var(--fg-secondary)]",
    "hover:bg-[var(--surface-raised)]",
    "active:translate-y-[-1px]"
  ),

  // Semantic: success green
  success: cn(
    "bg-[var(--success)] text-white",
    "hover:brightness-110",
    "active:translate-y-[-1px] active:shadow-md"
  ),

  // Semantic: error red
  error: cn(
    "bg-[var(--error)] text-white",
    "hover:brightness-110",
    "active:translate-y-[-1px] active:shadow-md"
  ),

  // Semantic: warning amber
  warning: cn(
    "bg-[var(--warning)] text-white",
    "hover:brightness-110",
    "active:translate-y-[-1px] active:shadow-md"
  ),

  // Semantic: info blue
  info: cn(
    "bg-[var(--info)] text-white",
    "hover:brightness-110",
    "active:translate-y-[-1px] active:shadow-md"
  ),

  // Deprecated variants (mapped to new equivalents)
  danger: cn(
    "bg-[var(--error)] text-white",
    "hover:brightness-110",
    "active:translate-y-[-1px] active:shadow-md"
  ),
  "ghost-danger": cn(
    "bg-transparent text-[var(--fg-secondary)]",
    "hover:bg-[var(--error)] hover:text-white",
    "active:translate-y-[-1px]"
  ),
  outline: cn(
    "bg-transparent text-[var(--fg-primary)]",
    "border border-[var(--border-default)]",
    "hover:bg-[var(--surface-raised)]",
    "active:translate-y-[-1px]"
  ),
  dashed: cn(
    "bg-transparent text-[var(--fg-secondary)]",
    "border-2 border-dashed border-[var(--border-default)]",
    "hover:border-[var(--primary)] hover:text-[var(--primary)]",
    "active:translate-y-[-1px]"
  ),
  chip: cn(
    "bg-[var(--surface-raised)] text-[var(--fg-secondary)]",
    "hover:bg-[var(--surface-sunken)]",
    "active:translate-y-[-1px]"
  ),
  segmented: cn(
    "bg-transparent text-[var(--fg-secondary)]",
    "hover:bg-[var(--surface-raised)]",
    "active:translate-y-[-1px]"
  ),
  elevated: cn(
    "bg-[var(--cta-bg)] text-[var(--cta-fg)]",
    "shadow-lg hover:shadow-xl",
    "hover:bg-[oklch(0.26_0.008_250)]",
    "active:translate-y-[-1px]"
  ),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs font-semibold rounded-sm gap-1.5 h-8",
  md: "px-5 py-2.5 text-sm font-semibold rounded-md gap-2 h-10",
  lg: "px-6 py-3 text-base font-semibold rounded-md gap-2.5 h-12",
  // Icon sizes (deprecated, for backwards compatibility)
  icon: "p-2.5 rounded-full min-h-11 min-w-11",
  "icon-sm": "p-2.5 rounded-full min-h-11 min-w-11",
  iconLg: "p-3.5 rounded-full min-h-12 min-w-12",
  "icon-lg": "p-3.5 rounded-full min-h-12 min-w-12",
};

export default function Button({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  fullWidth = false,
  isLoading = false,
  className = "",
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  const base = cn(
    // Base layout
    "inline-flex items-center justify-center font-semibold",
    "transition-all duration-150 ease-out-quart",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",

    // Variant styles
    variantStyles[variant],
    sizeStyles[size],

    // State: disabled
    isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",

    // Layout
    fullWidth && "w-full",

    // Custom class override
    className
  );

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={base}
      {...props}
    >
      {icon && iconPosition === "left" && (
        <span className={cn("shrink-0", isLoading && "animate-spin")}>
          {icon}
        </span>
      )}

      {children}

      {icon && iconPosition === "right" && (
        <span className={cn("shrink-0", isLoading && "animate-spin")}>
          {icon}
        </span>
      )}
    </button>
  );
}
