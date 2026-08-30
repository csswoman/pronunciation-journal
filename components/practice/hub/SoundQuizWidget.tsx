'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MicVocal, Waves, Sparkles, Volume2, ArrowRight } from '@/components/icons'
import { setLastPracticeMode } from '@/lib/db'
import { cn } from '@/lib/cn'
import SoundMicroQuiz, { type SoundCategory } from './SoundMicroQuiz'

export default function SoundQuizWidget() {
  const [selectedCategory, setSelectedCategory] = useState<SoundCategory>('all')
  const [resetKey, setResetKey] = useState(0)

  return (
    <div className="group/hero flex flex-col gap-5 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5 md:p-6 shadow-xs transition-colors hover:border-border-strong">
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-[var(--radius-md)] bg-[var(--hue-icon-bg)] text-primary">
              <MicVocal size={18} aria-hidden />
            </span>
            <span className="font-kicker text-fg-subtle uppercase tracking-wider text-tiny">Pronunciación</span>
          </div>

          <div className="flex items-center gap-1 rounded-full border border-border-subtle bg-surface-base/80 p-0.5 shadow-2xs backdrop-blur-xs">
            {(['all', 'vowels', 'consonants'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat)
                  setResetKey((k) => k + 1)
                }}
                className={cn(
                  'focus-ring rounded-full px-2.5 py-0.5 text-tiny font-medium transition-all duration-150',
                  selectedCategory === cat
                    ? 'bg-primary text-on-primary shadow-xs font-semibold'
                    : 'text-fg-muted hover:text-fg hover:bg-surface-sunken',
                )}
              >
                {cat === 'all' ? 'Todos' : cat === 'vowels' ? 'Vocales' : 'Consonantes'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Link
            href="/practice/sounds"
            onClick={() => void setLastPracticeMode('sounds')}
            className="focus-ring group/title flex items-center justify-between gap-2 rounded-sm"
          >
            <h2 className="text-h2 font-bold text-fg transition-colors group-hover/title:text-primary">
              Laboratorio de sonidos
            </h2>
            <ArrowRight
              size={18}
              className="text-fg-subtle transition-transform duration-200 group-hover/title:translate-x-1 group-hover/title:text-primary"
              aria-hidden
            />
          </Link>
          <p className="text-body-sm text-fg-muted text-pretty">
            Entrena el oído con sonidos que el español no distingue.
          </p>
        </div>

        <SoundMicroQuiz category={selectedCategory} resetKey={resetKey} />
      </div>

      {/* Grouped speech / pronunciation exercise list */}
      <div className="flex flex-col divide-y divide-border-subtle/60 border-t border-border-subtle/60 pt-2">
        {/* Item 1: Serie de pares mínimos */}
        <Link
          href="/practice/minimal-pairs"
          onClick={() => void setLastPracticeMode('minimal-pairs')}
          className="group/item flex items-start gap-3.5 py-3.5 transition-colors hover:bg-surface-sunken/40 focus-ring rounded-[var(--radius-md)] px-2 -mx-2"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-md)] bg-surface-sunken text-fg-subtle group-hover/item:text-primary transition-colors mt-0.5">
            <Volume2 size={18} aria-hidden />
          </span>
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-label font-semibold text-fg group-hover/item:text-primary transition-colors">
                Serie de pares mínimos
              </span>
              <span className="font-caption text-tiny text-fg-subtle">
                10 pares · 4 min
              </span>
            </div>
            <p className="font-caption text-fg-muted">
              La versión completa del reto de arriba, con tu historial de errores
            </p>
          </div>
        </Link>

        {/* Item 2: Entonación */}
        <Link
          href="/practice/intonation"
          onClick={() => void setLastPracticeMode('intonation')}
          className="group/item flex items-start gap-3.5 py-3.5 transition-colors hover:bg-surface-sunken/40 focus-ring rounded-[var(--radius-md)] px-2 -mx-2"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-md)] bg-surface-sunken text-fg-subtle group-hover/item:text-primary transition-colors mt-0.5">
            <Waves size={18} aria-hidden />
          </span>
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-label font-semibold text-fg group-hover/item:text-primary transition-colors">
                Entonación
              </span>
              <span className="font-caption text-tiny text-fg-subtle">
                6 frases · 3 min
              </span>
            </div>
            <p className="font-caption text-fg-muted">
              Cómo cambia el tono entre preguntas y afirmaciones
            </p>
          </div>
        </Link>

        {/* Item 3: Habla conectada */}
        <Link
          href="/practice/connected-speech"
          onClick={() => void setLastPracticeMode('connected-speech')}
          className="group/item flex items-start gap-3.5 py-3.5 transition-colors hover:bg-surface-sunken/40 focus-ring rounded-[var(--radius-md)] px-2 -mx-2"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-md)] bg-surface-sunken text-fg-subtle group-hover/item:text-primary transition-colors mt-0.5">
            <Sparkles size={18} aria-hidden />
          </span>
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-label font-semibold text-fg group-hover/item:text-primary transition-colors">
                Habla conectada
              </span>
              <span className="font-caption text-tiny text-fg-subtle">
                8 frases · 3 min
              </span>
            </div>
            <p className="font-caption text-fg-muted">
              Une palabras al hablar, como en una conversación real
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}
