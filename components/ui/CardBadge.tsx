import React from "react";

interface CardBadgeProps {
  children: React.ReactNode;
  color?: "primary" | "warning" | "success" | "error" | "info";
  icon?: React.ReactNode;
  className?: string;
}

const COLOR_STYLES: Record<NonNullable<CardBadgeProps["color"]>, React.CSSProperties> = {
  primary: {
    color: "color-mix(in oklch, var(--primary) 80%, var(--text-secondary))",
    borderColor: "color-mix(in oklch, var(--primary) 35%, transparent)",
    backgroundColor: "transparent",
  },
  warning: {
    color: "var(--warning-value)",
    borderColor: "var(--warning-border)",
    backgroundColor: "var(--warning-soft)",
  },
  success: {
    color: "var(--success-value)",
    borderColor: "var(--success-border)",
    backgroundColor: "var(--success-soft)",
  },
  error: {
    color: "var(--error-value)",
    borderColor: "var(--error-border)",
    backgroundColor: "var(--error-soft)",
  },
  info: {
    color: "var(--info-value)",
    borderColor: "var(--info-border)",
    backgroundColor: "var(--info-soft)",
  },
};

export function CardBadge({ children, color = "primary", icon, className = "" }: CardBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-tiny font-semibold tracking-widest w-fit uppercase ${className}`}
      style={COLOR_STYLES[color]}
    >
      {icon}
      {children}
    </span>
  );
}
