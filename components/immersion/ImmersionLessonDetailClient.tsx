'use client';

// Planned structure:
// <ImmersionLessonDetailClient>
//   <LessonDetailHeader /> (Breadcrumb, level & duration badges, kicker, title & subtitle)
//   <LessonDetailContent>
//     <YouTubeLessonPlayer /> (Left column: 16:9 player + teacher attribution & watch action)
//     <LessonStudyPanel /> (Right column: tabs for timestamps, vocabulary, phrases, quiz)
//   </LessonDetailContent>
// </ImmersionLessonDetailClient>

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Timer } from '@/components/icons';
import { YouTubeLessonPlayer, type YouTubePlayerHandle } from './YouTubeLessonPlayer';
import { LessonStudyPanel } from './LessonStudyPanel';
import type { ImmersionLesson } from '@/lib/immersion/types';
import { useImmersionProgress } from '@/lib/immersion/use-immersion-progress';

interface ImmersionLessonDetailClientProps {
  lesson: ImmersionLesson;
}

export function ImmersionLessonDetailClient({ lesson }: ImmersionLessonDetailClientProps) {
  const playerRef = useRef<YouTubePlayerHandle>(null);
  const { markWatched, recordQuiz } = useImmersionProgress(lesson.id);

  function handleSeekTo(seconds: number) {
    playerRef.current?.seekTo(seconds);
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1440px] mx-auto w-full">
      {/* Top Navigation & Header Metadata Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default/60 pb-3.5">
        <Link
          href="/practice/immersion"
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-body-sm font-semibold text-fg-muted transition-colors hover:bg-surface-raised hover:text-fg focus-ring border border-transparent hover:border-border-default"
        >
          <ArrowLeft className="size-4" />
          <span>Catálogo de Inmersión</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center rounded-full border border-sky/30 bg-sky-soft text-sky-deep dark:bg-sky-deep/20 dark:text-sky-light px-4 py-1.5 text-body-sm font-extrabold shadow-2xs">
            Nivel {lesson.level}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-lilac-soft text-primary-hover dark:bg-lilac/20 dark:text-lilac-light px-4 py-1.5 text-body-sm font-extrabold shadow-2xs">
            <Timer className="size-4 text-primary" />
            <span>{lesson.durationMinutes} min</span>
          </span>
        </div>
      </div>

      {/* Lesson Header Details */}
      <div className="flex flex-col gap-2 max-w-5xl">
        <span className="font-mono text-caption font-bold uppercase tracking-wider text-primary">
          TEACHER {lesson.teacher.toUpperCase()} · ENGVID
        </span>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-fg tracking-tight leading-tight">
          {lesson.title}
        </h1>
        {lesson.summary && (
          <p className="mt-1 text-body-lg text-fg-muted leading-relaxed">
            {lesson.summary}
          </p>
        )}
      </div>

      {/* Main 2-Column Responsive Layout (Video + Study Panel) */}
      <div className="grid gap-6 xl:gap-8 lg:grid-cols-12 items-start">
        {/* Left Column: YouTube Embed + Teacher Attribution Bar (7 cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <YouTubeLessonPlayer
            ref={playerRef}
            lesson={lesson}
            onMarkWatched={markWatched}
          />
        </div>

        {/* Right Column: Interactive Study Panel (5 cols on desktop) */}
        <div className="lg:col-span-5">
          <LessonStudyPanel
            lesson={lesson}
            onSeek={handleSeekTo}
            onQuizComplete={recordQuiz}
          />
        </div>
      </div>
    </div>
  );
}
