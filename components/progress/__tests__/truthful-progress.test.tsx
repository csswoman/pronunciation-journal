// @vitest-environment jsdom
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThisWeekCard } from '../ThisWeekCard'
import { FluencyRadarCard } from '../FluencyRadarCard'
import { SkillsBalanceCard } from '../SkillsBalanceCard'
import { AccuracyGaugeCard } from '../AccuracyGaugeCard'
import { WhereToFocusSection } from '../WhereToFocusSection'
import DailyProgressSidebar from '@/components/daily/DailyProgressSidebar'
import { SessionReady } from '@/components/practice/essential-words/SessionReady'
import { SessionReadyHero } from '@/components/practice/essential-words/SessionReadyHero'
import VocabularyReviewCard from '@/components/practice/hub/VocabularyReviewCard'
import RecommendedPracticeCard from '@/components/practice/hub/RecommendedPracticeCard'
import type { FluencyScores, SkillScore } from '@/lib/progress/fluency-scores'
import type { RecommendedResult } from '@/lib/practice/practice-modes'

vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <a {...props}>{children}</a>
  ),
}))

vi.mock('@/lib/practice/last-practice-mode', () => ({
  setLastPracticeMode: vi.fn(),
}))

vi.mock('@/hooks/useEssentialWordsReadyDashboard', () => ({
  useEssentialWordsReadyDashboard: () => null,
}))

vi.mock('@/components/practice/essential-words/SessionReadyVaultRow', () => ({
  SessionReadyVaultRow: () => <div data-testid="vault" />,
}))

/** Build a SkillScore with enough evidence to show a numeric score. */
function scored(value: number): SkillScore {
  return { score: value, accuracy: value, uniqueContentCount: 10, evidenceCount: 20, insufficientEvidence: false }
}

/** Build a SkillScore representing no activity at all. */
function empty(): SkillScore {
  return { score: null, accuracy: 0, uniqueContentCount: 0, evidenceCount: 0, insufficientEvidence: true }
}

