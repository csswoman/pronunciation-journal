"use client";

// Planned structure:
// <PackStudyPanel>
//   <PillButton>Practicar Essential Words</PillButton>
//   <ul> <button>lección</button> × n </ul>
//   <p role="status" />   (loading / unreadable pack)
// </PackStudyPanel>

import { useEffect, useState } from "react";
import { BookOpen } from "@/components/icons";
import { PillButton } from "@/components/ui/PillButton";
import type { DownloadedLessonRecord, OfflineResourcePackRecord } from "@/lib/db";
import type { CefrLevel } from "@/lib/essential-words/types";
import { listPackLessons, loadPackLesson } from "@/lib/offline/pack-contents";
import type { GrammarDeckPackResource } from "@/lib/offline/pack-types";

interface PackStudyPanelProps {
  receipt: OfflineResourcePackRecord;
  onStudyLesson: (lesson: DownloadedLessonRecord) => void;
  onStudyWords: (level: CefrLevel) => void;
}

const UNREADABLE = "No pudimos leer este paquete en el dispositivo. Vuelve a descargarlo cuando tengas conexión.";

export function PackStudyPanel({ receipt, onStudyLesson, onStudyWords }: PackStudyPanelProps) {
  const [lessons, setLessons] = useState<GrammarDeckPackResource[] | null | undefined>(undefined);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    void listPackLessons(receipt).then((next) => {
      if (active) setLessons(next);
    });
    return () => {
      active = false;
    };
  }, [receipt]);

  const openLesson = async (lesson: GrammarDeckPackResource) => {
    const record = await loadPackLesson(receipt, lesson);
    if (record) onStudyLesson(record);
    else setMessage(UNREADABLE);
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-line p-3">
      <PillButton
        variant="primary"
        size="sm"
        className="self-start"
        onClick={() => onStudyWords(receipt.level as CefrLevel)}
      >
        Practicar Essential Words {receipt.level}
      </PillButton>

      {lessons === undefined && <p className="text-caption text-fg-subtle" role="status">Leyendo lecciones…</p>}
      {lessons === null && <p className="text-caption text-fg-subtle" role="status">{UNREADABLE}</p>}
      {lessons && lessons.length > 0 && (
        <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto" aria-label={`Lecciones del paquete ${receipt.level}`}>
          {lessons.map((lesson) => (
            <li key={lesson.slug}>
              <button
                type="button"
                onClick={() => void openLesson(lesson)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-body-sm text-fg hover:bg-surface-sunken focus-ring"
              >
                <BookOpen size={14} className="shrink-0 text-fg-subtle" />
                {lesson.title}
              </button>
            </li>
          ))}
        </ul>
      )}
      {message && <p className="text-caption text-fg-subtle" role="status">{message}</p>}
    </div>
  );
}
