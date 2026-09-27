'use client';

// Planned structure:
// <LessonVocabularyTab>
//   <TabHeader>
//     <SubtitleText />
//     <SaveAllButton />
//   </TabHeader>
//   <VocabularyGrid>
//     <VocabularyCard /> (Word, IPA, definition, quote, audio button, bookmark toggle button)
//   </VocabularyGrid>
// </LessonVocabularyTab>

import { useState } from 'react';
import { Bookmark, BookmarkCheck, Volume2 } from '@/components/icons';
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

  async function handleSaveAll() {
    for (const v of lesson.keyVocabulary) {
      if (!savedWords[v.word]) {
        await handleSaveWord(v.word, v.contextSentence, v.definition, v.ipa);
      }
    }
  }

  const allSaved = lesson.keyVocabulary.length > 0 && lesson.keyVocabulary.every((v) => savedWords[v.word]);

  return (
    <div className="flex flex-col gap-3.5">
      {/* Encabezado con subtexto y botón de Guardar todas */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-body-sm text-fg-muted font-normal">
          Se guardan en tu repaso diario.
        </p>

        <button
          type="button"
          disabled={allSaved}
          onClick={handleSaveAll}
          className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-surface-raised px-4 py-2 text-body-sm font-semibold text-fg shadow-2xs hover:bg-surface-sunken focus-ring cursor-pointer transition-colors disabled:opacity-50"
        >
          {allSaved ? (
            <>
              <BookmarkCheck className="size-4 text-success" />
              <span>Guardadas ({lesson.keyVocabulary.length})</span>
            </>
          ) : (
            <>
              <Bookmark className="size-4 text-fg-muted" />
              <span>Guardar las {lesson.keyVocabulary.length}</span>
            </>
          )}
        </button>
      </div>

      {/* Lista de tarjetas de vocabulario */}
      <div className="flex flex-col gap-3">
        {lesson.keyVocabulary.map((v, idx) => {
          const isSaved = savedWords[v.word];

          return (
            <div
              key={idx}
              className="flex flex-col gap-1.5 rounded-2xl bg-surface-sunken p-4.5 border border-border-subtle/40 shadow-2xs"
            >
              {/* Fila 1: Palabra, IPA y Botones de acción derecha */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <span className="font-extrabold text-fg text-body-lg sm:text-xl">
                    {v.word}
                  </span>
                  {v.ipa && (
                    <span className="font-phonetic text-caption text-fg-muted font-medium">
                      {v.ipa}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => speakWord(v.word)}
                    className="flex size-9 items-center justify-center rounded-full bg-surface-raised border border-border-default text-fg hover:bg-surface-base cursor-pointer focus-ring transition-colors shadow-2xs"
                    aria-label={`Escuchar ${v.word}`}
                  >
                    <Volume2 className="size-4 text-fg" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveWord(v.word, v.contextSentence, v.definition, v.ipa)}
                    className={
                      isSaved
                        ? 'flex size-9 items-center justify-center rounded-full bg-primary text-on-primary shadow-xs cursor-pointer focus-ring transition-colors'
                        : 'flex size-9 items-center justify-center rounded-full bg-surface-raised border border-border-default text-fg hover:bg-surface-base cursor-pointer focus-ring transition-colors shadow-2xs'
                    }
                    aria-label={isSaved ? `Guardada ${v.word}` : `Guardar ${v.word}`}
                  >
                    {isSaved ? (
                      <BookmarkCheck className="size-4 text-on-primary" />
                    ) : (
                      <Bookmark className="size-4 text-fg" />
                    )}
                  </button>
                </div>
              </div>

              {/* Fila 2: Definición */}
              <p className="text-body-sm font-medium text-fg leading-snug">
                {v.definition}
              </p>

              {/* Fila 3: Oración de contexto en cursiva entre comillas */}
              {v.contextSentence && (
                <p className="text-body-sm italic text-fg-muted font-normal leading-relaxed mt-0.5">
                  &ldquo;{v.contextSentence}&rdquo;
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
