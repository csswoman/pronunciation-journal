'use client'

// Planned structure:
// <UsefulPhrasesCard>
//   <PastelCard tone="butter">
//     <HeaderRow: "FRASES PARA CONTARLO" + Subtitle + "0 de 3" pill badge />
//     <PhrasesList: 3 topic-related phrases with phrase name, spanish definition, plus button />
//   </PastelCard>
// </UsefulPhrasesCard>

import { useState } from 'react'
import { Plus } from '@/components/icons'
import PastelCard from '@/components/layout/PastelCard'
import type { NotebookTopic } from '@/lib/journal/notebook-types'

export interface UsefulPhraseItem {
  phrase: string
  es: string
}

export const TOPIC_USEFUL_PHRASES: Record<NotebookTopic, UsefulPhraseItem[]> = {
  daily: [
    { phrase: 'bring up', es: 'sacar un tema' },
    { phrase: 'catch up with', es: 'ponerse al día con alguien' },
    { phrase: 'point out', es: 'señalar, hacer notar' },
  ],
  opinion: [
    { phrase: 'from my point of view', es: 'desde mi punto de vista' },
    { phrase: 'it seems to me that', es: 'me parece que' },
    { phrase: 'on the other hand', es: 'por otro lado' },
  ],
  fiction: [
    { phrase: 'out of nowhere', es: 'de la nada' },
    { phrase: 'turns out that', es: 'resulta que' },
    { phrase: 'all of a sudden', es: 'de repente' },
  ],
  situational: [
    { phrase: 'touch base with', es: 'hacer contacto con' },
    { phrase: 'follow up on', es: 'hacer seguimiento a' },
    { phrase: 'looking forward to', es: 'esperando con ansias' },
  ],
  vocab: [
    { phrase: 'figure out', es: 'resolver / descifrar' },
    { phrase: 'come up with', es: 'proponer / inventar' },
    { phrase: 'take into account', es: 'tener en cuenta' },
  ],
  free: [
    { phrase: 'as far as I know', es: 'que yo sepa' },
    { phrase: 'in the long run', es: 'a la larga' },
    { phrase: 'keep in mind', es: 'tener presente' },
  ],
}

interface UsefulPhrasesCardProps {
  topic?: NotebookTopic
  phrases?: UsefulPhraseItem[]
  onInsertPhrase?: (phrase: string) => void
}

export function UsefulPhrasesCard({
  topic = 'daily',
  phrases,
  onInsertPhrase,
}: UsefulPhrasesCardProps) {
  const [usedPhrases, setUsedPhrases] = useState<Set<string>>(new Set())

  const activePhrases = phrases ?? TOPIC_USEFUL_PHRASES[topic] ?? TOPIC_USEFUL_PHRASES.daily

  function handleAdd(phrase: string) {
    setUsedPhrases((prev) => {
      const next = new Set(prev)
      next.add(phrase)
      return next
    })
    onInsertPhrase?.(phrase)
  }

  return (
    <PastelCard
      tone="butter"
      className="flex flex-col gap-4 p-5 sm:p-6 overflow-hidden motion-reduce:shadow-none"
      aria-labelledby="useful-phrases-heading"
    >
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <span
            id="useful-phrases-heading"
            className="font-kicker text-kicker sm:text-kicker-lg text-ink select-none"
          >
            FRASES PARA CONTARLO
          </span>
          <p className="font-sans text-caption text-ink-secondary">
            Úsalas en tu página de hoy. Toca una para añadirla.
          </p>
        </div>

        <span className="inline-flex shrink-0 items-center rounded-full bg-butter-deep/70 px-3 py-1 font-sans text-caption font-bold text-ink select-none">
          {usedPhrases.size} de {activePhrases.length}
        </span>
      </div>

      <ul className="flex flex-col gap-2.5" role="list">
        {activePhrases.map((item) => {
          const isAdded = usedPhrases.has(item.phrase)
          return (
            <li
              key={item.phrase}
              className="flex items-center justify-between gap-3 rounded-2xl bg-butter-soft p-3.5 shadow-2xs transition-all hover:bg-butter-soft/90"
            >
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="font-sans text-body-md sm:text-body-lg font-extrabold text-ink truncate">
                  {item.phrase}
                </span>
                <span className="font-sans text-body-sm text-ink-secondary truncate">
                  {item.es}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleAdd(item.phrase)}
                aria-label={`Añadir frase ${item.phrase}`}
                title={isAdded ? 'Frase añadida' : 'Añadir frase al borrador'}
                className={`focus-ring flex size-9 shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer ${
                  isAdded
                    ? 'bg-ink/15 text-ink/70'
                    : 'bg-butter-deep text-ink hover:bg-butter-deep/80 shadow-xs'
                }`}
              >
                <Plus size={18} aria-hidden />
              </button>
            </li>
          )
        })}
      </ul>
    </PastelCard>
  )
}
