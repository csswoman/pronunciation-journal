"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Lesson } from "@/lib/types";
import { getAttemptsByLessonId } from "@/lib/db";

interface LessonCardProps {
  lesson: Lesson;
  progressPct?: number;
}

const difficultyConfig = {
  easy: {
    label: "Easy",
    borderColor: "color-mix(in oklch, var(--admonitions-color-tip) 22%, var(--line-divider) 78%)",
    textColor: "var(--text-tertiary)",
  },
  medium: {
    label: "Mid",
    borderColor: "color-mix(in oklch, var(--admonitions-color-warning) 22%, var(--line-divider) 78%)",
    textColor: "var(--text-tertiary)",
  },
  hard: {
    label: "Hard",
    borderColor: "color-mix(in oklch, var(--admonitions-color-caution) 22%, var(--line-divider) 78%)",
    textColor: "var(--text-tertiary)",
  },
};

type LessonVisualFamily =
  | "basics"
  | "vowels"
  | "consonants"
  | "diphthongs"
  | "phoneme"
  | "vocabulary"
  | "general";

const lessonIconMap: Record<LessonVisualFamily, string[]> = {
  basics: ["paper", "headset", "voice"],
  vowels: ["ae", "ab", "voice"],
  consonants: ["mic", "sound", "headset"],
  diphthongs: ["ae", "voice", "sound"],
  phoneme: ["sound", "mic", "voice"],
  vocabulary: ["brain", "jigsaw", "paper"],
  general: ["paper", "headset", "brain"],
};

const iconSizes = [72, 80, 88] as const;
const iconRotations = [-24, -16, -10, 8] as const;

const pillStyle = {
  color: "var(--text-tertiary)",
  borderColor: "var(--line-divider)",
  backgroundColor: "color-mix(in oklch, var(--text-primary) 3%, transparent)",
} as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function detectLessonVisualFamily(lesson: Lesson): LessonVisualFamily {
  const title = lesson.title.toLowerCase();
  const category = lesson.category.toLowerCase();
  const combined = `${lesson.id} ${title} ${category}`;

  if (combined.includes("diphthong")) return "diphthongs";
  if (combined.includes("vowel")) return "vowels";
  if (
    combined.includes("fricative") ||
    combined.includes("consonant") ||
    combined.includes("th") ||
    combined.includes("r sound") ||
    combined.includes("l sound")
  ) return "consonants";
  if (
    combined.includes("sound") ||
    combined.includes("phoneme") ||
    lesson.id.startsWith("sound-") ||
    category === "sounds" ||
    category === "patterns"
  ) return "phoneme";
  if (
    category === "common-words" ||
    combined.includes("word") ||
    combined.includes("vocabulary")
  ) return "vocabulary";
  if (category === "basics" || combined.includes("greeting")) return "basics";

  return "general";
}

function deriveLessonDescription(title: string, category: string): string {
  const t = title.toLowerCase();
  const c = category.toLowerCase();
  if (t.includes("greeting")) return "Learn how to greet people naturally";
  if (t.includes("common words") || c === "common-words") return "Practice the words English speakers use every day";
  if (t.includes("diphthong")) return "Train smooth vowel glides with clearer transitions";
  if (t.includes("vowel")) return "Hear and shape each vowel more clearly";
  if (t.includes("consonant")) return "Build cleaner consonants with precise mouth placement";
  if (t.includes("sound") || t.includes("phoneme") || c === "sounds") return "Focus on one sound and make it feel natural";
  if (t.includes("difficult")) return "Work through the sounds learners usually miss";
  return "Practice this lesson with clear, focused repetition";
}

function MetadataPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium border"
      style={pillStyle}
    >
      {children}
    </span>
  );
}

