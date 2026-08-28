import React from "react";
import { cn } from "@/lib/cn";
import PlaceholderIllustration from "@/components/illustrations/PlaceholderIllustration";

// Planned structure:
// <EmptyState>
//   <illustration wrapper />
//   <H3 title />
//   <p description />
//   <action />
// </EmptyState>

interface EmptyStateProps {
  illustration?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  illustration,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-10 text-center",
        className
      )}
    >
      {/*
        koboyo illustrations are hand-drawn, not a fixed grid — extents differ
        per icon and under 4% are square. Constrain height only and let width
        follow, or the drawing distorts. See lib/illustrations/registry.ts.
      */}
      <div
        className="flex h-30 items-center justify-center text-primary [&>svg]:h-full [&>svg]:w-auto"
        aria-hidden="true"
      >
        {illustration ?? <PlaceholderIllustration className="h-full w-auto" />}
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="text-h4 font-medium text-fg">{title}</h3>
        {description && (
          <p className="text-body-sm text-fg-muted">{description}</p>
        )}
      </div>

      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
