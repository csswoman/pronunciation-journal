'use client';

// Planned structure:
// <LessonPhrasesTab>
//   <PhrasesHeader /> (Subtitle: Frases del vídeo para practicar...)
//   <PhrasesList>
//     <PhraseCard /> (Phrase, IPA, explanation note, connected-speech link chip, Listen & Save buttons)
//   </PhrasesList>
// </LessonPhrasesTab>

import { useState } from 'react';
import { Bookmark, BookmarkCheck, Volume2 } from '@/components/icons';
import { speakWord } from '@/lib/word-bank/speech';
import { quickAddWord } from '@/lib/word-bank/queries';
import type { ImmersionLesson } from '@/lib/immersion/types';

interface LessonPhrasesTabProps {
  lesson: ImmersionLesson;
}

export function LessonPhrasesTab({ lesson }: LessonPhrasesTabProps) {
  const [savedPhrases, setSavedPhrases] = useState<Record<string, boolean>>({});
  const [savingPhrase, setSavingPhrase] = useState<string | null>(null);

  async function handleSavePhrase(phrase: string, note?: string, ipa?: string) {
    if (savingPhrase || savedPhrases[phrase]) return;
    setSavingPhrase(phrase);
    try {
      await quickAddWord({
        text: phrase,
        context: note ?? phrase,
        source: 'reader',
        enrichment: {
          meaning: note ?? '',
          translation: note ?? '',
          example: phrase,
          ipa: ipa ?? '',
          synonyms: [],
          image_prompt: '',
        },
      });
      setSavedPhrases((prev) => ({ ...prev, [phrase]: true }));
    } catch (err) {
      console.error('[LessonPhrasesTab] Error saving phrase:', err);
    } finally {
      setSavingPhrase(null);
    }
  }

  function getLinkSnippet(phrase: string): string | null {
    const words = phrase.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/);
    if (words.length >= 2) {
      return words.slice(0, 3).join('_');
    }
    return null;
  }

  return (
    <div className="flex flex-col gap-3.5">
      <p className="text-body-sm text-fg-muted font-normal">
        Frases del vídeo para practicar la entonación y los enlaces.
      </p>

      <div className="flex flex-col gap-3">
        {lesson.targetPhrases.map((p, idx) => {
          const isSaved = savedPhrases[p.phrase];
          const isSaving = savingPhrase === p.phrase;
          const linkSnippet = getLinkSnippet(p.phrase);

          return (
            <div
              key={idx}
              className="flex flex-col gap-2 rounded-2xl bg-surface-sunken p-4.5 border border-border-subtle/40 shadow-2xs"
            >
              <h4 className="font-extrabold text-fg text-body sm:text-body-lg leading-snug">
                {p.phrase}
              </h4>

              {p.ipa && (
                <p className="font-phonetic text-caption text-fg-muted font-medium">
                  {p.ipa}
                </p>
              )}

              {p.note && (
                <p className="text-body-sm text-fg-muted leading-relaxed">
                  {p.note}
                </p>
              )}

              {/* Acciones e indicador de enlace en la parte inferior */}
              <div className="mt-1 flex flex-wrap items-center justify-between gap-2.5 pt-1">
                {linkSnippet ? (
                  <span className="inline-flex items-center rounded-full bg-sky-soft text-ink px-3 py-1 text-tiny font-mono font-medium border border-sky-deep/20">
                    enlaza: {linkSnippet}
                  </span>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => speakWord(p.phrase)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-surface-raised px-3.5 py-1.5 text-body-sm font-semibold text-fg shadow-xs hover:bg-surface-sunken cursor-pointer focus-ring transition-colors"
                  >
                    <Volume2 className="size-4 text-fg-muted" />
                    <span>Escuchar</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSaving || isSaved}
                    onClick={() => handleSavePhrase(p.phrase, p.note, p.ipa)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-surface-raised px-3.5 py-1.5 text-body-sm font-semibold text-fg shadow-xs hover:bg-surface-sunken cursor-pointer focus-ring transition-colors disabled:opacity-50"
                  >
                    {isSaved ? (
                      <>
                        <BookmarkCheck className="size-4 text-success" />
                        <span>Guardada</span>
                      </>
                    ) : isSaving ? (
                      '...'
                    ) : (
                      <>
                        <Bookmark className="size-4 text-fg-muted" />
                        <span>Guardar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
