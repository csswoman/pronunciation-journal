'use client'

// Planned structure:
// <SessionRecapCard>
//   heading + tema dominante
//   palabras consolidadas hoy
//   qué vuelve mañana (omitido si null o 0)
//   Core 1000 + racha
//   CTAs (home / free practice)
// </SessionRecapCard>

import Link from 'next/link'
import { ArrowRight, Flame } from "@/components/icons"
import PageLayout from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import type { SessionArc } from '@/lib/practice/types'
import SpeakWithCoachCard from '@/components/ai-coach/SpeakWithCoachCard'

const ESSENTIAL_WORD_TARGET = 1000

interface Props {
  arc: SessionArc | undefined
  stepCount: number
  /** Items due within 24h, or null when unavailable (offline). */
  dueTomorrow: number | null
  /** Current streak in days, or null when unavailable. */
  streak: number | null
  /**
   * Essential Words learned count, queried once by the shared ancestor
   * (DailyChecklist) instead of each daily card subscribing independently.
   */
  learned?: number
}

export default function SessionRecapCard({ arc, stepCount, dueTomorrow, streak, learned = 0 }: Props) {

  const topicParts: string[] = []
  if (arc?.topicLabel) topicParts.push(arc.topicLabel)
  if (arc?.soundIpa) topicParts.push(`sonido /${arc.soundIpa}/`)
  const words = arc?.sessionWords ?? []

  return (
    <PageLayout archetype="session">
      <div className="mt-16 flex flex-col items-center gap-4 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-primary-soft text-primary">
          <Flame size={30} />
        </div>
        <h1 className="text-h2 text-fg">
          ¡Sesión diaria completada!
        </h1>

        {topicParts.length > 0 && (
          <p className="max-w-sm text-body-sm text-fg-muted">
            Hoy reforzaste{' '}
            <span className="font-semibold text-fg">
              {topicParts.join(' · ')}
            </span>
            .
          </p>
        )}

        {words.length > 0 && (
          <div className="w-full max-w-sm rounded-lg border border-border-subtle bg-surface-raised p-4 text-left">
            <p className="font-kicker text-fg-subtle">
              Palabras de hoy
            </p>
            <p className="mt-1 text-body-sm text-fg-muted">
              {words.join(' · ')}
            </p>
          </div>
        )}

        {dueTomorrow != null && dueTomorrow > 0 && (
          <p className="text-body-sm text-fg-muted">
            <span className="font-semibold text-fg">{dueTomorrow}</span>{' '}
            {dueTomorrow === 1 ? 'palabra vuelve mañana' : 'palabras vuelven mañana'} por repaso
            espaciado.
          </p>
        )}

        <p className="text-body-sm text-fg-subtle">
          {(learned ?? 0) > 0
            ? `${learned} / ${ESSENTIAL_WORD_TARGET} palabras esenciales`
            : `Completaste ${stepCount} pasos`}
          {streak != null && streak > 0
            ? ` · ${streak} ${streak === 1 ? 'día' : 'días'} de racha`
            : ''}
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link href="/">
            <Button variant="primary" size="md">
              Volver al inicio
            </Button>
          </Link>
          <Link href="/practice?from=daily">
            <Button
              variant="secondary"
              size="md"
              icon={<ArrowRight size={15} />}
              iconPosition="right"
            >
              Práctica libre
            </Button>
          </Link>
        </div>
        <div className="mt-6 w-full max-w-sm">
          <SpeakWithCoachCard arc={arc} />
        </div>
      </div>
    </PageLayout>
  )
}
