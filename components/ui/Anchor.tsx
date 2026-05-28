import React from "react";
import { cn } from "@/lib/cn";

type AnchorColor = "primary" | "secondary" | "success" | "error" | "warning" | "info";
type IconPosition = "left" | "right";

interface AnchorProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  color?: AnchorColor;
  icon?: React.ReactNode;
  iconPosition?: IconPosition;
}

const colorStyles: Record<AnchorColor, string> = {
  primary: "text-[var(--primary)] hover:text-[oklch(0.58_0.16_250)] underline hover:no-underline",
  secondary: "text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] underline hover:no-underline",
  success: "text-[var(--success)] hover:brightness-110 underline hover:no-underline",
  error: "text-[var(--error)] hover:brightness-110 underline hover:no-underline",
  warning: "text-[var(--warning)] hover:brightness-110 underline hover:no-underline",
  info: "text-[var(--info)] hover:brightness-110 underline hover:no-underline",
};

export default function Anchor({
  color = "primary",
  icon,
  iconPosition = "left",
  className = "",
  children,
  ...props
}: AnchorProps) {
  const base = cn(
    // Base styles
    "inline-flex items-center gap-1.5",
    "text-sm font-medium",
    "transition-colors duration-150 ease-out-quart",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
    "cursor-pointer",

    // Color styles
    colorStyles[color],

    // Custom class override
    className
  );

  return (
    <a className={base} {...props}>
      {icon && iconPosition === "left" && <span className="shrink-0 flex items-center">{icon}</span>}
      {children}
      {icon && iconPosition === "right" && <span className="shrink-0 flex items-center">{icon}</span>}
    </a>
  );
}
