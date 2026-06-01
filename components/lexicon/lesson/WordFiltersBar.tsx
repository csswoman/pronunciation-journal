"use client";

import { Search, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/cn";

export type StatusFilter = "all" | "learned" | "reviewing" | "new";
export type SortMode = "alpha" | "difficulty";
export type ViewMode = "grid" | "list";

export type StatusCounts = Record<StatusFilter, number>;

interface WordFiltersBarProps {
  status: StatusFilter;
  sort: SortMode;
  view: ViewMode;
  search: string;
  counts?: StatusCounts;
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
  status,
  sort,
  view,
  search,
  counts,
  onStatusChange,
  onSortChange,
  onViewChange,
  onSearchChange,
}: WordFiltersBarProps) {
  return (
    <div className="lexicon-area__toolbar" role="search">
      <div className="lexicon-area__toolbar-cluster">
        <div className="lexicon-area__ftabs" role="tablist" aria-label="Filter by status">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={status === tab.id}
              onClick={() => onStatusChange(tab.id)}
              className={cn("lexicon-area__ftab", status === tab.id && "is-active")}
            >
              {tab.label}
              {counts ? (
                <span className="lexicon-area__ftab-count" aria-hidden>
                  {counts[tab.id]}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <span className="lexicon-area__toolbar-divider" aria-hidden />

        <div className="lexicon-area__sortgrp" role="group" aria-label="Sort words">
          <button
            type="button"
            onClick={() => onSortChange("alpha")}
            className={cn("lexicon-area__sortopt", sort === "alpha" && "is-active")}
          >
            A–Z
          </button>
          <button
            type="button"
            onClick={() => onSortChange("difficulty")}
            className={cn("lexicon-area__sortopt", sort === "difficulty" && "is-active")}
          >
            By difficulty
          </button>
        </div>
      </div>

      <div className="lexicon-area__toolbar-end">
        <label className="lexicon-area__find">
          <Search className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <span className="sr-only">Search words</span>
          <input
            type="search"
            placeholder="Find a word…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </label>

        <div className="lexicon-area__vtoggle" role="group" aria-label="View mode">
          <button
            type="button"
            onClick={() => onViewChange("grid")}
            className={cn("lexicon-area__vt", view === "grid" && "is-active")}
            aria-label="Grid view"
            aria-pressed={view === "grid"}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewChange("list")}
            className={cn("lexicon-area__vt", view === "list" && "is-active")}
            aria-label="List view"
            aria-pressed={view === "list"}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
