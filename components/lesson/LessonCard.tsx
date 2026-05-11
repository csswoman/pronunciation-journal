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
  const phoneme = title.match(/\/([^/]+)\//)
  if (phoneme) return phoneme[1]
  const words = title.trim().split(/\s+/)
  return words[0].slice(0, 2).toUpperCase()
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
      <Link href={lesson.href ?? `/practice/lesson/${lesson.id}`} className="block h-full">
        <div
          className="group flex flex-col h-full cursor-pointer"
          style={{
            position: "relative",
            background: "linear-gradient(135deg, var(--surface-raised) 60%, var(--primary-soft))",
            border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-7, 1.75rem)",
            gap: "var(--space-3)",
            overflow: "hidden",
            transition: `border-color var(--transition-fast), box-shadow var(--transition-fast)`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "color-mix(in srgb, var(--primary) 40%, transparent)";
            e.currentTarget.style.boxShadow = "var(--shadow-md)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "color-mix(in srgb, var(--primary) 20%, transparent)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {/* Radial glow corner */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "-60px",
              right: "-60px",
              width: "200px",
              height: "200px",
              background: "radial-gradient(circle, color-mix(in srgb, var(--primary) 10%, transparent) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Watermark */}
          <span
            aria-hidden
            style={{
              position: "absolute",
              bottom: "-10px",
              right: "16px",
              font: "var(--font-h1, 700 3.5rem/1 var(--font-family))",
              fontSize: "clamp(3rem, 6vw, 4.5rem)",
              color: "var(--primary)",
              opacity: 0.1,
              userSelect: "none",
              pointerEvents: "none",
              lineHeight: 1,
            }}
          >
            {watermark}
          </span>

          <DifficultyPill difficulty={lesson.difficulty} />

          <h2 style={{ font: "var(--font-h2)", color: "var(--text-primary)", lineHeight: 1.2, margin: 0 }}>
            {lesson.title}
          </h2>

          <p style={{ font: "var(--font-body-sm)", color: "var(--text-secondary)", lineHeight: 1.6, flex: 1 }}>
            {description}
          </p>

          <div
            className="flex items-center"
            style={{ font: "var(--font-caption)", color: "var(--text-tertiary)", gap: "var(--space-3)" }}
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

          <p style={{ font: "var(--font-caption)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {lessonState === "not-started" ? "Not started" : `${barProgress}%`}
          </p>

          <button
            type="button"
            style={{
              marginTop: "auto",
              alignSelf: "flex-start",
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-2)",
              background: "var(--primary)",
              color: "var(--on-primary)",
              borderRadius: "var(--radius-full)",
              height: "44px",
              padding: "0 var(--space-5)",
              font: "var(--font-body-sm)",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              transition: `opacity var(--transition-fast)`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {ctaLabel} Lesson →
          </button>
        </div>
      </Link>
    );
  }

  return (
    <Link href={lesson.href ?? `/practice/lesson/${lesson.id}`} className="block h-full">
      <div
        className="group flex flex-col h-full cursor-pointer"
        style={{
          background: "var(--surface-raised)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-5)",
          gap: "var(--space-3)",
          transition: `border-color var(--transition-fast), background var(--transition-fast)`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--border-default)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border-subtle)";
        }}
      >
        <DifficultyPill difficulty={lesson.difficulty} />

        <h3 style={{ font: "var(--font-h4)", color: "var(--text-primary)", lineHeight: 1.3, margin: 0 }}>
          {lesson.title}
        </h3>

        <p
          style={{
            font: "var(--font-body-sm)",
            color: "var(--text-secondary)",
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
            flex: 1,
          }}
        >
          {description}
        </p>

        <div
          className="flex items-center"
          style={{ font: "var(--font-caption)", color: "var(--text-tertiary)", gap: "var(--space-3)" }}
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

        <p style={{ font: "var(--font-caption)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {lessonState === "not-started" ? "Not started" : `${barProgress}%`}
        </p>

        <div className="flex justify-start" style={{ marginTop: "auto" }}>
          <span
            style={{
              font: "var(--font-caption)",
              fontWeight: 500,
              color: "var(--primary)",
            }}
          >
            {ctaLabel} →
          </span>
        </div>
      </div>
    </Link>
  );
}
