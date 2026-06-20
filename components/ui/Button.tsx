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
  // Deprecated mapping aliases for backwards compatibility during migration
  | "outline"
  | "danger"
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
    "hover:bg-[var(--cta-bg-hover)] shadow-none",
    "active:translate-y-[-1px] active:shadow-md"
  ),

  // Secondary: surface-raised background, primary text
  secondary: cn(
    "bg-[var(--surface-raised)] text-[var(--text-primary)]",
    "border border-[var(--border-default)]",
    "hover:bg-[var(--surface-sunken)]",
    "active:translate-y-[-1px] active:shadow-md"
  ),

  // Soft: primary-soft background, primary text
  soft: cn(
    "bg-[var(--primary-soft)] text-[var(--primary)]",
    "hover:bg-[var(--primary-200)]",
    "active:translate-y-[-1px] active:shadow-md"
  ),

  // Ghost: transparent, secondary text
  ghost: cn(
    "bg-transparent text-[var(--text-secondary)]",
    "hover:bg-[var(--surface-raised)]",
    "active:translate-y-[-1px]"
  ),

  // Semantic: success green
  success: cn(
    "bg-[var(--success)] text-[var(--on-primary)]",
    "hover:bg-[var(--success-hover)]",
    "active:translate-y-[-1px] active:shadow-md"
  ),

  // Semantic: error red
  error: cn(
    "bg-[var(--error)] text-[var(--on-primary)]",
    "hover:bg-[var(--error-hover)]",
    "active:translate-y-[-1px] active:shadow-md"
  ),

  // Semantic: warning amber
  warning: cn(
    "bg-[var(--warning)] text-[var(--on-primary)]",
    "hover:bg-[var(--warning-hover)]",
    "active:translate-y-[-1px] active:shadow-md"
  ),

  // Semantic: info blue
  info: cn(
    "bg-[var(--info)] text-[var(--on-primary)]",
    "hover:bg-[var(--info-hover)]",
    "active:translate-y-[-1px] active:shadow-md"
  ),

  // Deprecated variants — mapped to canonical equivalents for backwards compatibility
  outline: cn(
    "bg-transparent text-[var(--text-primary)]",
    "border border-[var(--border-default)]",
    "hover:bg-[var(--surface-raised)]",
    "active:translate-y-[-1px]"
  ),
  danger: cn(
    "bg-[var(--error)] text-[var(--on-primary)]",
    "hover:bg-[var(--error-hover)]",
    "active:translate-y-[-1px] active:shadow-md"
  ),
  "ghost-danger": cn(
    "bg-transparent text-[var(--error)]",
    "hover:bg-[var(--error-soft)]",
    "active:translate-y-[-1px]"
  ),

};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs font-semibold rounded-sm gap-1.5 h-8 touch:h-11",
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
  "aria-label": ariaLabel,
  ...props
}: ButtonProps & { "aria-label"?: string }) {
  const isDisabled = disabled || isLoading;

  const base = cn(
    // Base layout
    "inline-flex items-center justify-center font-semibold",
    "transition-all duration-150 ease-out-quart",
    "focus-ring",

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
      aria-label={ariaLabel}
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
