"use client";
// Planned structure:
// <CourseView>
//   <CourseViewHeader />
//   <LessonMarkdown />
// </CourseView>
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { H1 } from "@/components/ui/Typography";
import LessonMarkdown from "@/components/lessons/LessonMarkdown";
import { getTheoryLessonBySlug } from "@/lib/theory-lessons/queries";
import { LESSON_CATEGORIES } from "@/lib/types";
import type { TheoryLesson } from "@/lib/types";

export default function CourseView({ slug }: { slug: string }) {
  const [course, setCourse] = useState<TheoryLesson | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading");

  useEffect(() => {
    getTheoryLessonBySlug(slug)
      .then((c) => {
        setCourse(c);
        setStatus(c ? "ready" : "notfound");
      })
      .catch(() => setStatus("notfound"));
  }, [slug]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page-bg">
        <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "notfound" || !course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-page-bg">
        <p className="text-lg font-semibold text-fg">Course not found</p>
        <Link href="/courses" className="text-sm text-[var(--primary)] underline underline-offset-2">
          Back to all courses
        </Link>
      </div>
    );
  }

  const cat = LESSON_CATEGORIES.find((c) => c.value === course.category);

  return (
    <div className="min-h-screen bg-page-bg">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <nav className="flex items-center gap-1.5 text-sm mb-8">
          <Link
            href="/courses"
            className="text-fg-muted hover:text-fg underline-offset-2 hover:underline transition-colors"
          >
            Courses
          </Link>
          <span className="text-fg-subtle select-none">›</span>
          <span className="text-fg font-medium truncate">{course.title}</span>
        </nav>

        <article className="rounded-2xl border border-line-divider bg-card-bg overflow-hidden shadow-sm">
          <header className="relative h-56 flex flex-col justify-end bg-[var(--btn-regular-bg)]">
            {course.cover_image_url && (
              <Image
                src={course.cover_image_url}
                alt=""
                fill
                priority
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
            <div className="relative z-10 px-6 pb-5">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-tiny font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-overlay-light text-on-primary backdrop-blur-sm">
                  {cat?.label ?? course.category}
                </span>
                <span className="text-tiny font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-overlay-light text-on-primary backdrop-blur-sm">
                  {course.source === "notion" ? "Notes" : "Course"}
                </span>
              </div>
              <H1 className="text-h2 text-on-primary">{course.title}</H1>
              <p className="text-xs text-on-primary opacity-70 mt-1">
                Updated {new Date(course.updated_at).toLocaleDateString()}
              </p>
            </div>
          </header>

          <div className="px-6 py-8">
            <LessonMarkdown content={course.content} />
          </div>
        </article>
      </div>
    </div>
  );
}
