"use client";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { H2 } from "@/components/ui/Typography";
import { LESSON_CATEGORIES } from "@/lib/types";
import type { TheoryLesson } from "@/lib/types";

interface LessonTableProps {
  title: string;
  lessons: TheoryLesson[];
  deletingId: string | null;
  togglingId: string | null;
  onDelete: (l: TheoryLesson) => void;
  onTogglePublish: (l: TheoryLesson) => void;
  showPublishControl?: boolean;
}

const Spinner = ({ className }: { className?: string }) => (
  <div className={`border-2 border-current border-t-transparent rounded-full animate-spin ${className ?? "w-4 h-4"}`} />
);

export default function LessonTable({
  title,
  lessons,
  deletingId,
  togglingId,
  onDelete,
  onTogglePublish,
  showPublishControl = false,
}: LessonTableProps) {
  return (
    <section className="mb-10">
      <H2 className="text-xs font-semibold uppercase tracking-widest mb-3 text-fg-subtle">
        {title} ({lessons.length})
      </H2>
      {lessons.length === 0 ? (
        <p className="text-sm py-4 text-fg-subtle">None yet.</p>
      ) : (
        <div className="rounded-2xl border border-line-divider overflow-hidden">
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
    <div className={`flex items-center gap-3 px-4 py-3 bg-[var(--card-bg)] ${isLast ? "" : "border-b border-line-divider"}`}>
      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--btn-regular-bg)] flex items-center justify-center relative">
        {lesson.cover_image_url ? (
          <Image src={lesson.cover_image_url} alt={`Cover for ${lesson.title}`} fill sizes="40px" className="object-cover" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.206 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.794 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.794 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.206 18 16.5 18s-3.332.477-4.5 1.253" />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate text-fg">{lesson.title}</p>
        <p className="text-xs flex items-center gap-1.5 text-fg-subtle">
          {cat?.label ?? lesson.category} · /courses/library/{lesson.slug}
          {lesson.source === "notion" && (
            <span className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-tiny font-semibold bg-neutral-100 dark:bg-neutral-800 text-fg-subtle">
              N Notion
            </span>
          )}
        </p>
      </div>

      <span className={`text-tiny font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${lesson.is_published ? "bg-success-soft text-success" : "bg-[var(--btn-regular-bg)] text-fg-subtle"}`}>
        {lesson.is_published ? "Published" : "Draft"}
      </span>

      <div className="flex items-center gap-1 flex-shrink-0">
        {showPublishControl && (
          <Button
            onClick={() => onTogglePublish(lesson)}
            disabled={isToggling}
            title={lesson.is_published ? "Unpublish" : "Publish"}
            className="p-1.5 rounded-lg hover:bg-[var(--btn-plain-bg-hover)] transition-colors disabled:opacity-50 text-fg-muted"
          >
            {isToggling ? (
              <Spinner />
            ) : lesson.is_published ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </Button>
        )}

        <Link
          href={`/admin/lessons/${lesson.id}/edit`}
          className="p-1.5 rounded-lg hover:bg-[var(--btn-plain-bg-hover)] transition-colors text-fg-muted"
          title="Edit"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </Link>

        <Button
          onClick={() => onDelete(lesson)}
          disabled={isDeleting}
          className="p-1.5 rounded-lg hover:bg-error-soft transition-colors disabled:opacity-50 text-error"
          title="Delete"
        >
          {isDeleting ? (
            <Spinner />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </Button>
      </div>
    </div>
  );
}
