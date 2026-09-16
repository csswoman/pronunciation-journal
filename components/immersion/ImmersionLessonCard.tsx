'use client';

// Planned structure:
// <ImmersionLessonCard>
//   <ThumbnailContainer>
//     <VideoImage />
//     <DurationBadge />
//     <LevelAndStatusBadges />
//   </ThumbnailContainer>
//   <CardContent>
//     <TopicAndTeacher />
//     <LessonTitle />
//     <LessonSummary />
//   </CardContent>
//   <CardFooter>
//     <LessonStats />
//     <ActionButton />
//   </CardFooter>
// </ImmersionLessonCard>

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Timer } from '@/components/icons';
import Badge from '@/components/ui/Badge';
import type { ImmersionLesson, ImmersionProgress, ImmersionTopic } from '@/lib/immersion/types';

interface ImmersionLessonCardProps {
  lesson: ImmersionLesson;
  progress?: ImmersionProgress;
}

const TOPIC_LABELS: Record<ImmersionTopic, string> = {
  speaking: 'Speaking & Fluidez',
  'connected-speech': 'Connected Speech',
  pronunciation: 'Pronunciación',
  intonation: 'Entonación',
  conversation: 'Conversación',
  vocabulary: 'Vocabulario',
};

export function ImmersionLessonCard({ lesson, progress }: ImmersionLessonCardProps) {
  const isCompleted = progress?.status === 'completed';
  const isInProgress = progress?.status === 'in_progress';

  return (
    <Link
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
          <Badge label={lesson.level} variant="neutral" size="sm" />
          {isCompleted && <Badge label="Completada" variant="success" size="sm" />}
          {isInProgress && <Badge label="En progreso" variant="warning" size="sm" />}
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
            {isCompleted && progress?.quizScore != null
              ? `Quiz ${progress.quizScore}% • ${lesson.keyVocabulary.length} palabras`
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
}
