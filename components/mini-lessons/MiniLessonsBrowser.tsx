"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  LESSON_LEVELS,
  LESSON_CATEGORIES,
  type LessonLevel,
  type LessonCategory,
  type MiniLesson,
} from "@/lib/content/schemas";

const levels: LessonLevel[] = [...LESSON_LEVELS];
const categories: LessonCategory[] = [...LESSON_CATEGORIES];

export default function MiniLessonsBrowser({ lessons }: { lessons: MiniLesson[] }) {
  const [selectedLevel, setSelectedLevel] = useState<LessonLevel | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<LessonCategory | null>(null);

  const filteredLessons = lessons.filter(
    (lesson) =>
      (!selectedLevel || lesson.level === selectedLevel) &&
      (!selectedCategory || lesson.category === selectedCategory)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-12">
        <Link
          href="/"
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 inline-block"
        >
          ← Back to home
        </Link>
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">Mini Lessons</h1>
        <p className="text-lg text-[var(--text-secondary)]">
          Short lessons on pronunciation, grammar, vocabulary, and more
        </p>
      </div>

      <div className="mb-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Level</p>
          <div className="flex flex-wrap gap-2">
            {levels.map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(selectedLevel === level ? null : level)}
                className={cn(
                  "px-3 py-1 text-sm rounded-full font-medium transition-colors",
                  selectedLevel === level
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--btn-regular-bg)] text-[var(--text-secondary)] hover:bg-[var(--border-subtle)]"
                )}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
            {selectedLevel && (
              <button
                onClick={() => setSelectedLevel(null)}
                className="px-3 py-1 text-sm rounded-full font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Category</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                className={cn(
                  "px-3 py-1 text-sm rounded-full font-medium transition-colors",
                  selectedCategory === category
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--btn-regular-bg)] text-[var(--text-secondary)] hover:bg-[var(--border-subtle)]"
                )}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-3 py-1 text-sm rounded-full font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="text-sm text-[var(--text-tertiary)] mb-6">
        {filteredLessons.length} of {lessons.length} lessons
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLessons.map((lesson) => (
          <Link
            key={lesson.id}
            href={`/mini-lessons/${lesson.slug}`}
            className="group block p-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--btn-regular-bg)] hover:border-[var(--primary)] hover:bg-[var(--surface-raised)] transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="inline-block text-xs font-medium text-[var(--text-tertiary)] bg-[var(--surface-raised)] px-2 py-1 rounded mb-2">
                  {lesson.level}
                </span>
                <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                  {lesson.title}
                </h3>
              </div>
              <span className="text-xs text-[var(--text-tertiary)] whitespace-nowrap ml-2">
                {lesson.duration} min
              </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-2 line-clamp-2">{lesson.body}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-tertiary)]">{lesson.category}</span>
              <span className="text-xs text-[var(--primary)] group-hover:translate-x-1 transition-transform">
                →
              </span>
            </div>
          </Link>
        ))}
      </div>

      {filteredLessons.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[var(--text-secondary)]">No lessons found matching your filters.</p>
        </div>
      )}
    </div>
  );
}
