'use client'

// Planned structure:
// <RecommendedPracticeCard> — bento hero card in PastelCard tone="sky"
//   <CardHeader />        "REPASO DE HOY" (tinta sólida) + "Recomendado" (contorno)
//   <CardHeadline />      big number + rest of headline
//   <SrsBreakdown />      critical + retention pills, word tag chips (array, anomaly detection, etc.)
//   <CardActions />       primary CTA "Empezar repaso · 5 min →" + optional "Ver cuáles"
//   <CardIllustration />  Koboyo watermark illustration, top-right/bottom-right

import Link from 'next/link'
import PastelCard from '@/components/layout/PastelCard'
import { setLastPracticeMode } from '@/lib/practice/last-practice-mode'
import type { RecommendedResult } from '@/lib/practice/practice-modes'
import type { PracticeHubRecommendedData } from '@/lib/practice/hub-data-types'
import { getIllustration } from '@/lib/illustrations/registry'
import { ArrowRight } from '@/components/icons'

const Illustration = getIllustration('emptyDeck')

const EMPTY_DATA: PracticeHubRecommendedData = {
  dueCount: 0,
  criticalCount: 0,
  retentionPct: null,
  previewWords: [],
}

interface Props {
  recommendation: RecommendedResult
  data?: PracticeHubRecommendedData
}

export default function RecommendedPracticeCard({ recommendation, data = EMPTY_DATA }: Props) {
  const { mode, headline, subtext, reason } = recommendation
  const { dueCount, criticalCount, retentionPct, previewWords } = data

  const match = headline.match(/^(\d+)\s*(.*)$/)
  const numberStr = match ? match[1] : null
  const restText = match ? match[2] : headline

  const extraWords = dueCount > previewWords.length ? dueCount - previewWords.length : 0

  return (
    <PastelCard
      tone="accent"
      className="group relative flex flex-col justify-between gap-5 p-6 sm:p-7 rounded-3xl overflow-hidden shadow-sm motion-reduce:shadow-none min-h-[220px]"
    >
      <div className="flex flex-col gap-3.5 min-w-0 z-10 max-w-xl">
        {/* Encabezado: Kicker tinta sólida + Badge recomendada contorno */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-ink px-3.5 py-1 font-mono text-tiny font-bold uppercase tracking-wider text-paper select-none">
            REPASO DE HOY
          </span>
          <span className="inline-flex items-center rounded-full border border-ink/40 bg-transparent px-3.5 py-1 font-sans text-caption font-bold text-ink select-none">
            Recomendado
          </span>
        </div>

        {/* Título principal y subtítulo */}
        <div className="flex flex-col gap-1">
          {numberStr ? (
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-ink leading-snug tracking-tight">
              <span className="tabular-nums">{numberStr}</span> <span>{restText}</span>
            </h2>
          ) : (
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-ink leading-snug tracking-tight">
              {headline}
            </h2>
          )}
          <p className="font-sans text-body-sm text-ink-secondary text-pretty">
            {subtext || 'Repásalas hoy para fijarlas en memoria · ~5 min'}
          </p>
        </div>

        {/* Desglose SRS + Etiquetas de vista previa de palabras */}
        {(criticalCount > 0 || retentionPct !== null || previewWords.length > 0) && (
          <div className="flex flex-col gap-2 pt-0.5">
            {(criticalCount > 0 || retentionPct !== null) && (
              <div className="flex flex-wrap items-center gap-2">
                {criticalCount > 0 && (
                  <span className="inline-flex items-center rounded-full bg-ink/10 px-3.5 py-1 font-sans text-caption font-bold text-ink select-none">
                    {criticalCount} {criticalCount === 1 ? 'crítica' : 'críticas'}
                  </span>
                )}
                {retentionPct !== null && (
                  <span className="inline-flex items-center rounded-full bg-ink/10 px-3.5 py-1 font-sans text-caption font-bold text-ink select-none">
                    {retentionPct} % de retención
                  </span>
                )}
              </div>
            )}

            {previewWords.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {previewWords.map((word) => (
                  <span
                    key={word}
                    className="inline-flex items-center rounded-full border border-ink/40 bg-paper/70 px-3 py-0.5 font-mono text-tiny font-semibold text-ink select-none"
                  >
                    {word}
                  </span>
                ))}
                {extraWords > 0 && (
                  <span className="inline-flex items-center rounded-full border border-ink/30 bg-paper/40 px-2.5 py-0.5 font-mono text-tiny font-medium text-ink-secondary select-none">
                    +{extraWords} más
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex flex-wrap items-center gap-3 z-10 pt-1">
        <Link
          href={mode.href}
          onClick={() => void setLastPracticeMode(mode.id)}
          className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-6 py-2.5 font-label text-body-sm font-bold text-paper shadow-xs transition-all duration-150 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] select-none"
        >
            <span>{reason === 'due-review' ? 'Empezar repaso · 5 min' : 'Empezar práctica'}</span>
          <ArrowRight className="size-4 shrink-0 text-paper" aria-hidden />
        </Link>
        {reason === 'due-review' && (
          <Link
            href="/practice/essential-words"
            onClick={() => void setLastPracticeMode('essential-words')}
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-ink bg-transparent px-5 py-2.5 font-label text-body-sm font-bold text-ink transition-colors duration-150 hover:bg-ink/10 select-none"
          >
            <span>Ver cuáles</span>
          </Link>
        )}
      </div>

      {/* Marca de agua / Ilustración ampliada a la derecha */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-2 -bottom-2 hidden text-ink/15 transition-colors duration-200 group-hover:text-ink/25 sm:block [&>svg]:h-52 md:[&>svg]:h-64 lg:[&>svg]:h-72 [&>svg]:w-auto"
      >
        <Illustration />
      </div>
    </PastelCard>
  )
}
