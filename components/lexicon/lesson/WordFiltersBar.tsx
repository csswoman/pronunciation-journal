"use client";

// Planned structure:
// <WordFiltersBar>
//   <StatusTabs />
//   <Divider />
//   <SortButtons />
//   <SearchInput />
//   <ViewToggle />
// </WordFiltersBar>

import { Search, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/cn";

export type StatusFilter = "all" | "learned" | "reviewing" | "new";
export type SortMode = "alpha" | "difficulty";
export type ViewMode = "grid" | "list";

interface WordFiltersBarProps {
  status: StatusFilter;
  sort: SortMode;
  view: ViewMode;
  search: string;
  onStatusChange: (s: StatusFilter) => void;
  onSortChange: (s: SortMode) => void;
  onViewChange: (v: ViewMode) => void;
  onSearchChange: (q: string) => void;
}

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "learned", label: "Learned" },
  { id: "reviewing", label: "Reviewing" },
  { id: "new", label: "New" },
];

export function WordFiltersBar({
  status, sort, view, search,
  onStatusChange, onSortChange, onViewChange, onSearchChange,
}: WordFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-3 border-b border-border-subtle">
      {/* Status tabs */}
      <div className="flex items-center gap-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onStatusChange(tab.id)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full transition-colors",
              status === tab.id
                ? "bg-fg text-surface-raised font-medium"
                : "text-fg-muted hover:text-fg hover:bg-surface-sunken"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-border-default mx-1" />

      {/* Sort */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onSortChange("alpha")}
          className={cn(
            "px-3 py-1.5 text-sm rounded-full transition-colors",
            sort === "alpha"
              ? "bg-surface-sunken text-fg font-medium border border-border-default"
              : "text-fg-muted hover:text-fg"
          )}
        >
          A–Z
        </button>
        <button
          onClick={() => onSortChange("difficulty")}
          className={cn(
            "px-3 py-1.5 text-sm rounded-full transition-colors",
            sort === "difficulty"
              ? "bg-surface-sunken text-fg font-medium border border-border-default"
              : "text-fg-muted hover:text-fg"
          )}
        >
          by difficulty
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fg-subtle" />
        <input
          type="text"
          placeholder="Find a word..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 pr-3 py-1.5 text-sm bg-surface-raised border border-border-default rounded-full text-fg placeholder:text-fg-placeholder focus:outline-none focus:border-border-focus w-44"
        />
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 border border-border-default rounded-lg p-0.5">
        <button
          onClick={() => onViewChange("grid")}
          className={cn(
            "p-1.5 rounded transition-colors",
            view === "grid" ? "bg-fg text-surface-raised" : "text-fg-muted hover:text-fg"
          )}
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewChange("list")}
          className={cn(
            "p-1.5 rounded transition-colors",
            view === "list" ? "bg-fg text-surface-raised" : "text-fg-muted hover:text-fg"
          )}
        >
          <List className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
