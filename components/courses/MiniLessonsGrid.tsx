"use client";

import { useMemo, useState } from "react";
import type { LessonLevel, MiniLesson } from "@/lib/content/schemas";
import MiniLessonCard from "@/components/courses/MiniLessonCard";
import Button from "@/components/ui/Button";

type LevelFilter = "all" | LessonLevel;

export default function MiniLessonsGrid({ lessons }: { lessons: MiniLesson[] }) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<LevelFilter>("all");

  const filtered = useMemo(
    () =>
      lessons.filter((l) => {
        const matchLevel = level === "all" || l.level === level;
        const q = query.trim().toLowerCase();
        const matchQuery =
          !q ||
          l.title.toLowerCase().includes(q) ||
          l.body.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q);
        return matchLevel && matchQuery;
      }),
    [lessons, query, level]
  );

  const isFiltered = query.trim() !== "" || level !== "all";

  return (
    <div>
      {/* Search + level filter */}
      <div className="px-4 py-3 border-b border-border-subtle flex flex-col sm:flex-row gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Search lessons</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
          >
            <path
              d="M21 21l-4.3-4.3m1.8-5.2a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            type="search"
            placeholder="Search lessons…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-border-subtle bg-surface-raised pl-9 pr-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:border-primary transition-colors"
          />
        </label>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value as LevelFilter)}
          className="rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm text-fg focus:outline-none focus:border-primary transition-colors"
        >
          <option value="all">All levels</option>
          <option value="basic">Basic</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {/* Count */}
      {isFiltered && (
        <div className="px-4 pt-3 -mb-1">
          <p className="text-xs text-fg-subtle">
            {filtered.length === 0
              ? "No lessons match your search."
              : `${filtered.length} lesson${filtered.length === 1 ? "" : "s"} found`}
          </p>
        </div>
      )}

      {/* Grid */}
      <div className="p-4">
        {filtered.length === 0 ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-border-subtle px-8 text-center">
            <div>
              <p className="text-sm font-semibold text-fg">No lessons found</p>
              <p className="mt-2 text-xs text-fg-muted">Try a different search or level.</p>
              <Button
                onClick={() => { setQuery(""); setLevel("all"); }}
                className="mt-4 rounded-lg px-4 py-2 text-xs font-medium transition-colors bg-surface-sunken text-fg-muted"
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
