import React from "react";
import { cn } from "@/lib/cn";

// Planned structure:
// <EmptyState>
//   <illustration wrapper />
//   <H3 title />
//   <p description />
//   <action />
// </EmptyState>

interface EmptyStateProps {
  illustration: React.ReactNode;
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
      <div className="w-full max-w-50 text-primary" aria-hidden="true">
        {illustration}
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
