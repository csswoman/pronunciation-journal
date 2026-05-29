import { ReactNode, ComponentPropsWithoutRef } from "react";

type CardVariant = "default" | "interactive" | "lesson" | "stat" | "compact";

interface CardProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
  variant?: CardVariant;
  hoverable?: boolean;
}

/**
 * Card: Base card component with consistent styling and variants
 * Variants: default, interactive (clickable), lesson, stat
 */
export default function Card({
  children,
  variant = "default",
  hoverable = false,
  className = "",
  ...rest
}: CardProps) {
  const baseClasses =
    "rounded-lg border border-border-subtle bg-surface-raised [transition:all_var(--transition-base,200ms_ease)]";

  const variantMap = {
    default: "p-6",
    interactive: "p-6 cursor-pointer hover:shadow-lg hover:border-border-default hover:-translate-y-px focus-within:shadow-lg focus-within:border-border-default focus-within:-translate-y-px",
    lesson:
      "p-5 hover:shadow-md hover:-translate-y-px hover:border-border-default cursor-pointer relative overflow-hidden focus-within:shadow-md focus-within:-translate-y-px focus-within:border-border-default",
    stat: "p-6 flex items-center gap-4",
    compact: "p-4 flex flex-col",
  };

  const hoverClass = hoverable
    ? "hover:shadow-lg hover:-translate-y-px hover:border-[var(--border-default)]"
    : "";

  return (
    <div
      className={`${baseClasses} ${variantMap[variant]} ${hoverClass} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
