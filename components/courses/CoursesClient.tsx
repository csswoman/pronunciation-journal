"use client";

import { useMemo, useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import ContinueLessonCard from "@/components/courses/ContinueLessonCard";
import CoursesTabs, { type CoursesTab } from "@/components/courses/CoursesTabs";
import CoursesToolbar, {
  type LibraryFilter,
  type LibrarySort,
  type LibraryView,
} from "@/components/courses/CoursesToolbar";
import MiniLessonsGrid from "@/components/courses/MiniLessonsGrid";
import LibraryGrid from "@/components/courses/LibraryGrid";
import type { MiniLesson } from "@/lib/content/schemas";

// TODO: replace with real "last lesson in progress" query from Supabase
const MOCK_CONTINUE = {
  courseTitle:  "Advanced English Pronunciation",
  lessonLabel:  "Lesson 04",
  lessonTitle:  "Fluidez y habla conectada: cómo dejar de sonar entrecortado.",
  progress:     33,
  lessonsDone:  3,
  lessonsTotal: 9,
  minutesLeft:  10,
  phonemes:     ["wʊnə", "ˈgənə", "ˈdɪdʒə"],
};

export default function CoursesClient({ miniLessons }: { miniLessons: MiniLesson[] }) {
  const [tab, setTab]       = useState<CoursesTab>("library");
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort]     = useState<LibrarySort>("recent");
  const [view, setView]     = useState<LibraryView>("grid");
  const [libCounts, setLibCounts] = useState({ all: 0, manual: 0, notion: 0 });

  const tabs = useMemo(
    () => [
      { value: "library"      as const, label: "Library",      count: libCounts.all },
      { value: "mini-lessons" as const, label: "Mini lessons",  count: miniLessons.length },
    ],
    [libCounts.all, miniLessons.length]
  );

  const filterChips = useMemo(
    () => [
      { value: "all"    as const, label: "All",     count: libCounts.all },
      { value: "manual" as const, label: "Courses", count: libCounts.manual },
      { value: "notion" as const, label: "Notes",   count: libCounts.notion },
      { value: "mini"   as const, label: "Mini",    count: miniLessons.length },
    ],
    [libCounts, miniLessons.length]
  );

  return (
    <PageLayout cardWrapper={false}>
      <div className="mb-8">
        <ContinueLessonCard
          {...MOCK_CONTINUE}
          onResume={() => {
            // TODO: route to last lesson
          }}
          onViewSyllabus={() => {
            // TODO: route to course syllabus
          }}
        />
      </div>

      <CoursesTabs
        active={tab}
        onChange={(next) => {
          setTab(next);
          if (next === "mini-lessons" && filter !== "mini" && filter !== "all") setFilter("all");
        }}
        tabs={tabs}
      />

      <CoursesToolbar
        filters={filterChips}
        filter={filter}
        onFilter={(f) => {
          setFilter(f);
          if (f === "mini")    setTab("mini-lessons");
          else if (tab === "mini-lessons" && (f === "manual" || f === "notion")) setTab("library");
        }}
        search={search}
        onSearch={setSearch}
        sort={sort}
        onSort={setSort}
        view={view}
        onView={setView}
      />

      {tab === "library" && (
        <LibraryGrid
          filter={filter === "mini" ? "all" : filter}
          search={search}
          sort={sort}
          view={view}
          onCounts={setLibCounts}
        />
      )}

      {tab === "mini-lessons" && (
        <MiniLessonsGrid lessons={miniLessons} />
      )}
    </PageLayout>
  );
}
