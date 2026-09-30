'use client';

// Planned structure:
// <ImmersionLessonCard>
//   <CardContainer>
//     <ImmersionVideoThumbnail ... />
//     <CardBody>
//       <MetaHeader>
//         <CategoryBadge topic={lesson.topic} />
//         <TeacherName teacher={lesson.teacher} />
//       </MetaHeader>
//       <LessonTitle title={lesson.title} />
//       <CardFooterChips>
//         <FocusTag? />
//         <StatusChips? />
//         <StatsChips? />
//         <ActionAffordance? />
//       </CardFooterChips>
//     </CardBody>
//   </CardContainer>
// </ImmersionLessonCard>

import Link from 'next/link';
import { ArrowRight } from '@/components/icons';
import { cn } from '@/lib/cn';
import { ImmersionVideoThumbnail } from '@/components/immersion/ImmersionVideoThumbnail';
import type { ImmersionLesson, ImmersionProgress } from '@/lib/immersion/types';

export interface ImmersionLessonCardProps {
  lesson: ImmersionLesson;
  progress?: ImmersionProgress;
  focusTag?: string;
  customChip?: string;
  className?: string;
}

const TOPIC_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  vocabulary: { label: 'VOCABULARIO', badgeClass: 'bg-coral text-ink font-bold' },
  vocabulario: { label: 'VOCABULARIO', badgeClass: 'bg-coral text-ink font-bold' },
  pronunciation: { label: 'PRONUNCIACIÓN', badgeClass: 'bg-butter text-ink font-bold' },
  pronunciacion: { label: 'PRONUNCIACIÓN', badgeClass: 'bg-butter text-ink font-bold' },
  grammar: { label: 'GRAMÁTICA', badgeClass: 'bg-lilac text-ink font-bold' },
  gramatica: { label: 'GRAMÁTICA', badgeClass: 'bg-lilac text-ink font-bold' },
  'connected-speech': { label: 'CONNECTED SPEECH', badgeClass: 'bg-sky text-ink font-bold' },
  intonation: { label: 'ENTONACIÓN', badgeClass: 'bg-lilac text-ink font-bold' },
  entonacion: { label: 'ENTONACIÓN', badgeClass: 'bg-lilac text-ink font-bold' },
  speaking: { label: 'SPEAKING', badgeClass: 'bg-mint text-ink font-bold' },
  conversation: { label: 'CONVERSACIÓN', badgeClass: 'bg-sky text-ink font-bold' },
  conversacion: { label: 'CONVERSACIÓN', badgeClass: 'bg-sky text-ink font-bold' },
};

export function ImmersionLessonCard({
  lesson,
  progress,
  focusTag,
  customChip,
  className,
}: ImmersionLessonCardProps) {
  const isCompleted = progress?.status === 'completed';
  const isInProgress = progress?.status === 'in_progress';
  const isWatched = progress?.watched ?? false;

  const normalizedTopic = lesson.topic?.toLowerCase().trim() || 'vocabulary';
  const topicInfo = TOPIC_CONFIG[normalizedTopic] ?? {
    label: lesson.topic ? lesson.topic.toUpperCase() : 'LECCIÓN',
    badgeClass: 'bg-sky text-ink font-bold',
  };

  const vocabCount = lesson.keyVocabulary?.length ?? 0;
  const phrasesCount = lesson.targetPhrases?.length ?? 0;
  const timestampsCount = lesson.timestamps?.length ?? 0;

  return (
    <Link
      href={`/practice/immersion/${lesson.slug}`}
      className={cn(
        'group flex flex-col justify-between overflow-hidden rounded-2xl',
        'border border-border-default bg-surface-raised p-2.5',
        'transition-all duration-200 hover:border-primary/50 hover:shadow-xs focus-ring h-full',
        className,
      )}
    >
      {/* Miniatura superior con badge de nivel pill negro y duración (sin alterar imagen real) */}
      <ImmersionVideoThumbnail
        youtubeVideoId={lesson.youtubeVideoId}
        title={lesson.title}
        level={lesson.level}
        durationMinutes={lesson.durationMinutes}
        isWatched={isWatched || isCompleted}
        className="w-full aspect-video"
      />

      {/* Contenido textual con badges pastel vivos y metadata */}
      <div className="flex flex-1 flex-col justify-between pt-3 pb-1 px-1.5">
        <div>
          {/* Fila superior: Badge de tema en color vivo y Profesor */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-tiny tracking-wider uppercase shadow-2xs border border-ink/10',
                topicInfo.badgeClass,
              )}
            >
              {topicInfo.label}
            </span>
            <span className="text-tiny font-medium text-fg-muted">
              Teacher {lesson.teacher}
            </span>
          </div>

          {/* Título de la lección */}
          <h3 className="font-bold text-fg text-body-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors my-2">
            {lesson.title}
          </h3>
        </div>

        {/* Footer chips con estadísticas y estado */}
        <div className="mt-3 flex items-center justify-between gap-1.5 flex-wrap border-t border-border-subtle/50 pt-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {focusTag && (
              <span className="inline-flex items-center rounded-full bg-lilac px-2.5 py-0.5 text-tiny font-bold text-ink border border-ink/15">
                {focusTag}
              </span>
            )}

            {isCompleted && (
              <span className="inline-flex items-center rounded-full bg-feedback-correct-soft px-2.5 py-0.5 text-tiny font-semibold text-feedback-correct border border-feedback-correct/20">
                Completada
              </span>
            )}

            {isInProgress && (
              <span className="inline-flex items-center rounded-full bg-warning-soft px-2.5 py-0.5 text-tiny font-semibold text-warning border border-warning/20">
                En progreso
              </span>
            )}

            {isCompleted && progress?.quizScore != null && (
              <span className="inline-flex items-center rounded-full border border-border-default bg-surface-raised px-2.5 py-0.5 text-tiny text-fg-muted font-medium">
                Quiz {progress.quizScore}%
              </span>
            )}

            {customChip ? (
              <span className="inline-flex items-center rounded-full border border-border-default bg-surface-raised px-2.5 py-0.5 text-tiny text-fg-muted">
                {customChip}
              </span>
            ) : (
              <>
                {vocabCount > 0 && (
                  <span className="inline-flex items-center rounded-full border border-border-default bg-surface-raised px-2.5 py-0.5 text-tiny text-fg-muted">
                    {vocabCount} palabras
                  </span>
                )}
                {phrasesCount > 0 ? (
                  <span className="inline-flex items-center rounded-full border border-border-default bg-surface-raised px-2.5 py-0.5 text-tiny text-fg-muted">
                    {phrasesCount} frases
                  </span>
                ) : timestampsCount > 0 ? (
                  <span className="inline-flex items-center rounded-full border border-border-default bg-surface-raised px-2.5 py-0.5 text-tiny text-fg-muted">
                    {timestampsCount} puntos
                  </span>
                ) : null}
              </>
            )}
          </div>

          {/* Acción textual */}
          <span className="inline-flex items-center gap-1 text-tiny font-semibold text-primary ml-auto transition-colors group-hover:underline">
            <span>{isCompleted ? 'Repasar' : isInProgress ? 'Continuar' : 'Estudiar'}</span>
            <ArrowRight className="size-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
