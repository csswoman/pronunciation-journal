'use client'

// Planned structure:
// <WordDiagnosis>  — por qué falló la palabra elegida
//   <header> «El sonido /ipa/ en «palabra»» + badge de estado
//   <p> diagnóstico
//   <WordAudioActions />
//   <SoundHowTo />

import { cn } from '@/lib/cn'
import type { WordFeedback } from '@/lib/pronunciation/feedback/word-feedback'
import { SoundHowTo } from './SoundHowTo'
import { WordAudioActions } from './WordAudioActions'
import { WORD_TONE } from './word-feedback-tone'

interface Props {
  word: WordFeedback
  userAudioUrl?: string | null
  /** «Cómo se hace» abierto de entrada (variante completa). */
  howToOpen: boolean
}

export function WordDiagnosis({ word, userAudioUrl, howToOpen }: Props) {
  const tone = WORD_TONE[word.state]
  const { fix } = word

  return (
    <section
      aria-label={fix?.diagPlain ?? word.note ?? `Diagnóstico de ${word.text}`}
      className={cn('flex animate-fadeIn flex-col gap-3 rounded-l-3xl border-l-[3px] py-1 pl-5', tone.bracket)}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 flex flex-wrap items-center gap-2 font-display text-lg font-bold text-fg">
          {fix ? (
            <>
              <span>El sonido</span>
              <span className={cn('rounded-full px-3 py-0.5 font-phonetic text-body-md text-ink', tone.fill)}>
                {fix.ipa}
              </span>
              <span>en «{word.text}»</span>
            </>
          ) : (
            <span>La palabra «{word.text}»</span>
          )}
        </p>
        <span className={cn('rounded-full px-3 py-1 text-caption font-bold text-ink', tone.fill)}>
          {word.extra ? 'Sobra' : tone.label}
        </span>
      </header>

      <p className="m-0 text-body-sm leading-relaxed text-fg-muted">
        {fix
          ? fix.diag.map((seg, i) =>
              seg.emphasis ? (
                <span key={i} className="font-bold text-fg">{seg.text}</span>
              ) : (
                <span key={i}>{seg.text}</span>
              ),
            )
          : word.note}
      </p>

      <WordAudioActions word={word} userAudioUrl={userAudioUrl} />

      {fix && <SoundHowTo fix={fix} state={word.state} defaultOpen={howToOpen} />}
    </section>
  )
}
