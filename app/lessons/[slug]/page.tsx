"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  getTheoryLessonBySlug,
  deleteTheoryLesson,
  getAllTheoryLessons,
} from "@/lib/theory-lessons/queries";
import LessonsSidebar, { type Filters } from "@/components/LessonsSidebar";
import LessonMarkdown from "@/components/lessons/LessonMarkdown";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { LESSON_CATEGORIES } from "@/lib/types";
import type { TheoryLesson } from "@/lib/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const LEVEL_SET = new Set(["A1", "A2", "B1", "B2", "C1"]);

function getLessonLevel(category: string | null): string | null {
  if (!category) return null;
  const normalized = category.toUpperCase();
  return LEVEL_SET.has(normalized) ? normalized : null;
}

function estimateDurationMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(5, Math.ceil(words / 160));
}

const INITIAL_FILTERS: Filters = {
  search: "",
  level: null,
  category: null,
  source: "all",
};

function splitLessonContent(content: string): string[] {
  const source = content.replace(/\r\n/g, "\n").trim();
  if (!source) return ["This lesson has no content yet."];
  if (!source.includes("\n##")) return [source];
  return source.split(/\n(?=##\s+)/).filter((chunk) => chunk.trim().length > 0);
}

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
  const [allLessons, setAllLessons] = useState<TheoryLesson[]>([]);
  const [sidebarFilters, setSidebarFilters] = useState<Filters>(INITIAL_FILTERS);
  const scrollProgress = useScrollProgress("main.overflow-y-auto");

  useEffect(() => {
    if (!slug) return;
    Promise.all([getTheoryLessonBySlug(slug), getAllTheoryLessons()])
      .then(async ([data, list]) => {
        if (!data) { setError("Lesson not found"); return; }
        setLesson(data);
        setAllLessons(list);
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
  const level = getLessonLevel(lesson.category) ?? "General";
  const duration = estimateDurationMinutes(lesson.content);
  const lessonSections = splitLessonContent(lesson.content);
  const sidebarCategories = Array.from(
    new Set(allLessons.map((item) => item.category).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));

  const relatedLessons = allLessons
    .filter((item) => item.id !== lesson.id)
    .filter((item) =>
      sidebarFilters.search
        ? item.title.toLowerCase().includes(sidebarFilters.search.toLowerCase())
        : true,
    )
    .filter((item) =>
      sidebarFilters.level
        ? getLessonLevel(item.category) === sidebarFilters.level
        : true,
    )
    .filter((item) =>
      sidebarFilters.category
        ? item.category === sidebarFilters.category
        : true,
    )
    .filter((item) => {
      if (sidebarFilters.source === "system") return item.is_system;
      if (sidebarFilters.source === "mine") return !item.is_system;
      return true;
    })
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[var(--page-bg)]">
      <div className="pointer-events-none fixed top-0 left-0 z-50 h-1 w-full bg-transparent">
        <div
          className="h-full bg-[var(--primary)] transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link
          href="/lessons"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-[var(--text-secondary)] dark:hover:text-[var(--deep-text)]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Lessons
        </Link>

        <section className="relative mb-6 overflow-hidden rounded-xl shadow-sm">
          <div className="relative h-72 w-full">
            {lesson.cover_image_url ? (
              <Image
                src={lesson.cover_image_url}
                alt={lesson.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide backdrop-blur">
                  {cat?.label ?? lesson.category}
                </span>
                {!lesson.is_system && (
                  <span className="rounded-full bg-amber-300/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-950">
                    My lesson
                  </span>
                )}
              </div>

              <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">
                {lesson.title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-white/85">
                <span>Level: {level}</span>
                <span>{duration} min</span>
                <span>{new Date(lesson.updated_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-8 lg:flex-row">
          <main className="min-w-0 flex-1 space-y-8">
            <div className="space-y-6">
              {lessonSections.map((section, index) => (
                <section
                  key={`${index}-${section.slice(0, 24)}`}
                  className="rounded-xl bg-white p-6 shadow-sm dark:bg-[var(--card-bg)] sm:p-8"
                >
                  <LessonMarkdown content={section} />
                </section>
              ))}
            </div>

            {/* Owner actions */}
            {isOwner && (
              <div className="mt-8 flex items-center gap-3 border-t border-[var(--line-divider)] pt-6">
                <Link
                  href={`/lessons/${lesson.slug}/edit`}
                  className="rounded-xl border border-[var(--line-divider)] bg-white px-4 py-2 text-sm font-semibold text-neutral-800 transition-all duration-200 hover:bg-neutral-100 dark:bg-[var(--card-bg)] dark:text-[var(--deep-text)] dark:hover:bg-[var(--btn-plain-bg-hover)]"
                >
                  Edit
                </Link>

                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-red-600 transition-all duration-200 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
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
                      className="rounded-lg border border-[var(--line-divider)] px-3 py-1.5 text-xs font-semibold"
                      style={{ color: "var(--deep-text)" }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>

          <aside className="w-full lg:w-72">
            <LessonsSidebar
              filters={sidebarFilters}
              categories={sidebarCategories}
              onFiltersChange={setSidebarFilters}
            >
              <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--deep-text)" }}>
                Suggested Lessons
              </h2>
              {relatedLessons.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  No lessons for these filters.
                </p>
              ) : (
                <nav className="space-y-1">
                  {relatedLessons.map((item) => (
                    <Link
                      key={item.id}
                      href={`/lessons/${item.slug}`}
                      className="block rounded-lg px-2.5 py-2 text-sm transition-all duration-200 hover:bg-[var(--btn-plain-bg-hover)] hover:shadow-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <span className="line-clamp-2">{item.title}</span>
                    </Link>
                  ))}
                </nav>
              )}
            </LessonsSidebar>
          </aside>
        </div>
      </div>
    </div>
  );
}
