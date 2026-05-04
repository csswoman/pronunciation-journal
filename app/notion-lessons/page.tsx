"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SubLesson } from "@/lib/notion/types";

export default function NotionLessonsIndexPage() {
  const [subLessons, setSubLessons] = useState<SubLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubLessons() {
      try {
        // Replace with your actual Notion page ID
        const pageId = process.env.NEXT_PUBLIC_NOTION_LESSONS_PAGE_ID;
        if (!pageId) {
          throw new Error("NEXT_PUBLIC_NOTION_LESSONS_PAGE_ID not set");
        }

        const response = await fetch(
          `/api/notion/lessons?pageId=${pageId}`,
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        const { data } = await response.json();
        setSubLessons(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load lessons",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchSubLessons();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--page-bg)]">
        <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--page-bg)]">
        <div className="text-center">
          <p className="text-error mb-4">{error}</p>
          <Link href="/" className="text-[var(--primary)] font-semibold">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)]">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-2 text-[var(--deep-text)]">
          Lessons
        </h1>
        <p className="text-[var(--text-secondary)] mb-12">
          Learn by exploring each lesson topic
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subLessons.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/notion-lessons/${lesson.slug}`}
              className="group block p-6 rounded-xl border border-[var(--line-divider)] bg-[var(--card-bg)] hover:border-[var(--primary)] transition-all duration-200 hover:shadow-md"
            >
              <h2 className="text-lg font-semibold text-[var(--deep-text)] group-hover:text-[var(--primary)] transition-colors">
                {lesson.title}
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-2">
                View lesson →
              </p>
            </Link>
          ))}
        </div>

        {subLessons.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[var(--text-secondary)]">
              No lessons found yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

