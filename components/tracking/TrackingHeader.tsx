"use client";

// Planned structure:
// <TrackingHeader>
//   <TitleGroup: Kicker + H1Title(Bricolage) + SubtitleStats />
//   <ActionGroup: QuickAddButton + StartReviewButton />
// </TrackingHeader>

import { ArrowRight, Plus } from "@/components/icons";
import Button from "@/components/ui/Button";

interface TrackingHeaderProps {
  totalCount: number;
  dueCount: number;
  onOpenAdd: () => void;
  onStartReview: () => void;
  onPreloadAdd?: () => void;
  onPreloadReview?: () => void;
  canReview: boolean;
}

export function TrackingHeader({
  totalCount,
  dueCount,
  onOpenAdd,
  onStartReview,
  onPreloadAdd,
  onPreloadReview,
  canReview,
}: TrackingHeaderProps) {
  const subtitle = `${totalCount} guardados${dueCount > 0 ? ` · ${dueCount} ${dueCount === 1 ? "vence" : "vencen"} hoy` : ""}`;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
      <div>
        <span className="font-mono text-overline font-semibold uppercase tracking-wider text-fg-subtle">
          GUARDADOS
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-fg leading-tight mt-0.5">
          Mi inglés
        </h1>
        <p className="mt-1 text-body-sm text-fg-muted font-medium">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenAdd}
          onMouseEnter={onPreloadAdd}
          onFocus={onPreloadAdd}
          className="focus-ring inline-flex h-10 items-center gap-2 rounded-full border border-border-subtle bg-surface-raised px-4 text-body-sm font-semibold text-fg shadow-xs transition-colors hover:bg-surface-sunken active:scale-95"
        >
          <Plus size={16} aria-hidden />
          <span>Guardar</span>
          <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-xs border border-border-subtle bg-surface-sunken px-1 font-mono text-caption text-fg-muted">
            N
          </kbd>
        </button>

        <Button
          onClick={onStartReview}
          onMouseEnter={onPreloadReview}
          onFocus={onPreloadReview}
          disabled={!canReview}
          className="rounded-full shadow-xs"
          icon={<ArrowRight size={16} aria-hidden />}
        >
          {dueCount > 0 ? `Repasar ${dueCount}` : "Repasar"}
        </Button>
      </div>
    </div>
  );
}
