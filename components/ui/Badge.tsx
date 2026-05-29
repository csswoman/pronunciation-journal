export type BadgeVariant = "default" | "success" | "info" | "warning" | "error" | "neutral";
export type BadgeSize = "sm" | "md";
export type BadgeColor = "sky" | "violet" | "teal" | "emerald" | "amber" | "red";

const colorVar: Record<Exclude<BadgeVariant, "neutral">, string> = {
  default: "var(--primary)",
  success: "var(--success)",
  info:    "var(--info)",
  warning: "var(--warning)",
  error:   "var(--error)",
};

// Tonal chip colors — light + dark via Tailwind dark: prefix
const TONAL_CLASS: Record<BadgeColor, string> = {
  sky:     "bg-sky-100 text-sky-700 border border-sky-200 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-700/40",
  violet:  "bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-700/40",
  teal:    "bg-teal-100 text-teal-700 border border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-700/40",
  emerald: "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/40",
  amber:   "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/40",
  red:     "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/30",
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  color?: BadgeColor;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

export default function Badge({ label, variant = "default", color, size = "sm", dot = false, className }: BadgeProps) {
  const sizeClasses = size === "md"
    ? "text-sm px-3 py-2 rounded-lg"
    : "text-tiny px-2 py-0.5 rounded-full";

  // Tonal color mode — uses Tailwind classes with dark: variants
  if (color) {
    return (
      <span
        className={[
          "inline-flex items-center gap-1.5 font-semibold",
          sizeClasses,
          TONAL_CLASS[color],
          className,
        ].filter(Boolean).join(" ")}
      >
        {label}
      </span>
    );
  }

  const isNeutral = variant === "neutral";

  const badgeVariantClasses: Record<Exclude<BadgeVariant, "neutral">, string> = {
    default: "bg-badge-primary-bg text-primary border border-badge-primary-border",
    success: "bg-badge-success-bg text-success border border-badge-success-border",
    info: "bg-badge-info-bg text-info border border-badge-info-border",
    warning: "bg-badge-warning-bg text-warning border border-badge-warning-border",
    error: "bg-badge-error-bg text-error border border-badge-error-border",
  };

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 font-semibold",
        sizeClasses,
        isNeutral ? "bg-[var(--btn-regular-bg)] text-fg-muted" : badgeVariantClasses[variant],
        className,
      ].filter(Boolean).join(" ")}
    >
      {dot && !isNeutral && (
        <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-current" />
      )}
      {label}
    </span>
  );
}
