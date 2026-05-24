"use client";

import Link from "next/link";
import { RotateCw, Clock } from "lucide-react";
import type { Lesson } from "@/lib/types";

interface Props {
  lesson: Lesson;
  progressPct?: number;
  isContinuing?: boolean;
  isWeak?: boolean;
  category?: string;
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
  const m = title.match(/^\/([^/]+)\//);
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

export function SoundLabLessonCard({ lesson, progressPct, isContinuing, isWeak, category }: Props) {
  const { id, title, difficulty, words, exerciseCount, href } = lesson;
  const ipaSymbol = extractIpa(title);
  const label = displayTitle(title);
  const wordCount = words.length > 0 ? words.length : (exerciseCount ?? 0);
  const minutes = Math.max(2, Math.ceil(wordCount / 3));
  const isInProgress = progressPct !== undefined && progressPct > 0 && progressPct < 100;
  const isCompleted = progressPct === 100;
  const linkHref = href ?? `/practice/sounds/sound/${id.replace("sound-", "")}`;
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
          "relative flex flex-col gap-space-3 overflow-hidden rounded-xl p-space-5",
          "bg-surface border border-border-subtle",
          "shadow-sm cursor-pointer transition-shadow duration-[150ms] ease-out hover:shadow-md",
          isContinuing ? "ring-2 ring-primary ring-offset-1" : "",
        ].join(" ")}
      >
        {/* Weak dot */}
        {isWeak && !isContinuing && (
          <span
            title="You've struggled here — extra practice recommended"
            className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-error"
          />
        )}

        {/* Row 1: Difficulty badge */}
        <div>
          <span
            className={`inline-block rounded-md px-[8px] py-space-1 text-[10px] font-semibold uppercase tracking-wider ${DIFFICULTY_CLASSES[difficulty] ?? "bg-surface-sunken text-fg-muted"}`}
          >
            {DIFFICULTY_LABEL[difficulty] ?? difficulty}
          </span>
        </div>

        {/* Row 2: IPA glyph with thin slashes + category label */}
        <div className="flex flex-col gap-space-1">
          {ipaSymbol && (
            <p
              aria-hidden
              className="flex items-baseline gap-space-1 leading-none transition-transform duration-[150ms] ease-out group-hover:scale-[1.04]"
            >
              <span className="font-serif text-base font-light text-fg/30">/</span>
              <span className="font-serif text-4xl font-normal text-fg">{ipaSymbol}</span>
              <span className="font-serif text-base font-light text-fg/30">/</span>
            </p>
          )}
          {category && (
            <p className="text-[11px] text-fg-muted">{category}</p>
          )}
        </div>

        {/* Row 3: Title */}
        <h3 className="text-body font-semibold leading-tight text-fg">{label}</h3>

        {/* Row 4: Example words */}
        <p className="truncate text-caption text-fg-muted">{preview}</p>

        {/* Row 5: Meta */}
        <div className="flex items-center gap-space-3 text-caption text-fg-subtle">
          {wordCount > 0 && (
            <>
              <span className="flex items-center gap-1">
                <RotateCw className="h-3 w-3 flex-shrink-0" />
                {wordCount}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 flex-shrink-0" />
                {minutes}m
              </span>
            </>
          )}
          {isInProgress && (
            <span className="ml-auto text-caption font-medium text-primary">
              {progressPct}%
            </span>
          )}
          {isCompleted && (
            <span className="ml-auto text-tiny font-medium text-success">Done</span>
          )}
        </div>

        {/* Progress bar at bottom */}
        {showProgressBar && (
          <>
            <span aria-hidden className="absolute bottom-0 left-0 right-0 h-1 bg-primary/10" />
            <span
              aria-hidden
              className="absolute bottom-0 left-0 h-1 rounded-full bg-primary"
              style={{ width: `${progressPct}%` }}
            />
          </>
        )}
      </article>
    </Link>
  );
}