describe('truthful-progress: validación de datos reales y ausencia de fallbacks falsos', () => {
  it('ThisWeekCard con 0 ejercicios muestra 0 y no 53 ni 8 por día', () => {
    render(<ThisWeekCard stats={{ exercises7: 0, newWords7: 0 }} />)

    expect(screen.queryByText('53')).not.toBeInTheDocument()
    expect(screen.queryByText('8')).not.toBeInTheDocument()
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2)
  })

  it('DailyProgressSidebar no muestra números de pronóstico inventados (29 ni 23)', () => {
    render(
      <DailyProgressSidebar
        data={{
          streak: {
            currentStreak: 0,
            maxStreak: 0,
            completedToday: false,
          },
          heatmap7: [0, 0, 0, 0, 0, 0, 0],
          completedDays7: 0,
          rate7: 0,
          summary: { exercises7: 0, newWords7: 0 },
        }}
      />,
    )

    expect(screen.queryByText('29')).not.toBeInTheDocument()
    expect(screen.queryByText(/bajan a 23/i)).not.toBeInTheDocument()
  })

  it('SessionReadyHero sin lastSession no muestra el resultado falso 0:42', () => {
    render(
      <SessionReadyHero
        preview={{
          actionBudget: 15,
          scheduledActions: 15,
          uniqueWords: 5,
          newWordCount: 3,
          reviewActionCount: 4,
          continuationActionCount: 0,
          estimatedDurationMs: 168_000,
          completedActions: 0,
          remainingActions: 15,
        }}
        isResume={false}
        activeRouteId={null}
        onRouteChange={vi.fn()}
        sessionSize="recommended"
        onSessionSizeChange={vi.fn()}
        onBegin={vi.fn()}
        onDiscard={vi.fn()}
        previewLoading={false}
        lastSession={null}
      />,
    )

    expect(screen.queryByText(/0:42/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Última: sin fallos · 1\/1 · 0:42/)).not.toBeInTheDocument()
  })

  it('VocabularyReviewCard con learnedCount=0 no llena ningún segmento del progressbar', () => {
    render(<VocabularyReviewCard dueCount={0} learnedCount={0} totalCount={100} />)

    const progressbar = screen.getByRole('progressbar')
    const filledSegments = progressbar.querySelectorAll('.bg-ink')
    expect(filledSegments.length).toBe(0)
  })

  it('SkillsBalanceCard sin comparisonLabel no afirma "Mejorando esta semana"', () => {
    const scores: FluencyScores = {
      pronunciation: scored(50),
      grammar: scored(40),
      vocabulary: scored(60),
      listening: scored(30),
      speaking: scored(45),
      reading: scored(70),
      writing: scored(55),
    }

    render(<SkillsBalanceCard scores={scores} comparisonLabel={undefined} />)
    expect(screen.queryByText('Mejorando esta semana')).not.toBeInTheDocument()
  })

  it('SkillsBalanceCard incluye dimensión writing / Escritura', () => {
    const scores: FluencyScores = {
      pronunciation: scored(50),
      grammar: scored(40),
      vocabulary: scored(60),
      listening: scored(30),
      speaking: scored(45),
      reading: scored(70),
      writing: scored(55),
    }

    render(<SkillsBalanceCard scores={scores} />)
    expect(screen.getByText('Escritura')).toBeInTheDocument()
    expect(screen.getByText('7 dimensiones')).toBeInTheDocument()
  })

  it('FluencyRadarCard anuncia 7 dimensiones en accesibilidad y en eyebrow', () => {
    const scores: FluencyScores = {
      pronunciation: scored(50),
      grammar: scored(40),
      vocabulary: scored(60),
      listening: scored(30),
      speaking: scored(45),
      reading: scored(70),
      writing: scored(55),
    }

    render(<FluencyRadarCard scores={scores} />)
    expect(
      screen.getByRole('img', {
        name: /balance de habilidades en 7 dimensiones/i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('7 dimensiones')).toBeInTheDocument()
  })

  it('RecommendedPracticeCard etiqueta precisión (7 días) y no retención', () => {
    const recommendation = {
      mode: { id: 'essential-words', href: '/practice/essential-words' },
      headline: '15 palabras esperan repaso',
      subtext: 'Repaso recomendado',
      reason: 'due-review',
    } as unknown as RecommendedResult

    render(
      <RecommendedPracticeCard
        recommendation={recommendation}
        data={{
          dueCount: 15,
          criticalCount: 2,
          retentionPct: 85,
          previewWords: ['apple'],
        }}
      />,
    )

    expect(screen.getByText(/85\s*%\s*precisión\s*\(7 días\)/i)).toBeInTheDocument()
    expect(screen.queryByText(/85\s*%\s*de retención/i)).not.toBeInTheDocument()
  })

  it('WhereToFocusSection etiqueta claramente maestría en contrastes', () => {
    render(
      <WhereToFocusSection
        data={{
          wordsByStatus: { new: 0, learning: 0, review: 0, mastered: 0 },
          weakestPhonemes: [{ ipa: 'θ', accuracy: 42, totalAttempts: 5 }],
          essentialWords: { studied: 0, due: 0 },
        }}
        coach={{ weakTopics: [], avgAccuracy: null }}
        learnerLevel={{
          level: 'A2',
          confidence: 0.85,
          isPlaced: true,
          source: 'placement',
          updatedAt: null,
        }}
      />,
    )

    expect(screen.getByText('Maestría en contrastes')).toBeInTheDocument()
    expect(screen.getByLabelText(/\/θ\/: 42% de maestría/)).toBeInTheDocument()
  })

  it('AccuracyGaugeCard con error no muestra 0% y muestra estado de error', () => {
    render(
      <AccuracyGaugeCard
        stats={{
          accuracy7: 0,
          totalAnswers7: 0,
          retrievalQuality7: null,
          hasError: true,
        }}
      />,
    )

    expect(screen.queryByText('0%')).not.toBeInTheDocument()
    expect(
      screen.getByText('No se pudieron cargar tus datos de precisión en este momento.'),
    ).toBeInTheDocument()
  })

  it('SessionReady con 0 palabras no sustituye por 2800', () => {
    render(
      <SessionReady
        preview={{
          actionBudget: 15,
          scheduledActions: 15,
          uniqueWords: 5,
          newWordCount: 3,
          reviewActionCount: 4,
          continuationActionCount: 0,
          estimatedDurationMs: 168_000,
          completedActions: 0,
          remainingActions: 15,
        }}
        stats={{
          totalWords: 0,
          learned: 0,
          dueCount: 0,
          dueTomorrow: 0,
          newToday: 0,
          newQuota: 10,
          vaulted: 0,
        }}
        activeRouteId={null}
        onRouteChange={vi.fn()}
        sessionSize="recommended"
        onSessionSizeChange={vi.fn()}
        onBegin={vi.fn()}
        isResume={false}
        previewLoading={false}
        onDiscard={vi.fn()}
      />,
    )

    expect(screen.queryByText(/2800/)).not.toBeInTheDocument()
    expect(screen.getByText(/0 de 0/)).toBeInTheDocument()
  })

  it('SkillsBalanceCard con solo práctica de escritura no cae en estado vacío y muestra Escritura', () => {
    const scores: FluencyScores = {
      pronunciation: empty(),
      grammar: empty(),
      vocabulary: empty(),
      listening: empty(),
      speaking: empty(),
      reading: empty(),
      writing: scored(70),
    }

    render(<SkillsBalanceCard scores={scores} />)
    expect(screen.queryByText('Practica un poco más para ver tu balance de habilidades aquí.')).not.toBeInTheDocument()
    expect(screen.getByText('Escritura')).toBeInTheDocument()
    expect(screen.getByText('70')).toBeInTheDocument()
    expect(screen.queryByText('MÁS CONSOLIDADA')).not.toBeInTheDocument()
    expect(screen.queryByText('A PRIORIZAR EN TU PRÁCTICA')).not.toBeInTheDocument()
  })
})
