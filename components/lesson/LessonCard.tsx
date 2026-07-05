"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Zap } from "lucide-react";
import type { Lesson } from "@/lib/types";
import { getAttemptsByLessonId } from "@/lib/db";
import DifficultyPill from "@/components/ui/DifficultyPill";

interface LessonCardProps {
  lesson: Lesson;
  progressPct?: number;
  isFeatured?: boolean;
}

function deriveLessonDescription(title: string, category: string): string {
  const t = title.toLowerCase();
  const c = category.toLowerCase();
  if (t.includes("greeting")) return "Learn how to greet people naturally and with confidence. Master the sounds that make first impressions count.";
  if (t.includes("common words") || c === "common-words") return "Practice the words English speakers use every day";
  if (t.includes("diphthong")) return "Train smooth vowel glides with clearer transitions";
  if (t.includes("vowel")) return "Hear and shape each vowel more clearly";
  if (t.includes("consonant")) return "Build cleaner consonants with precise mouth placement";
  if (t.includes("sound") || t.includes("phoneme") || c === "sounds") return "Focus on one sound and make it feel natural";
  if (t.includes("difficult")) return "Work through the sounds learners usually miss";
  return "Practice this lesson with clear, focused repetition";
}

function deriveWatermark(title: string): string {
  const phoneme = title.match(/\/([^/]+)\//);
  if (phoneme) return phoneme[1];
  const words = title.trim().split(/\s+/);
  return words[0].slice(0, 2).toUpperCase();
}

export default function LessonCard({ lesson, progressPct, isFeatured = false }: LessonCardProps) {
  const [derivedProgress, setDerivedProgress] = useState(0);

  useEffect(() => {
    if (progressPct != null) return;

    let alive = true;
    getAttemptsByLessonId(lesson.id)
      .then((attempts) => {
        if (!alive) return;
        if (lesson.words.length === 0) {
          setDerivedProgress(attempts.length > 0 ? 100 : 0);
          return;
        }
        const uniqueWords = new Set(attempts.map((a) => a.word.toLowerCase())).size;
        setDerivedProgress(Math.max(0, Math.min(100, Math.round((uniqueWords / lesson.words.length) * 100))));
      })
      .catch(() => { if (alive) setDerivedProgress(0); });

    return () => { alive = false; };
  }, [lesson.id, lesson.words.length, progressPct]);

  const barProgress = Math.max(0, Math.min(100, Math.round(progressPct ?? derivedProgress)));
  const lessonState = barProgress >= 100 ? "completed" : barProgress > 0 ? "in-progress" : "not-started";
  const ctaLabel = lessonState === "completed" ? "Review" : lessonState === "in-progress" ? "Continue" : "Start";

  const description = useMemo(
    () => deriveLessonDescription(lesson.title, lesson.category),
    [lesson.title, lesson.category]
  );

  const durationLabel = lesson.exerciseCount
    ? `${Math.max(3, lesson.exerciseCount)} min`
    : `${lesson.words.length > 5 ? Math.ceil(lesson.words.length / 3) : 3} min`;

  const watermark = useMemo(() => deriveWatermark(lesson.title), [lesson.title]);

  if (isFeatured) {
    return (
      <Link href={lesson.href ?? `/practice/sounds/sound/${lesson.id.replace("sound-", "")}`} className="block h-full">
        <div
          className="group relative flex h-full cursor-pointer flex-col gap-3 overflow-hidden rounded-[var(--radius-lg)] border border-[color-mix(in_srgb,var(--primary)_20%,transparent)] bg-[linear-gradient(135deg,var(--surface-raised)_60%,var(--primary-soft))] p-[var(--space-7,1.75rem)] transition-[border-color,box-shadow] hover:border-[color-mix(in_srgb,var(--primary)_40%,transparent)] hover:shadow-[var(--shadow-md)]"
        >
          {/* Radial glow corner */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-15 -top-15 h-[200px] w-[200px] bg-[radial-gradient(circle,color-mix(in_srgb,var(--primary)_10%,transparent)_0%,transparent_70%)]"
          />

          {/* Watermark */}
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-2.5 right-4 select-none text-[clamp(3rem,6vw,4.5rem)] leading-none text-[var(--primary)] opacity-10"
          >
            {watermark}
          </span>

          <DifficultyPill difficulty={lesson.difficulty} />

          <h2 className="m-0 text-[var(--font-h2)] leading-[1.2] text-[var(--text-primary)]">
            {lesson.title}
          </h2>

          <p className="flex-1 text-[var(--font-body-sm)] leading-[1.6] text-[var(--text-secondary)]">
            {description}
          </p>

          <div
            className="flex items-center gap-[var(--space-3)] text-[var(--font-caption)] text-[var(--text-tertiary)]"
          >
            <span className="flex items-center gap-1">
              <BookOpen size={12} />
              {lesson.words.length} words
            </span>
            <span className="flex items-center gap-1">
              <Zap size={12} />
              {durationLabel}
            </span>
          </div>

          <p className="text-[var(--font-caption)] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
            {lessonState === "not-started" ? "Not started" : `${barProgress}%`}
          </p>

          <button type="button" className="mt-auto inline-flex items-center gap-[var(--space-2)] self-start rounded-full border-none bg-[var(--primary)] px-[var(--space-5)] h-11 font-semibold text-[var(--font-body-sm)] text-[var(--on-primary)] cursor-pointer transition-opacity hover:opacity-85">
            {ctaLabel} Lesson →
          </button>
        </div>
      </Link>
    );
  }

  return (
    <Link href={lesson.href ?? `/practice/sounds/sound/${lesson.id.replace("sound-", "")}`} className="block h-full">
      <div
        className="group flex h-full cursor-pointer flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-[var(--space-5)] transition-[border-color,background] hover:border-[var(--border-default)]"
      >
        <DifficultyPill difficulty={lesson.difficulty} />

        <h3 className="m-0 text-[var(--font-h4)] leading-[1.3] text-[var(--text-primary)]">
          {lesson.title}
        </h3>

        <p className="flex-1 overflow-hidden text-[var(--font-body-sm)] leading-[1.5] text-[var(--text-secondary)] line-clamp-2">
          {description}
        </p>

        <div className="flex items-center gap-[var(--space-3)] text-[var(--font-caption)] text-[var(--text-tertiary)]">
          <span className="flex items-center gap-1">
            <BookOpen size={12} />
            {lesson.words.length} words
          </span>
          <span className="flex items-center gap-1">
            <Zap size={12} />
            {durationLabel}
          </span>
        </div>

        <p className="text-[var(--font-caption)] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
          {lessonState === "not-started" ? "Not started" : `${barProgress}%`}
        </p>

        <div className="mt-auto flex justify-start">
          <span className="text-[var(--font-caption)] font-medium text-[var(--primary)]">
            {ctaLabel} →
          </span>
        </div>
      </div>
    </Link>
  );
}
