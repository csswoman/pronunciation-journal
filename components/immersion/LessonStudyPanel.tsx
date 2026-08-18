'use client';

import { useState } from 'react';
import { Bookmark, BookmarkCheck, Check, HelpCircle, Timer, Volume2 } from '@/components/icons';
import Button from '@/components/ui/Button';
import { quickAddWord } from '@/lib/word-bank/queries';
import { speakWord } from '@/lib/word-bank/speech';
import type { ImmersionLesson } from '@/lib/immersion/types';

interface LessonStudyPanelProps {
  lesson: ImmersionLesson;
  onSeek: (seconds: number) => void;
}

type TabType = 'timestamps' | 'vocabulary' | 'phrases' | 'quiz';

export function LessonStudyPanel({ lesson, onSeek }: LessonStudyPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('timestamps');
  const [savedWords, setSavedWords] = useState<Record<string, boolean>>({});
  const [savingWord, setSavingWord] = useState<string | null>(null);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  async function handleSaveWord(word: string, contextSentence: string, definition: string, ipa: string) {
    if (savingWord || savedWords[word]) return;
    setSavingWord(word);
    try {
      await quickAddWord({
        text: word,
        context: contextSentence,
        source: 'reader',
        enrichment: {
          meaning: definition,
          translation: definition,
          example: contextSentence,
          ipa,
          synonyms: [],
          image_prompt: '',
        },
      });
      setSavedWords((prev) => ({ ...prev, [word]: true }));
    } catch (err) {
      console.error('[LessonStudyPanel] Error saving word:', err);
    } finally {
      setSavingWord(null);
    }
  }

  function handleSelectOption(questionId: string, optionIndex: number) {
    if (quizSubmitted[questionId]) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    setQuizSubmitted((prev) => ({ ...prev, [questionId]: true }));
  }

  return (
    <div className="flex flex-col gap-4 rounded-card-interactive border border-border-default bg-surface-raised p-4 shadow-sm sm:p-5">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 border-b border-border-default pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('timestamps')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-body-sm font-medium transition-colors focus-ring ${
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
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-body-sm font-medium transition-colors focus-ring ${
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
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-body-sm font-medium transition-colors focus-ring ${
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
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-body-sm font-medium transition-colors focus-ring ${
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
        <div className="flex flex-col gap-2">
          <p className="text-tiny text-fg-muted">
            Toca una marca de tiempo para saltar directamente a la explicación en el video:
          </p>
          <div className="divide-y divide-border-default/60">
            {lesson.timestamps.map((ts, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSeek(ts.seconds)}
                className="group flex w-full items-center justify-between gap-3 py-2.5 text-left transition-colors hover:text-primary focus-ring"
              >
                <span className="text-body-sm font-medium text-fg group-hover:text-primary">
                  {ts.label}
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-surface-sunken px-2 py-0.5 font-mono text-tiny font-semibold text-fg-muted group-hover:bg-primary-soft group-hover:text-primary">
                  {formatTime(ts.seconds)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Key Vocabulary ($i+1) */}
      {activeTab === 'vocabulary' && (
        <div className="flex flex-col gap-3">
          <p className="text-tiny text-fg-muted">
            Vocabulario esencial explicado en la lección. Guárdalo para repasar en tu ciclo diario (SRS):
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {lesson.keyVocabulary.map((v, idx) => {
              const isSaved = savedWords[v.word];
              const isSaving = savingWord === v.word;

              return (
                <div
                  key={idx}
                  className="flex flex-col justify-between gap-2.5 rounded-lg border border-border-default bg-surface-sunken p-3.5"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-fg">{v.word}</span>
                      <span className="font-ipa text-tiny text-fg-muted">{v.ipa}</span>
                    </div>
                    <p className="text-body-sm text-fg-muted">{v.definition}</p>
                    <p className="border-l-2 border-primary/40 pl-2 text-tiny italic text-fg-subtle">
                      &quot;{v.contextSentence}&quot;
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => speakWord(v.word)}
                      className="inline-flex items-center gap-1 text-tiny text-fg-muted hover:text-primary focus-ring"
                    >
                      <Volume2 className="size-3.5" />
                      <span>Escuchar</span>
                    </button>

                    <Button
                      variant={isSaved ? 'outline' : 'secondary'}
                      size="sm"
                      disabled={isSaving || isSaved}
                      onClick={() => handleSaveWord(v.word, v.contextSentence, v.definition, v.ipa)}
                    >
                      {isSaved ? (
                        <>
                          <BookmarkCheck className="size-3.5 text-success" />
                          <span>Guardada</span>
                        </>
                      ) : isSaving ? (
                        'Guardando...'
                      ) : (
                        <>
                          <Bookmark className="size-3.5" />
                          <span>Guardar</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Target Phrases (Sentence Mining) */}
      {activeTab === 'phrases' && (
        <div className="flex flex-col gap-3">
          <p className="text-tiny text-fg-muted">
            Frases extraídas de la lección para practicar entonación y enlaces (Connected Speech):
          </p>
          <div className="flex flex-col gap-2.5">
            {lesson.targetPhrases.map((p, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-1.5 rounded-lg border border-border-default bg-surface-sunken p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-fg text-body">{p.phrase}</span>
                  {p.ipa && <span className="font-ipa text-tiny text-primary">{p.ipa}</span>}
                </div>
                {p.note && <p className="text-tiny text-fg-muted">{p.note}</p>}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => speakWord(p.phrase)}
                    className="inline-flex items-center gap-1.5 text-tiny text-fg-muted hover:text-primary focus-ring"
                  >
                    <Volume2 className="size-3.5" />
                    <span>Escuchar frase</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Micro-Quiz */}
      {activeTab === 'quiz' && (
        <div className="flex flex-col gap-4">
          <p className="text-tiny text-fg-muted">
            Comprueba tu comprensión del concepto enseñado por Teacher {lesson.teacher}:
          </p>

          {lesson.quiz.map((q, qIdx) => {
            const isSubmitted = quizSubmitted[q.id];
            const selected = selectedAnswers[q.id];

            return (
              <div
                key={q.id}
                className="flex flex-col gap-3 rounded-lg border border-border-default bg-surface-sunken p-4"
              >
                <p className="font-semibold text-fg">
                  {qIdx + 1}. {q.question}
                </p>

                <div className="flex flex-col gap-2">
                  {q.options.map((opt, optIdx) => {
                    const isOptionSelected = selected === optIdx;
                    const isCorrect = optIdx === q.correctIndex;

                    let optionClasses =
                      'flex items-center justify-between gap-2 rounded-md border border-border-default bg-surface-raised px-3 py-2.5 text-body-sm text-left transition-colors focus-ring';

                    if (isSubmitted) {
                      if (isCorrect) {
                        optionClasses =
                          'flex items-center justify-between gap-2 rounded-md border border-success bg-badge-success-bg text-success font-medium px-3 py-2.5 text-body-sm text-left';
                      } else if (isOptionSelected) {
                        optionClasses =
                          'flex items-center justify-between gap-2 rounded-md border border-error bg-badge-error-bg text-error font-medium px-3 py-2.5 text-body-sm text-left';
                      } else {
                        optionClasses += ' opacity-50';
                      }
                    } else {
                      optionClasses += ' hover:bg-surface-sunken hover:border-primary/50';
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        disabled={isSubmitted}
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        className={optionClasses}
                      >
                        <span>{opt}</span>
                        {isSubmitted && isCorrect && <Check className="size-4 shrink-0 text-success" />}
                      </button>
                    );
                  })}
                </div>

                {isSubmitted && (
                  <div className="mt-1 rounded-md bg-surface-raised p-3 text-tiny text-fg-muted border-l-2 border-primary">
                    <p className="font-semibold text-fg mb-0.5">Explicación:</p>
                    <p>{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
