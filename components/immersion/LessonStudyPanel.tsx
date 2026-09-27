'use client';

// Planned structure:
// <LessonStudyPanel>
//   <TabNavigation /> (Segmented control pill navigation bar with active purple outline)
//   <TabContent>
//     <TimestampsTab /> (Interactive timestamp jump points with black play pills)
//     <LessonVocabularyTab /> (SRS word saving component with audio & bookmark buttons)
//     <LessonPhrasesTab /> (Target sentences with connected-speech chips)
//     <LessonQuizTab /> (Micro-quiz evaluation component in PastelCard tone="butter")
//   </TabContent>
//   <FooterHintBanner /> (Yellow banner: Al terminar el vídeo, pasa a Comprobación...)
// </LessonStudyPanel>

import { useState } from 'react';
import { Play } from '@/components/icons';
import type { ImmersionLesson } from '@/lib/immersion/types';
import { LessonQuizTab } from './LessonQuizTab';
import { LessonVocabularyTab } from './LessonVocabularyTab';
import { LessonPhrasesTab } from './LessonPhrasesTab';
import type { ImmersionQuizAttemptInput } from '@/lib/immersion/progress-queries';

interface LessonStudyPanelProps {
  lesson: ImmersionLesson;
  onSeek: (seconds: number) => void;
  onQuizComplete: (attempt: Omit<ImmersionQuizAttemptInput, 'lessonId'>) => Promise<void>;
}

type TabType = 'timestamps' | 'vocabulary' | 'phrases' | 'quiz';

