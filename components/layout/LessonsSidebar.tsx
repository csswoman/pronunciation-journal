"use client";
import Button from "@/components/ui/Button";

import type { ReactNode } from "react";
import type { LessonLevel } from "@/lib/groupLessonsByLevel";

export type Filters = {
  search: string;
  level: LessonLevel | null;
  category: string | null;
  source: "all" | "system" | "mine";
};

type LessonsSidebarProps = {
  filters: Filters;
  categories: string[];
  onFiltersChange: (next: Filters) => void;
  children?: ReactNode;
};

const LEVELS: LessonLevel[] = ["A1", "A2", "B1", "B2", "C1"];

function normalizeSelectValue(value: string): string | null {
  return value === "all" ? null : value;
}

export default function LessonsSidebar({
  filters,
  categories,
  onFiltersChange,
  children,
}: LessonsSidebarProps) {
  return (
    <div className="lg:sticky lg:top-6 rounded-2xl border border-[var(--line-divider)] bg-[var(--card-bg)] p-4 shadow-sm">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-[var(--deep-text)]">Filters</h2>
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">
          Narrow down lessons quickly.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="lesson-search" className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
            Search
          </label>
          <input
            id="lesson-search"
            type="text"
            value={filters.search}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                search: event.target.value,
              })
            }
            placeholder="Search by title"
            className="w-full rounded-xl border border-[var(--line-divider)] bg-transparent px-3 py-2 text-sm text-[var(--deep-text)] outline-none transition focus:border-[var(--primary)]"
          />
        </div>

        <div>
          <label htmlFor="lesson-level" className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
            Level
          </label>
          <select
            id="lesson-level"
            value={filters.level ?? "all"}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                level: normalizeSelectValue(event.target.value) as LessonLevel | null,
              })
            }
            className="w-full rounded-xl border border-[var(--line-divider)] bg-transparent px-3 py-2 text-sm text-[var(--deep-text)] outline-none transition focus:border-[var(--primary)]"
          >
            <option value="all">All levels</option>
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="lesson-category" className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
            Category
          </label>
          <select
            id="lesson-category"
            value={filters.category ?? "all"}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                category: normalizeSelectValue(event.target.value),
              })
            }
            className="w-full rounded-xl border border-[var(--line-divider)] bg-transparent px-3 py-2 text-sm text-[var(--deep-text)] outline-none transition focus:border-[var(--primary)]"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
            Source
          </p>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-[var(--btn-regular-bg)] p-1">
            <Button
              type="button"
              onClick={() => onFiltersChange({ ...filters, source: "all" })}
              className={`rounded-lg px-2 py-1.5 text-xs font-medium transition ${
                filters.source === "all"
                  ? "bg-[var(--card-bg)] text-[var(--deep-text)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--deep-text)]"
              }`}
            >
              All
            </Button>
            <Button
              type="button"
              onClick={() => onFiltersChange({ ...filters, source: "system" })}
              className={`rounded-lg px-2 py-1.5 text-xs font-medium transition ${
                filters.source === "system"
                  ? "bg-[var(--card-bg)] text-[var(--deep-text)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--deep-text)]"
              }`}
            >
              System
            </Button>
            <Button
              type="button"
              onClick={() => onFiltersChange({ ...filters, source: "mine" })}
              className={`rounded-lg px-2 py-1.5 text-xs font-medium transition ${
                filters.source === "mine"
                  ? "bg-[var(--card-bg)] text-[var(--deep-text)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--deep-text)]"
              }`}
            >
              Mine
            </Button>
          </div>
        </div>
      </div>

      {children ? (
        <div className="mt-5 border-t border-[var(--line-divider)] pt-4">
          {children}
        </div>
      ) : null}
    </div>
  );
}

