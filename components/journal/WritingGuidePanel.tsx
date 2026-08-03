'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'
import { VerbTensesGuide } from './VerbTensesGuide'
import { UsefulPhrasesGuide } from './UsefulPhrasesGuide'

type GuideTab = 'tenses' | 'phrases'

export function WritingGuidePanel() {
  const [activeTab, setActiveTab] = useState<GuideTab>('tenses')
  const isTenses = activeTab === 'tenses'

  return (
    <section aria-label="Referencia de escritura" className="flex flex-col gap-4">
      <div>
        <p className="font-body-sm text-fg-muted">
          {isTenses
            ? 'Mira un modelo y adáptalo a lo que quieres contar.'
            : 'Elige una frase y hazla tuya para seguir escribiendo.'}
        </p>
      </div>
      <div role="tablist" aria-label="Tipo de referencia" className="flex rounded-[var(--radius-md)] bg-surface-sunken p-1">
        <button
          type="button"
          role="tab"
          id="journal-reference-tenses-tab"
          aria-selected={isTenses}
          aria-controls="journal-reference-tenses"
          onClick={() => setActiveTab('tenses')}
          className={cn(
            'focus-ring min-h-11 flex-1 rounded-[var(--radius-sm)] px-2 text-center font-body-sm font-medium transition-colors duration-150',
            isTenses ? 'bg-surface-raised text-fg' : 'text-fg-muted hover:text-fg',
          )}
        >
          Ejemplos por tiempo
        </button>
        <button
          type="button"
          role="tab"
          id="journal-reference-phrases-tab"
          aria-selected={!isTenses}
          aria-controls="journal-reference-phrases"
          onClick={() => setActiveTab('phrases')}
          className={cn(
            'focus-ring min-h-11 flex-1 rounded-[var(--radius-sm)] px-2 text-center font-body-sm font-medium transition-colors duration-150',
            !isTenses ? 'bg-surface-raised text-fg' : 'text-fg-muted hover:text-fg',
          )}
        >
          Frases para tu texto
        </button>
      </div>
      <div
        id={isTenses ? 'journal-reference-tenses' : 'journal-reference-phrases'}
        role="tabpanel"
        aria-labelledby={isTenses ? 'journal-reference-tenses-tab' : 'journal-reference-phrases-tab'}
      >
        {isTenses ? <VerbTensesGuide /> : <UsefulPhrasesGuide />}
      </div>
    </section>
  )
}
