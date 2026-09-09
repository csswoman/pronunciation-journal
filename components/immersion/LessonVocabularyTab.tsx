'use client';

import { useState } from 'react';
import { Bookmark, BookmarkCheck, Volume2 } from '@/components/icons';
import Button from '@/components/ui/Button';
import { quickAddWord } from '@/lib/word-bank/queries';
import { speakWord } from '@/lib/word-bank/speech';
import type { ImmersionLesson } from '@/lib/immersion/types';

interface LessonVocabularyTabProps {
  lesson: ImmersionLesson;
}

/** Pestaña de vocabulario clave: guarda palabras en el banco (SRS) desde la lección. */
export function LessonVocabularyTab({ lesson }: LessonVocabularyTabProps) {
  const [savedWords, setSavedWords] = useState<Record<string, boolean>>({});
  const [savingWord, setSavingWord] = useState<string | null>(null);

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
      console.error('[LessonVocabularyTab] Error saving word:', err);
    } finally {
      setSavingWord(null);
    }
  }

  return (
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
  );
}
