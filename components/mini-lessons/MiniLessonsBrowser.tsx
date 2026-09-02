"use client";

// Planned structure:
// <MiniLessonsBrowser>
//   <PageHeader />
//   <CatalogLayout>
//     <MiniLessonSidebarFilters />
//     <ResultsSection>
//       <MiniLessonFeaturedCard />
//       <AsymmetricGrid>
//         <MiniLessonCard /> × N
//       </AsymmetricGrid>
//       <ListPagination />
//     </ResultsSection>
//   </CatalogLayout>
// </MiniLessonsBrowser>

import { useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { MiniLessonCard } from "@/components/mini-lessons/MiniLessonCard";
import { MiniLessonFeaturedCard } from "@/components/mini-lessons/MiniLessonFeaturedCard";
import { MiniLessonSidebarFilters } from "@/components/mini-lessons/MiniLessonSidebarFilters";
import { ListPagination } from "@/components/ui/ListPagination";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { LessonLevel, LessonCategory, MiniLesson } from "@/lib/content/schemas";
import { MINI_LESSON_CATEGORY_LABELS } from "@/lib/content/mini-lesson-labels";

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

  const featuredLesson = lessons[0];

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
          <MiniLessonSidebarFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedLevel={selectedLevel}
            onLevelChange={setSelectedLevel}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            levelCounts={levelCounts}
            categoryCounts={categoryCounts}
          />

          <section className="mini-lessons__results" aria-label="Lecciones disponibles">
            {/* Top Featured Hero Card (when no filters or page 1) */}
            {!hasActiveFilters && currentPage === 1 && featuredLesson && (
              <div className="mb-2">
                <MiniLessonFeaturedCard lesson={featuredLesson} />
              </div>
            )}

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
                  {paginatedLessons.map((lesson, idx) => {
                    // Asymmetric grid: span 2 columns every 5 items (e.g. index 2)
                    const isSpanning = isWide && (idx % 5 === 2);
                    return (
                      <MiniLessonCard
                        key={lesson.id}
                        lesson={lesson}
                        isSpanning={isSpanning}
                      />
                    );
                  })}
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
