'use client'

// Planned structure:
// <PhonemeLessonIntro>
//   <IntroStage />     — zona superior: símbolo IPA grande + aro pulsante
//   <IntroTray />      — zona inferior: tip + CTA + enlace a lección
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

export function PhonemeLessonIntro({ ipa, onStart }: Props) {
  const [showLesson, setShowLesson] = useState(false)
  const bare = ipa.replace(/[/[\]]/g, '').trim()
  const extra = IPA_EXTRA[ipa]

  return (
    <div className="flex flex-col">
      <IntroStage bare={bare} ipa={ipa} />
      <IntroTray
        extra={extra}
        showLesson={showLesson}
        onToggleLesson={() => setShowLesson((v) => !v)}
        onStart={onStart}
      />
    </div>
  )
}

function IntroStage({ bare, ipa }: { bare: string; ipa: string }) {
  return (
    <div className="relative flex flex-col items-center gap-3 overflow-hidden bg-primary-soft px-6 pb-7 pt-8">
      {/* gradiente radial para dar profundidad */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 30%, oklch(0.88 0.08 var(--hue, 250)) 0%, oklch(0.93 0.04 var(--hue, 250)) 100%)',
        }}
        aria-hidden
      />

      <span className="relative text-xs font-semibold uppercase tracking-[0.08em] text-primary/60">
        Vocal larga
      </span>

      <button
        type="button"
        onClick={() => playIpaSound(bare)}
        aria-label={`Escuchar ${ipa}`}
        className={cn(
          'relative font-[Fraunces,Georgia,serif] text-[5.5rem] font-extrabold italic leading-none',
          'text-primary/80 transition-transform duration-100',
          'active:scale-95',
          // aro pulsante
          'before:absolute before:inset-[-14px] before:rounded-full',
          'before:border before:border-primary/25',
          'before:animate-[phoneme-ring_2.8s_ease-out_infinite]',
          'motion-reduce:before:animate-none',
        )}
        style={{ letterSpacing: '-0.04em' }}
      >
        {bare}
      </button>

      <span className="relative flex items-center gap-1 text-[0.6875rem] text-primary/60">
        <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
          <polygon points="3,1 11,6 3,11" />
        </svg>
        toca para escuchar
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
    <div className="flex flex-col gap-3.5 bg-surface-raised px-5 py-5">
      {extra?.spanishTip && (
        <div className="flex gap-2.5">
          <span className="mt-px text-base leading-none" aria-hidden>🇪🇸</span>
          <div className="flex flex-col gap-0.5">
            <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.04em] text-fg-subtle">
              Para hispanohablantes
            </span>
            <p className="text-sm leading-relaxed text-fg-secondary">{extra.spanishTip}</p>
          </div>
        </div>
      )}

      {showLesson && extra && (
        <LessonDetail extra={extra} />
      )}

      <div className="h-px bg-border-subtle" />

      <button
        type="button"
        onClick={onStart}
        className="w-full rounded-[var(--radius-md)] bg-[var(--cta-bg)] py-3.5 text-sm font-semibold text-[var(--cta-fg)] transition-colors hover:bg-[oklch(0.26_0.008_var(--hue,250))] active:scale-[0.985]"
      >
        Practicar ahora
      </button>

      {extra && (
        <button
          type="button"
          onClick={onToggleLesson}
          className="flex w-full items-center justify-center gap-1.5 py-1 text-sm font-medium text-fg-secondary transition-colors hover:text-fg-primary"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M2 4h12M2 8h8M2 12h10" />
          </svg>
          {showLesson ? 'Ocultar lección' : 'Ver la lección de este sonido'}
        </button>
      )}
    </div>
  )
}

function LessonDetail({ extra }: { extra: PhonemeExtra }) {
  return (
    <div className="flex flex-col gap-3">
      {extra.articulationEs.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.04em] text-fg-subtle">
            Cómo se produce
          </p>
          <ol className="flex flex-col gap-1.5">
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
        <div className="flex flex-col gap-1.5">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.04em] text-fg-subtle">
            Pares mínimos
          </p>
          <div className="flex flex-wrap gap-1.5">
            {extra.minimalPairs.map(({ wordA, wordB }) => (
              <span key={`${wordA}-${wordB}`} className="rounded-[var(--radius-sm)] bg-surface-base px-2 py-0.5 text-xs text-fg-secondary">
                {wordA} / {wordB}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
