import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import ReviewQueueBreakdown from "./ReviewQueueBreakdown";
import ReviewQueuePreview from "./ReviewQueuePreview";
import type { ReviewQueueSummary } from "@/lib/home/constants";

interface ReviewQueueCardProps {
  summary: ReviewQueueSummary;
}

export default function ReviewQueueCard({ summary }: ReviewQueueCardProps) {
  const { total, newAvailable, sources, preview } = summary;
  const hasDue = total > 0;

  return (
    <div className="flex flex-col rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-6">
      <div className="flex items-baseline gap-2">
        <span className="type-stat text-2xl tabular-nums">{total}</span>
        <span className="font-body-sm text-[var(--text-secondary)]">to review</span>
      </div>

      {hasDue ? (
        <ReviewQueueBreakdown sources={sources} />
      ) : (
        <p className="font-body-sm mt-1 text-[var(--text-tertiary)]">
          {newAvailable > 0
            ? "Nothing scheduled — keep momentum with new words."
            : "You're all caught up ✓"}
        </p>
      )}

      <ReviewQueuePreview items={preview} />

      <div className="mt-6">
        {hasDue ? (
          <Link
            href="/practice/review"
            className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-4 py-2.5 font-body-sm font-medium text-[var(--on-primary)] transition-opacity hover:opacity-90"
          >
            Start review <ArrowRight size={15} aria-hidden />
          </Link>
        ) : newAvailable > 0 ? (
          <Link
            href="/practice/core-1000"
            className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-4 py-2.5 font-body-sm font-medium text-[var(--on-primary)] transition-opacity hover:opacity-90"
          >
            Learn new words <ArrowRight size={15} aria-hidden />
          </Link>
        ) : (
          <Link
            href="/words"
            className="focus-ring inline-flex items-center gap-1.5 font-caption font-medium text-[var(--primary)] transition-opacity hover:opacity-80"
          >
            <Check size={13} aria-hidden /> Browse vocabulary
          </Link>
        )}
      </div>
    </div>
  );
}
