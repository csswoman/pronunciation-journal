// Planned structure:
// <CoursesToolbar>
//   <FilterChips />   (All / Courses / Notes / Mini with counts)
//   <SearchInput />
//   <SortSelect />
//   <ViewToggle />    (grid | list)
// </CoursesToolbar>

"use client";

import { ChevronDown, Grid2x2, List, Search } from "lucide-react";

export type LibraryFilter = "all" | "manual" | "mini";
export type LibrarySort   = "recent" | "alpha";
export type LibraryView   = "grid" | "list";

export interface FilterChip {
  value: LibraryFilter;
  label: string;
  count: number;
}

interface CoursesToolbarProps {
  filters:    FilterChip[];
  filter:     LibraryFilter;
  onFilter:   (f: LibraryFilter) => void;
  search:     string;
  onSearch:   (s: string) => void;
  sort:       LibrarySort;
  onSort:     (s: LibrarySort) => void;
  view:       LibraryView;
  onView:     (v: LibraryView) => void;
}

const SORT_LABEL: Record<LibrarySort, string> = {
  recent: "Recently updated",
  alpha:  "A → Z",
};

export default function CoursesToolbar({
  filters, filter, onFilter,
  search, onSearch,
  sort, onSort,
  view, onView,
}: CoursesToolbarProps) {
  return (
    <div
      className="flex flex-wrap items-center"
      style={{ gap: "var(--space-3)", padding: "var(--space-4) 0" }}
    >
      <FilterChips chips={filters} active={filter} onSelect={onFilter} />

      <div className="flex items-center ml-auto flex-wrap" style={{ gap: "var(--space-2)" }}>
        <SearchInput value={search} onChange={onSearch} />
        <SortSelect value={sort} onChange={onSort} />
        <ViewToggle value={view} onChange={onView} />
      </div>
    </div>
  );
}

function FilterChips({
  chips, active, onSelect,
}: { chips: FilterChip[]; active: LibraryFilter; onSelect: (f: LibraryFilter) => void }) {
  return (
    <div className="flex flex-wrap items-center" style={{ gap: "var(--space-2)" }}>
      {chips.map((chip) => {
        const isActive = chip.value === active;
        return (
          <button
            key={chip.value}
            type="button"
            onClick={() => onSelect(chip.value)}
            className="inline-flex items-center"
            style={{
              gap: "var(--space-1)",
              height: "32px",
              padding: "0 var(--space-3)",
              borderRadius: "var(--radius-full)",
              border: `1px solid ${isActive ? "transparent" : "var(--border-subtle)"}`,
              background: isActive ? "var(--text-primary)" : "var(--surface-raised)",
              color:      isActive ? "var(--surface-raised)" : "var(--text-primary)",
              font: "var(--font-body-sm)",
              fontWeight: 500,
              cursor: "pointer",
              transition: "background var(--transition-fast)",
            }}
          >
            {chip.label}
            <span
              className="tabular-nums"
              style={{
                font: "var(--font-caption)",
                color: isActive ? "color-mix(in srgb, var(--surface-raised) 70%, transparent)" : "var(--text-tertiary)",
              }}
            >
              ({chip.count})
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label
      className="inline-flex items-center focus-within:ring-2 focus-within:ring-[color:var(--primary)]/40 focus-within:border-[color:var(--primary)] transition-shadow w-full sm:w-60"
      style={{
        gap: "var(--space-2)",
        height: "32px",
        padding: "0 var(--space-3)",
        background: "var(--surface-raised)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-full)",
      }}
    >
      <Search size={14} style={{ color: "var(--text-tertiary)" }} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search title or category…"
        className="flex-1 bg-transparent outline-none"
        style={{
          font: "var(--font-body-sm)",
          color: "var(--text-primary)",
          border: "none",
        }}
      />
    </label>
  );
}

function SortSelect({ value, onChange }: { value: LibrarySort; onChange: (s: LibrarySort) => void }) {
  return (
    <div
      className="relative inline-flex items-center focus-within:ring-2 focus-within:ring-[color:var(--primary)]/40 focus-within:border-[color:var(--primary)] transition-shadow"
      style={{
        height: "32px",
        padding: "0 var(--space-3)",
        background: "var(--surface-raised)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-full)",
        gap: "var(--space-2)",
        font: "var(--font-body-sm)",
        color: "var(--text-primary)",
      }}
    >
      <ChevronDown size={14} style={{ color: "var(--text-tertiary)" }} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as LibrarySort)}
        className="bg-transparent outline-none appearance-none pr-2 cursor-pointer"
        style={{ font: "var(--font-body-sm)", color: "var(--text-primary)", border: "none" }}
      >
        <option value="recent">{SORT_LABEL.recent}</option>
        <option value="alpha">{SORT_LABEL.alpha}</option>
      </select>
    </div>
  );
}

function ViewToggle({ value, onChange }: { value: LibraryView; onChange: (v: LibraryView) => void }) {
  return (
    <div
      className="inline-flex items-center"
      style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      <ViewButton active={value === "grid"} onClick={() => onChange("grid")} aria-label="Grid view">
        <Grid2x2 size={14} />
      </ViewButton>
      <ViewButton active={value === "list"} onClick={() => onChange("list")} aria-label="List view">
        <List size={14} />
      </ViewButton>
    </div>
  );
}

function ViewButton({
  active, onClick, children, ...rest
}: { active: boolean; onClick: () => void; children: React.ReactNode; "aria-label": string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...rest}
      style={{
        width: "32px",
        height: "32px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: active ? "var(--text-primary)" : "transparent",
        color:      active ? "var(--surface-raised)" : "var(--text-secondary)",
        border: "none",
        cursor: "pointer",
        transition: "background var(--transition-fast)",
      }}
    >
      {children}
    </button>
  );
}
