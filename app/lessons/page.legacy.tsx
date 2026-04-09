"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { getAllTheoryLessons } from "@/lib/theory-lessons/queries";
import { LESSON_CATEGORIES } from "@/lib/types";
import type { TheoryLesson, LessonCategory } from "@/lib/types";
import { useUserRole } from "@/hooks/useUserRole";

const CATEGORY_ALL = "all";

function LessonCard({
  lesson,
  isLcpCandidate = false,
}: {
  lesson: TheoryLesson;
  isLcpCandidate?: boolean;
}) {
  const cat = LESSON_CATEGORIES.find((c) => c.value === lesson.category);
  return (
    <Link
      href={`/lessons/${lesson.slug}`}
      className="group flex flex-col rounded-2xl border border-[var(--line-divider)] bg-[var(--card-bg)] overflow-hidden hover:border-[var(--primary)] transition-colors"
    >
      {lesson.cover_image_url ? (
        <div className="h-36 w-full overflow-hidden bg-[var(--btn-plain-bg-hover)] relative">
          <Image
            src={lesson.cover_image_url}
            alt={lesson.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading={isLcpCandidate ? "eager" : "lazy"}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="h-36 w-full flex items-center justify-center bg-[var(--btn-regular-bg)]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.206 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.794 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.794 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.206 18 16.5 18s-3.332.477-4.5 1.253" />
          </svg>
        </div>
      )}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--btn-regular-bg)] text-[var(--primary)]">
            {cat?.label ?? lesson.category}
          </span>
          {!lesson.is_system && (
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              Mine
            </span>
          )}
        </div>
        <h3 className="text-sm font-semibold text-[var(--deep-text)] line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
          {lesson.title}
        </h3>
        <p className="text-xs text-[var(--text-tertiary)] mt-auto pt-1">
          {new Date(lesson.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>
    </Link>
  );
}

export default function LessonsPage() {
  const [lessons, setLessons] = useState<TheoryLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<LessonCategory | "all">(CATEGORY_ALL);
  const [search, setSearch] = useState("");
  const { isPremium } = useUserRole();

  useEffect(() => {
    getAllTheoryLessons()
      .then(setLessons)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = lessons;
    if (activeCategory !== CATEGORY_ALL) {
      result = result.filter((l) => l.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((l) => l.title.toLowerCase().includes(q));
    }
    return result;
  }, [lessons, activeCategory, search]);

  const systemLessons = filtered.filter((l) => l.is_system);
  const myLessons = filtered.filter((l) => !l.is_system);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--page-bg)" }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--deep-text)" }}>
              Lessons
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Theory, grammar, phonetics and more
            </p>
          </div>
          <Link
            href="/lessons/new"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: "var(--primary)", color: "var(--accent-text)" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New lesson
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search lessons…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[var(--line-divider)] bg-[var(--card-bg)] focus:outline-none focus:border-[var(--primary)]"
            style={{ color: "var(--deep-text)" }}
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap mb-8">
          <button
            onClick={() => setActiveCategory(CATEGORY_ALL)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeCategory === CATEGORY_ALL
                ? "bg-[var(--primary)] text-[var(--accent-text)]"
                : "bg-[var(--btn-regular-bg)] text-[var(--deep-text)] hover:bg-[var(--btn-plain-bg-hover)]"
            }`}
          >
            All
          </button>
          {LESSON_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeCategory === cat.value
                  ? "bg-[var(--primary)] text-[var(--accent-text)]"
                  : "bg-[var(--btn-regular-bg)] text-[var(--deep-text)] hover:bg-[var(--btn-plain-bg-hover)]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="rounded-xl p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* System lessons */}
            {systemLessons.length > 0 && (
              <section className="mb-10">
                <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-tertiary)" }}>
                  Official lessons
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {systemLessons.map((l, idx) => (
                    <LessonCard key={l.id} lesson={l} isLcpCandidate={idx === 0} />
                  ))}
                </div>
              </section>
            )}

            {/* User's own lessons */}
            {myLessons.length > 0 && (
              <section className="mb-10">
                <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-tertiary)" }}>
                  My lessons
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myLessons.map((l, idx) => (
                    <LessonCard
                      key={l.id}
                      lesson={l}
                      isLcpCandidate={systemLessons.length === 0 && idx === 0}
                    />
                  ))}
                </div>
              </section>
            )}

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.206 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.794 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.794 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.206 18 16.5 18s-3.332.477-4.5 1.253" />
                </svg>
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No lessons found</p>
                <Link
                  href="/lessons/new"
                  className="text-sm font-semibold"
                  style={{ color: "var(--primary)" }}
                >
                  Create your first lesson
                </Link>
              </div>
            )}
          </>
        )}

        {/* Admin shortcut */}
        {isPremium && (
          <div className="mt-4 pt-4 border-t border-[var(--line-divider)]">
            <Link
              href="/admin/lessons"
              className="text-xs font-semibold flex items-center gap-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Manage system lessons
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
