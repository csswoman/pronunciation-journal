'use client'

// Planned structure:
// <WritingGuidePanel>
//   <details> (collapsible wrapper, closed by default)
//     tab buttons: Tiempos / Frases
//     <VerbTensesGuide /> or <UsefulPhrasesGuide />
//   </details>
// </WritingGuidePanel>

import { useState } from 'react'
import { BookOpen, ChevronDown } from '@/components/icons'
import { cn } from '@/lib/cn'
import { VerbTensesGuide } from './VerbTensesGuide'
import { UsefulPhrasesGuide } from './UsefulPhrasesGuide'

type GuideTab = 'tenses' | 'phrases'

export function WritingGuidePanel() {
  const [activeTab, setActiveTab] = useState<GuideTab>('tenses')

  return (
    <details className="group rounded-[var(--radius-lg)] border border-border-subtle bg-surface-sunken">
      <summary className="focus-ring flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 font-body-sm font-medium text-fg">
        <BookOpen size={14} className="shrink-0 text-fg-subtle" aria-hidden />
        Guía de apoyo
        <ChevronDown
          size={14}
          className="ml-auto shrink-0 text-fg-subtle transition-transform duration-150 group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="flex flex-col gap-3 border-t border-border-subtle px-3 py-3">
        <div role="tablist" className="flex gap-2">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'tenses'}
            onClick={() => setActiveTab('tenses')}
            className={cn(
              'focus-ring rounded-[var(--radius-sm)] px-2.5 py-1 font-body-sm font-medium transition-colors duration-150',
              activeTab === 'tenses' ? 'bg-surface text-fg' : 'text-fg-muted',
            )}
          >
            Tiempos verbales
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'phrases'}
            onClick={() => setActiveTab('phrases')}
            className={cn(
              'focus-ring rounded-[var(--radius-sm)] px-2.5 py-1 font-body-sm font-medium transition-colors duration-150',
              activeTab === 'phrases' ? 'bg-surface text-fg' : 'text-fg-muted',
            )}
          >
            Frases útiles
          </button>
        </div>
        {activeTab === 'tenses' ? <VerbTensesGuide /> : <UsefulPhrasesGuide />}
      </div>
    </details>
  )
}