export function LessonStudyPanel({ lesson, onSeek, onQuizComplete }: LessonStudyPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('timestamps');

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  const timestampsCount = lesson.timestamps.length;
  const vocabCount = lesson.keyVocabulary.length;
  const phrasesCount = lesson.targetPhrases.length;
  const quizCount = lesson.quiz.length;

  return (
    <div className="flex flex-col justify-between gap-4 rounded-3xl border border-border-default bg-surface-raised p-4 sm:p-5 shadow-xs h-full">
      <div className="flex flex-col gap-4">
        {/* Tab Navigation Pill Bar - Single Row Grid */}
        <div className="grid grid-cols-4 gap-1 sm:gap-1.5 rounded-full border border-border-default/80 bg-surface-raised p-1.5 px-2.5 sm:px-3 shadow-2xs w-full">
          <button
            type="button"
            onClick={() => setActiveTab('timestamps')}
            className={
              activeTab === 'timestamps'
                ? 'inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-full border-2 border-primary bg-lilac-soft text-primary font-bold px-2 sm:px-3 py-1.5 text-caption sm:text-body-sm shadow-xs transition-colors cursor-pointer whitespace-nowrap'
                : 'inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-3 py-1.5 text-caption sm:text-body-sm font-semibold text-fg-muted hover:text-fg transition-colors cursor-pointer whitespace-nowrap'
            }
          >
            <span>Puntos clave</span>
            <span
              className={
                activeTab === 'timestamps'
                  ? 'inline-flex items-center justify-center rounded-full bg-primary text-on-primary px-1.5 py-0.5 text-tiny font-extrabold min-w-[18px]'
                  : 'inline-flex items-center justify-center rounded-full bg-primary/15 text-primary dark:bg-primary/25 dark:text-lilac-light px-1.5 py-0.5 text-tiny font-extrabold min-w-[18px]'
              }
            >
              {timestampsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vocabulary')}
            className={
              activeTab === 'vocabulary'
                ? 'inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-full border-2 border-primary bg-lilac-soft text-primary font-bold px-2 sm:px-3 py-1.5 text-caption sm:text-body-sm shadow-xs transition-colors cursor-pointer whitespace-nowrap'
                : 'inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-3 py-1.5 text-caption sm:text-body-sm font-semibold text-fg-muted hover:text-fg transition-colors cursor-pointer whitespace-nowrap'
            }
          >
            <span>Vocabulario</span>
            <span
              className={
                activeTab === 'vocabulary'
                  ? 'inline-flex items-center justify-center rounded-full bg-primary text-on-primary px-1.5 py-0.5 text-tiny font-extrabold min-w-[18px]'
                  : 'inline-flex items-center justify-center rounded-full bg-primary/15 text-primary dark:bg-primary/25 dark:text-lilac-light px-1.5 py-0.5 text-tiny font-extrabold min-w-[18px]'
              }
            >
              {vocabCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('phrases')}
            className={
              activeTab === 'phrases'
                ? 'inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-full border-2 border-primary bg-lilac-soft text-primary font-bold px-2 sm:px-3 py-1.5 text-caption sm:text-body-sm shadow-xs transition-colors cursor-pointer whitespace-nowrap'
                : 'inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-3 py-1.5 text-caption sm:text-body-sm font-semibold text-fg-muted hover:text-fg transition-colors cursor-pointer whitespace-nowrap'
            }
          >
            <span>Frases</span>
            <span
              className={
                activeTab === 'phrases'
                  ? 'inline-flex items-center justify-center rounded-full bg-primary text-on-primary px-1.5 py-0.5 text-tiny font-extrabold min-w-[18px]'
                  : 'inline-flex items-center justify-center rounded-full bg-primary/15 text-primary dark:bg-primary/25 dark:text-lilac-light px-1.5 py-0.5 text-tiny font-extrabold min-w-[18px]'
              }
            >
              {phrasesCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quiz')}
            className={
              activeTab === 'quiz'
                ? 'inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-full border-2 border-primary bg-lilac-soft text-primary font-bold px-2 sm:px-3 py-1.5 text-caption sm:text-body-sm shadow-xs transition-colors cursor-pointer whitespace-nowrap'
                : 'inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-3 py-1.5 text-caption sm:text-body-sm font-semibold text-fg-muted hover:text-fg transition-colors cursor-pointer whitespace-nowrap'
            }
          >
            <span>Comprobación</span>
            <span
              className={
                activeTab === 'quiz'
                  ? 'inline-flex items-center justify-center rounded-full bg-primary text-on-primary px-1.5 py-0.5 text-tiny font-extrabold min-w-[18px]'
                  : 'inline-flex items-center justify-center rounded-full bg-primary/15 text-primary dark:bg-primary/25 dark:text-lilac-light px-1.5 py-0.5 text-tiny font-extrabold min-w-[18px]'
              }
            >
              {quizCount}
            </span>
          </button>
        </div>

        {/* Tab 1: Timestamps ("Puntos clave") */}
        {activeTab === 'timestamps' && (
          <div className="flex flex-col gap-3">
            <p className="text-body-sm text-fg-muted font-normal">
              Toca una marca para saltar a ese momento del vídeo.
            </p>
            <div className="flex flex-col gap-2.5">
              {lesson.timestamps.map((ts, idx) => {
                const isActiveTimestamp = idx === 0;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSeek(ts.seconds)}
                    className={
                      isActiveTimestamp
                        ? 'flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-primary bg-lilac-soft/80 dark:bg-lilac/25 p-3.5 text-left transition-colors cursor-pointer focus-ring shadow-2xs'
                        : 'flex w-full items-center justify-between gap-3 rounded-2xl bg-surface-raised border border-border-default dark:bg-slate-800/80 dark:border-slate-700 p-3.5 text-left transition-colors hover:bg-lilac-soft/20 hover:border-primary/50 dark:hover:bg-slate-800 dark:hover:border-primary/60 cursor-pointer focus-ring shadow-2xs'
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary text-on-primary px-3 py-1 font-mono text-body-sm font-extrabold shadow-xs">
                        <Play className="size-3 fill-current" />
                        <span>{formatTime(ts.seconds)}</span>
                      </span>
                      <div className="flex flex-col">
                        <span className="text-body-sm font-bold text-fg">
                          {ts.label}
                        </span>
                        {ts.description && (
                          <span className="text-tiny text-fg-muted font-medium">
                            {ts.description}
                          </span>
                        )}
                      </div>
                    </div>

                    {isActiveTimestamp && (
                      <span className="font-extrabold text-tiny rounded-full bg-primary text-on-primary px-2.5 py-0.5 uppercase tracking-wider shrink-0 shadow-2xs">
                        AHORA
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Key Vocabulary */}
        {activeTab === 'vocabulary' && <LessonVocabularyTab lesson={lesson} />}

        {/* Tab 3: Target Phrases */}
        {activeTab === 'phrases' && <LessonPhrasesTab lesson={lesson} />}

        {/* Tab 4: Micro-Quiz */}
        {activeTab === 'quiz' && (
          <LessonQuizTab
            lesson={lesson}
            onQuizComplete={onQuizComplete}
            onSeekToVideo={onSeek}
          />
        )}
      </div>

      {/* Yellow Footer Banner matching image 1 (when not in quiz tab) */}
      {activeTab !== 'quiz' && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-butter-soft text-ink px-4 py-3 text-caption font-semibold border border-butter-deep/30 shadow-2xs">
          <span>
            <strong>Al terminar el vídeo</strong>, pasa a Comprobación: son {quizCount} preguntas.
          </span>
        </div>
      )}
    </div>
  );
}
