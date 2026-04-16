"use client";

import Image from "next/image";
import Link from "next/link";
import type { Course } from "@/lib/notion/types";

type CourseCardModel = Course & {
  completedLessons?: number;
};

type CourseCardProps = {
  course: CourseCardModel;
};

const levelConfig: Record<string, { label: string; hue: number }> = {
  basic: { label: "Basic", hue: 150 },
  intermediate: { label: "Intermediate", hue: 60 },
  advanced: { label: "Advanced", hue: 15 },
};

const coverHues = [250, 180, 310, 60, 25];

function getProgress(totalLessons: number, completedLessons: number) {
  if (totalLessons <= 0) return 0;
  return Math.min(100, Math.round((completedLessons / totalLessons) * 100));
}

function getCtaLabel(totalLessons: number, completedLessons: number) {
  if (totalLessons > 0 && completedLessons >= totalLessons) return "Completed";
  if (completedLessons > 0) return "Continue";
  return "Start";
}

function getCoverHue(title: string) {
  return coverHues[title.length % coverHues.length];
}

export default function CourseCard({ course }: CourseCardProps) {
  const totalLessons = course.lessonCount ?? 0;
  const completedLessons = course.completedLessons ?? 0;
  const progress = getProgress(totalLessons, completedLessons);
  const ctaLabel = getCtaLabel(totalLessons, completedLessons);
  const levelKey = (course.level ?? "basic").toLowerCase();
  const level = levelConfig[levelKey] ?? levelConfig.basic;
  const coverHue = getCoverHue(course.title);
  const isCompleted = ctaLabel === "Completed";
  const isInProgress = completedLessons > 0 && !isCompleted;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col rounded-2xl border border-[var(--line-divider)] bg-[var(--card-bg)] shadow-[0_1px_3px_var(--line-divider)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_var(--line-color)] hover:border-[var(--line-color)] overflow-hidden"
    >
      {/* Cover */}
      <div className="relative overflow-hidden">
        <div
          className="relative h-44 w-full"
          style={{
            background: `linear-gradient(135deg, oklch(.55 .18 ${coverHue}) 0%, oklch(.65 .14 ${(coverHue + 40) % 360}) 100%)`,
          }}
        >
          {course.coverImageUrl ? (
            <>
              <Image
                src={course.coverImageUrl}
                alt={course.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_50%)]" />
          )}

          {/* Badges overlay */}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white ring-1 ring-white/20"
              style={{
                background: `oklch(.4 .15 ${level.hue} / 0.85)`,
                backdropFilter: "blur(8px)",
              }}
            >
              {level.label}
            </span>
            <span className="rounded-full bg-black/30 px-2.5 py-0.5 text-[11px] font-medium text-white/90 backdrop-blur-sm ring-1 ring-white/10">
              {totalLessons} lessons
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex-1 space-y-1.5">
          <h2 className="text-[15px] font-semibold leading-snug text-[var(--deep-text)] group-hover:text-[var(--primary)] transition-colors duration-200">
            {course.title}
          </h2>
          {course.description ? (
            <p className="line-clamp-2 text-[13px] leading-5 text-[var(--text-secondary)]">
              {course.description}
            </p>
          ) : null}
        </div>

        {/* Progress */}
        {totalLessons > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
              <span>{isCompleted ? "Completed" : isInProgress ? "In progress" : "Not started"}</span>
              <span>{completedLessons}/{totalLessons}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--btn-regular-bg)]">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${progress}%`,
                  background: isCompleted
                    ? `oklch(.65 .14 150)`
                    : `linear-gradient(to right, var(--primary), oklch(.65 .14 ${(coverHue + 60) % 360}))`,
                }}
              />
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="flex items-center justify-between border-t border-[var(--line-divider)] pt-3">
          <span
            className="text-[13px] font-semibold transition-colors duration-200"
            style={{ color: isCompleted ? `oklch(.6 .13 150)` : `var(--primary)` }}
          >
            {ctaLabel}
          </span>
          <span className="text-[var(--text-tertiary)] transition-all duration-300 group-hover:translate-x-1 group-hover:text-[var(--primary)]">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
