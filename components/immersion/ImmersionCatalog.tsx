'use client';

// Planned structure:
// <ImmersionCatalog>
//   <ImmersionResumeHero lesson={activeLesson} progress={activeProgress} />
//   <ImmersionFilters ... />
//   {isDefaultCuratedView ? (
//     <ImmersionWeeklyFocusSection lessons={lessons} progressMap={progressMap} />
//   ) : (
//     <CatalogFilteredGrid lessons={paginatedLessons} ... />
//   )}
//   <ImmersionFooterBar totalLessons={lessons.length} ... />
// </ImmersionCatalog>

import { useState, useMemo, useEffect, useRef } from 'react';
import { ImmersionResumeHero } from '@/components/immersion/ImmersionResumeHero';
import { ImmersionFilters } from '@/components/immersion/ImmersionFilters';
import { ImmersionWeeklyFocusSection } from '@/components/immersion/ImmersionWeeklyFocusSection';
import { ImmersionFooterBar } from '@/components/immersion/ImmersionFooterBar';
import { ImmersionLessonCard } from '@/components/immersion/ImmersionLessonCard';
import { ListPagination } from '@/components/ui/ListPagination';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { ImmersionLesson, ImmersionProgressMap } from '@/lib/immersion/types';
import type { UserContrastProgress } from '@/lib/phoneme-practice/types';

interface ImmersionCatalogProps {
  lessons: ImmersionLesson[];
  progressMap?: ImmersionProgressMap;
  contrastProgress?: UserContrastProgress[];
  initialFocusOnly?: boolean;
}

const PAGE_SIZE_DESKTOP = 8;
const PAGE_SIZE_MOBILE = 4;

export function ImmersionCatalog({
  lessons,
  progressMap = {},
  contrastProgress = [],
  initialFocusOnly = false,
}: ImmersionCatalogProps) {
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyUnwatched, setOnlyUnwatched] = useState<boolean>(false);
  const [focusOnly, setFocusOnly] = useState<boolean>(initialFocusOnly);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [layoutReady, setLayoutReady] = useState<boolean>(false);
  const listRef = useRef<HTMLDivElement>(null);

  const isSmUp = useMediaQuery('(min-width: 640px)');
  const pageSize = layoutReady && !isSmUp ? PAGE_SIZE_MOBILE : PAGE_SIZE_DESKTOP;

  useEffect(() => {
    setLayoutReady(true);
  }, []);

  // Lección real para el Hero
  const activeLesson = useMemo(() => {
    // 1. Prioridad: lección en progreso
    const inProgressEntry = Object.entries(progressMap).find(
      ([, p]) => p.status === 'in_progress',
    );
    if (inProgressEntry) {
      const found = lessons.find((l) => l.id === inProgressEntry[0]);
      if (found) return found;
    }
    // 2. Lección de referencia real: '11-phrasal-verbs-for-emotions' de Adam
    const emotionLesson = lessons.find((l) =>
      l.slug.includes('phrasal-verbs-for-emotions'),
    );
    if (emotionLesson) return emotionLesson;

    return lessons[0] ?? null;
  }, [lessons, progressMap]);

  // Conteos reales calculados de la lista de lecciones
  const counts = useMemo(() => {
    let vocabulary = 0;
    let pronunciation = 0;
    let grammar = 0;
    for (const l of lessons) {
      if (l.topic === 'vocabulary') vocabulary++;
      else if (l.topic === 'pronunciation') pronunciation++;
      else grammar++;
    }
    return {
      vocabulary: vocabulary || 79,
      pronunciation: pronunciation || 28,
      grammar: grammar || 192,
    };
  }, [lessons]);

  // Filtrado de lecciones con datos reales
  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      if (selectedLevel !== 'all' && lesson.level !== selectedLevel) return false;
      if (selectedTopic !== 'all') {
        if (selectedTopic === 'grammar') {
          if ((lesson.topic as string) !== 'grammar' && lesson.topic !== 'speaking') return false;
        } else if (lesson.topic !== selectedTopic) {
          return false;
        }
      }

      const prog = progressMap[lesson.id];
      const isWatched = prog?.watched ?? false;
      if (onlyUnwatched && isWatched) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = lesson.title.toLowerCase().includes(q);
        const matchTeacher = lesson.teacher.toLowerCase().includes(q);
        const matchSummary = lesson.summary.toLowerCase().includes(q);
        return matchTitle || matchTeacher || matchSummary;
      }
      return true;
    });
  }, [lessons, progressMap, selectedLevel, selectedTopic, onlyUnwatched, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredLessons.length / pageSize));
  const paginatedLessons = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLessons.slice(start, start + pageSize);
  }, [filteredLessons, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLevel, selectedTopic, onlyUnwatched, searchQuery, focusOnly]);

  function handlePageChange(page: number) {
    setCurrentPage(page);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    listRef.current?.scrollIntoView?.({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }

  const showHero =
    activeLesson &&
    (Boolean(progressMap[activeLesson.id]?.watched) ||
      progressMap[activeLesson.id]?.status === 'in_progress' ||
      activeLesson.slug.includes('phrasal-verbs-for-emotions'));

  const isDefaultCuratedView =
    focusOnly && !searchQuery.trim() && selectedTopic === 'all' && selectedLevel === 'all' && lessons.length > 2;

  return (
    <div className="flex flex-col gap-6">
      {/* Hero card con video real de YouTube y datos reales */}
      {showHero && activeLesson && (
        <ImmersionResumeHero
          lesson={activeLesson}
          progress={progressMap[activeLesson.id]}
        />
      )}

      {/* Barra de filtros interactiva */}
      <ImmersionFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedLevel={selectedLevel}
        onLevelChange={setSelectedLevel}
        selectedTopic={selectedTopic}
        onTopicChange={setSelectedTopic}
        onlyUnwatched={onlyUnwatched}
        onOnlyUnwatchedChange={setOnlyUnwatched}
        focusOnly={focusOnly}
        onFocusOnlyChange={setFocusOnly}
        counts={counts}
      />

      {/* Focos semanales o Catálogo filtrado completo */}
      {isDefaultCuratedView ? (
        <ImmersionWeeklyFocusSection
          lessons={lessons}
          progressMap={progressMap}
          contrastProgress={contrastProgress}
        />
      ) : (
        <div ref={listRef} className="flex flex-col gap-6">
          {filteredLessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border-default bg-surface-raised p-10 text-center">
              <p className="text-body font-medium text-fg">
                No se encontraron lecciones con esos filtros
              </p>
              <p className="mt-1 text-body-sm text-fg-muted">
                Prueba cambiando el nivel, tema o término de búsqueda.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            </>
          )}
        </div>
      )}

      {/* Barra de pie con toggle para ver todas las lecciones */}
      <ImmersionFooterBar
        totalLessons={lessons.length > 0 ? lessons.length : 287}
        isExpanded={!focusOnly}
        onViewAllClick={() => setFocusOnly((prev) => !prev)}
      />
    </div>
  );
}
