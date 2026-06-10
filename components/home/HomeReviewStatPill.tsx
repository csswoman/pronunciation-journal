import { cn } from "@/lib/cn";

type HomeReviewStatPillTone = "primary" | "warning" | "neutral";

interface HomeReviewStatPillProps {
  value: number;
  label: string;
  tone?: HomeReviewStatPillTone;
}

const TONE_CLASS: Record<HomeReviewStatPillTone, string> = {
  primary:
    "border-badge-primary-border bg-badge-primary-bg text-[var(--text-secondary)] [&_.stat-value]:text-[var(--primary)]",
  warning:
    "border-badge-warning-border bg-badge-warning-bg text-[var(--warning-value)]",
  neutral:
    "border-border-subtle bg-surface-sunken text-[var(--text-tertiary)] [&_.stat-value]:text-[var(--text-primary)]",
};

/** Compact stat chip: editorial numeral + caption label. */
export default function HomeReviewStatPill({
  value,
  label,
  tone = "primary",
}: HomeReviewStatPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1.5 rounded-full border px-3 py-1",
        TONE_CLASS[tone],
      )}
    >
      <span className="stat-value type-stat text-lg leading-none tabular-nums">{value}</span>
      <span className="font-caption leading-none">{label}</span>
    </span>
  );
}
