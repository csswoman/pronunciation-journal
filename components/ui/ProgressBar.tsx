import { cn } from "@/lib/cn";

type PastelTone = "sky" | "butter" | "coral" | "lilac" | "mint";

interface ProgressBarProps {
  value: number; // 0–100
  color?: string;
  height?: "xs" | "sm" | "md";
  className?: string;
  showLabel?: boolean;
  /** English Journal design system: pastel tone (track -deep, fill ink, border ink)
   *  or "neutral" (track surface-raised, fill accent). Overrides `color` when set. */
  tone?: PastelTone | "neutral";
}

const heightMap = { xs: "h-1", sm: "h-1.5", md: "h-2" };

const pastelTrackClasses: Record<PastelTone, string> = {
  sky: "bg-sky-deep border-ink",
  butter: "bg-butter-deep border-ink",
  coral: "bg-coral-deep border-ink",
  lilac: "bg-lilac-deep border-ink",
  mint: "bg-mint-deep border-ink",
};

export default function ProgressBar({
  value,
  color = "var(--primary)",
  height = "sm",
  className = "",
  showLabel = false,
  tone,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));

  if (tone) {
    const isPastel = tone !== "neutral";
    return (
      <div
        className={cn("flex items-center gap-2", className)}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "flex-1 overflow-hidden rounded-full",
            heightMap[height],
            isPastel
              ? cn("border-[1.5px]", pastelTrackClasses[tone])
              : "bg-ej-surface-raised"
          )}
        >
          <div
            className={cn(
              "h-full w-full rounded-full origin-left transition-transform duration-300",
              isPastel ? "bg-ink" : "bg-accent"
            )}
            style={{ transform: `scaleX(${pct / 100})` }}
          />
        </div>
        {showLabel && (
          <span className="text-tiny tabular-nums font-medium shrink-0 text-ej-text">
            {pct}%
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`flex-1 ${heightMap[height]} rounded-full overflow-hidden border border-[var(--line-divider)] bg-surface-sunken`}
      >
        <div
          className="progress-fill h-full w-full rounded-full"
          style={{ transform: `scaleX(${pct / 100})`, background: color }}
        />
      </div>
      {showLabel && (
        <span className="text-tiny tabular-nums font-medium shrink-0" style={{ color: color }}>
          {pct}%
        </span>
      )}
    </div>
  );
}
