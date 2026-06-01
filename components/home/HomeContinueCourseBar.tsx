"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mic, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import { getAllTheoryLessons } from "@/lib/theory-lessons/queries";
import { LESSON_CATEGORIES, type TheoryLesson } from "@/lib/types";

function categoryLabel(category: TheoryLesson["category"]): string {
  return LESSON_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

export default function HomeContinueCourseBar() {
  const [course, setCourse] = useState<TheoryLesson | null>(null);

  useEffect(() => {
    getAllTheoryLessons()
      .then((all) => {
        const published = all.filter((l) => l.is_published);
        setCourse(published[0] ?? null);
      })
      .catch(() => setCourse(null));
  }, []);

  if (!course) return null;

  const progress = 0;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-4 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised px-5 py-5">
      <div
        className="grid h-[54px] w-[54px] shrink-0 place-items-center rounded-lg border text-2xl"
        style={{
          background: "var(--btn-soft-bg)",
          borderColor: "var(--accent-border)",
          color: "var(--primary)",
        }}
      >
        <Mic size={24} />
      </div>

      <div className="min-w-[200px] flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
          Continue your course
        </p>
        <p className="mt-0.5 font-semibold text-[var(--text-primary)]">{course.title}</p>
        <p
          className="text-[15px] text-[var(--primary)]"
          style={{ fontFamily: "var(--font-display), serif" }}
        >
          Next up · {categoryLabel(course.category)}
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <ProgressBar value={progress} color="var(--primary)" height="sm" className="w-[120px]" />
        <span
          className="tabular-nums text-[var(--primary)]"
          style={{ fontFamily: "var(--font-display), serif" }}
        >
          {progress}%
        </span>
      </div>

      <Link href={`/courses/library/${course.slug}`}>
        <Button variant="primary" size="sm" icon={<ArrowRight size={14} />} iconPosition="right">
          Continue
        </Button>
      </Link>
    </div>
  );
}
