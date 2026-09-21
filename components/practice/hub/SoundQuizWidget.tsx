'use client'

// Planned structure:
// <SoundQuizWidget> — "Laboratorio de sonidos" bento card in PastelCard tone="butter"
//   Header: SONIDOS kicker + top-right learner focus badge
//   Title: Laboratorio de sonidos
//   Learner evidence panel, or an honest empty state
//   Exercise Chips (Outline, single row): Pares mínimos, Entonación, Habla conectada
//   Decorative SVG wavy lines (bottom-right)
// </SoundQuizWidget>

import Link from 'next/link'
import PastelCard from '@/components/layout/PastelCard'
import { setLastPracticeMode } from '@/lib/practice/last-practice-mode'
import type { PracticeHubSoundData } from '@/lib/practice/hub-data-types'

const EXERCISES = [
  { href: '/practice/sounds/minimal-pairs', mode: 'minimal-pairs', title: 'Pares mínimos' },
  { href: '/practice/intonation', mode: 'intonation', title: 'Entonación' },
  { href: '/practice/connected-speech', mode: 'connected-speech', title: 'Habla conectada' },
] as const

interface Props {
  sound: PracticeHubSoundData | null
}

export default function SoundQuizWidget({ sound }: Props) {

  return (
    <PastelCard
      tone="butter"
      className="group relative flex flex-col justify-between gap-5 rounded-3xl p-6 overflow-hidden shadow-sm motion-reduce:shadow-none"
    >
      <div className="flex flex-col gap-3 z-10">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-tiny font-bold uppercase tracking-wider text-ink select-none">
              SONIDOS
            </span>
            <Link
              href="/practice/sounds"
              onClick={() => void setLastPracticeMode('sounds')}
              className="focus-ring inline-block"
            >
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-ink leading-tight transition-colors group-hover:text-ink-secondary">
                Laboratorio de sonidos
              </h2>
            </Link>
          </div>

          <div className="flex h-14 min-w-14 shrink-0 items-center justify-center rounded-full bg-ink/10 px-2 font-phoneme text-lg sm:text-xl font-bold text-ink select-none shadow-2xs">
            {sound?.ipa ?? '—'}
          </div>
        </div>
      </div>

      <div className="z-10 rounded-2xl border border-ink/10 bg-paper/85 p-3.5">
        {sound ? (
          <p className="font-sans text-body-sm text-ink-secondary">
            Tu foco actual: <span className="font-phoneme font-bold text-ink">{sound.ipa}</span> · {sound.accuracy}% de acierto en {sound.totalAttempts} {sound.totalAttempts === 1 ? 'intento' : 'intentos'}.
          </p>
        ) : (
          <p className="font-sans text-body-sm text-ink-secondary">
            Aún no hay intentos evaluados. Explora un sonido para empezar a crear tu historial.
          </p>
        )}
      </div>

      {/* Chips de enlaces de ejercicios en una sola línea centrados y sin fondo (outline) */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 pt-1 z-10 select-none">
        {EXERCISES.map(({ href, mode, title }) => (
          <Link
            key={href}
            href={href}
            onClick={() => void setLastPracticeMode(mode)}
            className="focus-ring inline-flex shrink-0 items-center justify-center rounded-full border border-ink bg-transparent px-2.5 sm:px-3 py-1 font-sans text-tiny sm:text-caption font-semibold text-ink transition-all hover:bg-ink hover:text-paper"
          >
            {title}
          </Link>
        ))}
      </div>

      {/* Decoración de líneas onduladas en tono más oscuro de la tarjeta */}
      <svg
        aria-hidden="true"
        viewBox="0 0 160 60"
        fill="none"
        className="pointer-events-none absolute -right-2 -bottom-1 w-48 h-auto text-ink/15 z-0"
      >
        <path
          d="M10 50 C 40 10, 80 60, 110 20 C 130 5, 150 30, 170 15 M5 35 C 35 5, 75 45, 105 10"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </PastelCard>
  )
}
