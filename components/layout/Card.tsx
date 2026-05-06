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
    "rounded-lg border border-border-subtle bg-surface-raised transition-all duration-200";

  const variantMap = {
    default: "p-6",
    interactive: "p-6 cursor-pointer hover:shadow-lg hover:border-[var(--primary)]",
    lesson:
      "p-5 hover:shadow-md hover:translate-y-[-2px] cursor-pointer relative overflow-hidden",
    stat: "p-6 flex items-center gap-4",
    compact: "p-5 flex flex-col",
  };

  const hoverClass = hoverable
    ? "hover:shadow-lg hover:-translate-y-[2px]"
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
