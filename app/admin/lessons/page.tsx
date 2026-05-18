"use client";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { H1 } from "@/components/ui/Typography";
import LessonTable from "@/components/admin/LessonTable";
import { useLessonManager } from "@/hooks/useLessonManager";

export default function AdminLessonsPage() {
  const {
    lessons,
    loading,
    error,
    deletingId,
    togglingId,
    syncStatus,
    syncResult,
    deleteLesson,
    togglePublish,
    syncNotion,
    dismissSync,
  } = useLessonManager();

  const handleDelete = (lesson: (typeof lessons)[number]) => {
    if (!confirm(`Delete "${lesson.title}"? This cannot be undone.`)) return;
    deleteLesson(lesson);
  };

  const system = lessons.filter((l) => l.is_system);
  const user = lessons.filter((l) => !l.is_system);

  return (
    <div className="min-h-screen bg-page-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <H1 className="text-h2">Lesson Manager</H1>
            <p className="text-sm mt-0.5 text-fg-muted">
              Create, edit and publish theory lessons
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={syncNotion}
              disabled={syncStatus === "syncing"}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border border-line-divider bg-card-bg text-fg transition-colors disabled:opacity-50"
              title="Sync lessons from Notion"
            >
              {syncStatus === "syncing" ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              {syncStatus === "syncing" ? "Syncing…" : "Sync Notion"}
            </Button>
            <Link
              href="/admin/lessons/new"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New lesson
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-xl p-3 mb-4 bg-error-soft text-error text-sm">
            {error}
          </div>
        )}

        {syncStatus === "success" && syncResult && (
          <div className="rounded-xl p-3 mb-6 bg-success-soft text-success text-sm flex items-center justify-between">
            <span>
              Notion sync complete — {syncResult.created} created, {syncResult.updated} updated, {syncResult.deleted} deleted, {syncResult.skipped} skipped
            </span>
            <Button onClick={dismissSync} className="ml-4 opacity-60 hover:opacity-100 text-lg leading-none">×</Button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <LessonTable
              title="System lessons"
              lessons={system}
              deletingId={deletingId}
              togglingId={togglingId}
              onDelete={handleDelete}
              onTogglePublish={togglePublish}
              showPublishControl
            />
            <LessonTable
              title="User lessons"
              lessons={user}
              deletingId={deletingId}
              togglingId={togglingId}
              onDelete={handleDelete}
              onTogglePublish={togglePublish}
            />
          </>
        )}
      </div>
    </div>
  );
}
