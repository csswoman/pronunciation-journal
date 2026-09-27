"use client";

// Planned structure:
// <TrackingMasteryBar>
//   <StatusBadge | SegmentBars | ProgressPercentBar | DashFallback />
// </TrackingMasteryBar>

import { cn } from "@/lib/cn";

interface TrackingMasteryBarProps {
  masteryLevel: number | null;
  statusBadge: { label: string; variant: string } | null;
  progressPercent: number | null;
}

export function TrackingMasteryBar({
  masteryLevel,
  statusBadge,
  progressPercent,
}: TrackingMasteryBarProps) {
  if (statusBadge) {
    const isCoral = statusBadge.variant === "coral" || statusBadge.label === "hoy";
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-caption font-semibold",
          isCoral
            ? "bg-coral-soft text-coral-deep dark:bg-coral-soft/30 dark:text-coral"
            : "bg-mint-soft text-mint-deep dark:bg-mint-soft/30 dark:text-mint",
        )}
      >
        {statusBadge.label}
      </span>
    );
  }

  if (progressPercent !== null) {
    return (
      <div className="flex items-center gap-2 text-caption font-semibold text-fg">
        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-surface-sunken">
          <div
            className="h-full rounded-full bg-fg transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span>{progressPercent} %</span>
      </div>
    );
  }

  if (masteryLevel !== null && masteryLevel > 0) {
    return (
      <div
        className="inline-flex items-center gap-1"
        aria-label={`Nivel de repaso: ${masteryLevel} de 4`}
      >
        {[1, 2, 3, 4].map((seg) => (
          <span
            key={seg}
            className={cn(
              "h-1.5 w-4 rounded-full transition-colors",
              seg <= masteryLevel
                ? "bg-text-strong dark:bg-text-strong"
                : "bg-border-subtle/80 dark:bg-border-subtle",
            )}
          />
        ))}
      </div>
    );
  }

  return <span className="text-body-sm text-fg-subtle">—</span>;
}
