"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { Course } from "@/lib/notion/types";
import ProgressBar from "@/components/ui/ProgressBar";
import Badge, { BadgeColor } from "@/components/ui/Badge";

type CourseCardModel = Course & {
  completedLessons?: number;
};

type CourseCardProps = {
  course: CourseCardModel;
  priority?: boolean;
};

const levelBadge: Record<string, { label: string; color: BadgeColor }> = {
  basic:        { label: "Basic",        color: "emerald" },
  intermediate: { label: "Intermediate", color: "amber"   },
  advanced:     { label: "Advanced",     color: "red"     },
};

const coverHues = [250, 180, 310, 60, 25];

const illustrationFiles = [
  "/illustrations/lesson/brain.svg",
  "/illustrations/lesson/headset.svg",
  "/illustrations/lesson/jigsaw.svg",
  "/illustrations/lesson/mic.svg",
  "/illustrations/lesson/paper.svg",
  "/illustrations/lesson/sound.svg",
  "/illustrations/lesson/voice.svg",
];

function getCourseIllustration(title: string) {
  return illustrationFiles[title.length % illustrationFiles.length];
}

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

export default function CourseCard({ course, priority = false }: CourseCardProps) {
  const [coverFailed, setCoverFailed] = useState(false);
  const totalLessons = course.lessonCount ?? 0;
  const completedLessons = course.completedLessons ?? 0;
  const progress = getProgress(totalLessons, completedLessons);
  const ctaLabel = getCtaLabel(totalLessons, completedLessons);
  const levelKey = (course.level ?? "basic").toLowerCase();
  const level = levelBadge[levelKey] ?? levelBadge.basic;
  const coverHue = getCoverHue(course.title);
  const illustration = getCourseIllustration(course.title);
  const isCompleted = ctaLabel === "Completed";
  const isInProgress = completedLessons > 0 && !isCompleted;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col h-full w-full rounded-xl border border-border-subtle bg-surface-raised overflow-hidden transition-all duration-200 hover:border-border-default hover:-translate-y-px"
    >
      {/* Cover */}
      <div
        className="relative h-36 w-full overflow-hidden shrink-0"
        style={{
          background: `linear-gradient(135deg, oklch(.55 .18 ${coverHue}) 0%, oklch(.65 .14 ${(coverHue + 40) % 360}) 100%)`,
        }}
      >
        {/* Level badge */}
        <Badge label={level.label} color={level.color} className="absolute top-2 left-2 z-10" />

        {course.coverImageUrl && !coverFailed ? (
          <Image
            src={course.coverImageUrl}
            alt=""
            fill
            priority={priority}
            unoptimized
            onError={() => setCoverFailed(true)}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,oklch(1_0_0_/_0.12),transparent_60%)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src={illustration}
                alt=""
                width={80}
                height={80}
                className="opacity-90 drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col">
        <p className="font-semibold text-sm text-fg mt-3 px-3 leading-snug">
          {course.title}
        </p>

        {course.description && (
          <p className="text-xs text-fg-muted leading-relaxed px-3 mt-1 line-clamp-2">
            {course.description}
          </p>
        )}

        {totalLessons > 0 && (isInProgress || isCompleted) && (
          <div className="px-3 mt-2">
            <ProgressBar
              value={progress}
              color={isCompleted ? "var(--success)" : "var(--primary)"}
              height="xs"
              showLabel
            />
          </div>
        )}

        <p className="text-xs text-fg-subtle px-3 mt-auto pt-2 pb-1 flex items-center gap-1">
          <BookOpen size={11} className="opacity-70 shrink-0" />
          {totalLessons} lessons
        </p>

        <span
          className="text-xs font-medium px-3 pb-3 transition-all duration-150 group-hover:gap-1.5 inline-flex items-center gap-1"
          style={{ color: isCompleted ? "var(--success)" : "var(--primary)" }}
        >
          {ctaLabel}
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </span>
      </div>
    </Link>
  );
}
