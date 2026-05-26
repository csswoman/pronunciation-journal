"use client";

export type CoursesTab = "library" | "mini-lessons";

interface TabSpec {
  value: CoursesTab;
  label: string;
  count: number;
}

interface CoursesTabsProps {
  active: CoursesTab;
  onChange: (tab: CoursesTab) => void;
  tabs: TabSpec[];
}

export default function CoursesTabs({ active, onChange, tabs }: CoursesTabsProps) {
  return (
    <div
      className="flex items-center"
      style={{
        gap: "var(--space-6)",
        borderBottom: "1px solid var(--border-subtle)",
        padding: "0 var(--space-1)",
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === active;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className="inline-flex items-center"
            style={{
              gap: "var(--space-2)",
              padding: "var(--space-3) 0",
              background: "transparent",
              border: "none",
              borderBottom: `2px solid ${isActive ? "var(--primary)" : "transparent"}`,
              marginBottom: "-1px",
              cursor: "pointer",
              font: "var(--font-body)",
              fontWeight: isActive ? 600 : 500,
              color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
              transition: "color var(--transition-fast)",
            }}
          >
            {tab.label}
            <span
              style={{
                font: "var(--font-caption)",
                color: isActive ? "var(--primary)" : "var(--text-tertiary)",
                fontWeight: 500,
              }}
              className="tabular-nums"
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
