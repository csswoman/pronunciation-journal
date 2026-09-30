"use client";

// Planned structure:
// <OfflineHubClient>
//   <OfflineStudyDeck /> | <OfflineEssentialWords />  (active study view)
//   <OfflineHubHeader />
//   <DownloadedLessonsSection />
//     <DownloadedLessonCard />
//   <OfflineLevelPacks /> (deferred chunk)
//   <OfflineCoachPack /> (mounted only when opened)
//   <OfflineCapabilitiesList />
// </OfflineHubClient>

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, BookOpen, Download } from "@/components/icons";
import { PillButton } from "@/components/ui/PillButton";
import type { DownloadedLessonRecord } from "@/lib/db";
import type { CefrLevel } from "@/lib/essential-words/types";
import { useAllDownloadedLessons } from "@/lib/offline/download-manager";
import { DownloadedLessonCard } from "./DownloadedLessonCard";
import { OfflineCapabilitiesList } from "./OfflineCapabilitiesList";
import { OfflineHubHeader } from "./OfflineHubHeader";
import { OfflineLoadingState } from "./OfflineLoadingState";
import { OfflineStudyDeck } from "./OfflineStudyDeck";

const OfflineCoachPack = dynamic(
  () => import("./OfflineCoachPack").then((module) => module.OfflineCoachPack),
  {
    loading: ({ error, retry }) => (
      <OfflineLoadingState
        message="Preparando las opciones del Coach…"
        error={error}
        retry={retry}
      />
    ),
  },
);

const OfflineEssentialWords = dynamic(
  () => import("./OfflineEssentialWords").then((module) => module.OfflineEssentialWords),
  {
    loading: ({ error, retry }) => (
      <OfflineLoadingState message="Abriendo Essential Words…" error={error} retry={retry} />
    ),
  },
);

// Deferred so Dexie receipts + the pack manager stay out of the hub's first chunk.
const OfflineLevelPacks = dynamic(
  () => import("./OfflineLevelPacks").then((module) => module.OfflineLevelPacks),
  {
    loading: ({ error, retry }) => (
      <OfflineLoadingState message="Preparando los paquetes por nivel…" error={error} retry={retry} />
    ),
  },
);

export function OfflineHubClient() {
  const [activeLesson, setActiveLesson] = useState<DownloadedLessonRecord | null>(null);
  const downloadedLessons = useAllDownloadedLessons();
  const [showCoachPack, setShowCoachPack] = useState(false);
  const [activeWordsLevel, setActiveWordsLevel] = useState<CefrLevel | null>(null);

  // If the user selected an offline lesson to study, render the full deck experience
  if (activeLesson) {
    return <OfflineStudyDeck lesson={activeLesson} />;
  }
  if (activeWordsLevel) {
    return <OfflineEssentialWords level={activeWordsLevel} onBack={() => setActiveWordsLevel(null)} />;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
      <OfflineHubHeader />

      {/* Downloaded Lessons Section */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-body font-semibold text-fg flex items-center gap-2">
            <Download size={16} className="text-primary" />
            Lecciones descargadas ({downloadedLessons.length})
          </h2>
          {downloadedLessons.length > 0 && (
            <span className="text-caption text-fg-subtle font-mono">Disponibles offline</span>
          )}
        </div>

        {downloadedLessons.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-line bg-surface-raised/40 text-center gap-3">
            <BookOpen size={24} className="text-fg-subtle" />
            <div className="flex flex-col gap-1">
              <p className="text-body-sm font-medium text-fg">No tienes lecciones descargadas</p>
              <p className="text-caption text-fg-muted max-w-sm">
                Cuando tengas conexión, toca el botón de descarga en cualquier lección de tus cursos para guardarla y practicar sin internet.
              </p>
            </div>
            <Link href="/courses">
              <PillButton variant="outline" size="sm" icon={<ArrowLeft size={14} />}>
                Ver ruta de cursos
              </PillButton>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {downloadedLessons.map((record) => (
              <DownloadedLessonCard
                key={record.id}
                record={record}
                onStudy={(rec) => setActiveLesson(rec)}
              />
            ))}
          </div>
        )}
      </section>

      <OfflineLevelPacks onStudyLesson={setActiveLesson} onStudyWords={setActiveWordsLevel} />

      <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface-raised p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-body font-semibold text-fg">Ejercicios del Coach</h2>
            <p className="text-caption text-fg-muted">
              Prepara hasta 100 ejercicios del nivel de tu cuenta para estudiar sin conexión.
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
      </section>

      <OfflineCapabilitiesList />
    </div>
  );
}
