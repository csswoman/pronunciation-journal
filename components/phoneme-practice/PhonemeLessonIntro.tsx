'use client'

// Planned structure:
// <PhonemeLessonIntro>
//   <LessonHeader />     — IPA badge + sound name
//   <ArticulationList /> — articulationEs steps
//   <PairsGrid />        — minimal pairs with audio buttons
//   <SpanishTipBox />    — tip in Spanish
//   <LessonActions />    — "Practicar" (primary) + "Ver lección" (toggle)
// </PhonemeLessonIntro>

import { useState } from 'react'
import { IPA_EXTRA } from '@/lib/pronunciation/ipa-data'
import { speak } from '@/lib/phoneme-practice/tts'
import { playIpaSound } from '@/lib/pronunciation/ipa-audio'

interface Props {
  ipa: string
  onStart: () => void
}

export function PhonemeLessonIntro({ ipa, onStart }: Props) {
  const [showLesson, setShowLesson] = useState(false)
  const extra = IPA_EXTRA[ipa]

  return (
    <div className="flex flex-col gap-5 p-4">
      <LessonHeader ipa={ipa} />

      {showLesson && extra ? (
        <>
          <ArticulationList steps={extra.articulationEs} />
          {extra.minimalPairs.length > 0 && <PairsGrid pairs={extra.minimalPairs} />}
          <SpanishTipBox tip={extra.spanishTip} />
        </>
      ) : (
        !showLesson && (
          <p className="text-sm leading-relaxed text-fg-secondary">
            Practica distinguir este sonido en contexto. Puedes ver la lección antes si quieres.
          </p>
        )
      )}

      <LessonActions
        showLesson={showLesson}
        hasExtra={!!extra}
        onToggleLesson={() => setShowLesson((v) => !v)}
        onStart={onStart}
      />
    </div>
  )
}

function LessonHeader({ ipa }: { ipa: string }) {
  const bare = ipa.replace(/[/[\]]/g, '').trim()
  return (
    <div className="flex flex-col items-center gap-2 pt-2">
      <button
        type="button"
        onClick={() => playIpaSound(bare)}
        aria-label={`Escuchar ${ipa}`}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-selection-bg text-4xl font-bold text-primary transition-colors hover:bg-primary hover:text-white font-[var(--font-ipa),monospace]"
      >
        {bare}
      </button>
      <p className="text-xs text-fg-subtle">Toca para escuchar</p>
    </div>
  )
}

function ArticulationList({ steps }: { steps: string[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Cómo se produce</p>
      <ol className="flex flex-col gap-1.5">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-2.5 text-sm text-fg-secondary">
            <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-surface-raised text-[10px] font-bold text-fg-subtle">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  )
}

type Pair = { wordA: string; wordB: string; phonemeA: string; phonemeB: string }

function PairsGrid({ pairs }: { pairs: Pair[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Pares mínimos</p>
      <div className="flex flex-col gap-1.5">
        {pairs.map(({ wordA, wordB }) => (
          <div key={`${wordA}-${wordB}`} className="flex items-center gap-2">
            <AudioChip word={wordA} />
            <span className="text-xs text-fg-subtle">vs</span>
            <AudioChip word={wordB} />
          </div>
        ))}
      </div>
    </div>
  )
}

function AudioChip({ word }: { word: string }) {
  return (
    <button type="button" onClick={() => speak(word)} className="pf-chip" aria-label={`Escuchar ${word}`}>
      <span className="pf-chip__icon" aria-hidden>🔊</span>
      {word}
    </button>
  )
}

function SpanishTipBox({ tip }: { tip: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised p-3">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-fg-subtle">Para hispanohablantes</p>
      <p className="text-sm leading-relaxed text-fg-secondary">{tip}</p>
    </div>
  )
}

interface LessonActionsProps {
  showLesson: boolean
  hasExtra: boolean
  onToggleLesson: () => void
  onStart: () => void
}

function LessonActions({ showLesson, hasExtra, onToggleLesson, onStart }: LessonActionsProps) {
  return (
    <div className="flex flex-col gap-3 pt-1">
      {hasExtra && (
        <button
          type="button"
          onClick={onToggleLesson}
          className="w-full rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised py-3 text-sm font-medium text-fg-secondary transition-colors hover:border-border-default"
        >
          {showLesson ? 'Ocultar lección' : 'Ver la lección de este sonido'}
        </button>
      )}
      <button
        type="button"
        onClick={onStart}
        className="w-full rounded-[var(--radius-md)] bg-primary py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        Practicar ahora
      </button>
    </div>
  )
}
