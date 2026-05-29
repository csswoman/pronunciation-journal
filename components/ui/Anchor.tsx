import React from "react";
import { cn } from "@/lib/cn";

type AnchorColor = "primary" | "secondary" | "success" | "error" | "warning" | "info" | "unstyled";
type IconPosition = "left" | "right";

interface AnchorProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  color?: AnchorColor;
  icon?: React.ReactNode;
  iconPosition?: IconPosition;
}

const colorStyles: Record<AnchorColor, string> = {
  primary: "text-[var(--primary)] hover:text-[var(--primary-hover)] underline hover:no-underline",
  secondary: "text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] underline hover:no-underline",
  success: "text-[var(--success)] hover:text-[var(--success-hover)] underline hover:no-underline",
  error: "text-[var(--error)] hover:text-[var(--error-hover)] underline hover:no-underline",
  warning: "text-[var(--warning)] hover:text-[var(--warning-hover)] underline hover:no-underline",
  info: "text-[var(--info)] hover:text-[var(--info-hover)] underline hover:no-underline",
  unstyled: "text-inherit hover:text-inherit no-underline",
};

export default function Anchor({
  color = "primary",
  icon,
  iconPosition = "left",
  className = "",
  children,
  "aria-label": ariaLabel,
  ...props
}: AnchorProps & { "aria-label"?: string }) {
  const base = cn(
    // Base styles
    "inline-flex items-center gap-1.5",
    "text-sm font-medium",
    "transition-colors duration-150 ease-out-quart",
    "focus-ring",
    "cursor-pointer",

    // Color styles
    colorStyles[color],

    // Custom class override
    className
  );

  return (
    <a className={base} aria-label={ariaLabel} {...props}>
      {icon && iconPosition === "left" && <span className="shrink-0 flex items-center">{icon}</span>}
      {children}
      {icon && iconPosition === "right" && <span className="shrink-0 flex items-center">{icon}</span>}
    </a>
  );
}
