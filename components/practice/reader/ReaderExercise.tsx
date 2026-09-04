'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/cn'
import type { ReaderPassage } from '@/lib/practice/reader/types'
import { recordReaderExposure } from '@/lib/practice/reader/exposure'
import { tokenizePassage, groupTokensBySentence } from './passage-tokens'
import { WordSavePopover } from './WordSavePopover'
import { ShadowingController } from './ShadowingController'
import { ReaderSentenceRecorder } from './ReaderSentenceRecorder'
import { useAuthOptional } from '@/components/auth/AuthProvider'
import { recordReaderShadowingAttempt } from '@/lib/practice/reader/reader-shadowing'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Check, X } from '@/components/icons'

// Planned structure:
// <ReaderExercise>
//   <ReaderEditorialHeader />
//   <ShadowingController />
//   <PassageCard />
//   <ReaderSentenceRecorder />
//   <ComprehensionCard />
// </ReaderExercise>

interface ReaderExerciseProps {
  passage: ReaderPassage
  online: boolean
  onComplete: (correct: boolean) => Promise<void>
}

export function ReaderExercise({ passage, online, onComplete }: ReaderExerciseProps) {
  const auth = useAuthOptional()
  const user = auth?.user ?? null
  const [answered, setAnswered] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [openToken, setOpenToken] = useState<number | null>(null)
  const [activeSentenceIdx, setActiveSentenceIdx] = useState<number | null>(null)
  const [requestedSentenceIdx, setRequestedSentenceIdx] = useState<number | null>(null)

  const question = passage.questions[0]
  const tokens = useMemo(() => tokenizePassage(passage.passage), [passage.passage])
  const sentenceGroups = useMemo(() => groupTokensBySentence(tokens), [tokens])
  const activeGroup = useMemo(
    () => (activeSentenceIdx !== null ? sentenceGroups.find((g) => g.sentenceIndex === activeSentenceIdx) : null),
    [sentenceGroups, activeSentenceIdx],
  )
  const activeSentenceText = useMemo(
    () => (activeGroup ? activeGroup.tokens.map((t) => t.value).join('').trim() : null),
    [activeGroup],
  )

  async function choose(index: number) {
    if (answered || saving) return
    setAnswered(true)
    setSelectedIndex(index)
    setSaving(true)
    setSaveError(false)
    const correct = index === question.correctIndex
    try {
      // Exposure for every recycled target — never an SM-2 grade.
      await Promise.all(passage.targetSrsIds.map((srsId, i) =>
        recordReaderExposure(srsId, passage.targetItems[i] ?? srsId),
      ))
      await onComplete(correct)
    } catch (err) {
      console.error('[ReaderExercise] progress save failed', err)
      setSaveError(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={cn('flex flex-col layout-stack-loose', openToken === null ? '' : 'pb-64')}>
      {/* Encabezado editorial */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default/60 pb-3">
        <div className="flex items-center gap-2">
          {passage.topic && (
            <span className="font-kicker text-caption uppercase tracking-wider text-primary">
              {passage.topic}
            </span>
          )}
          <span className="text-tiny text-fg-muted font-mono">· ~1 min de lectura</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge label={`Nivel ${passage.level.toUpperCase()}`} variant="neutral" size="sm" />
          {passage.targetItems.length > 0 && (
            <Badge
              label={`${passage.targetItems.length} ${passage.targetItems.length === 1 ? 'palabra clave' : 'palabras clave'}`}
              variant="default"
              size="sm"
            />
          )}
        </div>
      </div>

      {/* 2-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Main Reading & Audio Column */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <ShadowingController
            passageText={passage.passage}
            online={online}
            onActiveSentenceChange={setActiveSentenceIdx}
            requestedSentenceIdx={requestedSentenceIdx}
          />

          <div className="flex flex-col gap-2">
            <p className="text-body-sm text-fg-muted">
              Toca cualquier palabra para ver su significado y guardarla a tu banco.
            </p>
            <div className="text-body-lg leading-[1.9] sm:text-xl sm:leading-[2.0] text-fg rounded-2xl border border-border-default bg-surface-raised p-6 sm:p-10 shadow-xs select-text transition-colors">
              {sentenceGroups.map((group) => {
                const isActive = activeSentenceIdx === group.sentenceIndex
                return (
                  <span
                    key={group.sentenceIndex}
                    onClick={(e) => {
                      const target = e.target as HTMLElement
                      if (target.closest('button')) return
                      setRequestedSentenceIdx(group.sentenceIndex)
                    }}
                    className={cn(
                      'inline rounded-md px-1 py-0.5 -mx-0.5 transition-all duration-200 cursor-pointer',
                      isActive
                        ? 'bg-primary-soft text-fg ring-1 ring-primary/40 font-medium shadow-xs'
                        : 'hover:bg-surface-sunken/70',
                    )}
                    title="Toca para escuchar esta oración"
                  >
                    {group.tokens.map((token, tokenIdx) => {
                      const globalIdx = tokens.indexOf(token)
                      if (token.kind !== 'word') {
                        return <span key={tokenIdx}>{token.value}</span>
                      }

                      const popover = (
                        <WordSavePopover
                          word={token.value}
                          lookup={token.lookup}
                          context={token.context}
                          online={online}
                          open={openToken === globalIdx}
                          onOpenChange={(open) => setOpenToken(open ? globalIdx : null)}
                        />
                      )

                      return token.emphasized ? (
                        <strong key={`${token.value}-${tokenIdx}`} className="font-semibold text-fg underline decoration-primary/60 decoration-2 underline-offset-4">{popover}</strong>
                      ) : (
                        <span key={`${token.value}-${tokenIdx}`}>{popover}</span>
                      )
                    })}
                  </span>
                )
              })}
            </div>
          </div>

          {activeSentenceText && (
            <ReaderSentenceRecorder
              sentenceText={activeSentenceText}
              online={online}
              onRecorded={(accuracy, transcript, timeMs) => {
                if (!user?.id) return
                void recordReaderShadowingAttempt(user.id, {
                  passageId: passage.id,
                  sentenceText: activeSentenceText,
                  accuracy,
                  transcript,
                  timeMs,
                }).catch((err) => {
                  console.warn('[ReaderExercise] shadowing attempt recording error', err)
                })
              }}
            />
          )}
        </div>

        {/* Side Column: Sticky Comprehension Question */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 flex flex-col gap-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-border-default bg-surface-raised p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="font-kicker text-caption uppercase tracking-wider text-fg-muted">
                Comprobación de lectura
              </span>
            </div>
            <p className="text-h3 font-medium text-fg leading-snug">{question.prompt}</p>
            <div className="grid gap-2.5">
              {question.options.map((opt, i) => {
                const isSelected = selectedIndex === i
                const isCorrect = i === question.correctIndex
                const optionLetter = ['A', 'B', 'C', 'D'][i] ?? `${i + 1}`

                return (
                  <button
                    key={opt}
                    type="button"
                    aria-label={opt}
                    onClick={() => void choose(i)}
                    disabled={answered || saving}
                    className={cn(
                      'group flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left text-body transition-all duration-150',
                      !answered && 'border-border-default bg-surface-base hover:border-border-hover hover:bg-surface-sunken/50 cursor-pointer active:scale-[0.99] focus-ring',
                      answered && isCorrect && 'border-success bg-success-soft text-fg font-medium ring-1 ring-success/30',
                      answered && isSelected && !isCorrect && 'border-error bg-error-soft text-fg font-medium ring-1 ring-error/30',
                      answered && !isSelected && !isCorrect && 'border-border-subtle bg-surface-base/40 opacity-60 text-fg-muted',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className={cn(
                          'flex size-6 shrink-0 items-center justify-center rounded-full text-tiny font-semibold transition-all duration-150',
                          !answered && 'bg-surface-sunken text-fg-muted border border-border-subtle group-hover:border-border-default group-hover:text-fg',
                          answered && isCorrect && 'bg-success text-white shadow-xs',
                          answered && isSelected && !isCorrect && 'bg-error text-white shadow-xs',
                          answered && !isSelected && !isCorrect && 'bg-surface-sunken text-fg-muted/60',
                        )}
                      >
                        {optionLetter}
                      </span>
                      <span className="leading-snug">{opt}</span>
                    </div>
                    {answered && isCorrect && <Check className="size-4 shrink-0 text-success" />}
                    {answered && isSelected && !isCorrect && <X className="size-4 shrink-0 text-error" />}
                  </button>
                )
              })}
            </div>
            {answered && (
              <p role="status" className={cn('text-body-sm font-medium pt-1', selectedIndex === question.correctIndex ? 'text-success' : 'text-error')}>
                {saving
                  ? 'Saving progress…'
                  : selectedIndex === question.correctIndex
                  ? 'Correcto. Esta lectura cuenta en tu progreso.'
                  : 'No exactamente. Revisa el texto y compara con la respuesta marcada.'}
              </p>
            )}
            {saveError && (
              <div role="alert" className="flex items-center justify-between gap-2 text-body-sm text-warning bg-warning-soft/30 border border-warning/30 rounded-lg p-3 mt-1">
                <span>Your answer is shown here, but progress could not be saved. Try again when the connection recovers.</span>
                {selectedIndex !== null && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => void choose(selectedIndex)}
                    disabled={saving}
                    className="shrink-0"
                  >
                    Reintentar
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
