'use client'

// Planned structure:
// <PhonemeIntroStage>
//   <IpaPlayButton /> — símbolo con anillos vivos
//   <HeroWord /> — "como en see"
//   <ExamplePills /> — palabras tocables
// </PhonemeIntroStage>

import { Play } from '@/components/icons'
import { useSpeakWord } from '@/hooks/useSpeakWord'
import { cn } from '@/lib/cn'

export type IntroAudioState = 'idle' | 'playing' | 'error'

interface Props {
  audioState: IntroAudioState
  bare: string
  examples: string[]
  ipa: string
  label: string
  onPlay: () => void
}

export function PhonemeIntroStage({
  audioState,
  bare,
  examples,
  ipa,
  label,
  onPlay,
}: Props) {
  const { speaking, speak } = useSpeakWord()
  const hero = examples[0]
  const statusLabel =
    audioState === 'playing'
      ? `Escuchando ${ipa}…`
      : audioState === 'error'
        ? 'No salió el audio. Prueba otra vez'
        : 'Toca el símbolo para oírlo'

  return (
    <div className="phoneme-intro__stage relative flex flex-col items-center overflow-hidden px-[var(--layout-card-pad)] py-[var(--layout-section-gap)]">
      <div className="phoneme-intro__wash pointer-events-none absolute inset-0" aria-hidden />

      <span className="phoneme-intro__kicker relative">{label}</span>

      <button
        type="button"
        onClick={onPlay}
        aria-label={`Escuchar ${ipa}`}
        className={cn(
          'phoneme-intro__ipa relative mt-4 font-mono font-extrabold text-primary',
          'text-[length:var(--text-ipa-hero)] leading-none',
          audioState === 'playing' && 'phoneme-intro__ipa--playing',
        )}
      >
        <span className="phoneme-intro__ring" aria-hidden />
        <span className="phoneme-intro__ring phoneme-intro__ring--late" aria-hidden />
        {bare}
      </button>

      {hero && (
        <button
          type="button"
          onClick={() => speak(hero)}
          className={cn( 'phoneme-intro__hero relative mt-4 text-body-lg font-medium text-fg', speaking === hero && 'phoneme-intro__hero--speaking', )}
          aria-label={`Pronunciar ${hero}`}
        >
          como en <em>{hero}</em>
        </button>
      )}

      {examples.length > 0 && (
        <div className="phoneme-intro__examples relative mt-5 flex flex-wrap justify-center gap-2">
          {examples.map((word) => (
            <button
              key={word}
              type="button"
              onClick={() => speak(word)}
              className={cn( 'phoneme-intro__pill', speaking === word && 'phoneme-intro__pill--speaking', )}
              aria-label={`Pronunciar ${word}`}
            >
              <Play size={8} className="fill-current" aria-hidden />
              {word}
            </button>
          ))}
        </div>
      )}

      <span
        className={cn( 'phoneme-intro__status relative mt-5', audioState === 'error' && 'phoneme-intro__status--error', )}
        aria-live="polite"
      >
        {statusLabel}
      </span>
    </div>
  )
}
