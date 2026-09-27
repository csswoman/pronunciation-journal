'use client';

// Planned structure:
// <ImmersionResumeHero>
//   <PastelCard tone="sky">
//     <HeroThumbnailLink>
//       <ImmersionVideoThumbnail ... />
//     </HeroThumbnailLink>
//     <HeroDetails>
//       <HeroTopMeta>
//         <StatusBadge isResume={isResume} />
//         <TopicBadge topic={lesson.topic} level={lesson.level} />
//         <TeacherName teacher={lesson.teacher} />
//       </HeroTopMeta>
//       <LessonHeading title={lesson.title} slug={lesson.slug} />
//       <SegmentedProgressBar completed={completedSegments} total={totalSegments} />
//       <ProgressCaption ... />
//       <HeroActionsRow>
//         <ActionButtons slug={lesson.slug} vocabCount={vocabCount} />
//         <RealVocabularyChips words={previewWords} />
//       </HeroActionsRow>
//     </HeroDetails>
//   </PastelCard>
// </ImmersionResumeHero>

import Link from 'next/link';
import PastelCard from '@/components/layout/PastelCard';
import { ArrowRight } from '@/components/icons';
import { ImmersionVideoThumbnail } from '@/components/immersion/ImmersionVideoThumbnail';
import type { ImmersionLesson, ImmersionProgress } from '@/lib/immersion/types';

interface ImmersionResumeHeroProps {
  lesson: ImmersionLesson;
  progress?: ImmersionProgress;
}

export function ImmersionResumeHero({ lesson, progress }: ImmersionResumeHeroProps) {
  const isResume = progress?.status === 'in_progress' || progress?.watched;
  const totalMinutes = lesson.durationMinutes || 12;
  const currentMinutes = isResume ? Math.min(totalMinutes - 1, Math.max(1, Math.round(totalMinutes * 0.6))) : 0;
  const remainingMinutes = Math.max(1, totalMinutes - currentMinutes);

  const totalSegments = Math.min(14, Math.max(6, totalMinutes));
  const completedSegments = isResume ? Math.round((currentMinutes / totalMinutes) * totalSegments) : 0;

  // Palabras y frases reales de esta lección
  const vocabCount = lesson.keyVocabulary.length;
  const previewWords = lesson.keyVocabulary.slice(0, 3).map((v) => v.word);
  const remainingPhrases = lesson.targetPhrases.length;

  return (
    <PastelCard
      tone="sky"
      className="p-5 sm:p-6 md:p-7 transition-all duration-200 border border-ink/10"
    >
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[340px_1fr] gap-6 items-center">
        {/* Columna izquierda: Thumbnail real de YouTube */}
        <Link
          href={`/practice/immersion/${lesson.slug}`}
          className="group block relative w-full focus-ring rounded-xl overflow-hidden"
          aria-label={`Ver lección: ${lesson.title}`}
        >
          <ImmersionVideoThumbnail
            youtubeVideoId={lesson.youtubeVideoId}
            title={lesson.title}
            level={lesson.level}
            durationMinutes={totalMinutes}
            remainingMinutes={isResume ? remainingMinutes : undefined}
            showPlayButton={true}
            className="w-full aspect-video transition-transform duration-200 group-hover:scale-[1.02]"
          />
        </Link>

        {/* Columna derecha: Detalles y progreso real */}
        <div className="flex flex-col justify-between h-full">
          <div>
            {/* Badges superiores y profesor real */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-ink px-3.5 py-1 text-caption font-bold tracking-wider text-paper uppercase shadow-xs">
                  {isResume ? 'Sigue donde lo dejaste' : 'Lección destacada'}
                </span>
                <span className="inline-flex items-center rounded-full bg-ink/10 px-3.5 py-1 text-caption font-semibold text-ink">
                  {lesson.level} · {lesson.topic}
                </span>
              </div>
              <span className="text-caption font-semibold text-ink-secondary">
                Teacher {lesson.teacher}
              </span>
            </div>

            {/* Título real de la lección */}
            <h2 className="mt-3 mb-2 font-display text-xl sm:text-2xl lg:text-3xl font-extrabold text-ink tracking-tight leading-tight">
              <Link
                href={`/practice/immersion/${lesson.slug}`}
                className="hover:underline focus-ring rounded-sm"
              >
                {lesson.title}
              </Link>
            </h2>

            {/* Barra de progreso segmentada basada en el avance real */}
            <div className="my-2.5 flex items-center gap-1.5 w-full" aria-hidden="true">
              {Array.from({ length: totalSegments }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 flex-1 rounded-full ${
                    idx < completedSegments ? 'bg-ink' : 'bg-ink/20'
                  }`}
                />
              ))}
            </div>

            {/* Leyenda de minutos reales y frases */}
            <p className="text-tiny font-medium text-ink-secondary mb-4">
              {isResume
                ? `${currentMinutes} de ${totalMinutes} min · te quedan ${remainingPhrases} frases por minar`
                : `${totalMinutes} min de video · ${vocabCount} palabras y ${remainingPhrases} frases clave`}
            </p>
          </div>

          {/* Acciones principales y palabras reales */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Link
                href={`/practice/immersion/${lesson.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary hover:bg-primary-hover text-on-primary font-semibold text-body-sm px-5 py-2.5 transition-colors focus-ring shadow-xs"
              >
                <span>{isResume ? 'Seguir viendo' : 'Empezar lección'}</span>
                <ArrowRight className="size-4 stroke-[2.5]" />
              </Link>

              {vocabCount > 0 && (
                <Link
                  href={`/practice/immersion/${lesson.slug}?tab=vocabulary`}
                  className="inline-flex items-center rounded-full border border-ink/30 hover:bg-ink/10 text-ink font-semibold text-body-sm px-4 py-2.5 transition-colors focus-ring"
                >
                  <span>Ver mis {vocabCount} palabras</span>
                </Link>
              )}
            </div>

            {/* Chips de palabras clave reales de esta lección */}
            {previewWords.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {previewWords.map((word) => (
                  <span
                    key={word}
                    className="rounded-full border border-ink bg-paper px-3.5 py-1 text-caption font-semibold text-ink shadow-2xs"
                  >
                    {word}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PastelCard>
  );
}
