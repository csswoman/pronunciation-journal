"use client";

import Link from "next/link";
import { BookOpen, Zap } from "lucide-react";
import type { Lesson } from "@/lib/types";

interface Props {
  lesson: Lesson;
  progressPct?: number;
  isContinuing?: boolean;
  isWeak?: boolean;
}

const DIFFICULTY_CLASSES: Record<string, string> = {
  easy:   "bg-success-soft text-success-value",
  medium: "bg-warning-soft text-warning-value",
  hard:   "bg-error-soft   text-error-value",
};

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Easy",
  medium: "Mid",
  hard: "Hard",
};

function extractIpa(title: string): string | null {
  const m = title.match(/^(\/[^/]+\/)/);
  return m ? m[1] : null;
}

function displayTitle(title: string): string {
  return title.replace(/^\/[^/]+\/\s*[—–-]\s*/, "");
}

function buildPreview(lesson: Lesson): string {
  if (lesson.words.length > 0) {
    return lesson.words.slice(0, 3).map((w) => w.word).join(" · ");
  }
  return lesson.description;
}

function cellBg(isContinuing: boolean, isInProgress: boolean): string {
  if (isContinuing) return "bg-primary-100";
  if (isInProgress) return "bg-primary-50 hover:bg-primary-100";
  return "hover:bg-primary-50";
}

export function SoundLabLessonCard({ lesson, progressPct, isContinuing, isWeak }: Props) {
  const { id, title, difficulty, words, exerciseCount, href } = lesson;
  const ipa = extractIpa(title);
  const label = displayTitle(title);
  const wordCount = words.length > 0 ? words.length : (exerciseCount ?? 0);
  const minutes = Math.max(2, Math.ceil(wordCount / 3));
  const isInProgress = progressPct !== undefined && progressPct > 0 && progressPct < 100;
  const isCompleted = progressPct === 100;
  const linkHref = href ?? `/practice/lesson/${id}`;
  const preview = buildPreview(lesson);
  const showProgressBar = isInProgress || (isContinuing && progressPct !== undefined && progressPct > 0);

  return (
    <Link
      href={linkHref}
      className={[
        "group block",
        isCompleted && !isContinuing ? "opacity-60 transition-opacity hover:opacity-100" : "",
      ].join(" ")}
    >
      <article
        className={[
          "relative flex flex-col gap-space-2 overflow-hidden",
          "border-b border-r border-border-subtle",
          "cursor-pointer transition-colors duration-[150ms] ease-out",
          isInProgress ? "shadow-[inset_0_0_0_1.5px_var(--color-primary-200)]" : "",
          cellBg(!!isContinuing, isInProgress),
        ].join(" ")}
        style={{ padding: "14px 16px" }}
      >
        {/* Continuing left accent stripe */}
        {isContinuing && (
          <span className="pointer-events-none absolute bottom-0 left-0 top-0 w-1 bg-primary" />
        )}

        {/* Weak dot */}
        {isWeak && !isContinuing && (
          <span
            title="You've struggled here — extra practice recommended"
            className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-error"
          />
        )}

        {/* Row 1: Difficulty badge + IPA glyph */}
        <div className="flex items-start justify-between gap-space-2">
          <span
            className={`rounded-full px-[8px] py-1 text-[10px] font-medium ${DIFFICULTY_CLASSES[difficulty] ?? "bg-surface-sunken text-fg-muted"}`}
          >
            {DIFFICULTY_LABEL[difficulty] ?? difficulty}
          </span>
          {ipa && (
            <span
              aria-hidden
              className="font-heading text-h2 leading-none text-primary opacity-60 transition-all duration-[150ms] ease-out group-hover:scale-[1.05] group-hover:opacity-100"
            >
              {ipa}
            </span>
          )}
        </div>

        {/* Row 2: Title */}
        <h3 className="line-clamp-1 text-h4 leading-tight text-fg">{label}</h3>

        {/* Row 3: Example words */}
        <p className="truncate text-caption text-fg-muted">{preview}</p>

        {/* Row 4: Meta + status */}
        <div className="flex items-center gap-space-3 text-caption text-fg-subtle">
          {wordCount > 0 && (
            <>
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3 flex-shrink-0" />
                {wordCount}
              </span>
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3 flex-shrink-0" />
                {minutes}m
              </span>
            </>
          )}
          <span className="ml-auto">
            {isCompleted ? (
              <span className="rounded-full bg-success-soft px-space-2 py-0.5 text-tiny text-success">
                Done
              </span>
            ) : isInProgress ? (
              <span className="rounded-full bg-primary-100 px-space-2 py-0.5 text-tiny text-primary">
                {progressPct}%
              </span>
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-border-subtle" />
            )}
          </span>
        </div>

        {/* In-progress bottom strip: track + fill */}
        {showProgressBar && (
          <>
            <span aria-hidden className="absolute bottom-0 left-0 right-0 h-1 bg-primary/10" />
            <span
              aria-hidden
              className="absolute bottom-0 left-0 h-1 bg-primary"
              style={{ width: `${progressPct}%` }}
            />
          </>
        )}
      </article>
    </Link>
  );
}
