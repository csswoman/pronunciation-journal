/*
 * Planned subcomponents:
 * - CoursePathProgressRing (main indicator)
 *   - DoneCheckIcon (completed state)
 *   - PartialProgressArc (in-progress circular ring)
 *   - UnstartedCircleIcon (empty state)
 */

import { Check } from "@/components/icons";
import { cn } from "@/lib/cn";

export type CoursePathRowProgressStatus = "done" | "partial" | "unstarted";

interface CoursePathProgressRingProps {
  status: CoursePathRowProgressStatus;
  progressPercent?: number;
  size?: number;
  className?: string;
  ariaLabel?: string;
}

export default function CoursePathProgressRing({
  status,
  progressPercent = 0,
  size = 22,
  className,
  ariaLabel,
}: CoursePathProgressRingProps) {
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.max(0, Math.min(100, progressPercent));
  const strokeDashoffset = circumference * (1 - clampedPercent / 100);

  if (status === "done") {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center shrink-0 text-success",
          className
        )}
        style={{ width: size, height: size }}
        role={ariaLabel ? "img" : undefined}
        aria-label={ariaLabel}
        aria-hidden={!ariaLabel}
      >
        <Check size={size - 2} strokeWidth={2.5} aria-hidden />
      </span>
    );
  }

  if (status === "partial") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className={cn("shrink-0", className)}
        role={ariaLabel ? "progressbar" : undefined}
        aria-label={ariaLabel}
        aria-valuenow={clampedPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-hidden={!ariaLabel}
      >
        {/* Background track circle */}
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          stroke="var(--border-default)"
          strokeWidth="2"
        />
        {/* Active progress arc */}
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 12 12)"
        />
      </svg>
    );
  }

  // Unstarted state
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn("shrink-0", className)}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
    >
      <circle
        cx="12"
        cy="12"
        r={radius}
        fill="none"
        stroke="var(--border-default)"
        strokeWidth="1.75"
        className="opacity-70"
      />
    </svg>
  );
}
