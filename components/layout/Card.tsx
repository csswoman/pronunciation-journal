import { ReactNode, ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

type CardVariant =
  | "default"
  | "interactive"
  | "lesson"
  | "stat"
  | "compact"
  // English Journal design system — pastel/neutral cards (radius 28, padding 24)
  | "ej-sky"
  | "ej-butter"
  | "ej-coral"
  | "ej-lilac"
  | "ej-mint"
  | "ej-neutral";

interface CardProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
  variant?: CardVariant;
  hoverable?: boolean;
}

const EJ_VARIANT_CLASSES: Record<
  "ej-sky" | "ej-butter" | "ej-coral" | "ej-lilac" | "ej-mint" | "ej-neutral",
  string
> = {
  "ej-sky": "bg-sky text-ink",
  "ej-butter": "bg-butter text-ink",
  "ej-coral": "bg-coral text-ink",
  "ej-lilac": "bg-lilac text-ink",
  "ej-mint": "bg-mint text-ink",
  "ej-neutral": "bg-ej-surface text-ej-text border border-ej-border",
};

/** Content inset within an English Journal card — uses the tone's -soft background. */
export function Inset({
  tone,
  children,
  className,
}: {
  tone: "sky" | "butter" | "coral" | "lilac" | "mint";
  children: ReactNode;
  className?: string;
}) {
  const softClasses: Record<typeof tone, string> = {
    sky: "bg-sky-soft",
    butter: "bg-butter-soft",
    coral: "bg-coral-soft",
    lilac: "bg-lilac-soft",
    mint: "bg-mint-soft",
  };
  return (
    <div className={cn("rounded-lg p-4", softClasses[tone], className)}>{children}</div>
  );
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
  const isEjVariant = variant in EJ_VARIANT_CLASSES;

  if (isEjVariant) {
    return (
      <div
        className={cn(
          "rounded-3xl p-6",
          EJ_VARIANT_CLASSES[variant as keyof typeof EJ_VARIANT_CLASSES],
          hoverable && "hover:-translate-y-px transition-transform duration-150",
          className
        )}
        {...rest}
      >
        {children}
      </div>
    );
  }

  const baseClasses =
    "rounded-md border border-border-subtle bg-surface-raised [transition:all_var(--transition-base,200ms_ease)]";

  const variantMap = {
    default: "layout-card-pad",
    interactive:
      "layout-card-pad cursor-pointer hover:shadow-lg hover:border-border-default hover:-translate-y-px focus-within:shadow-lg focus-within:border-border-default focus-within:-translate-y-px",
    lesson:
      "layout-card-pad hover:shadow-md hover:-translate-y-px hover:border-border-default cursor-pointer relative overflow-hidden focus-within:shadow-md focus-within:-translate-y-px focus-within:border-border-default",
    stat: "layout-card-pad flex items-center gap-[var(--layout-stack-loose)]",
    compact: "layout-card-pad-compact flex flex-col",
  } as const;

  const hoverClass = hoverable
    ? "hover:shadow-lg hover:-translate-y-px hover:border-[var(--border-default)]"
    : "";

  return (
    <div
      className={`${baseClasses} ${variantMap[variant as keyof typeof variantMap]} ${hoverClass} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
