'use client';

// Planned structure:
// <LessonStudyPanel>
//   <TabNavigation /> (Rounded-full pill navigation buttons)
//   <TimestampsTab /> (Interactive timestamp jump points)
//   <LessonVocabularyTab /> (SRS word saving component)
//   <PhrasesTab /> (Target sentences with IPA and ListenButton)
//   <LessonQuizTab /> (Micro-quiz evaluation component)
// </LessonStudyPanel>

import { useState } from 'react';
import { HelpCircle, Timer, Bookmark } from '@/components/icons';
import { ListenButton } from '@/components/ui/ListenButton';
import { speakWord } from '@/lib/word-bank/speech';
import { useImmersionProgress } from '@/lib/immersion/use-immersion-progress';
import type { ImmersionLesson } from '@/lib/immersion/types';
import { LessonQuizTab } from './LessonQuizTab';
import { LessonVocabularyTab } from './LessonVocabularyTab';

interface LessonStudyPanelProps {
  lesson: ImmersionLesson;
  onSeek: (seconds: number) => void;
}

type TabType = 'timestamps' | 'vocabulary' | 'phrases' | 'quiz';

export function LessonStudyPanel({ lesson, onSeek }: LessonStudyPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('timestamps');
  const { markWatched } = useImmersionProgress(lesson.id);

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border-default bg-surface-raised p-4 shadow-xs sm:p-5">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1.5 border-b border-border-default pb-3.5">
        <button
          type="button"
          onClick={() => setActiveTab('timestamps')}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-body-sm font-medium transition-colors focus-ring ${
            activeTab === 'timestamps'
              ? 'bg-primary-soft text-primary font-semibold'
              : 'text-fg-muted hover:bg-surface-sunken hover:text-fg'
          }`}
        >
          <Timer className="size-4" />
          <span>Puntos clave ({lesson.timestamps.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vocabulary')}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-body-sm font-medium transition-colors focus-ring ${
            activeTab === 'vocabulary'
              ? 'bg-primary-soft text-primary font-semibold'
              : 'text-fg-muted hover:bg-surface-sunken hover:text-fg'
          }`}
        >
          <Bookmark className="size-4" />
          <span>Vocabulario ({lesson.keyVocabulary.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('phrases')}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-body-sm font-medium transition-colors focus-ring ${
            activeTab === 'phrases'
              ? 'bg-primary-soft text-primary font-semibold'
              : 'text-fg-muted hover:bg-surface-sunken hover:text-fg'
          }`}
        >
          <span>Frases ({lesson.targetPhrases.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('quiz')}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-body-sm font-medium transition-colors focus-ring ${
            activeTab === 'quiz'
              ? 'bg-primary-soft text-primary font-semibold'
              : 'text-fg-muted hover:bg-surface-sunken hover:text-fg'
          }`}
        >
          <HelpCircle className="size-4" />
          <span>Comprobación ({lesson.quiz.length})</span>
        </button>
      </div>

      {/* Tab 1: Timestamps */}
      {activeTab === 'timestamps' && (
        <div className="flex flex-col gap-2.5">
          <p className="text-tiny text-fg-muted">
            Toca una marca de tiempo para saltar directamente a la explicación en el video:
          </p>
          <div className="flex flex-col gap-1.5">
            {lesson.timestamps.map((ts, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSeek(ts.seconds)}
                className="group flex w-full items-center justify-between gap-3 rounded-xl border border-transparent p-2.5 text-left transition-colors hover:border-border-default hover:bg-surface-sunken focus-ring"
              >
                <span className="text-body-sm font-medium text-fg group-hover:text-primary">
                  {ts.label}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2.5 py-0.5 font-mono text-tiny font-semibold text-fg-muted group-hover:bg-primary-soft group-hover:text-primary">
                  {formatTime(ts.seconds)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Key Vocabulary */}
      {activeTab === 'vocabulary' && <LessonVocabularyTab lesson={lesson} />}

      {/* Tab 3: Target Phrases (Sentence Mining) */}
      {activeTab === 'phrases' && (
        <div className="flex flex-col gap-3">
          <p className="text-tiny text-fg-muted">
            Frases extraídas de la lección para practicar entonación y enlaces (Connected Speech):
          </p>
          <div className="flex flex-col gap-3">
            {lesson.targetPhrases.map((p, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-2 rounded-2xl border border-border-default bg-surface-sunken p-4 shadow-2xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-fg text-body">{p.phrase}</span>
                  {p.ipa && <span className="font-ipa text-tiny text-primary">{p.ipa}</span>}
                </div>
                {p.note && <p className="text-tiny text-fg-muted">{p.note}</p>}
                <div className="flex justify-end pt-1">
                  <ListenButton
                    label="Escuchar frase"
                    onPlay={() => speakWord(p.phrase)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Micro-Quiz */}
      {activeTab === 'quiz' && (
        <LessonQuizTab lesson={lesson} onQuizComplete={markWatched} />
      )}
    </div>
  );
}
