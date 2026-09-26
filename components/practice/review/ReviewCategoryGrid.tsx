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
import { applyReviewFilters, soundDaysOverdue, wordDaysOverdue } from '@/lib/review/filters'
import type { ReviewHubSummary } from '@/lib/review/types'
import type { WordBankEntry } from '@/lib/word-bank/types'
import type { ReviewCategory } from '@/hooks/useReviewSession'

interface ReviewCategoryGridProps {
  summary: ReviewHubSummary
  onStartSession: (category: ReviewCategory) => void
  isSessionActive?: boolean
  sortByOverdue?: boolean
  onlyOverdue?: boolean
}

function formatIpa(ipa: string | null | undefined): string {
  if (!ipa) return ''
  return ipa.startsWith('/') ? ipa : `/${ipa.replace(/^\/|\/$/g, '')}/`
}

function formatDaysOverdue(days: number): string {
  return days <= 0 ? 'hoy' : `${days} d`
}

export function ReviewCategoryGrid({
  summary,
  onStartSession,
  isSessionActive = false,
  sortByOverdue = false,
  onlyOverdue = false,
}: ReviewCategoryGridProps) {
  const counts = summary.queueCounts ?? summary.counts
  const filterOptions = { sortByOverdue, onlyOverdue }

  const weakWords = applyReviewFilters(summary.weakWords, wordDaysOverdue, filterOptions)
  const dueWords = applyReviewFilters(summary.dueWords, wordDaysOverdue, filterOptions)
  const soundsList = applyReviewFilters(summary.soundsDue, soundDaysOverdue, filterOptions)

  const hasFailedSentences = summary.failedSentences.length > 0
  const hasEssentialWordsDue = summary.essentialWordsDue.length > 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Card 1: Palabras débiles */}
      <div className="flex flex-col justify-between rounded-3xl border border-border-subtle bg-surface p-6 sm:p-7 shadow-xs gap-6">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--butter)] dark:bg-[var(--butter-deep)] text-[var(--ink)] shadow-xs shrink-0">
                <AlertCircle className="h-5 w-5 stroke-[2.5]" />
              </span>
              <div>
                <h4 className="font-extrabold text-xl text-text-strong leading-tight">Palabras débiles</h4>
                <p className="text-xs sm:text-sm text-text-muted font-medium">nuevas o en aprendizaje</p>
              </div>
            </div>
            <span className="rounded-full bg-field border border-border-subtle px-3 py-1 text-xs sm:text-sm font-extrabold text-text-muted">
              {counts.weakWords}
            </span>
          </div>

          {/* List - Up to 6 words */}
          {weakWords.length > 0 ? (
            <ul className="space-y-3 pt-1">
              {weakWords.slice(0, 6).map((word: WordBankEntry, idx: number) => (
                <li key={word.id || idx} className="flex items-center justify-between gap-3 text-base font-bold">
                  <span className="text-text-strong">{word.text}</span>
                  <div className="flex items-center gap-3">
                    <WordStrengthBars strength={getWordStrength(word)} size={14} />
                    <span className="text-text-muted font-semibold text-xs sm:text-sm min-w-[32px] text-right">
                      {formatDaysOverdue(wordDaysOverdue(word))}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-body-sm text-text-muted">
              {onlyOverdue ? 'Ninguna palabra débil está atrasada.' : 'Ninguna palabra en aprendizaje — muy bien.'}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
          <Link href="/words" className="text-sm sm:text-base font-extrabold text-text-strong underline underline-offset-4 hover:opacity-80">
            Ver las {counts.weakWords}
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isSessionActive || counts.weakWords === 0}
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
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--coral-soft)] dark:bg-[var(--coral-deep)] text-[var(--ink)] shadow-xs shrink-0">
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
              {counts.dueWords}
            </span>
          </div>

          {/* List - Up to 6 words */}
          {dueWords.length > 0 ? (
            <ul className="space-y-3 pt-1">
              {dueWords.slice(0, 6).map((word: WordBankEntry, idx: number) => (
                <li key={word.id || idx} className="flex items-center justify-between gap-3 text-base font-bold">
                  <span className="text-text-strong">{word.text}</span>
                  <div className="flex items-center gap-3">
                    <WordStrengthBars strength={getWordStrength(word)} size={14} />
                    <span className="text-text-muted font-semibold text-xs sm:text-sm min-w-[32px] text-right">
                      {formatDaysOverdue(wordDaysOverdue(word))}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-body-sm text-text-muted">
              {onlyOverdue ? 'Ningún vocabulario pendiente está atrasado.' : 'Nada de vocabulario para hoy.'}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
          <Link href="/words" className="text-sm sm:text-base font-extrabold text-text-strong underline underline-offset-4 hover:opacity-80">
            Ver las {counts.dueWords}
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isSessionActive || counts.dueWords === 0}
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
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--lilac-soft)] dark:bg-[var(--lilac-deep)] text-[var(--ink)] shadow-xs shrink-0">
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
                {counts.soundsDue}
              </span>
            </div>

            {/* List */}
            {soundsList.length > 0 ? (
              <ul className="space-y-3.5 pt-1">
                {soundsList.slice(0, 3).map((s, idx) => {
                  const ipa = formatIpa(s.ipa)
                  const daysOverdue = s.daysOverdue
                  const isOverdueAlert = daysOverdue > 14
                  return (
                    <li key={s.soundId || idx} className="flex items-center justify-between gap-3 text-base font-bold">
                      <div className="flex items-center gap-2.5">
                        <span className="font-ipa font-extrabold text-text-strong text-lg">{ipa}</span>
                        <span className="text-text-secondary font-bold">{s.example}</span>
                      </div>
                      {isOverdueAlert ? (
                        <span className="rounded-full bg-[var(--coral)] dark:bg-[var(--coral-deep)] px-3 py-1 text-xs font-black text-[var(--ink)] shadow-2xs">
                          {daysOverdue} d
                        </span>
                      ) : (
                        <span className="text-text-muted font-semibold text-xs sm:text-sm text-right">{daysOverdue} d</span>
                      )}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="font-body-sm text-text-muted">
                {onlyOverdue ? 'Ningún sonido pendiente está atrasado.' : 'Ningún sonido pendiente hoy.'}
              </p>
            )}
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
              disabled={isSessionActive || counts.soundsDue === 0}
              onClick={() => onStartSession('sounds')}
              className="rounded-full bg-field hover:bg-border-subtle border border-border-subtle px-4 py-2 text-xs sm:text-sm font-extrabold text-text-strong shadow-2xs"
            >
              Repasar grupo
            </Button>
          </div>
        </div>

        {/* Sin pendientes section — reflects the real summary, not a fixed claim */}
        <div className="rounded-2xl border border-border-subtle/80 bg-surface/70 p-4 sm:p-5 space-y-3 shadow-2xs">
          <h5 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-text-muted">
            {hasFailedSentences || hasEssentialWordsDue ? 'TAMBIÉN PENDIENTE' : 'SIN PENDIENTES'}
          </h5>
          <div className="space-y-2.5 text-sm sm:text-base text-text-secondary font-bold">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2.5">
                <CheckCircle2
                  className={`h-5 w-5 shrink-0 stroke-[2.5] ${hasFailedSentences ? 'text-[var(--coral-deep)]' : 'text-[var(--mint-deep)]'}`}
                />
                Oraciones y dictados
              </span>
              <span className="text-text-muted text-xs sm:text-sm font-medium">
                {hasFailedSentences
                  ? `${counts.failedSentences} sin corregir`
                  : 'sin errores recientes'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2.5">
                <CheckCircle2
                  className={`h-5 w-5 shrink-0 stroke-[2.5] ${hasEssentialWordsDue ? 'text-[var(--coral-deep)]' : 'text-[var(--mint-deep)]'}`}
                />
                Palabras esenciales
              </span>
              <span className="text-text-muted text-xs sm:text-sm font-medium">
                {hasEssentialWordsDue ? `${counts.essentialWordsDue} pendientes` : 'al día'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
