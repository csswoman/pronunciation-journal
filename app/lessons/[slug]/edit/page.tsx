"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTheoryLessonBySlug } from "@/lib/theory-lessons/queries";
import type { TheoryLesson } from "@/lib/types";
import LessonEditor from "@/components/lessons/LessonEditor";

export default function EditLessonPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [lesson, setLesson] = useState<TheoryLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    getTheoryLessonBySlug(slug)
      .then((data) => {
        if (!data) setError("Lesson not found");
        else setLesson(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--page-bg)" }}>
        <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--page-bg)" }}>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{error ?? "Lesson not found"}</p>
      </div>
    );
  }

  return <LessonEditor initialLesson={lesson} />;
}
