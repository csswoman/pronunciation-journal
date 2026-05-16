"use client";

import Link from "next/link";
import { BookOpen, Zap, ArrowRight } from "lucide-react";
import type { Lesson } from "@/lib/types";

interface Props {
  lesson: Lesson;
  progressPct?: number;
}

const DIFFICULTY_CLASSES = {
  easy: "bg-success-soft text-success border border-success-border",
  medium: "bg-warning-soft text-warning border border-warning-border",
  hard: "bg-error-soft text-error border border-error-border",
} as const;

const DIFFICULTY_LABEL = { easy: "Easy", medium: "Mid", hard: "Hard" } as const;

function extractIpa(title: string): string | null {
  const m = title.match(/^(\/[^/]+\/)/)
  return m ? m[1] : null
}

function displayTitle(title: string): string {
  return title.replace(/^\/[^/]+\/\s*[—–-]\s*/, "")
}

export function SoundLabLessonCard({ lesson, progressPct }: Props) {
  const { id, title, description, difficulty, words, exerciseCount, href } = lesson;
  const ipa = extractIpa(title);
  const label = displayTitle(title);
  const wordCount = words.length > 0 ? words.length : (exerciseCount ?? 0);
  const minutes = Math.max(2, Math.ceil(wordCount / 3));
  const isInProgress = progressPct !== undefined && progressPct > 0 && progressPct < 100;
  const isCompleted = progressPct === 100;
  const linkHref = href ?? `/practice/lesson/${id}`;

  return (
    <Link href={linkHref} className="group block">
      <article className="flex h-full flex-col gap-space-4 rounded-lg border border-border-subtle bg-surface-raised p-space-6 shadow-sm transition-all duration-[180ms] ease-out hover:-translate-y-[3px] hover:shadow-md hover:[border-color:color-mix(in_oklch,var(--primary)_30%,transparent)]">
        {/* Difficulty pill + IPA glyph */}
        <div className="flex items-start justify-between">
          <span className={`rounded-full px-space-3 py-space-1 text-tiny font-medium uppercase tracking-wider ${DIFFICULTY_CLASSES[difficulty]}`}>
            {DIFFICULTY_LABEL[difficulty]}
          </span>
          {ipa && (
            <span className="font-heading text-h3 leading-none text-primary opacity-50 transition-all duration-[180ms] ease-out group-hover:scale-105 group-hover:opacity-100">
              {ipa}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 font-heading text-h4 text-fg leading-snug">{label}</h3>

        {/* Description */}
        <p className="line-clamp-2 flex-1 text-body-sm text-fg-muted leading-relaxed">{description}</p>

        {/* Meta */}
        {wordCount > 0 && (
          <div className="flex items-center gap-space-4 text-caption text-fg-subtle">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {wordCount} words
            </span>
            <span aria-hidden>·</span>
            <span className="flex items-center gap-1">
              <Zap className="h-3.5 w-3.5" />
              {minutes} min
            </span>
          </div>
        )}

        {/* Status + progress bar */}
        <div className="space-y-1.5">
          {isCompleted ? (
            <span className="text-tiny uppercase tracking-wider text-success">Completed</span>
          ) : isInProgress ? (
            <>
              <span className="text-tiny uppercase tracking-wider text-fg-subtle">In progress</span>
              <div className="h-[4px] overflow-hidden rounded-full bg-primary-100">
                <div className="h-full rounded-full bg-primary" style={{ width: `${progressPct}%` }} />
              </div>
            </>
          ) : (
            <span className="text-tiny uppercase tracking-wider text-fg-subtle">Not started</span>
          )}
        </div>

        {/* CTA */}
        <div className="mt-auto flex justify-end">
          <span className="flex items-center gap-1 text-body-sm text-primary transition-all duration-150 group-hover:gap-2">
            {isCompleted ? "Review" : isInProgress ? "Continue" : "Start"}
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </article>
    </Link>
  );
}
