"use client";
import Link from "next/link";
import Button from "@/components/ui/Button";
import LessonAvatar from "@/components/admin/LessonAvatar";
import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { LESSON_CATEGORIES } from "@/lib/types";
import type { TheoryLesson } from "@/lib/types";

// Planned structure:
// <LessonTable>
//   <LessonTableHeader />   — section title, count, origin note
//   <LessonTableColumns />  — column labels
//   <LessonRow />           — one per lesson
// </LessonTable>

const GRID = "grid grid-cols-[1fr_minmax(0,15rem)_8.5rem_6rem] items-center gap-space-4";

interface LessonTableProps {
  label: string;
  note: string;
  lessons: TheoryLesson[];
  deletingId: string | null;
  togglingId: string | null;
  onDelete: (l: TheoryLesson) => void;
  onTogglePublish: (l: TheoryLesson) => void;
  showPublishControl?: boolean;
}

const Spinner = ({ className }: { className?: string }) => (
  <div className={cn("border-2 border-current border-t-transparent rounded-full animate-spin", className ?? "w-4 h-4")} />
);

export default function LessonTable({
  label,
  note,
  lessons,
  deletingId,
  togglingId,
  onDelete,
  onTogglePublish,
  showPublishControl = false,
}: LessonTableProps) {
  return (
    <section className="mb-space-10">
      <div className="flex items-center justify-between gap-space-4 mb-space-3">
        <div className="flex items-center gap-space-2">
          <h2 className="font-display text-h4 text-fg mb-2">
            {label} <span className="italic text-primary">lessons</span>
          </h2>
          <span className="text-tiny font-semibold px-space-2 py-px rounded-full border border-border-default text-fg-subtle tabular-nums">
            {String(lessons.length).padStart(2, "0")}
          </span>
        </div>
        <p className="text-caption text-fg-subtle hidden sm:block">{note}</p>
      </div>

      {lessons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-subtle py-space-10 text-center">
          <p className="text-body-sm text-fg-subtle">No lessons match the current view.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border-default bg-surface-raised overflow-hidden shadow-sm">
          <div className={cn(GRID, "px-space-4 py-space-3 bg-surface-sunken border-b border-border-default")}>
            <ColLabel>Lesson</ColLabel>
            <ColLabel>Path</ColLabel>
            <ColLabel>Status</ColLabel>
            <ColLabel className="text-right">Actions</ColLabel>
          </div>
          {lessons.map((lesson, idx) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              isLast={idx === lessons.length - 1}
              isDeleting={deletingId === lesson.id}
              isToggling={togglingId === lesson.id}
              onDelete={onDelete}
              onTogglePublish={onTogglePublish}
              showPublishControl={showPublishControl}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ColLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("text-tiny font-semibold uppercase tracking-widest text-fg-subtle text-xs", className)}>
      {children}
    </span>
  );
}

interface LessonRowProps {
  lesson: TheoryLesson;
  isLast: boolean;
  isDeleting: boolean;
  isToggling: boolean;
  onDelete: (l: TheoryLesson) => void;
  onTogglePublish: (l: TheoryLesson) => void;
  showPublishControl: boolean;
}

function LessonRow({
  lesson,
  isLast,
  isDeleting,
  isToggling,
  onDelete,
  onTogglePublish,
  showPublishControl,
}: LessonRowProps) {
  const cat = LESSON_CATEGORIES.find((c) => c.value === lesson.category);

  return (
    <div
      className={cn(
        GRID,
        "group relative px-space-4 py-space-3 transition-colors hover:bg-surface-sunken",
        !isLast && "border-b border-border-subtle"
      )}
    >
      <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Lesson */}
      <div className="flex items-center gap-space-3 min-w-0">
        <LessonAvatar title={lesson.title} coverUrl={lesson.cover_image_url} />
        <div className="min-w-0">
          <p className="text-body-sm font-semibold truncate text-fg">{lesson.title}</p>
          <p className="text-caption flex items-center gap-space-2 text-fg-subtle mt-px">
            <span className="uppercase tracking-wide font-semibold">{cat?.label ?? lesson.category}</span>
            <span className="text-border-strong">·</span>
            <span>Updated {formatRelativeTime(lesson.updated_at)}</span>
          </p>
        </div>
      </div>

      {/* Path */}
      <div className="flex items-center gap-space-2 min-w-0">
        <code className="text-caption font-mono text-fg-muted truncate">
          /courses/library/{lesson.slug}
        </code>
        {lesson.source === "notion" && (
          <span className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-tiny font-semibold border border-border-default text-fg-muted flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M7 7h10v10" />
            </svg>
            Notion
          </span>
        )}
      </div>

      {/* Status */}
      <span className={cn("badge w-fit", lesson.is_published ? "text-success bg-success-soft" : "")}>
        <span className={lesson.is_published ? "dot-success" : "dot-danger"} />
        {lesson.is_published ? "Published" : "Draft"}
      </span>

      {/* Actions */}
      <div className="flex items-center justify-end gap-space-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        {showPublishControl && (
          <Button
            variant="ghost"
            onClick={() => onTogglePublish(lesson)}
            disabled={isToggling}
            title={lesson.is_published ? "Unpublish" : "Publish"}
            className="!p-1 !rounded-md !hover:-translate-y-0 text-fg-subtle"
          >
            {isToggling ? (
              <Spinner className="w-3.5 h-3.5" />
            ) : lesson.is_published ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </Button>
        )}

        <Link
          href={`/courses/library/${lesson.slug}`}
          target="_blank"
          className="p-1 rounded-md text-fg-subtle hover:text-fg hover:bg-surface-sunken transition-colors"
          title="Preview"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </Link>

        <Link
          href={`/admin/lessons/${lesson.id}/edit`}
          className="p-1 rounded-md text-fg-subtle hover:text-fg hover:bg-surface-sunken transition-colors"
          title="Edit"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </Link>

        <Button
          onClick={() => onDelete(lesson)}
          disabled={isDeleting}
          className="!p-1 !rounded-md !hover:-translate-y-0 text-fg-subtle hover:text-error hover:!bg-error-soft"
          title="Delete"
        >
          {isDeleting ? (
            <Spinner className="w-3.5 h-3.5" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </Button>
      </div>
    </div>
  );
}
