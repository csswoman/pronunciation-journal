"use client";

type CourseLevel = "all" | "basic" | "intermediate" | "advanced";

type CourseFiltersProps = {
  query: string;
  level: CourseLevel;
  onQueryChange: (value: string) => void;
  onLevelChange: (value: CourseLevel) => void;
};

export default function CourseFilters({
  query,
  level,
  onQueryChange,
  onLevelChange,
}: CourseFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {/* Search */}
      <label className="relative flex-1">
        <span className="sr-only">Search courses</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
        >
          <path
            d="M21 21l-4.3-4.3m1.8-5.2a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search courses…"
          className="w-full rounded-lg border border-border-subtle bg-surface-raised pl-9 pr-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-primary transition-colors"
        />
      </label>

      {/* Level select */}
      <select
        value={level}
        onChange={(e) => onLevelChange(e.target.value as CourseLevel)}
        className="rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm text-fg focus:outline-none focus:border-primary transition-colors"
      >
        <option value="all">All levels</option>
        <option value="basic">Basic</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </select>
    </div>
  );
}
