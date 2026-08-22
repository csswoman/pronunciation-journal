export type BadgeVariant = "default" | "success" | "info" | "warning" | "error" | "neutral";
export type BadgeSize = "sm" | "md";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const badgeVariantClasses: Record<Exclude<BadgeVariant, "neutral">, string> = {
  default: "bg-badge-primary-bg text-primary border border-badge-primary-border",
  success: "bg-badge-success-bg text-success border border-badge-success-border",
  info: "bg-badge-info-bg text-info border border-badge-info-border",
  warning: "bg-badge-warning-bg text-warning border border-badge-warning-border",
  error: "bg-badge-error-bg text-error border border-badge-error-border",
};

export default function Badge({
  label,
  variant = "default",
  size = "sm",
  dot = false,
  className,
}: BadgeProps) {
  const sizeClasses = size === "md"
    ? "text-body-sm px-3 py-2 rounded-md"
    : "text-tiny px-2 py-0.5 rounded-full";

  const isNeutral = variant === "neutral";

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
