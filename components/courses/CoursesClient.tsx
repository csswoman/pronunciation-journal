"use client";

import { useMemo, useRef, useState } from "react";
import type { Course } from "@/lib/notion/types";
import PageHeader from "@/components/layout/PageHeader";
import CourseCard from "@/components/courses/CourseCard";
import CourseFilters from "@/components/courses/CourseFilters";

type CourseLevel = "all" | "basic" | "intermediate" | "advanced";
type CourseListItem = Course & {
  completedLessons?: number;
};

type CoursesClientProps = {
  courses: CourseListItem[];
};

export default function CoursesClient({ courses }: CoursesClientProps) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<CourseLevel>("all");
  const filtersRef = useRef<HTMLDivElement | null>(null);

  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        course.title.toLowerCase().includes(normalizedQuery);
      const matchesLevel =
        level === "all" || (course.level ?? "").toLowerCase() === level;
      return matchesQuery && matchesLevel;
    });
  }, [courses, level, query]);

  return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          badge="Courses"
          title="Continue your"
          subtitle="learning path"
          description="Filter by level or search by title to find the right course."
          primaryCta={{
            label: "Browse courses",
            onClick: () => {
              filtersRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            },
          }}
          variant="compact"
        />

        {/* Filters bar */}
        <div
          ref={filtersRef}
          className="rounded-2xl border border-[var(--line-divider)] bg-[var(--card-bg)] px-4 py-3 shadow-[0_1px_3px_var(--line-divider)]"
        >
          <CourseFilters
            query={query}
            level={level}
            onQueryChange={setQuery}
            onLevelChange={setLevel}
          />
        </div>

        {/* Results label */}
        {(query || level !== "all") && (
          <p className="mt-5 text-[13px] text-[var(--text-tertiary)]">
            {filteredCourses.length === 0
              ? "No courses match your filters."
              : `${filteredCourses.length} course${filteredCourses.length === 1 ? "" : "s"} found`}
          </p>
        )}

        {/* Grid */}
        <div className="mt-6">
          {filteredCourses.length === 0 ? (
            <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-[var(--line-divider)] bg-[var(--card-bg)] px-8 text-center">
              <div>
                <p className="text-[15px] font-semibold text-[var(--deep-text)]">
                  No courses found
                </p>
                <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
                  Try a different search term or clear the level filter.
                </p>
                <button
                  onClick={() => { setQuery(""); setLevel("all"); }}
                  className="mt-4 rounded-lg px-4 py-2 text-[13px] font-medium transition-colors"
                  style={{ background: "var(--btn-regular-bg)", color: "var(--text-secondary)" }}
                >
                  Clear filters
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
