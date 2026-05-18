"use client";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export type LessonFilter = "all" | "system" | "user" | "drafts";

interface LessonToolbarProps {
  query: string;
  onQueryChange: (q: string) => void;
  filter: LessonFilter;
  onFilterChange: (f: LessonFilter) => void;
  counts: Record<LessonFilter, number>;
}

const TABS: { value: LessonFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "system", label: "System" },
  { value: "user", label: "User" },
  { value: "drafts", label: "Drafts" },
];

export default function LessonToolbar({
  query,
  onQueryChange,
  filter,
  onFilterChange,
  counts,
}: LessonToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-space-4 flex-wrap mb-space-8">
      {/* Search */}
      <div className="relative flex-1 min-w-[16rem]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-space-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-subtle"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search lessons, paths, tags…"
          className="w-full pl-space-10 pr-space-12 py-space-2 rounded-xl text-body-sm bg-surface-sunken border border-border-default text-fg placeholder:text-fg-placeholder focus:outline-none focus:border-border-focus transition-colors"
        />
        <kbd className="absolute right-space-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-md text-tiny font-mono bg-surface-raised border border-border-default text-fg-subtle">
          ⌘K
        </kbd>
      </div>

      <div className="flex items-center gap-space-2">
        {/* Filter tabs */}
        <div className="flex items-center gap-space-1 p-space-1 rounded-xl bg-surface-sunken border border-border-default">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => onFilterChange(tab.value)}
              className={cn(
                "flex items-center gap-1.5 px-space-3 py-space-1 rounded-lg text-sm font-medium transition-colors",
                filter === tab.value
                  ? "bg-surface-raised text-fg shadow-sm"
                  : "text-fg-muted hover:text-fg"
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "text-tiny font-semibold px-1.5 py-px rounded-full tabular-nums",
                  filter === tab.value ? "bg-primary-soft text-primary" : "bg-surface-raised text-fg-subtle"
                )}
              >
                {counts[tab.value]}
              </span>
            </button>
          ))}
        </div>

        {/* Filter button */}
        <Button
          className="flex items-center gap-1.5 px-space-3 py-space-2 rounded-xl text-body-xs font-medium border border-border-default bg-surface-raised text-fg-muted hover:text-fg hover:bg-surface-sunken transition-colors"
          title="More filters"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 12h12M10 20h4" />
          </svg>
          Filter
        </Button>
      </div>
    </div>
  );
}
