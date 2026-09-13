'use client';

// Planned structure:
// <LessonVocabularyTab>
//   <VocabularyGrid>
//     <VocabularyCard /> (Word, IPA, definition, rounded quote box, ListenButton & save button)
//   </VocabularyGrid>
// </LessonVocabularyTab>

import { useState } from 'react';
import { Bookmark, BookmarkCheck } from '@/components/icons';
import Button from '@/components/ui/Button';
import { ListenButton } from '@/components/ui/ListenButton';
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
              className="flex flex-col justify-between gap-3 rounded-2xl border border-border-default bg-surface-sunken p-4 shadow-2xs"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-fg text-body">{v.word}</span>
                  <span className="font-ipa text-tiny text-primary">{v.ipa}</span>
                </div>
                <p className="text-body-sm text-fg-muted">{v.definition}</p>
                <div className="rounded-xl bg-surface-raised/80 px-3 py-2 text-tiny italic text-fg-muted border border-border-subtle">
                  &quot;{v.contextSentence}&quot;
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border-subtle">
                <ListenButton
                  iconOnly
                  label={`Escuchar ${v.word}`}
                  onPlay={() => speakWord(v.word)}
                />

                <Button
                  variant={isSaved ? 'soft' : 'secondary'}
                  size="sm"
                  className="rounded-full"
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