export default function LessonCard({ lesson, progressPct }: LessonCardProps) {
  const config = difficultyConfig[lesson.difficulty];
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
        const pct = Math.round((uniqueWords / lesson.words.length) * 100);
        setDerivedProgress(Math.max(0, Math.min(100, pct)));
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

  const iconVisual = useMemo(() => {
    const family = detectLessonVisualFamily(lesson);
    const seed = hashString(`${lesson.id}-${lesson.title}`);
    const icons = lessonIconMap[family];
    const iconName = icons[seed % icons.length];
    const iconName2 = icons[(seed + 1) % icons.length];

    return {
      iconSrc: `/illustrations/lesson/${iconName}.svg`,
      iconSrc2: `/illustrations/lesson/${iconName2}.svg`,
      size: iconSizes[seed % iconSizes.length] + 96,
      size2: iconSizes[(seed + 1) % iconSizes.length] + 48,
      rotation: iconRotations[seed % iconRotations.length],
      rotation2: iconRotations[(seed + 2) % iconRotations.length] * -1,
    };
  }, [lesson.id, lesson.title]);

  return (
    <Link href={lesson.href ?? `/practice/lesson/${lesson.id}`}>
      <div
        className="group relative cursor-pointer overflow-hidden rounded-[28px] border p-7 transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--line-divider)",
          minHeight: "260px",
          boxShadow: "0 2px 12px color-mix(in oklch, var(--text-primary) 3%, transparent)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{
            boxShadow: "0 0 0 1px color-mix(in oklch, var(--color-accent) 25%, transparent), 0 12px 32px color-mix(in oklch, var(--color-accent) 7%, transparent)",
          }}
        />

        <div
          className="pointer-events-none absolute -right-10 -bottom-10 z-0 rounded-full blur-3xl transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 group-hover:opacity-100"
          style={{
            width: "180px",
            height: "180px",
            opacity: 0.04,
            background: "radial-gradient(circle, var(--color-accent) 0%, transparent 70%)",
          }}
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-14 -top-6 z-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1.5"
          style={{
            width: `${iconVisual.size2}px`,
            height: `${iconVisual.size2}px`,
            opacity: 0.03,
            transform: `rotate(${iconVisual.rotation2}deg)`,
            backgroundColor: "var(--color-accent)",
            WebkitMaskImage: `url(${iconVisual.iconSrc2})`,
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            WebkitMaskSize: "contain",
            maskImage: `url(${iconVisual.iconSrc2})`,
            maskRepeat: "no-repeat",
            maskPosition: "center",
            maskSize: "contain",
          }}
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 -bottom-4 z-0 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-2 group-hover:opacity-[0.10]"
          style={{
            width: `${iconVisual.size}px`,
            height: `${iconVisual.size}px`,
            opacity: 0.07,
            transform: `rotate(${iconVisual.rotation}deg)`,
            backgroundColor: "var(--color-accent)",
            WebkitMaskImage: `url(${iconVisual.iconSrc})`,
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            WebkitMaskSize: "contain",
            maskImage: `url(${iconVisual.iconSrc})`,
            maskRepeat: "no-repeat",
            maskPosition: "center",
            maskSize: "contain",
          }}
        />

        <div className="relative z-10 flex flex-col h-full">
          <div className="mb-5 flex items-center justify-between gap-4">
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] border"
              style={{
                backgroundColor: "transparent",
                color: config.textColor,
                borderColor: config.borderColor,
              }}
            >
              {config.label}
            </span>

            {lessonState === "completed" && (
              <span
                className="flex items-center gap-1 text-[11px] font-medium"
                style={{ color: "var(--text-tertiary)" }}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Done
              </span>
            )}
          </div>

          <h3
            className="mb-2 text-[1.2rem] font-bold leading-snug tracking-[-0.025em]"
            style={{ color: "var(--text-primary)" }}
          >
            {lesson.title}
          </h3>

          <p
            className="mb-5 max-w-[22ch] text-sm leading-relaxed line-clamp-2"
            style={{ color: "var(--text-secondary)" }}
          >
            {description}
          </p>

          <div className="flex items-center gap-2 mb-6">
            <MetadataPill>
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {lesson.words.length} words
            </MetadataPill>
            <MetadataPill>
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {durationLabel}
            </MetadataPill>
          </div>

          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-[11px] font-medium tracking-[0.06em]"
                style={{ color: "var(--text-tertiary)" }}
              >
                {lessonState === "not-started" ? "Not started" : "Progress"}
              </span>
              {lessonState !== "not-started" && (
                <span
                  className="text-[11px] font-semibold tabular-nums"
                  style={{ color: "var(--color-accent)" }}
                >
                  {barProgress}%
                </span>
              )}
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: "color-mix(in oklch, var(--text-tertiary) 18%, transparent)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  backgroundColor: "var(--color-accent)",
                  width: `${barProgress}%`,
                  boxShadow: barProgress > 0 ? "0 0 8px color-mix(in oklch, var(--color-accent) 50%, transparent)" : "none",
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-auto">
            <span
              className="text-[11px] font-medium"
              style={{ color: "var(--text-tertiary)" }}
            >
              {lessonState === "completed"
                ? "Keep it fresh"
                : lessonState === "in-progress"
                  ? "Pick up where you left off"
                  : "Short focused practice"}
            </span>

            <span
              className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-[background-color,opacity] duration-200"
              style={{
                backgroundColor: "var(--color-accent)",
                color: "var(--color-text-on-accent)",
              }}
            >
              {ctaLabel}
              <svg
                className="w-3 h-3 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
