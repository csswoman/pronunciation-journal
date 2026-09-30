"use client";

// Planned structure:
// <TrackingControls>
//   <TrackingHeader />
//   <TrackingToolbar />
// </TrackingControls>

import { TrackingHeader } from "./TrackingHeader";
import { TrackingToolbar, type FilterCounts, type SortMode } from "./TrackingToolbar";
import type { TrackingFilter } from "@/lib/tracking/types";

interface TrackingControlHandlers {
  onOpenAdd: () => void;
  onStartReview: () => void;
  onPreloadAdd: () => void;
  onPreloadReview: () => void;
  onFilterChange: (filter: TrackingFilter) => void;
  onSearchChange: (query: string) => void;
  onSortChange: (sort: SortMode) => void;
  onViewModeChange: (view: "list" | "grid") => void;
}

interface TrackingControlsProps {
  counts: FilterCounts;
  dueCount: number;
  canReview: boolean;
  filter: TrackingFilter;
  searchQuery: string;
  sortMode: SortMode;
  viewMode: "list" | "grid";
  handlers: TrackingControlHandlers;
}

export function TrackingControls({
  counts,
  dueCount,
  canReview,
  filter,
  searchQuery,
  sortMode,
  viewMode,
  handlers,
}: TrackingControlsProps) {
  return (
    <>
      <TrackingHeader
        totalCount={counts.all}
        dueCount={dueCount}
        onOpenAdd={handlers.onOpenAdd}
        onStartReview={handlers.onStartReview}
        canReview={canReview}
        onPreloadAdd={handlers.onPreloadAdd}
        onPreloadReview={handlers.onPreloadReview}
      />
      <TrackingToolbar
        filter={filter}
        onFilterChange={handlers.onFilterChange}
        counts={counts}
        searchQuery={searchQuery}
        onSearchChange={handlers.onSearchChange}
        sortMode={sortMode}
        onSortChange={handlers.onSortChange}
        viewMode={viewMode}
        onViewModeChange={handlers.onViewModeChange}
      />
    </>
  );
}
