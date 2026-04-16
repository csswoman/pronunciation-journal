"use client";

type CourseLevel = "all" | "basic" | "intermediate" | "advanced";

type CourseFiltersProps = {
  query: string;
  level: CourseLevel;
  onQueryChange: (value: string) => void;
  onLevelChange: (value: CourseLevel) => void;
};

const levelTabs: { value: CourseLevel; label: string }[] = [
  { value: "all", label: "All levels" },
  { value: "basic", label: "Basic" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export default function CourseFilters({
  query,
  level,
  onQueryChange,
  onLevelChange,
}: CourseFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      {/* Search */}
      <label className="relative flex-1">
        <span className="sr-only">Search courses</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]"
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
          className="h-10 w-full rounded-xl border border-[var(--line-divider)] bg-[var(--card-bg)] pl-10 pr-4 text-sm text-[var(--deep-text)] placeholder:text-[var(--text-tertiary)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[color-mix(in_oklch,var(--primary)_20%,transparent)]"
        />
      </label>

      {/* Level pills */}
      <div className="flex flex-wrap gap-1.5">
        {levelTabs.map((tab) => {
          const active = level === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onLevelChange(tab.value)}
              className="rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all duration-150"
              style={
                active
                  ? {
                      background: "var(--primary)",
                      color: "white",
                      boxShadow: "0 2px 8px color-mix(in oklch, var(--primary) 30%, transparent)",
                    }
                  : {
                      background: "var(--btn-regular-bg)",
                      color: "var(--text-secondary)",
                    }
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
