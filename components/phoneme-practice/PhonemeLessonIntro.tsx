'use client'

// Planned structure:
// <PhonemeLessonIntro>
//   <IntroStage />     — zona superior: símbolo IPA grande + aro pulsante
//   <IntroTray />      — zona inferior: tip español + CTA + toggle lección
//   <LessonDetail />   — sección expandible: articulación + pares mínimos
// </PhonemeLessonIntro>

import { useState } from 'react'
import { IPA_EXTRA } from '@/lib/pronunciation/ipa-data'
import type { PhonemeExtra } from '@/lib/pronunciation/ipa-data'
import { playIpaSound } from '@/lib/pronunciation/ipa-audio'
import { cn } from '@/lib/cn'

interface Props {
  ipa: string
  onStart: () => void
}

/** Derives a short Spanish category label from the IPA symbol. */
function ipaLabel(ipa: string): string {
  const bare = ipa.replace(/[/[\]]/g, '').trim()
  const vowels: Record<string, string> = {
    'iː': 'Vocal larga', 'ɪ': 'Vocal corta', 'e': 'Vocal media',
    'æ': 'Vocal abierta', 'ɑː': 'Vocal posterior', 'ɒ': 'Vocal redondeada',
    'ɔː': 'Vocal posterior larga', 'ʊ': 'Vocal posterior corta',
    'uː': 'Vocal posterior larga', 'ʌ': 'Vocal central', 'ɜː': 'Vocal central larga',
    'ə': 'Schwa', 'eɪ': 'Diptongo', 'aɪ': 'Diptongo', 'ɔɪ': 'Diptongo',
    'aʊ': 'Diptongo', 'oʊ': 'Diptongo',
  }
  if (bare in vowels) return vowels[bare]
  return 'Consonante'
}

export function PhonemeLessonIntro({ ipa, onStart }: Props) {
  const [showLesson, setShowLesson] = useState(false)
  const [playing, setPlaying] = useState(false)
  const bare = ipa.replace(/[/[\]]/g, '').trim()
  const extra = IPA_EXTRA[ipa]
  const label = ipaLabel(ipa)

  function handlePlay() {
    if (playing) return
    setPlaying(true)
    playIpaSound(bare)
    setTimeout(() => setPlaying(false), 700)
  }

  return (
    <div className="flex flex-col">
      <IntroStage bare={bare} ipa={ipa} label={label} playing={playing} onPlay={handlePlay} />
      <IntroTray
        extra={extra}
        showLesson={showLesson}
        onToggleLesson={() => setShowLesson((v) => !v)}
        onStart={onStart}
      />
    </div>
  )
}

function IntroStage({
  bare, ipa, label, playing, onPlay,
}: {
  bare: string; ipa: string; label: string; playing: boolean; onPlay: () => void
}) {
  return (
    <div className="relative flex flex-col items-center justify-center gap-5 overflow-hidden px-6 py-10">
      {/* radial wash behind the symbol */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 50% 40%, color-mix(in oklch, var(--primary) 18%, var(--surface-raised)) 0%, transparent 100%)',
        }}
        aria-hidden
      />

      <span className="relative text-tiny font-semibold uppercase tracking-[0.1em] text-fg-subtle">
        {label}
      </span>

      <button
        type="button"
        onClick={onPlay}
        aria-label={`Escuchar ${ipa}`}
        style={{ fontSize: 'var(--text-ipa-hero)', lineHeight: 1 }}
        className={cn(
          'relative font-[Fraunces,Georgia,serif] font-extrabold italic',
          'text-primary transition-all duration-100',
          'active:scale-95',
          // pulsing ring
          'before:absolute before:inset-[-20px] before:rounded-full',
          'before:border before:border-primary/20',
          'before:animate-[phoneme-ring_2.8s_ease-out_infinite]',
          'motion-reduce:before:animate-none',
          playing && 'opacity-70 scale-95',
        )}
      >
        {bare}
      </button>

      <span className="relative flex items-center gap-1.5 text-tiny font-medium tracking-wide text-fg-subtle/70">
        <svg width="9" height="9" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
          <polygon points="3,1 11,6 3,11" />
        </svg>
        {playing ? 'reproduciendo…' : 'toca para escuchar'}
      </span>
    </div>
  )
}

function IntroTray({
  extra,
  showLesson,
  onToggleLesson,
  onStart,
}: {
  extra: PhonemeExtra | undefined
  showLesson: boolean
  onToggleLesson: () => void
  onStart: () => void
}) {
  return (
    <div className="flex flex-col">
      {/* tip section */}
      {extra?.spanishTip && (
        <div className="px-5 pb-4 pt-1">
          <div className="flex gap-3">
            <span className="mt-0.5 shrink-0 text-base leading-none" aria-hidden>🇪🇸</span>
            <div className="flex flex-col gap-1">
              <span className="text-tiny font-semibold uppercase tracking-[0.07em] text-fg-subtle">
                Para hispanohablantes
              </span>
              <p className="max-w-[52ch] text-sm leading-relaxed text-fg-secondary">
                {extra.spanishTip}
              </p>
            </div>
          </div>
        </div>
      )}

      {showLesson && extra && (
        <div className="px-5 pb-4">
          <LessonDetail extra={extra} />
        </div>
      )}

      {/* action section */}
      <div className="px-5 pb-6 pt-3">
        <button
          type="button"
          onClick={onStart}
          className="pf-cta pf-cta--primary mb-3"
        >
          Practicar ahora
        </button>

        {extra && (
          <button
            type="button"
            onClick={onToggleLesson}
            className="flex w-full items-center justify-center gap-1.5 py-1.5 text-sm font-medium text-fg-subtle transition-colors hover:text-fg-secondary"
          >
            <svg
              width="13" height="13" viewBox="0 0 16 16"
              fill="none" stroke="currentColor" strokeWidth="1.75"
              strokeLinecap="round" strokeLinejoin="round"
              aria-hidden
            >
              <path d="M2 4h12M2 8h8M2 12h10" />
            </svg>
            {showLesson ? 'Ocultar lección' : 'Ver la lección de este sonido'}
          </button>
        )}
      </div>
    </div>
  )
}

function LessonDetail({ extra }: { extra: PhonemeExtra }) {
  return (
    <div className="flex flex-col gap-4">
      {extra.articulationEs.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-tiny font-semibold uppercase tracking-[0.07em] text-fg-subtle">
            Cómo se produce
          </p>
          <ol className="flex flex-col gap-2">
            {extra.articulationEs.map((step, i) => (
              <li key={step} className="flex gap-2.5 text-sm text-fg-secondary">
                <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-surface-base text-[10px] font-bold text-fg-subtle">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {extra.minimalPairs.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-tiny font-semibold uppercase tracking-[0.07em] text-fg-subtle">
            Pares mínimos
          </p>
          <div className="flex flex-wrap gap-1.5">
            {extra.minimalPairs.map(({ wordA, wordB }) => (
              <span
                key={`${wordA}-${wordB}`}
                className="rounded-[var(--radius-sm)] bg-surface-base px-2.5 py-1 text-xs font-medium text-fg-secondary"
              >
                {wordA} / {wordB}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
