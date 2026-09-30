"use client";

// Planned structure:
// <ProfileOfflineCard>
//   <DownloadedLessonsList>
//     <DownloadedLessonCard /> × n
//   </DownloadedLessonsList>
//   <OfflineLevelPacks />
//   <OfflineCoachPack /> (toggle)
//   <OfflineCapabilitiesList />
// </ProfileOfflineCard>

import { useState } from "react";
import { Download } from "@/components/icons";
import { PillButton } from "@/components/ui/PillButton";
import { DownloadedLessonCard } from "@/components/offline/DownloadedLessonCard";
import { OfflineCapabilitiesList } from "@/components/offline/OfflineCapabilitiesList";
import { OfflineCoachPack } from "@/components/offline/OfflineCoachPack";
import { OfflineLevelPacks } from "@/components/offline/OfflineLevelPacks";
import type { DownloadedLessonRecord } from "@/lib/db";
import type { CefrLevel } from "@/lib/essential-words/types";
import { useAllDownloadedLessons } from "@/lib/offline/download-manager";

interface ProfileOfflineCardProps {
  onStudyLesson: (lesson: DownloadedLessonRecord) => void;
  onStudyWords: (level: CefrLevel) => void;
}

/** Manages downloads for offline study — the same panels `/offline` falls back to when disconnected. */
export default function ProfileOfflineCard({ onStudyLesson, onStudyWords }: ProfileOfflineCardProps) {
  const downloadedLessons = useAllDownloadedLessons();
  const [showCoachPack, setShowCoachPack] = useState(false);

  return (
    <section
      aria-labelledby="profile-offline-title"
      className="layout-stack rounded-xl border border-border-subtle bg-surface-raised p-6 shadow-xs"
    >
      <div className="layout-stack-tight">
        <h2 id="profile-offline-title" className="m-0 font-display text-h3 font-bold text-fg">
          Descargas sin conexión
        </h2>
        <p className="m-0 font-display text-body-sm text-fg-muted">
          Guarda el paquete de tu nivel o lecciones sueltas para estudiar sin internet.
        </p>
      </div>

      <div className="layout-stack gap-5 pt-2">
        <div className="layout-stack-tight">
          <div className="flex items-center justify-between">
            <span className="font-caption font-medium text-fg-muted">
              Lecciones descargadas ({downloadedLessons.length})
            </span>
          </div>
          {downloadedLessons.length > 0 && (
            <div className="flex flex-col gap-2 pt-1">
              {downloadedLessons.map((record) => (
                <DownloadedLessonCard key={record.id} record={record} onStudy={onStudyLesson} />
              ))}
            </div>
          )}
        </div>

        <OfflineLevelPacks onStudyLesson={onStudyLesson} onStudyWords={onStudyWords} />

        <div className="layout-stack-tight rounded-lg border border-line p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="m-0 font-label text-body-sm font-semibold text-fg">Ejercicios del Coach</p>
              <p className="m-0 font-caption text-fg-muted">
                Prepara hasta 100 ejercicios del nivel de tu cuenta.
              </p>
            </div>
            <PillButton
              variant="outline"
              size="sm"
              icon={<Download size={14} />}
              aria-expanded={showCoachPack}
              onClick={() => setShowCoachPack((open) => !open)}
            >
              {showCoachPack ? "Cerrar opciones" : "Ver opciones"}
            </PillButton>
          </div>
          {showCoachPack && <OfflineCoachPack />}
        </div>

        <OfflineCapabilitiesList />
      </div>
    </section>
  );
}
