"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LessonMarkdown from "@/components/lessons/LessonMarkdown";
import Button from "@/components/ui/Button";
import { getTheoryLessonBySlug } from "@/lib/theory-lessons/queries";
import type { TheoryLesson } from "@/lib/types";
import { markLessonIncomplete, isLessonComplete } from "@/lib/db";
import { recordLessonComplete } from "@/lib/practice/queries";
import type { CoursePathTrackId } from "@/lib/courses/types";

interface CourseLessonViewProps {
  slug: string;
  levelId?: CoursePathTrackId;
  lessonId?: string;
}

export default function CourseLessonView({ slug, levelId, lessonId }: CourseLessonViewProps) {
  const [lesson, setLesson] = useState<TheoryLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    getTheoryLessonBySlug(slug)
      .then(setLesson)
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (levelId && lessonId) {
      isLessonComplete(levelId, lessonId).then(setCompleted);
    }
  }, [levelId, lessonId]);

  const handleToggleComplete = async () => {
    if (!levelId || !lessonId) return;
    setMarking(true);
    try {
      if (completed) {
        await markLessonIncomplete(levelId, lessonId);
        setCompleted(false);
      } else {
        await recordLessonComplete(levelId, lessonId);
        setCompleted(true);
      }
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-fg-subtle text-sm">Cargando lección…</div>
    );
  }

  if (!lesson) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <p className="text-lg font-semibold text-fg">Lección no encontrada</p>
        <Link href="/courses" className="text-sm text-primary underline underline-offset-2 mt-4 inline-block">
          Volver a la ruta
        </Link>
      </div>
    );
  }

  return (
    <div className="course-path">
      <div className="course-path__lesson-wrap">
        <header className="course-path__lesson-hero">
          <Link
            href="/courses"
            className="course-path__eyebrow inline-block mb-4 hover:text-fg transition-colors"
          >
            ← Ruta de aprendizaje
          </Link>
          <h1 className="course-path__title course-path__title--lesson">
            {lesson.title}
          </h1>
        </header>

        <article className="rounded-xl border border-border-subtle bg-surface-raised p-6 md:p-8">
          <LessonMarkdown content={lesson.content} />
        </article>

        <div className="mt-8 flex flex-wrap gap-3 items-center">
          {levelId && lessonId && (
            <Button
              variant={completed ? "secondary" : "primary"}
              size="md"
              onClick={handleToggleComplete}
              disabled={marking}
            >
              {marking
                ? "Guardando…"
                : completed
                ? "Completada — desmarcar"
                : "Marcar como completada"}
            </Button>
          )}
          <Link href="/courses" className="course-path__back-btn">
            Volver a la ruta
          </Link>
        </div>
      </div>
    </div>
  );
}
