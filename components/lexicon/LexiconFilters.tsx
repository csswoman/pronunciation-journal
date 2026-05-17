type FilterId = "all" | "in-progress" | "not-started" | "tech" | "design" | "professional";

interface LexiconFiltersProps {
  active: FilterId;
  onChange: (filter: FilterId) => void;
}

const filters: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in-progress", label: "In progress" },
  { id: "not-started", label: "Not started" },
  { id: "tech", label: "Tech" },
  { id: "design", label: "Design" },
  { id: "professional", label: "Professional" },
];

export function LexiconFilters({ active, onChange }: LexiconFiltersProps) {
  return (
    <div className="flex gap-3 mb-6 flex-wrap">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onChange(filter.id)}
          className={[
            "px-4 py-2 rounded-full text-sm font-medium transition-colors",
            active === filter.id
              ? "bg-fg text-on-fg"
              : "bg-surface-raised border border-border-subtle text-fg-muted hover:text-fg hover:border-border-default",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

export type { FilterId };
