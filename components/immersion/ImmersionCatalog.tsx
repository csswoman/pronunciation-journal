'use client';

// Planned structure:
// <ImmersionCatalog>
//   <CatalogFilters /> (Search input & rounded pill filters for level/topic/status)
//   <CatalogGrid>
//     <LessonCard /> (Rounded card, thumbnail, badges, topic kicker, description & action)
//   </CatalogGrid>
//   <EmptyCatalogState /> (Shown when no lessons match filters)
// </ImmersionCatalog>

import { useState, useMemo, useEffect, useRef } from 'react';
import { Search } from '@/components/icons';
import { ListPagination } from '@/components/ui/ListPagination';
import { ImmersionLessonCard } from '@/components/immersion/ImmersionLessonCard';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { ImmersionLesson, ImmersionLevel, ImmersionProgressMap } from '@/lib/immersion/types';

interface ImmersionCatalogProps {
  lessons: ImmersionLesson[];
  progressMap?: ImmersionProgressMap;
}

const PAGE_SIZE_DESKTOP = 6;
const PAGE_SIZE_MOBILE = 4;

const LEVEL_LABELS: Record<ImmersionLevel, string> = {
  A2: 'A2 • Elemental',
  B1: 'B1 • Intermedio',
  C1: 'C1 • Avanzado',
};

const LEVEL_ORDER: ImmersionLevel[] = ['A2', 'B1', 'C1'];

function matchesTopic(lesson: ImmersionLesson, targetTopic: string): boolean {
  if (targetTopic === 'all') return true;

  const topic = lesson.topic;
  const canonical = lesson.metadata?.canonicalTopic ?? '';
  const title = lesson.title.toLowerCase();
  const summary = lesson.summary.toLowerCase();

  if (targetTopic === 'connected-speech') {
    return (
      topic === 'connected-speech' ||
      canonical === 'connected-speech' ||
      canonical === 'reductions' ||
      canonical.startsWith('cs-') ||
      title.includes('connected speech') ||
      title.includes('elision') ||
      title.includes('reduction') ||
      summary.includes('connected speech') ||
      summary.includes('elision') ||
      summary.includes('reduction')
    );
  }

  if (targetTopic === 'intonation') {
    return (
      topic === 'intonation' ||
      canonical === 'intonation' ||
      canonical.includes('entonacion') ||
      title.includes('intonation') ||
      summary.includes('intonation')
    );
  }

  if (targetTopic === 'pronunciation') {
    return (
      topic === 'pronunciation' ||
      canonical.includes('pronunciacion') ||
      title.includes('pronunciation') ||
      title.includes('accent') ||
      title.includes('sound')
    );
  }

  if (targetTopic === 'speaking') {
    return (
      topic === 'speaking' ||
      topic === 'conversation' ||
      title.includes('speak') ||
      title.includes('talk') ||
      summary.includes('speaking')
    );
  }

  if (targetTopic === 'vocabulary') {
    return (
      topic === 'vocabulary' ||
      title.includes('vocab') ||
      title.includes('words') ||
      summary.includes('vocabulary')
    );
  }

  return topic === targetTopic || canonical === targetTopic;
}

export function ImmersionCatalog({ lessons, progressMap = {} }: ImmersionCatalogProps) {
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [layoutReady, setLayoutReady] = useState<boolean>(false);
  const listRef = useRef<HTMLDivElement>(null);

  const isSmUp = useMediaQuery('(min-width: 640px)');
  const pageSize = layoutReady && !isSmUp ? PAGE_SIZE_MOBILE : PAGE_SIZE_DESKTOP;

  useEffect(() => {
    setLayoutReady(true);
  }, []);

  const availableLevels = LEVEL_ORDER.filter((level) =>
    lessons.some((lesson) => lesson.level === level),
  );

  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      if (selectedLevel !== 'all' && lesson.level !== selectedLevel) return false;
      if (!matchesTopic(lesson, selectedTopic)) return false;

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
  }, [lessons, progressMap, selectedLevel, selectedTopic, selectedStatus, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredLessons.length / pageSize));

  const paginatedLessons = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLessons.slice(start, start + pageSize);
  }, [filteredLessons, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLevel, selectedTopic, selectedStatus, searchQuery]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  function handlePageChange(page: number) {
    setCurrentPage(page);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    listRef.current?.scrollIntoView?.({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }

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
        <div ref={listRef} className="flex flex-col gap-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedLessons.map((lesson) => (
              <ImmersionLessonCard
                key={lesson.id}
                lesson={lesson}
                progress={progressMap[lesson.id]}
              />
            ))}
          </div>

          <ListPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredLessons.length}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            ariaLabel="Paginación de lecciones de inmersión"
          />
        </div>
      )}
    </div>
  );
}
