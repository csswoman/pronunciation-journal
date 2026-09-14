'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/cn'
import type { ReaderPassage } from '@/lib/practice/reader/types'
import { recordReaderExposure } from '@/lib/practice/reader/exposure'
import { tokenizePassage, groupTokensBySentence } from './passage-tokens'
import { WordSavePopover } from './WordSavePopover'
import { ShadowingController } from './ShadowingController'
import { ReaderSentenceRecorder } from './ReaderSentenceRecorder'
import { ReaderAudioPlayer } from './ReaderAudioPlayer'
import { ReaderComprehensionCard } from './ReaderComprehensionCard'
import { useAuthOptional } from '@/components/auth/AuthProvider'
import { recordReaderShadowingAttempt } from '@/lib/practice/reader/reader-shadowing'
import Badge from '@/components/ui/Badge'

// Planned structure:
// <ReaderExercise>
//   <ReaderEditorialHeader /> (optional, hidden in daily step)
//   <ReaderMainGrid>
//     <AudioAndPassageColumn>
//       <ReaderAudioPlayer />
//       <ShadowingController />
//       <PassageCard />
//       <ReaderSentenceRecorder />
//     </AudioAndPassageColumn>
//     <ComprehensionSideColumn>
//       <ReaderComprehensionCard />
//     </ComprehensionSideColumn>
//   </ReaderMainGrid>
// </ReaderExercise>

interface ReaderExerciseProps {
  passage: ReaderPassage
  online: boolean
  showHeader?: boolean
  onComplete: (correct: boolean) => Promise<void>
}

export function ReaderExercise({
  passage,
  online,
  showHeader = true,
  onComplete,
}: ReaderExerciseProps) {
  const auth = useAuthOptional()
  const user = auth?.user ?? null
  const [answered, setAnswered] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [openToken, setOpenToken] = useState<number | null>(null)
  const [activeSentenceIdx, setActiveSentenceIdx] = useState<number | null>(null)
  const [requestedSentenceIdx, setRequestedSentenceIdx] = useState<number | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | undefined>(passage.audioUrl)

  const question = passage.questions?.[0]
  const tokens = useMemo(() => tokenizePassage(passage.passage), [passage.passage])
  const sentenceGroups = useMemo(() => groupTokensBySentence(tokens), [tokens])
  const activeGroup = useMemo(
    () =>
      activeSentenceIdx !== null
        ? sentenceGroups.find((g) => g.sentenceIndex === activeSentenceIdx)
        : null,
    [sentenceGroups, activeSentenceIdx],
  )
  const activeSentenceText = useMemo(
    () => (activeGroup ? activeGroup.tokens.map((t) => t.value).join('').trim() : null),
    [activeGroup],
  )

  async function choose(index: number) {
    if (!question || answered || saving) return
    setAnswered(true)
    setSelectedIndex(index)
    setSaving(true)
    setSaveError(false)
    const correct = index === question.correctIndex
    try {
      // Exposure for every recycled target — never an SM-2 grade.
      await Promise.all(
        passage.targetSrsIds.map((srsId, i) =>
          recordReaderExposure(srsId, passage.targetItems[i] ?? srsId),
        ),
      )
      await onComplete(correct)
    } catch (err) {
      console.error('[ReaderExercise] progress save failed', err)
      setSaveError(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', openToken === null ? '' : 'pb-64')}>
      {/* Encabezado editorial opcional (se oculta en daily step para evitar repetir título) */}
      {showHeader && (
        <div className="flex flex-col gap-3 border-b border-border-default/60 pb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
          <div className="flex flex-wrap items-center gap-2">
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
      )}

      {/* 2-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Main Reading & Audio Column */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <ReaderAudioPlayer
            passageId={passage.id}
            passageText={passage.passage}
            initialAudioUrl={audioUrl}
            online={online}
            onAudioReady={(url) => setAudioUrl(url)}
          />

          <ShadowingController
            passageText={passage.passage}
            online={online}
            onActiveSentenceChange={setActiveSentenceIdx}
            requestedSentenceIdx={requestedSentenceIdx}
          />

          <div className="flex flex-col gap-2">
            <p className="text-caption text-fg-muted px-1">
              Toca cualquier palabra para ver su significado y guardarla a tu banco.
            </p>
            <div className="text-body-lg leading-[2.0] sm:text-xl sm:leading-loose text-fg rounded-2xl border border-border-default bg-surface-raised p-6 sm:p-8 shadow-xs select-text transition-colors">
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
                        <strong
                          key={`${token.value}-${tokenIdx}`}
                          className="font-semibold text-fg underline decoration-primary/60 decoration-2 underline-offset-4"
                        >
                          {popover}
                        </strong>
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
        {question && (
          <div className="lg:col-span-5 lg:sticky lg:top-6 flex flex-col gap-6">
            <ReaderComprehensionCard
              question={question}
              answered={answered}
              selectedIndex={selectedIndex}
              saving={saving}
              saveError={saveError}
              onChoose={choose}
            />
          </div>
        )}
      </div>
    </div>
  )
}
