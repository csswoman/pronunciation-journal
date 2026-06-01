"use client";
// Planned structure:
// <CourseView>
//   <CourseTopBar />        (breadcrumb + actions, sticky)
//   <CourseHero />          (background image + title)
//   <Layout>                (2-col on lg: article + sidebar)
//     <LessonMarkdown />
//     <CourseTocSidebar />
//   </Layout>
// </CourseView>

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import LessonMarkdown from "@/components/lessons/LessonMarkdown";
import CourseTopBar from "@/components/courses/CourseTopBar";
import CourseHero from "@/components/courses/CourseHero";
import CourseTocSidebar from "@/components/courses/CourseTocSidebar";
import { getContentMetrics } from "@/components/courses/courseContentHelpers";
import { getTheoryLessonBySlug } from "@/lib/theory-lessons/queries";
import { LESSON_CATEGORIES } from "@/lib/types";
import type { TheoryLesson } from "@/lib/types";

export default function CourseView({ slug }: { slug: string }) {
  const [course, setCourse] = useState<TheoryLesson | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading");
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    getTheoryLessonBySlug(slug)
      .then((c) => {
        setCourse(c);
        setStatus(c ? "ready" : "notfound");
      })
      .catch(() => setStatus("notfound"));
  }, [slug]);

  const metrics = useMemo(
    () => getContentMetrics(course?.content ?? ""),
    [course?.content]
  );

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
      <CourseTopBar
        title={course.title}
        isCompleted={isCompleted}
        onMarkComplete={() => setIsCompleted((v) => !v)}
      />

      <div
        className="mx-auto"
        style={{
          maxWidth: "1180px",
          padding: "var(--space-4) clamp(var(--space-5), 6vw, var(--space-10)) var(--space-12)",
        }}
      >
        <CourseHero
          title={course.title}
          category={course.category}
          categoryLabel={cat?.label}
          updatedAt={course.updated_at}
          dek={metrics.dek}
          readTimeMin={metrics.readTimeMin}
          wordCount={metrics.wordCount}
        />

        <div
          className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px]"
          style={{
            gap: "clamp(var(--space-6), 5vw, var(--space-12))",
            alignItems: "start",
            marginTop: "var(--space-10)",
          }}
        >
          <article className="min-w-0">
            <LessonMarkdown content={course.content} />
          </article>

          <CourseTocSidebar
            toc={metrics.toc}
            wordCount={metrics.wordCount}
            readTimeMin={metrics.readTimeMin}
          />
        </div>
      </div>
    </div>
  );
}
