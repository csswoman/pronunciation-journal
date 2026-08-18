'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Timer } from '@/components/icons';
import Badge from '@/components/ui/Badge';
import type { ImmersionLesson, ImmersionTopic } from '@/lib/immersion/types';

interface ImmersionCatalogProps {
  lessons: ImmersionLesson[];
}

const TOPIC_LABELS: Record<ImmersionTopic, string> = {
  speaking: 'Speaking',
  'connected-speech': 'Connected Speech',
  pronunciation: 'Pronunciación',
  intonation: 'Entonación',
  conversation: 'Conversación',
  vocabulary: 'Vocabulario',
};

export function ImmersionCatalog({ lessons }: ImmersionCatalogProps) {
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredLessons = lessons.filter((lesson) => {
    if (selectedLevel !== 'all' && lesson.level !== selectedLevel) return false;
    if (selectedTopic !== 'all' && lesson.topic !== selectedTopic) return false;
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
      <div className="flex flex-col gap-3 rounded-card-interactive border border-border-default bg-surface-raised p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar por tema, palabra o profesor (Emma, Ronnie, James)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-border-default bg-surface-sunken px-3.5 py-2 text-body-sm text-fg placeholder:text-fg-muted focus-ring"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Level Filter */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="rounded-md border border-border-default bg-surface-sunken px-3 py-2 text-body-sm text-fg focus-ring"
            aria-label="Filtrar por nivel"
          >
            <option value="all">Todos los niveles</option>
            <option value="A1">A1 - Inicial</option>
            <option value="A2">A2 - Elemental</option>
            <option value="B1">B1 - Intermedio</option>
            <option value="B2">B2 - Intermedio Alto</option>
          </select>

          {/* Topic Filter */}
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="rounded-md border border-border-default bg-surface-sunken px-3 py-2 text-body-sm text-fg focus-ring"
            aria-label="Filtrar por tema"
          >
            <option value="all">Todos los temas</option>
            <option value="speaking">Speaking</option>
            <option value="connected-speech">Connected Speech</option>
            <option value="pronunciation">Pronunciación</option>
            <option value="intonation">Entonación</option>
            <option value="vocabulary">Vocabulario</option>
          </select>
        </div>
      </div>

      {/* Grid of Lessons */}
      {filteredLessons.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-card border border-border-default bg-surface-raised p-8 text-center">
          <p className="text-body font-medium text-fg">No se encontraron lecciones con esos filtros</p>
          <p className="mt-1 text-body-sm text-fg-muted">Prueba cambiando el nivel o término de búsqueda.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLessons.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/practice/immersion/${lesson.slug}`}
              className="group flex flex-col overflow-hidden rounded-card-interactive border border-border-default bg-surface-raised transition-all hover:border-primary/50 hover:shadow-md focus-ring"
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
                <div className="absolute inset-0 bg-black/20 transition-opacity group-hover:bg-black/10" />

                {/* Duration Badge */}
                <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded bg-black/80 px-2 py-0.5 text-tiny font-mono font-medium text-white backdrop-blur-xs">
                  <Timer className="size-3" />
                  <span>{lesson.durationMinutes} min</span>
                </div>

                {/* Level Badge */}
                <div className="absolute top-2.5 left-2.5">
                  <Badge label={lesson.level} color={lesson.level.startsWith('A') ? 'emerald' : 'sky'} size="sm" />
                </div>
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col justify-between p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-tiny font-semibold text-primary uppercase tracking-wider">
                      {TOPIC_LABELS[lesson.topic]}
                    </span>
                    <span className="text-tiny text-fg-muted font-medium">
                      Teacher {lesson.teacher}
                    </span>
                  </div>

                  <h3 className="font-semibold text-fg line-clamp-2 group-hover:text-primary transition-colors">
                    {lesson.title}
                  </h3>

                  <p className="text-tiny text-fg-muted line-clamp-2">
                    {lesson.summary}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="mt-4 flex items-center justify-between border-t border-border-default/60 pt-3 text-tiny">
                  <span className="text-fg-muted">
                    {lesson.keyVocabulary.length} palabras • {lesson.timestamps.length} puntos
                  </span>

                  <span className="flex items-center gap-1 font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                    <span>Estudiar</span>
                    <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
