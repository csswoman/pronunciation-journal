'use client';

// Planned structure:
// <ImmersionCatalog>
//   <CatalogFilters /> (Search input & rounded pill filters for level/topic/status)
//   <CatalogGrid>
//     <LessonCard /> (Rounded card, thumbnail, badges, topic kicker, description & action)
//   </CatalogGrid>
//   <EmptyCatalogState /> (Shown when no lessons match filters)
// </ImmersionCatalog>

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Search, Timer } from '@/components/icons';
import Badge from '@/components/ui/Badge';
import type { ImmersionLesson, ImmersionLevel, ImmersionTopic, ImmersionProgressMap } from '@/lib/immersion/types';

interface ImmersionCatalogProps {
  lessons: ImmersionLesson[];
  progressMap?: ImmersionProgressMap;
}

const LEVEL_LABELS: Record<ImmersionLevel, string> = {
  A2: 'A2 • Elemental',
  B1: 'B1 • Intermedio',
  C1: 'C1 • Avanzado',
};

const LEVEL_ORDER: ImmersionLevel[] = ['A2', 'B1', 'C1'];

const TOPIC_LABELS: Record<ImmersionTopic, string> = {
  speaking: 'Speaking & Fluidez',
  'connected-speech': 'Connected Speech',
  pronunciation: 'Pronunciación',
  intonation: 'Entonación',
  conversation: 'Conversación',
  vocabulary: 'Vocabulario',
};

export function ImmersionCatalog({ lessons, progressMap = {} }: ImmersionCatalogProps) {
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const availableLevels = LEVEL_ORDER.filter((level) =>
    lessons.some((lesson) => lesson.level === level),
  );
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredLessons = lessons.filter((lesson) => {
    if (selectedLevel !== 'all' && lesson.level !== selectedLevel) return false;
    if (selectedTopic !== 'all' && lesson.topic !== selectedTopic) return false;

    const prog = progressMap[lesson.id];
    const status = prog?.status ?? 'not_started';
    if (selectedStatus !== 'all' && status !== selectedStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = lesson.title.toLowerCase().includes(q);
      const matchTeacher = lesson.teacher.toLowerCase().includes(q);
      const matchSummary = lesson.summary.toLowerCase().includes(q);
      return matchTitle || matchTeacher || matchSummary;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Search & Filters */}
      <div className="flex flex-col gap-3.5 rounded-2xl border border-border-default bg-surface-raised p-4 shadow-sm sm:p-5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
          <input
            type="text"
            placeholder="Buscar por tema, palabra o profesor (Emma, Ronnie, James)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-border-default bg-surface-sunken pl-10 pr-4 py-2.5 text-body-sm text-fg placeholder:text-fg-muted focus-ring"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Level Filter */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="rounded-full border border-border-default bg-surface-sunken px-4 py-2 text-body-sm text-fg focus-ring cursor-pointer"
            aria-label="Filtrar por nivel"
          >
            <option value="all">Todos los niveles</option>
            {availableLevels.map((level) => (
              <option key={level} value={level}>
                {LEVEL_LABELS[level]}
              </option>
            ))}
          </select>

          {/* Topic Filter */}
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="rounded-full border border-border-default bg-surface-sunken px-4 py-2 text-body-sm text-fg focus-ring cursor-pointer"
            aria-label="Filtrar por tema"
          >
            <option value="all">Todos los temas</option>
            <option value="speaking">Speaking & Fluidez</option>
            <option value="connected-speech">Connected Speech</option>
            <option value="pronunciation">Pronunciación</option>
            <option value="intonation">Entonación</option>
            <option value="vocabulary">Vocabulario</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-full border border-border-default bg-surface-sunken px-4 py-2 text-body-sm text-fg focus-ring cursor-pointer"
            aria-label="Filtrar por estado"
          >
            <option value="all">Todos los estados</option>
            <option value="in_progress">En progreso</option>
            <option value="completed">Completadas</option>
            <option value="not_started">Por empezar</option>
          </select>
        </div>
      </div>

      {/* Grid of Lessons */}
      {filteredLessons.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border-default bg-surface-raised p-10 text-center">
          <p className="text-body font-medium text-fg">No se encontraron lecciones con esos filtros</p>
          <p className="mt-1 text-body-sm text-fg-muted">Prueba cambiando el nivel, tema o filtro de progreso.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLessons.map((lesson) => {
            const prog = progressMap[lesson.id];
            const isCompleted = prog?.status === 'completed';
            const isInProgress = prog?.status === 'in_progress';

            return (
              <Link
                key={lesson.id}
                href={`/practice/immersion/${lesson.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border-default bg-surface-raised transition-all hover:border-primary/50 hover:shadow-md focus-ring"
              >
                {/* Video Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-surface-sunken">
                  <Image
                    src={`https://img.youtube.com/vi/${lesson.youtubeVideoId}/hqdefault.jpg`}
                    alt={lesson.title}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-surface-tooltip/10 transition-opacity group-hover:bg-surface-tooltip/5" />

                  {/* Duration Badge */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-surface-base/90 px-2.5 py-0.5 text-tiny font-mono font-medium text-fg shadow-xs backdrop-blur-xs border border-border-subtle">
                    <Timer className="size-3 text-fg-muted" />
                    <span>{lesson.durationMinutes} min</span>
                  </div>

                  {/* Level & Status Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                    <Badge
                      label={lesson.level}
                      variant="neutral"
                      size="sm"
                    />
                    {isCompleted && (
                      <Badge
                        label="Completada"
                        variant="success"
                        size="sm"
                      />
                    )}
                    {isInProgress && (
                      <Badge
                        label="En progreso"
                        variant="warning"
                        size="sm"
                      />
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-tiny font-semibold text-primary uppercase tracking-wider font-mono">
                        {TOPIC_LABELS[lesson.topic]}
                      </span>
                      <span className="text-tiny text-fg-muted font-medium">
                        Teacher {lesson.teacher}
                      </span>
                    </div>

                    <h3 className="font-semibold text-fg line-clamp-2 group-hover:text-primary transition-colors">
                      {lesson.title}
                    </h3>

                    <p className="text-body-sm text-fg-muted line-clamp-2">
                      {lesson.summary}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-4 flex items-center justify-between border-t border-border-default/60 pt-3 text-tiny">
                    <span className="text-fg-muted">
                      {isCompleted && prog?.quizScore != null
                        ? `Quiz ${prog.quizScore}% • ${lesson.keyVocabulary.length} palabras`
                        : `${lesson.keyVocabulary.length} palabras • ${lesson.timestamps.length} puntos`}
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-tiny font-semibold text-primary group-hover:bg-primary-soft transition-colors">
                      <span>{isCompleted ? 'Repasar' : isInProgress ? 'Continuar' : 'Estudiar'}</span>
                      <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
