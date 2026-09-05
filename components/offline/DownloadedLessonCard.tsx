"use client";

// Planned structure:
// <DownloadedLessonCard>
//   <LessonCardHeader />
//   <LessonCardActions />
// </DownloadedLessonCard>

import { useState, useCallback } from "react";
import { BookOpen, Trash2 } from "@/components/icons";
import { PillButton } from "@/components/ui/PillButton";
import type { DownloadedLessonRecord } from "@/lib/db";
import { removeDownloadedLesson } from "@/lib/offline/download-manager";

interface DownloadedLessonCardProps {
  record: DownloadedLessonRecord;
  onStudy: (record: DownloadedLessonRecord) => void;
}

export function DownloadedLessonCard({ record, onStudy }: DownloadedLessonCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await removeDownloadedLesson(record.id);
    } finally {
      setIsDeleting(false);
    }
  }, [record.id]);

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-line bg-surface-raised transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary font-mono text-caption font-semibold shrink-0">
          {String(record.lessonNumber).padStart(2, "0")}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-caption font-mono uppercase text-fg-subtle">
              {record.trackId}
            </span>
            <span className="text-fg-subtle text-caption">•</span>
            <span className="text-caption text-fg-muted font-medium">
              {record.deck.cards?.length ?? 0} tarjetas
            </span>
          </div>
          <h3 className="text-body font-semibold text-fg truncate">
            {record.title}
          </h3>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <PillButton
          variant="primary"
          size="sm"
          onClick={() => onStudy(record)}
          icon={<BookOpen size={14} />}
        >
          Estudiar
        </PillButton>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          title="Eliminar de descargas"
          aria-label="Eliminar lección de descargas"
          className="p-1.5 rounded-md text-fg-subtle hover:text-danger hover:bg-danger/10 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
