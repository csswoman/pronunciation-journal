"use client";

// Planned structure:
// <MiniLessonsBrowser>
//   <PageHeader />
//   <SidebarFilters>
//     <SearchBar />
//     <LevelFilter />
//     <CategoryFilter />
//   </SidebarFilters>
//   <Results>
//     <MiniLessonCard /> × N
//     <ListPagination />
//   </Results>
// </MiniLessonsBrowser>

import { useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { MiniLessonCard } from "@/components/mini-lessons/MiniLessonCard";
import { ListPagination } from "@/components/ui/ListPagination";
import { cn } from "@/lib/cn";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  LESSON_LEVELS,
  LESSON_CATEGORIES,
  type LessonLevel,
  type LessonCategory,
  type MiniLesson,
} from "@/lib/content/schemas";
import {
  MINI_LESSON_CATEGORY_LABELS,
  MINI_LESSON_LEVEL_LABELS,
} from "@/lib/content/mini-lesson-labels";

const levels: LessonLevel[] = [...LESSON_LEVELS];
const categories: LessonCategory[] = [...LESSON_CATEGORIES];

const PAGE_SIZE_DESKTOP = 12;
const PAGE_SIZE_MOBILE = 8;

export default function MiniLessonsBrowser({ lessons }: { lessons: MiniLesson[] }) {
  const [selectedLevel, setSelectedLevel] = useState<LessonLevel | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<LessonCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [layoutReady, setLayoutReady] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const isWide = useMediaQuery("(min-width: 700px)");
  const pageSize = layoutReady && !isWide ? PAGE_SIZE_MOBILE : PAGE_SIZE_DESKTOP;

  useEffect(() => {
    setLayoutReady(true);
  }, []);

  const filteredLessons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return lessons.filter((lesson) => {
      const matchesLevel = selectedLevel === "all" || lesson.level === selectedLevel;
      const matchesCategory =
        selectedCategory === "all" || lesson.category === selectedCategory;
      const matchesSearch =
        !q ||
        lesson.title.toLowerCase().includes(q) ||
        lesson.body.toLowerCase().includes(q) ||
        lesson.subtitle.toLowerCase().includes(q) ||
        MINI_LESSON_CATEGORY_LABELS[lesson.category].toLowerCase().includes(q);

      return matchesLevel && matchesCategory && matchesSearch;
    });
  }, [lessons, selectedLevel, selectedCategory, searchQuery]);

  const hasActiveFilters =
    selectedLevel !== "all" || selectedCategory !== "all" || searchQuery.trim().length > 0;
  const totalPages = Math.max(1, Math.ceil(filteredLessons.length / pageSize));

  const paginatedLessons = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLessons.slice(start, start + pageSize);
  }, [filteredLessons, currentPage, pageSize]);

  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = { all: lessons.length };
    for (const l of lessons) counts[l.level] = (counts[l.level] ?? 0) + 1;
    return counts;
  }, [lessons]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: lessons.length };
    for (const l of lessons) counts[l.category] = (counts[l.category] ?? 0) + 1;
    return counts;
  }, [lessons]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLevel, selectedCategory, searchQuery]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  function clearFilters() {
    setSelectedLevel("all");
    setSelectedCategory("all");
    setSearchQuery("");
  }

  function handlePageChange(page: number) {
    setCurrentPage(page);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    listRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  return (
    <>
      <PageHeader
        kicker="Aprender"
        title="Mini Lessons"
        subtitle={`${lessons.length} lecciones de pronunciación, gramática, vocabulario y más, en pocos minutos, con ejemplos y ejercicios.`}
      />

      <div className="mini-lessons__wrap mini-lessons__wrap--shell">
        <div className="mini-lessons__catalog">
          <aside className="mini-lessons__filters" aria-label="Filtrar lecciones">
            <div className="mini-lessons__filter-group">
              <span id="lesson-search-label" className="mini-lessons__filter-label">
                Buscar
              </span>
              <input
                type="search"
                value={searchQuery}
                aria-labelledby="lesson-search-label"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar lección..."
                className="w-full px-3 py-1.5 text-body-sm rounded-sm bg-surface-sunken border border-border-default text-fg placeholder:text-fg-placeholder focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            <div
              className="mini-lessons__filter-group"
              role="group"
              aria-labelledby="lesson-level-filter"
            >
              <span id="lesson-level-filter" className="mini-lessons__filter-label">
                Nivel
              </span>
              <div className="mini-lessons__filter-options">
                <button
                  type="button"
                  className={cn(
                    "mini-lessons__chip",
                    selectedLevel === "all" && "mini-lessons__chip--on",
                  )}
                  aria-pressed={selectedLevel === "all"}
                  onClick={() => setSelectedLevel("all")}
                >
                  Todos
                </button>
                {levels.map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={cn(
                      "mini-lessons__chip",
                      selectedLevel === level && "mini-lessons__chip--on",
                    )}
                    aria-pressed={selectedLevel === level}
                    onClick={() => setSelectedLevel(level)}
                  >
                    {MINI_LESSON_LEVEL_LABELS[level]}
                    {levelCounts[level] !== undefined && (
                      <span className="mini-lessons__chip-count">{levelCounts[level]}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div
              className="mini-lessons__filter-group"
              role="group"
              aria-labelledby="lesson-category-filter"
            >
              <span id="lesson-category-filter" className="mini-lessons__filter-label">
                Tema
              </span>
              <div className="mini-lessons__filter-options mini-lessons__filter-options--categories">
                <button
                  type="button"
                  className={cn(
                    "mini-lessons__chip",
                    selectedCategory === "all" && "mini-lessons__chip--on",
                  )}
                  aria-pressed={selectedCategory === "all"}
                  onClick={() => setSelectedCategory("all")}
                >
                  Todas
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={cn(
                      "mini-lessons__chip",
                      selectedCategory === category && "mini-lessons__chip--on",
                    )}
                    aria-pressed={selectedCategory === category}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {MINI_LESSON_CATEGORY_LABELS[category]}
                    {categoryCounts[category] !== undefined && (
                      <span className="mini-lessons__chip-count">
                        {categoryCounts[category]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="mini-lessons__results" aria-label="Lecciones disponibles">
            <div className="mini-lessons__results-header">
              <p className="mini-lessons__count" aria-live="polite">
                {filteredLessons.length}{" "}
                {filteredLessons.length === 1 ? "lección" : "lecciones"}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  className="mini-lessons__toolbar-reset"
                  onClick={clearFilters}
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            {filteredLessons.length === 0 ? (
              <p className="mini-lessons__empty">
                No hay lecciones con estos filtros.{" "}
                <button
                  type="button"
                  className="mini-lessons__toolbar-reset"
                  onClick={clearFilters}
                >
                  Ver todas
                </button>
              </p>
            ) : (
              <div ref={listRef} className="flex flex-col gap-4">
                <div className="mini-lessons__grid">
                  {paginatedLessons.map((lesson) => (
                    <MiniLessonCard key={lesson.id} lesson={lesson} />
                  ))}
                </div>
                <ListPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredLessons.length}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  ariaLabel="Paginación de lecciones"
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
