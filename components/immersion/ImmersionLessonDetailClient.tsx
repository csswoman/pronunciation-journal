'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Timer } from '@/components/icons';
import Badge from '@/components/ui/Badge';
import { YouTubeLessonPlayer, type YouTubePlayerHandle } from './YouTubeLessonPlayer';
import { LessonStudyPanel } from './LessonStudyPanel';
import type { ImmersionLesson } from '@/lib/immersion/types';

interface ImmersionLessonDetailClientProps {
  lesson: ImmersionLesson;
}

export function ImmersionLessonDetailClient({ lesson }: ImmersionLessonDetailClientProps) {
  const playerRef = useRef<YouTubePlayerHandle>(null);

  function handleSeekTo(seconds: number) {
    playerRef.current?.seekTo(seconds);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Breadcrumb & Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default pb-4">
        <Link
          href="/practice/immersion"
          className="inline-flex items-center gap-2 text-body-sm font-medium text-fg-muted transition-colors hover:text-fg focus-ring"
        >
          <ArrowLeft className="size-4" />
          <span>Volver al Catálogo de Inmersión</span>
        </Link>

        <div className="flex items-center gap-2">
          <Badge label={`Nivel ${lesson.level}`} color={lesson.level.startsWith('A') ? 'emerald' : 'sky'} size="sm" />
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2.5 py-0.5 text-tiny font-mono text-fg-muted">
            <Timer className="size-3" />
            <span>{lesson.durationMinutes} min</span>
          </span>
        </div>
      </div>

      {/* Lesson Header */}
      <div>
        <h1 className="text-display-sm font-bold text-fg md:text-display-md">
          {lesson.title}
        </h1>
        <p className="mt-1 text-body text-fg-muted">
          {lesson.summary}
        </p>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Official YouTube Embed + Creator Attribution (7 cols on desktop) */}
        <div className="lg:col-span-7">
          <YouTubeLessonPlayer ref={playerRef} lesson={lesson} />
        </div>

        {/* Right Column: Interactive Study Panel (5 cols on desktop) */}
        <div className="lg:col-span-5">
          <LessonStudyPanel lesson={lesson} onSeek={handleSeekTo} />
        </div>
      </div>
    </div>
  );
}
