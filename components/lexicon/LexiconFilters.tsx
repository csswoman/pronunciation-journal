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
    <div className="flex gap-2 flex-wrap">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onChange(filter.id)}
          className={
            active === filter.id
              ? "px-4 py-1.5 rounded-full text-sm font-medium bg-primary text-on-primary transition-colors"
              : "px-4 py-1.5 rounded-full text-sm font-medium border border-border-subtle text-fg-muted bg-transparent hover:text-fg hover:border-border-default transition-colors"
          }
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

export type { FilterId };
