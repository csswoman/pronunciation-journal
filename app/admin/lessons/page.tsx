"use client";
import Button from "@/components/ui/Button";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getAllTheoryLessons, deleteTheoryLesson, updateTheoryLesson } from "@/lib/theory-lessons/queries";
import { LESSON_CATEGORIES } from "@/lib/types";
import type { TheoryLesson } from "@/lib/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type SyncStatus = "idle" | "syncing" | "success" | "error";

export default function AdminLessonsPage() {
  const [lessons, setLessons] = useState<TheoryLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncResult, setSyncResult] = useState<{ created: number; updated: number; skipped: number; deleted: number } | null>(null);

  const load = () => {
    setLoading(true);
    getAllTheoryLessons()
      .then(setLessons)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (lesson: TheoryLesson) => {
    if (!confirm(`Delete "${lesson.title}"? This cannot be undone.`)) return;
    setDeletingId(lesson.id);
    try {
      if (lesson.is_system) {
        // System lessons need service-role bypass via API route
        const supabase = getSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Not authenticated");
        const res = await fetch(`/api/lessons/${lesson.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error ?? "Delete failed");
        }
      } else {
        await deleteTheoryLesson(lesson.id);
      }
      setLessons((prev) => prev.filter((l) => l.id !== lesson.id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (lesson: TheoryLesson) => {
    setTogglingId(lesson.id);
    try {
      const updated = await updateTheoryLesson(lesson.id, {
        is_published: !lesson.is_published,
      });
      setLessons((prev) => prev.map((l) => l.id === lesson.id ? updated : l));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setTogglingId(null);
    }
  };

  const handleNotionSync = async () => {
    setSyncStatus("syncing");
    setSyncResult(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch("/api/notion/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");

      setSyncResult(data);
      setSyncStatus("success");
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Notion sync failed");
      setSyncStatus("error");
    }
  };

  const system = lessons.filter((l) => l.is_system);
  const user   = lessons.filter((l) => !l.is_system);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--page-bg)" }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--deep-text)" }}>
              Lesson Manager
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Manage system and user theory lessons
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleNotionSync}
              disabled={syncStatus === "syncing"}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border border-[var(--line-divider)] transition-colors disabled:opacity-50"
              style={{ background: "var(--card-bg)", color: "var(--deep-text)" }}
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
              href="/courses"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "var(--primary)", color: "var(--accent-text)" }}
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
            <Button onClick={() => setSyncStatus("idle")} className="ml-4 opacity-60 hover:opacity-100 text-lg leading-none">×</Button>
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
              onTogglePublish={handleTogglePublish}
              showPublishControl
            />
            <LessonTable
              title="User lessons"
              lessons={user}
              deletingId={deletingId}
              togglingId={togglingId}
              onDelete={handleDelete}
              onTogglePublish={handleTogglePublish}
            />
          </>
        )}
      </div>
    </div>
  );
}

function LessonTable({
  title,
  lessons,
  deletingId,
  togglingId,
  onDelete,
  onTogglePublish,
  showPublishControl = false,
}: {
  title: string;
  lessons: TheoryLesson[];
  deletingId: string | null;
  togglingId: string | null;
  onDelete: (l: TheoryLesson) => void;
  onTogglePublish: (l: TheoryLesson) => void;
  showPublishControl?: boolean;
}) {
  return (
    <section className="mb-10">
      <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-tertiary)" }}>
        {title} ({lessons.length})
      </h2>
      {lessons.length === 0 ? (
        <p className="text-sm py-4" style={{ color: "var(--text-tertiary)" }}>None yet.</p>
      ) : (
        <div className="rounded-2xl border border-[var(--line-divider)] overflow-hidden">
          {lessons.map((lesson, idx) => {
            const cat = LESSON_CATEGORIES.find((c) => c.value === lesson.category);
            return (
              <div
                key={lesson.id}
                className={`flex items-center gap-3 px-4 py-3 ${idx < lessons.length - 1 ? "border-b border-[var(--line-divider)]" : ""} bg-[var(--card-bg)]`}
              >
                {/* Cover thumbnail */}
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--btn-regular-bg)] flex items-center justify-center relative">
                  {lesson.cover_image_url ? (
                    <Image src={lesson.cover_image_url} alt="" fill sizes="40px" className="object-cover" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.206 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.794 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.794 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.206 18 16.5 18s-3.332.477-4.5 1.253" />
                    </svg>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--deep-text)" }}>
                    {lesson.title}
                  </p>
                  <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-tertiary)" }}>
                    {cat?.label ?? lesson.category} · /lessons/{lesson.slug}
                    {lesson.source === "notion" && (
                      <span className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-tiny font-semibold bg-neutral-100 dark:bg-neutral-800 text-fg-subtle">
                        N Notion
                      </span>
                    )}
                  </p>
                </div>

                {/* Published badge */}
                <span className={`text-tiny font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${lesson.is_published ? "bg-success-soft text-success" : "bg-[var(--btn-regular-bg)] text-[var(--text-tertiary)]"}`}>
                  {lesson.is_published ? "Published" : "Draft"}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {showPublishControl && (
                    <Button
                      onClick={() => onTogglePublish(lesson)}
                      disabled={togglingId === lesson.id}
                      className="p-1.5 rounded-lg hover:bg-[var(--btn-plain-bg-hover)] transition-colors disabled:opacity-50"
                      title={lesson.is_published ? "Unpublish" : "Publish"}
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {togglingId === lesson.id ? (
                        <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" />
                      ) : lesson.is_published ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </Button>
                  )}

                  <Link
                    href="/courses"
                    className="p-1.5 rounded-lg hover:bg-[var(--btn-plain-bg-hover)] transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                    title="Edit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Link>

                  <Button
                    onClick={() => onDelete(lesson)}
                    disabled={deletingId === lesson.id}
                    className="p-1.5 rounded-lg hover:bg-error-soft transition-colors disabled:opacity-50 text-error"
                    title="Delete"
                  >
                    {deletingId === lesson.id ? (
                      <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}


