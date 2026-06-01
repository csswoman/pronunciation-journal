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

  const categoryCount = useMemo(() => {
    const set = new Set(lessons.map((l) => l.category));
    return set.size;
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
                Pronunciación, gramática, vocabulario y más — en pocos minutos, con ejemplos y
                ejercicios.
              </p>
            </div>

            <div className="mini-lessons__stats" aria-label="Resumen">
              <div className="mini-lessons__stat mini-lessons__stat--accent">
                <b>{lessons.length}</b>
                <span>lecciones</span>
              </div>
              <div className="mini-lessons__stat">
                <b>{categoryCount}</b>
                <span>categorías</span>
              </div>
            </div>
          </div>
        </header>

        <div className="mini-lessons__toolbar">
          <div className="mini-lessons__toolbar-group">
            <span className="mini-lessons__toolbar-label" id="ml-level-label">
              Nivel
            </span>
            <div
              className="mini-lessons__segmented"
              role="group"
              aria-labelledby="ml-level-label"
            >
              <button
                type="button"
                className={cn(
                  "mini-lessons__segment",
                  selectedLevel === "all" && "mini-lessons__segment--on"
                )}
                onClick={() => setSelectedLevel("all")}
              >
                Todos
              </button>
              {levels.map((level) => (
                <button
                  key={level}
                  type="button"
                  className={cn(
                    "mini-lessons__segment",
                    selectedLevel === level && "mini-lessons__segment--on"
                  )}
                  onClick={() => setSelectedLevel(level)}
                >
                  {MINI_LESSON_LEVEL_LABELS[level]}
                </button>
              ))}
            </div>
          </div>

          <span className="mini-lessons__toolbar-divider" aria-hidden />

          <div className="mini-lessons__toolbar-group">
            <label className="mini-lessons__toolbar-label" htmlFor="ml-category">
              Categoría
            </label>
            <select
              id="ml-category"
              className="mini-lessons__select"
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(e.target.value as LessonCategory | "all")
              }
            >
              <option value="all">Todas</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {MINI_LESSON_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </div>

          <div className="mini-lessons__toolbar-meta">
            <p className="mini-lessons__count">
              {filteredLessons.length} de {lessons.length}
            </p>
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
              className="mini-lessons__card"
            >
              <div className="mini-lessons__card-top">
                <div className="mini-lessons__card-meta">
                  <span className="mini-lessons__pill mini-lessons__pill--level">
                    {MINI_LESSON_LEVEL_LABELS[lesson.level]}
                  </span>
                  <span className="mini-lessons__pill">
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
