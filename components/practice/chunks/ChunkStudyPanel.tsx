'use client'

// Planned structure:
// <ChunkStudyPanel>
//   <Header />
//   <ChunkRows: phrase + IPA + meaning + model />
//   <StartButton />
// </ChunkStudyPanel>

import Button from '@/components/ui/Button'
import { formatIpaDisplay } from '@/lib/lexicon/format-ipa'
import { speakText } from '@/lib/speech/synthesis'
import type { LearningChunk } from '@/lib/chunk-of-day/types'
import type { ChunkEvidenceRecord } from '@/lib/db'
import { ChunkMarkedText } from './ChunkMarkedText'
import { ChunkEvidenceSummary } from './ChunkEvidenceSummary'

interface Props {
  chunks: LearningChunk[]
  evidenceByChunk?: Record<string, ChunkEvidenceRecord>
  focus?: 'default' | 'pronunciation'
  onStart: () => void
}

/** Visible label only for an authored Essential Word anchor; UUID-only links
 * stay linked internally until their word-bank display data is available. */
export function essentialAnchorLabels(chunk: LearningChunk): string[] {
  return Array.from(new Set(chunk.contentGraph.anchors
    .filter((anchor) => anchor.owner === 'essential_words' && anchor.id.startsWith('c1k:'))
    .map((anchor) => anchor.id.slice('c1k:'.length))))
}

export function ChunkStudyPanel({
  chunks,
  evidenceByChunk = {},
  focus = 'default',
  onStart,
}: Props) {
  const pronunciationFocus = focus === 'pronunciation'
  return (
    <section className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5 shadow-xs sm:p-6">
      <header className="mb-5">
        <span className="font-kicker text-tiny text-fg-subtle">
          {pronunciationFocus ? 'Escucha y habla' : 'Primero reconoce el patrón'}
        </span>
        <h1 className="mt-1 text-h1 text-fg">
          {pronunciationFocus ? 'Una frase, un sonido' : 'Chunks para usar hoy'}
        </h1>
        <p className="mt-1 max-w-2xl text-body text-fg-muted">
          {pronunciationFocus
            ? 'Escucha la frase completa. Después recupérala y úsala en contexto.'
            : 'Escúchalos y observa la situación. Después practicarás comprensión, escucha y producción.'}
        </p>
      </header>
      <div className="divide-y divide-border-subtle border-y border-border-subtle">
        {chunks.map((chunk) => (
          <article key={chunk.id} className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] sm:gap-6">
            <button type="button" onClick={() => speakText(chunk.learning.practiceAnswer)} className="focus-ring rounded-[var(--radius-sm)] text-left" aria-label={`Escuchar ${chunk.learning.practiceAnswer}`}>
              <strong className="block text-h3 text-fg"><ChunkMarkedText text={chunk.contentGraph.text} highlights={chunk.contentGraph.highlights} /></strong>
              {chunk.ipa ? <span className="font-ipa text-body-sm text-fg-muted" lang="en-fonipa">{formatIpaDisplay(chunk.ipa)}</span> : null}
            </button>
            <div>
              {essentialAnchorLabels(chunk).length > 0 ? (
                <p className="mb-1 text-caption text-fg-muted"><span className="font-semibold text-fg-secondary">Palabra ancla:</span> <span className="font-medium text-fg">{essentialAnchorLabels(chunk).join(', ')}</span></p>
              ) : null}
              <p className="text-body-sm font-medium text-fg">{chunk.meaning}</p>
              <p className="mt-1 text-body-sm text-fg-muted"><span className="font-semibold">Situación:</span> {chunk.learning.recognitionCueEs}</p>
              {chunk.learning.practiceAnswer !== chunk.chunk ? <p className="mt-1 text-body-sm text-fg-muted"><span className="font-semibold">Modelo:</span> {chunk.learning.practiceAnswer}</p> : null}
              <ChunkEvidenceSummary evidence={evidenceByChunk[chunk.id]} />
            </div>
          </article>
        ))}
      </div>
      <div className="mt-5 flex justify-end"><Button onClick={onStart}>Empezar práctica</Button></div>
    </section>
  )
}
