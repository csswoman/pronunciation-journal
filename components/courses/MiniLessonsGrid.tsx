"use client";

import { useMemo, useState } from "react";
import { miniLessons, LessonLevel, LessonCategory } from "@/lib/mini-lessons";
import MiniLessonCard from "@/components/courses/MiniLessonCard";
import Button from "@/components/ui/Button";

type LevelFilter = "all" | LessonLevel;
type CategoryFilter = "all" | LessonCategory;

const levelTabs: { value: LevelFilter; label: string }[] = [
  { value: "all",          label: "All levels"    },
  { value: "basic",        label: "Basic"         },
  { value: "intermediate", label: "Intermediate"  },
  { value: "advanced",     label: "Advanced"      },
];

const categoryTabs: { value: CategoryFilter; label: string }[] = [
  { value: "all",           label: "All"          },
  { value: "pronunciation", label: "Pronunciation"},
  { value: "grammar",       label: "Grammar"      },
  { value: "vocabulary",    label: "Vocabulary"   },
  { value: "listening",     label: "Listening"    },
  { value: "speaking",      label: "Speaking"     },
  { value: "writing",       label: "Writing"      },
  { value: "idioms",        label: "Idioms"       },
  { value: "collocations",  label: "Collocations" },
];

const activeStyle = {
  background: "var(--primary)",
  color: "var(--on-primary)",
  boxShadow: "0 2px 8px color-mix(in oklch, var(--primary) 30%, transparent)",
};

const idleStyle = {
  background: "var(--btn-regular-bg)",
  color: "var(--text-secondary)",
};

export default function MiniLessonsGrid() {
  const [level, setLevel] = useState<LevelFilter>("all");
  const [category, setCategory] = useState<CategoryFilter>("all");

  const filtered = useMemo(
    () =>
      miniLessons.filter(
        (l) =>
          (level === "all"    || l.level    === level) &&
          (category === "all" || l.category === category)
      ),
    [level, category]
  );

  return (
    <div>
      {/* Filters */}
      <div className="px-4 py-3 border-b border-[var(--line-divider)] flex flex-col gap-3">
        {/* Level */}
        <div className="flex flex-wrap gap-1.5">
          {levelTabs.map((tab) => (
            <Button
              key={tab.value}
              type="button"
              onClick={() => setLevel(tab.value)}
              className="rounded-lg px-3.5 py-1.5 text-caption font-medium transition-all duration-150"
              style={level === tab.value ? activeStyle : idleStyle}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Category */}
        <div className="flex flex-wrap gap-1.5">
          {categoryTabs.map((tab) => (
            <Button
              key={tab.value}
              type="button"
              onClick={() => setCategory(tab.value)}
              className="rounded-lg px-3.5 py-1.5 text-caption font-medium transition-all duration-150"
              style={category === tab.value ? activeStyle : idleStyle}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Count */}
      {(level !== "all" || category !== "all") && (
        <div className="px-4 pt-3 -mb-1">
          <p className="text-caption text-fg-subtle">
            {filtered.length === 0
              ? "No lessons match your filters."
              : `${filtered.length} lesson${filtered.length === 1 ? "" : "s"} found`}
          </p>
        </div>
      )}

      {/* Grid */}
      <div className="p-4">
        {filtered.length === 0 ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-[var(--line-divider)] px-8 text-center">
            <div>
              <p className="text-body-sm font-semibold text-fg">No lessons found</p>
              <p className="mt-2 text-caption text-fg-muted">Try clearing the filters.</p>
              <Button
                onClick={() => { setLevel("all"); setCategory("all"); }}
                className="mt-4 rounded-lg px-4 py-2 text-caption font-medium transition-colors bg-surface-sunken text-fg-muted"
              >
                Clear filters
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((lesson) => (
              <MiniLessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
