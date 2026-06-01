"use client";
import { useMemo, useState } from "react";
import LessonManagerHeader from "@/components/admin/LessonManagerHeader";
import LessonToolbar, { type LessonFilter } from "@/components/admin/LessonToolbar";
import LessonTable from "@/components/admin/LessonTable";
import { useLessonManager } from "@/hooks/useLessonManager";
import type { TheoryLesson } from "@/lib/types";

export default function AdminLessonsPage() {
  const {
    lessons,
    loading,
    error,
    deletingId,
    togglingId,
    deleteLesson,
    togglePublish,
  } = useLessonManager();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<LessonFilter>("all");

  const handleDelete = (lesson: TheoryLesson) => {
    if (!confirm(`Delete "${lesson.title}"? This cannot be undone.`)) return;
    deleteLesson(lesson);
  };

  const counts = useMemo(() => ({
    all: lessons.length,
    system: lessons.filter((l) => l.is_system).length,
    user: lessons.filter((l) => !l.is_system).length,
    drafts: lessons.filter((l) => !l.is_published).length,
  }), [lessons]);

  const { system, user, showSystem, showUser } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = lessons.filter((l) => {
      const matchesQuery = !q || l.title.toLowerCase().includes(q) || l.slug.toLowerCase().includes(q);
      const matchesDrafts = filter !== "drafts" || !l.is_published;
      return matchesQuery && matchesDrafts;
    });
    return {
      system: visible.filter((l) => l.is_system),
      user: visible.filter((l) => !l.is_system),
      showSystem: filter !== "user",
      showUser: filter !== "system",
    };
  }, [lessons, query, filter]);

  return (
    <div className="min-h-screen bg-page-bg">
      <LessonManagerHeader
        total={counts.all}
        published={counts.all - counts.drafts}
        drafts={counts.drafts}
      />

      <div className="max-w-5xl mx-auto px-space-6 py-space-8">
        <LessonToolbar
          query={query}
          onQueryChange={setQuery}
          filter={filter}
          onFilterChange={setFilter}
          counts={counts}
        />

        {error && (
          <div className="rounded-xl p-space-3 mb-space-4 bg-error-soft text-error text-body-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-space-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {showSystem && (
              <LessonTable
                label="System"
                note="Platform lessons · read-only origin"
                lessons={system}
                deletingId={deletingId}
                togglingId={togglingId}
                onDelete={handleDelete}
                onTogglePublish={togglePublish}
                showPublishControl
              />
            )}
            {showUser && (
              <LessonTable
                label="User"
                note="Created by you · editable"
                lessons={user}
                deletingId={deletingId}
                togglingId={togglingId}
                onDelete={handleDelete}
                onTogglePublish={togglePublish}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
