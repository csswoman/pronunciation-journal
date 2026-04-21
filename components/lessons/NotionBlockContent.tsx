"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { SubLesson } from "@/lib/notion/types";
import { BlockList } from "./BlockList";

export { NotionBlockRenderer } from "./NotionBlockRenderer";

interface NotionToggleItemProps {
  lesson: SubLesson;
  defaultOpen?: boolean;
}

function NotionToggleItem({ lesson, defaultOpen = false }: NotionToggleItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-[var(--line-divider)] bg-white dark:bg-[var(--card-bg)] overflow-hidden">
      <Button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-[var(--btn-plain-bg-hover)]"
      >
        <span className="text-base font-semibold text-neutral-900 dark:text-[var(--deep-text)]">
          {lesson.title}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 shrink-0 text-[var(--text-secondary)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {open && (
        <div className="border-t border-[var(--line-divider)] px-6 py-5">
          {lesson.content.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">No content</p>
          ) : (
            <BlockList blocks={lesson.content} />
          )}
        </div>
      )}
    </div>
  );
}

interface NotionBlockContentProps {
  subLessons: SubLesson[];
}

export default function NotionBlockContent({ subLessons }: NotionBlockContentProps) {
  if (subLessons.length === 0) {
    return (
      <p className="text-sm text-[var(--text-secondary)]">No sections found in this Notion page.</p>
    );
  }

  return (
    <div>
      {subLessons.map((lesson, i) => (
        <NotionToggleItem key={lesson.id} lesson={lesson} defaultOpen={i === 0} />
      ))}
    </div>
  );
}
