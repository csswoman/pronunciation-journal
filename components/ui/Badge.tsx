export type BadgeVariant = "default" | "success" | "info" | "warning" | "error" | "neutral";
export type BadgeSize = "sm" | "md";

const colorVar: Record<Exclude<BadgeVariant, "neutral">, string> = {
  default: "var(--primary)",
  success: "var(--success)",
  info:    "var(--info)",
  warning: "var(--warning)",
  error:   "var(--error)",
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

export default function Badge({ label, variant = "default", size = "sm", dot = false, className }: BadgeProps) {
  const isNeutral = variant === "neutral";
  const color = isNeutral ? null : colorVar[variant];

  const sizeClasses = size === "md"
    ? "text-sm px-3 py-2 rounded-lg"
    : "text-[11px] px-2 py-0.5 rounded-full";

  const style = isNeutral ? undefined : {
    backgroundColor: `color-mix(in oklch, ${color} 14%, var(--bg-tertiary) 86%)`,
    color: color ?? undefined,
    border: `1px solid color-mix(in oklch, ${color} 22%, transparent)`,
  };

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 font-semibold",
        sizeClasses,
        isNeutral ? "bg-[var(--btn-regular-bg)] text-[var(--text-secondary)]" : "",
        className,
      ].filter(Boolean).join(" ")}
      style={style}
    >
      {dot && !isNeutral && (
        <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-current" />
      )}
      {label}
    </span>
  );
}
