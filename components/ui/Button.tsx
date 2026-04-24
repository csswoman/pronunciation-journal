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
  | "segmented"
  | "elevated";

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
  primary: `
    bg-[var(--primary-500)]
    text-[var(--on-primary)]
    border border-transparent
    hover:bg-[var(--primary-600)]
    focus:ring-[var(--primary-400)]
  `,

  secondary: `
    bg-[var(--bg-secondary)]
    text-[var(--text-primary)]
    border border-[var(--border)]
    hover:bg-[var(--bg-tertiary)]
  `,

  ghost: `
    bg-transparent
    text-[var(--text-secondary)]
    hover:bg-[var(--bg-secondary)]
  `,

  danger: `
    bg-[var(--error)]
    text-[var(--on-primary)]
    border border-transparent
    hover:brightness-105
    focus:ring-[var(--error)]
  `,

  success: `
    bg-[var(--success)]
    text-[var(--on-primary)]
    border border-transparent
    hover:brightness-105
    focus:ring-[var(--success)]
  `,

  outline: `
    bg-transparent
    text-[var(--text-primary)]
    border border-[var(--border)]
    hover:bg-[var(--bg-secondary)]
  `,

  dashed: `
    bg-transparent
    text-[var(--text-secondary)]
    border-2 border-dashed border-[var(--border)]
    hover:border-[var(--primary-500)]
    hover:text-[var(--primary-500)]
  `,

  chip: `
    bg-[var(--bg-secondary)]
    text-[var(--text-secondary)]
    border border-transparent
    hover:bg-[var(--bg-tertiary)]
  `,

  segmented: `
    bg-transparent
    text-[var(--text-secondary)]
    hover:bg-[var(--bg-secondary)]
  `,

  elevated: `
    bg-[var(--primary-500)]
    text-[var(--on-primary)]
    border border-transparent
    shadow-lg
    hover:shadow-xl
    hover:-translate-y-1
    hover:bg-[var(--primary-600)]
  `,
};

const selectedStyles: Partial<Record<ButtonVariant, string>> = {
  primary: "ring-2 ring-[var(--primary-400)]",
  segmented: "bg-[var(--primary-500)] text-[var(--on-primary)]",
  chip: "bg-[var(--primary-100)] text-[var(--primary-700)]",
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
    "inline-flex items-center justify-center font-medium",
    "transition-all duration-200 ease-out",
    "focus:outline-none focus:ring-4 focus:ring-opacity-30",
    "active:scale-[0.97] active:brightness-95",
    "shadow-sm hover:shadow-md",

    disabled
      ? "bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border border-[var(--border)] cursor-not-allowed pointer-events-none"
      : "hover:-translate-y-0.5",

    variantStyles[variant],
    sizeStyles[size],
    fullWidth ? "w-full" : "",
    selected && selectedStyles[variant] ? selectedStyles[variant] : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${base} ${className}`.trim()}
      {...props}
    >
      {icon && iconPosition === "left" && (
        <span className="shrink-0 text-current opacity-90">{icon}</span>
      )}

      {!isIconOnly && children}

      {icon && iconPosition === "right" && (
        <span className="shrink-0 text-current opacity-90">{icon}</span>
      )}
    </button>
  );
}
