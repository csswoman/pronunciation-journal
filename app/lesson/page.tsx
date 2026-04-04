"use client";

import { useState, useEffect } from "react";
import { getAllLessons } from "@/lib/lesson-generator";
import { getAllDbLessons } from "@/lib/lesson-generator-db";
import { getSoundsForToday } from "@/lib/phoneme-practice/queries";
import { useAuth } from "@/components/AuthProvider";
import LessonCard from "@/components/lesson/LessonCard";
import type { Lesson } from "@/lib/types";

// ── Section config ────────────────────────────────────────────────────────────

const SECTIONS: { difficulty: Lesson['difficulty']; label: string; description: string }[] = [
  { difficulty: 'easy',   label: 'Basics',   description: 'Start here — core sounds and everyday words' },
  { difficulty: 'medium', label: 'Practice', description: 'Build fluency with common vocabulary and patterns' },
  { difficulty: 'hard',   label: 'Advanced', description: 'Tackle tricky sounds and challenging words' },
]

const PAGE_SIZE = 6

// ── Component ─────────────────────────────────────────────────────────────────

export default function LessonsPage() {
  const { user } = useAuth()
  const staticLessons = getAllLessons()
  const [dbLessons, setDbLessons] = useState<Lesson[]>([])
  const [recommended, setRecommended] = useState<Lesson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    getAllDbLessons()
      .then(setDbLessons)
      .catch((err) => console.error("Failed to load DB lessons:", err))
      .finally(() => setIsLoading(false))
  }, [])

  // Resolve recommended: sounds due for review → matching sound-* lessons
  useEffect(() => {
    if (!user || dbLessons.length === 0) return

    getSoundsForToday(user.id)
      .then((due) => {
        if (due.length === 0) return

        const dueIds = new Set(due.map((s) => s.sound_id))
        const dueLessons = dbLessons.filter(
          (l) => l.id.startsWith('sound-') && dueIds.has(Number(l.id.replace('sound-', '')))
        )

        if (dueLessons.length > 0) {
          setRecommended(dueLessons.slice(0, 3))
        }
      })
      .catch(() => {
        // Silently fail — recommended section just won't show
      })
  }, [user, dbLessons])

  const allLessons = [...staticLessons, ...dbLessons]

  // Group by difficulty (static lessons use category as proxy, DB lessons have difficulty)
  const lessonsByDifficulty = (diff: Lesson['difficulty']) =>
    allLessons.filter((l) => l.difficulty === diff)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--page-bg)' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'var(--page-bg)' }}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Lessons
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Improve your pronunciation with structured practice
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-12">
        {isLoading && (
          <div className="flex items-center gap-2 mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading lessons…
          </div>
        )}

        {/* Recommended for you — dynamic, only shown when there's relevant content */}
        {recommended.length > 0 && (
          <section className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Recommended for you
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Sounds due for review based on your progress
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommended.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
          </section>
        )}

        {/* Sections by difficulty */}
        <div className="space-y-14">
          {SECTIONS.map(({ difficulty, label, description }) => {
            const lessons = lessonsByDifficulty(difficulty)
            if (lessons.length === 0) return null
            const isExpanded = expanded[difficulty] ?? false
            const visible = isExpanded ? lessons : lessons.slice(0, PAGE_SIZE)
            const hasMore = lessons.length > PAGE_SIZE
            return (
              <section key={difficulty}>
                <div className="mb-6 border-l-4 pl-4" style={{ borderLeftColor: 'var(--primary)' }}>
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {label}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {description}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visible.map((lesson) => (
                    <LessonCard key={lesson.id} lesson={lesson} />
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setExpanded((prev) => ({ ...prev, [difficulty]: !isExpanded }))}
                      className="px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {isExpanded
                        ? 'Show less'
                        : `Show ${lessons.length - PAGE_SIZE} more`}
                    </button>
                  </div>
                )}
              </section>
            )
          })}
        </div>
      </main>
    </div>
  )
}
