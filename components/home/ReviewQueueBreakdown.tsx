import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ReviewSource } from "@/lib/home/constants";

interface ReviewQueueBreakdownProps {
  sources: ReviewSource[];
}

export default function ReviewQueueBreakdown({ sources }: ReviewQueueBreakdownProps) {
  if (sources.length === 0) return null;
  return (
    <ul className="mt-4 flex flex-col gap-1.5">
      {sources.map((s) => (
        <li key={s.id}>
          <Link
            href={s.href}
            className="focus-ring group flex items-center justify-between rounded-[var(--radius-md)] px-2 py-1.5 transition-colors hover:bg-surface-sunken"
          >
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  s.tone === "warning" ? "bg-[var(--warning)]" : "bg-[var(--primary)]",
                )}
                aria-hidden
              />
              <span className="font-body-sm text-[var(--text-secondary)]">
                <span className="tabular-nums font-medium text-[var(--text-primary)]">{s.count}</span>{" "}
                {s.label.toLowerCase()}
              </span>
            </span>
            <ArrowRight
              size={14}
              className="shrink-0 text-[var(--text-tertiary)] transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
