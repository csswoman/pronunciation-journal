"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
    <div className="mini-lessons">
      <div className="mini-lessons__wrap">
        <header className="mini-lessons__hero">
          <Link href="/" className="mini-lessons__back">
            ← Inicio
          </Link>

          <div className="mini-lessons__hero-row">
            <div>
              <span className="mini-lessons__eyebrow">Learning · Mini Lessons</span>
              <h1 className="mini-lessons__title">
                Lecciones <em>cortas</em>
              </h1>
              <p className="mini-lessons__lead">
                {lessons.length} lecciones de pronunciación, gramática, vocabulario y más, en
                pocos minutos, con ejemplos y ejercicios.
              </p>
            </div>
          </div>
        </header>

        <div className="mini-lessons__toolbar" role="group" aria-label="Filtros">
          <div className="mini-lessons__filter-row">
            {/* Level chips */}
            <button
              type="button"
              className={cn("mini-lessons__chip", selectedLevel === "all" && "mini-lessons__chip--on")}
              onClick={() => setSelectedLevel("all")}
            >
              Todos
            </button>
            {levels.map((level) => (
              <button
                key={level}
                type="button"
                className={cn("mini-lessons__chip", selectedLevel === level && "mini-lessons__chip--on")}
                onClick={() => setSelectedLevel(level)}
              >
                {MINI_LESSON_LEVEL_LABELS[level]}
                {levelCounts[level] !== undefined && (
                  <span className="mini-lessons__chip-count">{levelCounts[level]}</span>
                )}
              </button>
            ))}

            <span className="mini-lessons__toolbar-divider" aria-hidden />

            {/* Category chips */}
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={cn("mini-lessons__chip", selectedCategory === category && "mini-lessons__chip--on")}
                onClick={() => setSelectedCategory(category)}
              >
                {MINI_LESSON_CATEGORY_LABELS[category]}
                {categoryCounts[category] !== undefined && (
                  <span className="mini-lessons__chip-count">{categoryCounts[category]}</span>
                )}
              </button>
            ))}
          </div>

          <div className="mini-lessons__toolbar-meta">
            <span className="mini-lessons__count">
              {filteredLessons.length}/{lessons.length}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                className="mini-lessons__toolbar-reset"
                onClick={clearFilters}
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        <div className="mini-lessons__grid">
          {filteredLessons.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/mini-lessons/${lesson.slug}`}
              className={`mini-lessons__card mini-lessons__card--${lesson.category}`}
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
      </div>
    </div>
  );
}
