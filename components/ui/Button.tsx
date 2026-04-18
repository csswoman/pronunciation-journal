"use client";

import React from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "success"
  | "outline"
  | "dashed"
  | "chip"
  | "segmented";
type ButtonSize = "sm" | "md" | "lg" | "icon" | "iconLg";
type IconPosition = "left" | "right";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: IconPosition;
  fullWidth?: boolean;
  selected?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-accent)] text-[var(--color-text-on-accent)] border border-transparent hover:bg-[var(--color-accent-hover)] focus:ring-[var(--color-accent)]",
  secondary:
    "bg-[var(--btn-regular-bg)] text-[var(--text-secondary)] border border-[var(--line-divider)] hover:bg-[var(--btn-plain-bg-hover)]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--btn-plain-bg-hover)]",
  danger:
    "bg-gradient-to-br from-red-500 to-red-600 text-white hover:brightness-105 focus:ring-red-500",
  success:
    "bg-[oklch(.55_.16_150)] text-white hover:brightness-105 focus:ring-[oklch(.55_.16_150)]",
  outline:
    "bg-transparent text-[var(--text-secondary)] border border-[var(--line-divider)] hover:bg-[var(--btn-plain-bg-hover)]",
  dashed:
    "bg-transparent text-[var(--text-secondary)] border-2 border-dashed border-[var(--line-divider)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
  chip:
    "bg-[var(--btn-regular-bg)] text-[var(--text-secondary)] border border-transparent hover:bg-[var(--btn-plain-bg-hover)]",
  segmented:
    "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--btn-plain-bg-hover)]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg gap-1.5",
  md: "px-4 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-5 py-3 text-base rounded-xl gap-2.5",
  icon: "p-2 rounded-full",
  iconLg: "p-3.5 rounded-full",
};

export default function Button({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  fullWidth,
  selected = false,
  className = "",
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const isIconOnly = size === "icon" || size === "iconLg";
  const base = [
    "inline-flex items-center justify-center font-medium transition-all duration-200",
    "focus:outline-none focus:ring-4 focus:ring-opacity-30 active:scale-[0.98]",
    disabled ? "opacity-60 cursor-not-allowed pointer-events-none" : "hover:-translate-y-0.5",
    variantStyles[variant],
    sizeStyles[size],
    fullWidth ? "w-full" : "",
    selected ? "bg-[var(--color-accent)] text-[var(--color-text-on-accent)] border-[var(--color-accent)] shadow-sm" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} disabled={disabled} className={`${base} ${className}`.trim()} {...props}>
      {icon && iconPosition === "left" && <span className="shrink-0">{icon}</span>}
      {!isIconOnly && children}
      {icon && iconPosition === "right" && <span className="shrink-0">{icon}</span>}
    </button>
  );
}
