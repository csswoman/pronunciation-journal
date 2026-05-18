"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import LessonEditor from "@/components/lessons/LessonEditor";
import { getTheoryLessonById } from "@/lib/theory-lessons/queries";
import type { TheoryLesson } from "@/lib/types";

export default function EditLessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [lesson, setLesson] = useState<TheoryLesson | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading");

  useEffect(() => {
    getTheoryLessonById(id)
      .then((l) => {
        setLesson(l);
        setStatus(l ? "ready" : "notfound");
      })
      .catch(() => setStatus("notfound"));
  }, [id]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page-bg">
        <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "notfound" || !lesson) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-page-bg">
        <p className="text-lg font-semibold text-fg">Lesson not found</p>
        <Link href="/admin/lessons" className="text-sm text-[var(--primary)] underline underline-offset-2">
          Back to Lesson Manager
        </Link>
      </div>
    );
  }

  return <LessonEditor initialLesson={lesson} />;
}
