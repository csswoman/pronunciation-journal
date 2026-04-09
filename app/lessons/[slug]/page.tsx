"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { getTheoryLessonBySlug, deleteTheoryLesson } from "@/lib/theory-lessons/queries";
import { LESSON_CATEGORIES } from "@/lib/types";
import type { TheoryLesson } from "@/lib/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// MDEditor preview-only (no editor bundle on this page)
const MDPreview = dynamic(() => import("@uiw/react-md-editor").then((m) => m.default.Markdown), {
  ssr: false,
});

export default function LessonReaderPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [lesson, setLesson] = useState<TheoryLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getTheoryLessonBySlug(slug)
      .then(async (data) => {
        if (!data) { setError("Lesson not found"); return; }
        setLesson(data);
        // check ownership
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user && data.user_id === user.id) setIsOwner(true);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleDelete = async () => {
    if (!lesson) return;
    setDeleting(true);
    try {
      await deleteTheoryLesson(lesson.id);
      router.push("/lessons");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not delete lesson");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--page-bg)" }}>
        <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: "var(--page-bg)" }}>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{error ?? "Lesson not found"}</p>
        <Link href="/lessons" className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
          Back to lessons
        </Link>
      </div>
    );
  }

  const cat = LESSON_CATEGORIES.find((c) => c.value === lesson.category);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--page-bg)" }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back */}
        <Link
          href="/lessons"
          className="inline-flex items-center gap-1.5 text-sm mb-6 font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Lessons
        </Link>

        {/* Cover */}
        {lesson.cover_image_url && (
          <div className="h-56 w-full rounded-2xl overflow-hidden mb-6 relative">
            <Image
              src={lesson.cover_image_url}
              alt={lesson.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--btn-regular-bg)] text-[var(--primary)]">
            {cat?.label ?? lesson.category}
          </span>
          {!lesson.is_system && (
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              My lesson
            </span>
          )}
          <span className="text-xs ml-auto" style={{ color: "var(--text-tertiary)" }}>
            {new Date(lesson.updated_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </span>
        </div>

        <h1 className="text-2xl font-bold mb-8" style={{ color: "var(--deep-text)" }}>
          {lesson.title}
        </h1>

        {/* Markdown content */}
        <div data-color-mode="auto" className="prose-lesson">
          <MDPreview source={lesson.content} />
        </div>

        {/* Owner actions */}
        {isOwner && (
          <div className="mt-12 pt-6 border-t border-[var(--line-divider)] flex items-center gap-3">
            <Link
              href={`/lessons/${lesson.slug}/edit`}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--line-divider)] bg-[var(--card-bg)] hover:bg-[var(--btn-plain-bg-hover)] transition-colors"
              style={{ color: "var(--deep-text)" }}
            >
              Edit
            </Link>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Are you sure?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Yes, delete"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--line-divider)]"
                  style={{ color: "var(--deep-text)" }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
