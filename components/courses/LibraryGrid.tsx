"use client";
// Planned structure:
// <LibraryGrid>            ← receives filter/search/sort/view from parent
//   <LibraryCard />         ← one per theory_lesson, badged Notes / Course
// </LibraryGrid>

import { useEffect, useMemo, useState } from "react";
import LibraryItemCard from "@/components/courses/LibraryItemCard";
import {
  getCoverHue,
  getCoverVariant,
  getDurationLabel,
  getInitials,
  getLevelLabel,
} from "@/components/courses/libraryCardHelpers";
import { getAllTheoryLessons } from "@/lib/theory-lessons/queries";
import type { TheoryLesson } from "@/lib/types";
import type { LibraryFilter, LibrarySort, LibraryView } from "@/components/courses/CoursesToolbar";

interface LibraryGridProps {
  filter:  LibraryFilter;
  search:  string;
  sort:    LibrarySort;
  view:    LibraryView;
  onCounts?: (counts: { all: number; manual: number; notion: number }) => void;
}

export default function LibraryGrid({ filter, search, sort, view, onCounts }: LibraryGridProps) {
  const [items, setItems] = useState<TheoryLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAllTheoryLessons()
      .then((all) => {
        const published = all.filter((l) => l.is_published);
        setItems(published);
        onCounts?.({
          all:    published.length,
          manual: published.filter((i) => i.source === "manual").length,
          notion: published.filter((i) => i.source === "notion").length,
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load library"))
      .finally(() => setLoading(false));
    // onCounts is intentionally omitted to avoid re-fetching
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((i) => filter === "all" ? true : i.source === (filter === "manual" ? "manual" : filter === "notion" ? "notion" : i.source))
      .filter((i) => q === "" || i.title.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
      .sort((a, b) =>
        sort === "alpha"
          ? a.title.localeCompare(b.title)
          : new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
  }, [items, filter, search, sort]);

  if (error) {
    return <div className="rounded-xl p-3 bg-error-soft text-error text-sm">{error}</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-border-subtle px-8 text-center">
        <p className="text-sm text-fg-muted">Nothing here yet.</p>
      </div>
    );
  }

  return (
    <div
      className={
        view === "list"
          ? "grid gap-3"
          : "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      }
    >
      {visible.map((item, i) => (
        <LibraryCard key={item.id} item={item} layout={view} priority={i === 0} />
      ))}
    </div>
  );
}

// Mock metadata until the schema carries description/lessons/level/progress.
// TODO: source these from theory_lessons or a sibling table.
const MOCK_BY_CATEGORY: Record<string, { description: string; lessons: number; level: string; inProgress?: boolean; progress?: number }> = {
  pronunciation: { description: "Sonidos, ritmo y entonación con prácticas dirigidas.",          lessons: 9,  level: "advanced",     inProgress: true, progress: 33 },
  grammar:       { description: "Estructura, conectores y patrones para escribir con claridad.", lessons: 8,  level: "basic"        },
  vocabulary:    { description: "Léxico esencial y matices de uso para conversación real.",      lessons: 14, level: "intermediate" },
  conversation:  { description: "Rutinas para practicar inglés conversacional usando IA 1:1.",    lessons: 12, level: "intermediate" },
  writing:       { description: "Construcción de oraciones y párrafos efectivos.",                lessons: 8,  level: "basic"        },
  listening:     { description: "Comprensión auditiva con material auténtico.",                   lessons: 10, level: "intermediate" },
};

function LibraryCard({ item, layout, priority }: { item: TheoryLesson; layout: LibraryView; priority?: boolean }) {
  const isNotion = item.source === "notion";
  const mock = MOCK_BY_CATEGORY[item.category] ?? { description: "", lessons: 0, level: "basic" };
  const inProgress = mock.inProgress ?? false;

  return (
    <LibraryItemCard
      href={`/courses/library/${item.slug}`}
      badge={isNotion ? "Notes" : "Course"}
      eyebrow={item.category.replace(/-/g, " ")}
      title={item.title}
      description={mock.description}
      initials={getInitials(item.title)}
      coverImageUrl={item.cover_image_url}
      coverVariant={getCoverVariant(item.title, inProgress)}
      coverHue={getCoverHue(item.title)}
      lessons={mock.lessons || undefined}
      durationLabel={getDurationLabel(mock.lessons)}
      levelLabel={getLevelLabel(mock.level)}
      progress={mock.progress}
      inProgress={inProgress}
      layout={layout}
      priority={priority}
    />
  );
}
