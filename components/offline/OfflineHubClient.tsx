"use client";

// Planned structure:
// <OfflineHubClient>
//   <OfflineStudyActiveView />
//   <OfflineHeaderBanner />
//   <DownloadedLessonsSection />
//     <DownloadedLessonCard />
//   <OfflineCapabilitiesList />
// </OfflineHubClient>

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Download, RefreshCw } from "@/components/icons";
import { PillButton } from "@/components/ui/PillButton";
import GrammarStudyDeck from "@/components/courses/grammar-deck/GrammarStudyDeck";
import type { CoursePathTrackId } from "@/lib/courses/types";
import type { DownloadedLessonRecord } from "@/lib/db";
import { useAllDownloadedLessons } from "@/lib/offline/download-manager";
import { DownloadedLessonCard } from "./DownloadedLessonCard";

export function OfflineHubClient() {
  const [activeLesson, setActiveLesson] = useState<DownloadedLessonRecord | null>(null);
  const downloadedLessons = useAllDownloadedLessons();

  // If the user selected an offline lesson to study, render the full deck experience
  if (activeLesson) {
    return (
      <div className="min-h-screen">
        <GrammarStudyDeck
          deck={activeLesson.deck}
          backHref="/offline"
          backLabel="Volver a mis descargas"
          courseTitle={activeLesson.title}
          levelId={activeLesson.trackId as CoursePathTrackId}
          lessonId={String(activeLesson.lessonNumber)}
          deckSlug={activeLesson.slug}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-2">
        <div className="text-h1">📡</div>
        <h1 className="text-h3 font-semibold text-fg">Modo sin conexión</h1>
        <p className="text-body text-fg-muted max-w-md">
          Estás navegando sin internet. Puedes continuar estudiando las lecciones que descargaste previamente.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full text-caption font-mono text-fg-muted hover:text-fg bg-surface-raised border border-line transition-colors"
        >
          <RefreshCw size={12} />
          Comprobar conexión
        </button>
      </div>

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

      {/* Capabilities summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
        <div className="bg-surface-raised rounded-xl p-4 border border-line">
          <p className="text-body-sm font-medium text-fg mb-2">Disponible sin conexión:</p>
          <ul className="space-y-1.5 text-caption text-fg-muted">
            <li className="flex items-center gap-1.5">
              <span className="text-primary">✓</span> Lecciones descargadas y sus quizzes
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-primary">✓</span> Registro local de progreso (se sincroniza al volver)
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-primary">✓</span> Audios fonéticos de lecciones guardadas
            </li>
          </ul>
        </div>

        <div className="bg-surface-raised rounded-xl p-4 border border-line">
          <p className="text-body-sm font-medium text-fg mb-2">Requiere conexión:</p>
          <ul className="space-y-1.5 text-caption text-fg-muted">
            <li className="flex items-center gap-1.5">
              <span className="text-fg-subtle">✗</span> Práctica libre y generación con IA
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-fg-subtle">✗</span> Descargar nuevas lecciones no guardadas
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-fg-subtle">✗</span> Sincronización en tiempo real con la nube
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
