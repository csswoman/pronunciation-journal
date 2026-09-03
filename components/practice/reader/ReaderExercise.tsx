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
      {/* Shadowing & Audio Player Controller */}
      <ShadowingController
        passageText={passage.passage}
        online={online}
        onActiveSentenceChange={setActiveSentenceIdx}
        requestedSentenceIdx={requestedSentenceIdx}
      />

      <div className="flex flex-col gap-3">
        <p className="text-body-sm text-fg-muted">
          Toca cualquier palabra para ver su significado y guardarla a tu banco.
        </p>
        <div className="text-body-lg leading-relaxed text-fg rounded-card border border-border-default bg-surface-sunken p-4 sm:p-5">
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
                  'inline rounded px-1 -mx-0.5 transition-colors duration-200 cursor-pointer',
                  isActive
                    ? 'bg-primary-soft text-fg ring-1 ring-primary/40 font-medium'
                    : 'hover:bg-surface-raised/60',
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
                    <strong key={`${token.value}-${tokenIdx}`}>{popover}</strong>
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

      <div className="flex flex-col gap-3">
        <p className="font-medium text-fg">{question.prompt}</p>
        <div className="grid gap-2">
          {question.options.map((opt, i) => (
            <button
              key={opt}
              type="button"
              onClick={() => void choose(i)}
              disabled={answered || saving}
              className={cn( 'rounded-md border border-border-default px-4 py-3 text-left', answered && i === question.correctIndex && 'border-success bg-success-soft', answered && i === selectedIndex && i !== question.correctIndex && 'border-error bg-error-soft', )}
            >
              {opt}
            </button>
          ))}
        </div>
        {answered && (
          <p role="status" className={cn('text-body-sm font-medium', selectedIndex === question.correctIndex ? 'text-success' : 'text-error')}>
            {saving
              ? 'Saving progress…'
              : selectedIndex === question.correctIndex
              ? 'Correcto. Esta lectura cuenta en tu progreso.'
              : 'No exactamente. Revisa el texto y compara con la respuesta marcada.'}
          </p>
        )}
        {saveError && (
          <p role="alert" className="text-body-sm text-warning">
            Your answer is shown here, but progress could not be saved. Try again when the connection recovers.
          </p>
        )}
      </div>
    </div>
  )
}
