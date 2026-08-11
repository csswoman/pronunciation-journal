"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { cn } from "@/lib/cn";
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

export default function MiniLessonsBrowser({ lessons }: { lessons: MiniLesson[] }) {
  const [selectedLevel, setSelectedLevel] = useState<LessonLevel | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<LessonCategory | "all">("all");

  const filteredLessons = lessons.filter(
    (lesson) =>
      (selectedLevel === "all" || lesson.level === selectedLevel) &&
      (selectedCategory === "all" || lesson.category === selectedCategory)
  );

  const hasActiveFilters = selectedLevel !== "all" || selectedCategory !== "all";

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

  function clearFilters() {
    setSelectedLevel("all");
    setSelectedCategory("all");
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
                {filteredLessons.length} {filteredLessons.length === 1 ? "lección" : "lecciones"}
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

            <div className="mini-lessons__grid">
              {filteredLessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/mini-lessons/${lesson.slug}`}
                  className="mini-lessons__card"
                >
                  <div className="mini-lessons__card-top">
                    <div className="mini-lessons__card-meta">
                      <span className="mini-lessons__pill mini-lessons__pill--level">
                        {MINI_LESSON_LEVEL_LABELS[lesson.level]}
                      </span>
                      <span className="mini-lessons__pill mini-lessons__pill--category">
                        {MINI_LESSON_CATEGORY_LABELS[lesson.category]}
                      </span>
                    </div>
                    <span className="mini-lessons__card-duration">{lesson.duration} min</span>
                  </div>

                  <h2 className="mini-lessons__card-title">{lesson.title}</h2>
                  <p className="mini-lessons__card-body">{lesson.body}</p>

                  <div className="mini-lessons__card-foot">
                    <span>{lesson.subtitle}</span>
                    <span className="mini-lessons__card-arrow" aria-hidden>
                      →
                    </span>
                  </div>
                </Link>
              ))}

              {filteredLessons.length === 0 && (
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
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
