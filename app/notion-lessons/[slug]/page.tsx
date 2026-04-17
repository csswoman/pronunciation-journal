"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { NotionRenderer } from "react-notion-x";
import type { ExtendedRecordMap } from "notion-types";
import { SubLesson } from "@/lib/notion/types";
import "@/styles/notion-custom.css";

export default function SubLessonPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [subLesson, setSubLesson] = useState<SubLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allSubLessons, setAllSubLessons] = useState<SubLesson[]>([]);

  useEffect(() => {
    async function fetchSubLesson() {
      try {
        const pageId = process.env.NEXT_PUBLIC_NOTION_LESSONS_PAGE_ID;
        if (!pageId) {
          throw new Error("NEXT_PUBLIC_NOTION_LESSONS_PAGE_ID not set");
        }

        // Fetch all sub-lessons from the page
        const response = await fetch(`/api/notion/lessons?pageId=${pageId}`);
        if (!response.ok) throw new Error("Failed to fetch lessons");

        const { data } = await response.json();
        setAllSubLessons(data);

        // Find the one matching the slug
        const found = data.find(
          (lesson: SubLesson) => lesson.slug === slug,
        );
        if (!found) {
          setError("Lesson not found");
          return;
        }

        setSubLesson(found);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load lesson",
        );
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchSubLesson();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--page-bg)]">
        <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !subLesson) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--page-bg)] gap-4">
        <p className="text-[var(--text-secondary)]">
          {error ?? "Lesson not found"}
        </p>
        <Link href="/notion-lessons" className="text-[var(--primary)] font-semibold">
          Back to lessons
        </Link>
      </div>
    );
  }

  // Navigation between sub-lessons
  const currentIndex = allSubLessons.findIndex((l) => l.id === subLesson.id);
  const prevLesson =
    currentIndex > 0 ? allSubLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allSubLessons.length - 1
      ? allSubLessons[currentIndex + 1]
      : null;

  return (
    <div className="min-h-screen bg-[var(--page-bg)]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/notion-lessons"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--deep-text)] transition-colors mb-6"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          All Lessons
        </Link>

        {/* Header */}
        <header className="mb-12 border-b border-[var(--line-divider)] pb-8">
          <h1 className="text-4xl font-bold text-[var(--deep-text)] mb-2">
            {subLesson.title}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Updated {new Date(subLesson.updatedAt).toLocaleDateString()}
          </p>
        </header>

        {/* Content rendered with react-notion-x */}
        <article className="prose prose-invert max-w-none mb-12">
          <NotionRenderer
            recordMap={{
              collection: {},
              collection_view: {},
              notion_user: {},
              collection_query: {},
              signed_urls: {},
              block: {
                [subLesson.id]: {
                  role: "reader",
                  value: {
                    id: subLesson.id,
                    type: "page",
                    properties: {},
                    created_time: subLesson.createdAt.toISOString(),
                    last_edited_time: subLesson.updatedAt.toISOString(),
                    parent_id: subLesson.parentPageId,
                    archived: false,
                  },
                },
                ...subLesson.content.reduce(
                  (acc, block) => {
                    acc[block.id] = {
                      role: "reader",
                      value: block,
                    };
                    return acc;
                  },
                  {} as Record<string, { role: "reader"; value: unknown }>,
                ),
              },
            } as unknown as ExtendedRecordMap}
            rootPageId={subLesson.id}
          />
        </article>

        {/* Navigation */}
        <nav className="flex items-center justify-between gap-4 border-t border-[var(--line-divider)] pt-8 mt-12">
          {prevLesson ? (
            <Link
              href={`/notion-lessons/${prevLesson.slug}`}
              className="flex-1 px-4 py-3 rounded-lg border border-[var(--line-divider)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--btn-plain-bg-hover)] transition-colors text-left"
            >
              <span className="text-xs text-[var(--text-tertiary)] block mb-1">
                Previous
              </span>
              {prevLesson.title}
            </Link>
          ) : (
            <div className="flex-1" />
          )}

          {nextLesson ? (
            <Link
              href={`/notion-lessons/${nextLesson.slug}`}
              className="flex-1 px-4 py-3 rounded-lg border border-[var(--line-divider)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--btn-plain-bg-hover)] transition-colors text-right"
            >
              <span className="text-xs text-[var(--text-tertiary)] block mb-1">
                Next
              </span>
              {nextLesson.title}
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </nav>
      </div>
    </div>
  );
}
