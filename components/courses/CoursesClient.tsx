"use client";
import Button from "@/components/ui/Button";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Course } from "@/lib/notion/types";
import PageHeader from "@/components/layout/PageHeader";
import PageLayout from "@/components/layout/PageLayout";
import CourseCard from "@/components/courses/CourseCard";
import CourseFilters from "@/components/courses/CourseFilters";
import MiniLessonsGrid from "@/components/courses/MiniLessonsGrid";
import { getCompletedCountByCourse } from "@/lib/db";

type CourseLevel = "all" | "basic" | "intermediate" | "advanced";
type CourseListItem = Course & { completedLessons?: number };
type ActiveTab = "courses" | "mini-lessons";

const tabs: { value: ActiveTab; label: string }[] = [
  { value: "courses",      label: "Courses"      },
  { value: "mini-lessons", label: "Mini Lessons" },
];

export default function CoursesClient() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("courses");
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<CourseLevel>("all");
  const filtersRef = useRef<HTMLDivElement | null>(null);
  const [completedCounts, setCompletedCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/notion/courses")
      .then((r) => r.json())
      .then((data) => { setCourses(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
    getCompletedCountByCourse().then(setCompletedCounts);
  }, []);

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
    <PageLayout
      hero={
        <PageHeader
          badge="Courses"
          title="Continue your"
          subtitle="learning path"
          description="Filter by level or search by title to find the right course."
          primaryCta={{
            label: "Browse courses",
            onClick: () => {
              filtersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            },
          }}
          variant="compact"
        />
      }
    >
      <div
        ref={filtersRef}
        className="rounded-2xl border border-[var(--line-divider)] bg-[var(--card-bg)] shadow-[0_1px_3px_var(--line-divider)] overflow-hidden"
      >
        {/* Tab selector */}
        <div className="flex gap-1 px-4 pt-3 pb-0 border-b border-[var(--line-divider)]">
          {tabs.map((tab) => {
            const active = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors -mb-px border-b-2"
                style={
                  active
                    ? { color: "var(--primary)", borderColor: "var(--primary)" }
                    : { color: "var(--text-secondary)", borderColor: "transparent" }
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Courses tab */}
        {activeTab === "courses" && (
          <>
            <div className="px-4 py-3 border-b border-[var(--line-divider)]">
              <CourseFilters
                query={query}
                level={level}
                onQueryChange={setQuery}
                onLevelChange={setLevel}
              />
            </div>

            {(query || level !== "all") && (
              <div className="px-4 pt-3 -mb-1">
                <p className="text-caption text-fg-subtle">
                  {filteredCourses.length === 0
                    ? "No courses match your filters."
                    : `${filteredCourses.length} course${filteredCourses.length === 1 ? "" : "s"} found`}
                </p>
              </div>
            )}

            <div className="p-4">
              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-[var(--line-divider)] h-48 overflow-hidden relative bg-surface-sunken">
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-overlay-light to-transparent" />
                    </div>
                  ))}
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-[var(--line-divider)] px-8 text-center">
                  <div>
                    <p className="text-body-sm font-semibold text-fg">No courses found</p>
                    <p className="mt-2 text-caption text-fg-muted">
                      Try a different search term or clear the level filter.
                    </p>
                    <Button
                      onClick={() => { setQuery(""); setLevel("all"); }}
                      className="mt-4 rounded-lg px-4 py-2 text-caption font-medium transition-colors bg-surface-sunken text-fg-muted"
                    >
                      Clear filters
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredCourses.map((course, i) => (
                    <CourseCard key={course.id} course={{ ...course, completedLessons: completedCounts[course.slug] ?? 0 }} priority={i === 0} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Mini Lessons tab */}
        {activeTab === "mini-lessons" && <MiniLessonsGrid />}
      </div>
    </PageLayout>
  );
}

