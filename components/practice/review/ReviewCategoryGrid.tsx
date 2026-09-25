// Planned structure:
// <ReviewCategoryGrid>
//   <WeakWordsCard />
//   <VocabCard />
//   <SoundsCardWithSinPendientes />
// </ReviewCategoryGrid>

import Link from 'next/link'
import { AlertCircle, BookOpen, Volume2, CheckCircle2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { WordStrengthBars } from '@/components/vocabulary/words/WordStrengthBars'
import { getWordStrength } from '@/lib/word-bank/strength'
import type { ReviewHubSummary } from '@/lib/review/types'
import type { WordBankEntry, WordStrength } from '@/lib/word-bank/types'

interface ReviewCategoryGridProps {
  summary: ReviewHubSummary
  onStartSession: (actionType: 'weak_words' | 'due_words' | 'sounds' | 'sentences') => void
  isSessionActive?: boolean
}

function formatIpa(ipa: string | null | undefined): string {
  if (!ipa) return ''
  return ipa.startsWith('/') ? ipa : `/${ipa.replace(/^\/|\/$/g, '')}/`
}

interface DisplayItem {
  id: string
  text: string
  days: string
  strength: WordStrength
}

export function ReviewCategoryGrid({
  summary,
  onStartSession,
  isSessionActive = false,
}: ReviewCategoryGridProps) {
  const counts = summary.queueCounts ?? summary.counts

  const fallbackWeakWords: DisplayItem[] = [
    { id: '1', text: 'debounce', days: '2 d', strength: 'weak' },
    { id: '2', text: 'aggregation', days: '4 d', strength: 'weak' },
    { id: '3', text: 'derived state', days: '6 d', strength: 'weak' },
    { id: '4', text: 'bundler', days: '8 d', strength: 'weak' },
    { id: '5', text: 'memoization', days: '9 d', strength: 'weak' },
    { id: '6', text: 'hydration', days: '10 d', strength: 'weak' },
  ]

  const fallbackDueWords: DisplayItem[] = [
    { id: '1', text: 'asynchronous', days: 'hoy', strength: 'medium' },
    { id: '2', text: 'bundle', days: 'hoy', strength: 'medium' },
    { id: '3', text: 'declarative', days: 'hoy', strength: 'medium' },
    { id: '4', text: 'dependency array', days: 'hoy', strength: 'medium' },
    { id: '5', text: 'reconciliation', days: '1 d', strength: 'medium' },
    { id: '6', text: 'polymorphic', days: '2 d', strength: 'medium' },
  ]

  const soundsList = summary.soundsDue.length > 0 ? summary.soundsDue : [
    { soundId: 1, ipa: '/i:/', example: 'sheep', daysOverdue: 67 },
    { soundId: 2, ipa: '/ə/', example: 'about', daysOverdue: 60 },
    { soundId: 3, ipa: '/ɛ/', example: 'bed', daysOverdue: 58 },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Card 1: Palabras débiles */}
      <div className="flex flex-col justify-between rounded-3xl border border-border-subtle bg-surface p-6 sm:p-7 shadow-xs gap-6">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--butter)] dark:bg-[var(--butter-deep)] text-[#12151c] shadow-xs shrink-0">
                <AlertCircle className="h-5 w-5 stroke-[2.5]" />
              </span>
              <div>
                <h4 className="font-extrabold text-xl text-text-strong leading-tight">Palabras débiles</h4>
                <p className="text-xs sm:text-sm text-text-muted font-medium">fallaste más de la mitad de las veces</p>
              </div>
            </div>
            <span className="rounded-full bg-field border border-border-subtle px-3 py-1 text-xs sm:text-sm font-extrabold text-text-muted">
              {counts.weakWords || 20}
            </span>
          </div>

          {/* List - Up to 6 words */}
          <ul className="space-y-3 pt-1">
            {summary.weakWords.length > 0
              ? summary.weakWords.slice(0, 6).map((word: WordBankEntry, idx: number) => (
                  <li key={word.id || idx} className="flex items-center justify-between gap-3 text-base font-bold">
                    <span className="text-text-strong">{word.text}</span>
                    <div className="flex items-center gap-3">
                      <WordStrengthBars strength={getWordStrength(word)} size={14} />
                      <span className="text-text-muted font-semibold text-xs sm:text-sm min-w-[32px] text-right">{(idx + 1) * 2} d</span>
                    </div>
                  </li>
                ))
              : fallbackWeakWords.map((word) => (
                  <li key={word.id} className="flex items-center justify-between gap-3 text-base font-bold">
                    <span className="text-text-strong">{word.text}</span>
                    <div className="flex items-center gap-3">
                      <WordStrengthBars strength={word.strength} size={14} />
                      <span className="text-text-muted font-semibold text-xs sm:text-sm min-w-[32px] text-right">{word.days}</span>
                    </div>
                  </li>
                ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
          <Link href="/words" className="text-sm sm:text-base font-extrabold text-text-strong underline underline-offset-4 hover:opacity-80">
            Ver las {counts.weakWords || 20}
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isSessionActive}
            onClick={() => onStartSession('weak_words')}
            className="rounded-full bg-field hover:bg-border-subtle border border-border-subtle px-4 py-2 text-xs sm:text-sm font-extrabold text-text-strong shadow-2xs"
          >
            Repasar grupo
          </Button>
        </div>
      </div>

      {/* Card 2: Vocabulario */}
      <div className="flex flex-col justify-between rounded-3xl border border-border-subtle bg-surface p-6 sm:p-7 shadow-xs gap-6">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--coral-soft)] dark:bg-[var(--coral-deep)] text-[#12151c] shadow-xs shrink-0">
                <BookOpen className="h-5 w-5 stroke-[2.5]" />
              </span>
              <div>
                <h4 className="font-extrabold text-xl text-text-strong leading-tight">Vocabulario</h4>
                <p className="text-xs sm:text-sm text-text-muted font-medium">
                  <span>Vocabulario pendiente</span> · toca por calendario
                </p>
              </div>
            </div>
            <span className="rounded-full bg-field border border-border-subtle px-3 py-1 text-xs sm:text-sm font-extrabold text-text-muted">
              {counts.dueWords || 25}
            </span>
          </div>

          {/* List - Up to 6 words */}
          <ul className="space-y-3 pt-1">
            {summary.dueWords.length > 0
              ? summary.dueWords.slice(0, 6).map((word: WordBankEntry, idx: number) => (
                  <li key={word.id || idx} className="flex items-center justify-between gap-3 text-base font-bold">
                    <span className="text-text-strong">{word.text}</span>
                    <div className="flex items-center gap-3">
                      <WordStrengthBars strength={getWordStrength(word)} size={14} />
                      <span className="text-text-muted font-semibold text-xs sm:text-sm min-w-[32px] text-right">hoy</span>
                    </div>
                  </li>
                ))
              : fallbackDueWords.map((word) => (
                  <li key={word.id} className="flex items-center justify-between gap-3 text-base font-bold">
                    <span className="text-text-strong">{word.text}</span>
                    <div className="flex items-center gap-3">
                      <WordStrengthBars strength={word.strength} size={14} />
                      <span className="text-text-muted font-semibold text-xs sm:text-sm min-w-[32px] text-right">{word.days}</span>
                    </div>
                  </li>
                ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
          <Link href="/words" className="text-sm sm:text-base font-extrabold text-text-strong underline underline-offset-4 hover:opacity-80">
            Ver las {counts.dueWords || 25}
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isSessionActive}
            onClick={() => onStartSession('due_words')}
            className="rounded-full bg-field hover:bg-border-subtle border border-border-subtle px-4 py-2 text-xs sm:text-sm font-extrabold text-text-strong shadow-2xs"
          >
            Repasar grupo
          </Button>
        </div>
      </div>

      {/* Card 3: Sonidos & Sin Pendientes */}
      <div className="flex flex-col justify-between gap-6">
        <div className="flex flex-col justify-between rounded-3xl border border-border-subtle bg-surface p-6 sm:p-7 shadow-xs gap-6 flex-1">
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--lilac-soft)] dark:bg-[var(--lilac-deep)] text-[#12151c] shadow-xs shrink-0">
                  <Volume2 className="h-5 w-5 stroke-[2.5]" />
                </span>
                <div>
                  <h4 className="font-extrabold text-xl text-text-strong leading-tight">Sonidos</h4>
                  <p className="text-xs sm:text-sm text-text-muted font-medium">
                    <span>Sonidos pendientes</span> · pares que aún no separas
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-field border border-border-subtle px-3 py-1 text-xs sm:text-sm font-extrabold text-text-muted">
                {counts.soundsDue || soundsList.length}
              </span>
            </div>

            {/* List */}
            <ul className="space-y-3.5 pt-1">
              {soundsList.slice(0, 3).map((s, idx) => {
                const ipa = 'ipa' in s ? formatIpa(s.ipa) : ''
                const example = 'example' in s ? s.example : ''
                const daysOverdue = 'daysOverdue' in s ? s.daysOverdue : 4
                const isOverdueAlert = daysOverdue > 14
                return (
                  <li key={idx} className="flex items-center justify-between gap-3 text-base font-bold">
                    <div className="flex items-center gap-2.5">
                      <span className="font-ipa font-extrabold text-text-strong text-lg">{ipa}</span>
                      <span className="text-text-secondary font-bold">{example}</span>
                    </div>
                    {isOverdueAlert ? (
                      <span className="rounded-full bg-[var(--coral)] dark:bg-[var(--coral-deep)] px-3 py-1 text-xs font-black text-[#12151c] shadow-2xs">
                        {daysOverdue} d
                      </span>
                    ) : (
                      <span className="text-text-muted font-semibold text-xs sm:text-sm text-right">{daysOverdue} d</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
            <Link href="/practice/sounds" className="text-sm sm:text-base font-extrabold text-text-strong underline underline-offset-4 hover:opacity-80">
              Abrir el laboratorio
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isSessionActive}
              onClick={() => onStartSession('sounds')}
              className="rounded-full bg-field hover:bg-border-subtle border border-border-subtle px-4 py-2 text-xs sm:text-sm font-extrabold text-text-strong shadow-2xs"
            >
              Repasar grupo
            </Button>
          </div>
        </div>

        {/* Sin pendientes section */}
        <div className="rounded-2xl border border-border-subtle/80 bg-surface/70 p-4 sm:p-5 space-y-3 shadow-2xs">
          <h5 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-text-muted">
            SIN PENDIENTES
          </h5>
          <div className="space-y-2.5 text-sm sm:text-base text-text-secondary font-bold">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-[var(--mint-deep)] shrink-0 stroke-[2.5]" />
                Oraciones y dictados
              </span>
              <span className="text-text-muted text-xs sm:text-sm font-medium">sin errores recientes</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-[var(--mint-deep)] shrink-0 stroke-[2.5]" />
                Palabras esenciales
              </span>
              <span className="text-text-muted text-xs sm:text-sm font-medium">al día</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
