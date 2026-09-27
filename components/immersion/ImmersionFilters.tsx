'use client';

// Planned structure:
// <ImmersionFilters>
//   <FiltersContainer>
//     <SearchInput />
//     <LevelPills selectedLevel={selectedLevel} />
//     <TopicPills selectedTopic={selectedTopic} topicCounts={topicCounts} />
//     <QuickToggles focusOnly={focusOnly} onlyUnwatched={onlyUnwatched} />
//   </FiltersContainer>
// </ImmersionFilters>

import { useState } from 'react';
import { Search } from '@/components/icons';
import { cn } from '@/lib/cn';

export interface ImmersionFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedLevel: string;
  onLevelChange: (level: string) => void;
  selectedTopic: string;
  onTopicChange: (topic: string) => void;
  onlyUnwatched: boolean;
  onOnlyUnwatchedChange: (val: boolean) => void;
  focusOnly: boolean;
  onFocusOnlyChange: (val: boolean) => void;
  counts?: {
    vocabulary?: number;
    pronunciation?: number;
    grammar?: number;
  };
}

const LEVELS: { id: string; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'A2', label: 'A2' },
  { id: 'B1', label: 'B1' },
  { id: 'B2', label: 'B2' },
  { id: 'C1', label: 'C1' },
];

const MAIN_TOPICS = [
  { id: 'vocabulary', label: 'Vocabulario', defaultCount: 79 },
  { id: 'pronunciation', label: 'Pronunciación', defaultCount: 28 },
  { id: 'grammar', label: 'Gramática', defaultCount: 192 },
];

const EXTRA_TOPICS = [
  { id: 'speaking', label: 'Speaking & Fluidez' },
  { id: 'connected-speech', label: 'Connected Speech' },
  { id: 'intonation', label: 'Entonación' },
  { id: 'conversation', label: 'Conversación' },
];

export function ImmersionFilters({
  searchQuery,
  onSearchChange,
  selectedLevel,
  onLevelChange,
  selectedTopic,
  onTopicChange,
  onlyUnwatched,
  onOnlyUnwatchedChange,
  focusOnly,
  onFocusOnlyChange,
  counts,
}: ImmersionFiltersProps) {
  const [showExtraTopics, setShowExtraTopics] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3.5 py-1.5">
      {/* Grupo izquierdo: Búsqueda, Niveles y Temas principales */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Input de búsqueda estilizado con lupa */}
        <div className="relative w-72 sm:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-fg-muted" />
          <input
            type="text"
            placeholder="Buscar por tema, palabra o profesor..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-full border border-border-default bg-surface-sunken pl-10.5 pr-4 py-2.5 text-body-sm text-fg placeholder:text-fg-muted focus-ring transition-colors min-h-[40px]"
          />
        </div>

        {/* Píldoras de nivel: Todos, A2, B1, B2, C1 */}
        <div className="flex items-center gap-1.5">
          {LEVELS.map((lvl) => {
            const isActive = selectedLevel === lvl.id;
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => onLevelChange(lvl.id)}
                className={cn(
                  'rounded-full px-4 py-2 text-body-sm font-semibold transition-colors cursor-pointer focus-ring min-h-[40px] inline-flex items-center justify-center',
                  isActive
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-fg-muted hover:text-fg hover:bg-surface-sunken',
                )}
              >
                {lvl.label}
              </button>
            );
          })}
        </div>

        {/* Píldoras de temas con contadores numéricos */}
        <div className="flex items-center gap-2 flex-wrap">
          {MAIN_TOPICS.map((topic) => {
            const isActive = selectedTopic === topic.id;
            const count =
              topic.id === 'vocabulary'
                ? counts?.vocabulary ?? topic.defaultCount
                : topic.id === 'pronunciation'
                ? counts?.pronunciation ?? topic.defaultCount
                : counts?.grammar ?? topic.defaultCount;

            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => onTopicChange(isActive ? 'all' : topic.id)}
                className={cn(
                  'rounded-full px-4.5 py-2 text-body-sm font-medium transition-colors cursor-pointer focus-ring border min-h-[40px] inline-flex items-center justify-center',
                  isActive
                    ? 'bg-primary text-on-primary border-primary font-semibold shadow-xs'
                    : 'bg-surface-raised border-border-default text-fg hover:bg-surface-sunken',
                )}
              >
                <span>{topic.label}</span>
                <span
                  className={cn(
                    'ml-2 font-mono text-caption',
                    isActive ? 'text-on-primary opacity-90' : 'text-fg-muted',
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {/* Menú desplegable para temas adicionales */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExtraTopics(!showExtraTopics)}
              className={cn(
                'rounded-full px-4.5 py-2 text-body-sm font-medium transition-colors cursor-pointer focus-ring border min-h-[40px] inline-flex items-center justify-center',
                EXTRA_TOPICS.some((t) => t.id === selectedTopic)
                  ? 'bg-primary text-on-primary border-primary font-semibold'
                  : 'bg-surface-raised border-border-default text-fg hover:bg-surface-sunken',
              )}
            >
              <span>+4 temas ⌵</span>
            </button>

            {showExtraTopics && (
              <div className="absolute left-0 mt-2 w-56 rounded-2xl border border-border-default bg-surface-raised p-2 shadow-lg z-20">
                {EXTRA_TOPICS.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => {
                      onTopicChange(selectedTopic === topic.id ? 'all' : topic.id);
                      setShowExtraTopics(false);
                    }}
                    className={cn(
                      'w-full text-left rounded-xl px-4 py-2.5 text-body-sm font-medium transition-colors cursor-pointer',
                      selectedTopic === topic.id
                        ? 'bg-primary text-on-primary font-semibold'
                        : 'text-fg hover:bg-surface-sunken',
                    )}
                  >
                    {topic.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grupo derecho: Toggles rápidos "Sin ver" y "Con mis focos" */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => onOnlyUnwatchedChange(!onlyUnwatched)}
          className={cn(
            'rounded-full px-4.5 py-2 text-body-sm font-medium transition-colors cursor-pointer focus-ring min-h-[40px] inline-flex items-center justify-center',
            onlyUnwatched
              ? 'bg-primary text-on-primary shadow-xs font-semibold'
              : 'text-fg-muted hover:text-fg hover:bg-surface-sunken',
          )}
        >
          Sin ver
        </button>

        <button
          type="button"
          onClick={() => onFocusOnlyChange(!focusOnly)}
          className={cn(
            'rounded-full px-5 py-2 text-body-sm font-semibold transition-colors cursor-pointer focus-ring min-h-[40px] inline-flex items-center justify-center',
            focusOnly
              ? 'bg-primary text-on-primary shadow-xs'
              : 'border border-border-default bg-surface-raised text-fg hover:bg-surface-sunken',
          )}
        >
          Con mis focos
        </button>
      </div>
    </div>
  );
}
