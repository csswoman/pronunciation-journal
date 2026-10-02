'use client'

// Planned structure:
// <ReaderExercise>
//   <ReaderHeaderBar> (Volver link, Kicker, Bricolage Title, Meta, Top Badges) </ReaderHeaderBar>
//   <ReaderGrid>
//     <MainContentColumn>
//       <ReaderAudioPlayer />
//       <PassageTextCard> (Interactive text with lilac highlighted target words) </PassageTextCard>
//       <ReaderSentenceRecorder />
//     </MainContentColumn>
//     <RightSidebarColumn>
//       <ReaderComprehensionCard /> (PastelCard tone="butter")
//       <TargetWordsCard /> (PastelCard tone="lilac" with saved chips & mass-save button)
//     </RightSidebarColumn>
//   </ReaderGrid>
// </ReaderExercise>

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import type { ReaderPassage } from '@/lib/practice/reader/types'
import { recordReaderExposure } from '@/lib/practice/reader/exposure'
import { tokenizePassage, groupTokensBySentence } from './passage-tokens'
import { WordSavePopover } from './WordSavePopover'
import { ShadowingController } from './ShadowingController'
import { ReaderSentenceRecorder } from './ReaderSentenceRecorder'
import { ReaderAudioPlayer } from './ReaderAudioPlayer'
import { ReaderComprehensionCard } from './ReaderComprehensionCard'
import PastelCard from '@/components/layout/PastelCard'
import { useAuthOptional } from '@/components/auth/AuthProvider'
import { recordReaderShadowingAttempt } from '@/lib/practice/reader/reader-shadowing'
import { ArrowLeft, Sparkles, Check } from '@/components/icons'

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
  const [savedWords, setSavedWords] = useState<string[]>(['asynchronous', 'cache'])

  const question = passage.questions?.[0]
  const targetList = passage.targetItems.length > 0 ? passage.targetItems : [
    'asynchronous', 'cache', 'dependency array', 'declarative', 'bundler', 'bundle', 'derived state', 'custom hook'
  ]
  const tokens = useMemo(
    () => tokenizePassage(passage.passage, targetList),
    // targetList is derived from passage.targetItems
     
    [passage.passage, passage.targetItems],
  )
  const sentenceGroups = useMemo(() => groupTokensBySentence(tokens), [tokens])
  const activeGroup = useMemo(
    () => sentenceGroups.find((g) => g.sentenceIndex === activeSentenceIdx) ?? null,
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

  function handleSaveAllRemaining() {
    setSavedWords(targetList)
  }

  return (
    <div className={cn('flex flex-col gap-6 w-full max-w-7xl mx-auto', openToken === null ? '' : 'pb-64')}>
      {/* Editorial Header */}
      {showHeader && (
        <div className="flex flex-col gap-3 border-b border-border/60 pb-5">
          <div>
            <Link
              href="/practice/reader"
              className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-fg-muted transition-colors hover:text-fg rounded py-1"
            >
              <ArrowLeft className="size-4" />
              <span>Biblioteca de lecturas</span>
            </Link>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-fg-muted block">
                LECTURA GUIADA · NIVEL {passage.level.toUpperCase()}
              </span>
              <h1 className="font-display text-4xl sm:text-5xl font-black text-fg tracking-tight mt-1">
                {passage.topic || 'Coding a Game Feature'}
              </h1>
              <p className="text-xs font-mono text-fg-muted mt-1.5">
                ~1 min de lectura · {sentenceGroups.length || 7} frases · 29 sept
              </p>
            </div>

            {/* Top Right Actions / Badges */}
            <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
              <span className="rounded-full bg-surface-raised border border-border px-4 py-1.5 text-xs font-semibold text-fg-muted shadow-2xs">
                {targetList.length} palabras clave
              </span>
              <button
                type="button"
                className="rounded-full bg-surface-raised border border-border hover:bg-surface-sunken px-4 py-1.5 text-xs font-semibold text-fg flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Sparkles className="size-3.5 text-primary" />
                <span>Generar voz HD</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Main Column (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <ReaderAudioPlayer
            passageId={passage.id}
            passageText={passage.passage}
            initialAudioUrl={audioUrl}
            online={online}
            onAudioReady={(url) => setAudioUrl(url)}
            totalSentences={sentenceGroups.length || 7}
            currentSentenceIdx={activeSentenceIdx ?? 0}
          />

          <ShadowingController
            passageText={passage.passage}
            online={online}
            onActiveSentenceChange={setActiveSentenceIdx}
            requestedSentenceIdx={requestedSentenceIdx}
          />

          <div className="flex flex-col gap-2 rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
            <p className="text-xs text-fg-muted font-medium mb-3">
              Toca cualquier palabra para ver su significado y guardarla a tu banco.
            </p>

            <div className="text-body-lg leading-[2.2] sm:text-xl sm:leading-[2.2] text-fg select-text">
              {sentenceGroups.map((group) => {
                const isActive = activeSentenceIdx === group.sentenceIndex
                return (
                  <span
                    key={group.sentenceIndex}
                    title="Toca para escuchar esta oración"
                    onClick={(e) => {
                      const target = e.target as HTMLElement
                      if (target.closest('button')) return
                      setRequestedSentenceIdx(group.sentenceIndex)
                    }}
                    className={cn(
                      'inline rounded-lg px-1 py-0.5 transition-all duration-200 cursor-pointer',
                      'box-decoration-clone',
                      isActive ? 'bg-sky' : 'hover:bg-surface-sunken/60',
                    )}
                  >
                    {group.tokens.map((token, tokenIdx) => {
                      const globalIdx = tokens.indexOf(token)
                      if (token.kind !== 'word') {
                        return <span key={tokenIdx}>{token.value}</span>
                      }

                      const popover = (
                        <WordSavePopover
                          key={`${token.value}-${tokenIdx}`}
                          word={token.value}
                          lookup={token.lookup}
                          context={token.context}
                          online={online}
                          highlighted={token.highlighted}
                          open={openToken === globalIdx}
                          onOpenChange={(open) => setOpenToken(open ? globalIdx : null)}
                        />
                      )

                      return token.emphasized ? (
                        <strong key={`${token.value}-${tokenIdx}`} className="font-semibold text-fg">
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

        {/* Right Sidebar Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-6">
          {question && (
            <ReaderComprehensionCard
              question={question}
              answered={answered}
              selectedIndex={selectedIndex}
              saving={saving}
              saveError={saveError}
              onChoose={choose}
              currentQuestionIdx={1}
              totalQuestions={passage.questions?.length || 3}
            />
          )}

          {/* Target Words Card (PastelCard tone="lilac") */}
          <PastelCard tone="lilac" className="rounded-3xl p-6 shadow-xs flex flex-col gap-4 border border-black/10">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-fg/80">
                PALABRAS CLAVE
              </span>
              <span className="text-xs font-mono font-semibold text-fg/75">
                {savedWords.length} de {targetList.length} guardadas
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {targetList.map((word) => {
                const isSaved = savedWords.includes(word)
                return isSaved ? (
                  <span
                    key={word}
                    className="inline-flex items-center gap-1.5 rounded-full bg-ink text-paper px-3 py-1 text-xs font-mono font-bold shadow-2xs"
                  >
                    <Check className="size-3 text-paper" />
                    <span>{word}</span>
                  </span>
                ) : (
                  <span
                    key={word}
                    className="inline-flex items-center rounded-full bg-paper/85 border border-black/10 text-fg px-3 py-1 text-xs font-mono font-medium shadow-2xs"
                  >
                    {word}
                  </span>
                )
              })}
            </div>

            {savedWords.length < targetList.length && (
              <button
                type="button"
                onClick={handleSaveAllRemaining}
                className="mt-1 w-full rounded-full bg-paper/40 hover:bg-paper/70 border border-black/20 text-fg px-4 py-2.5 text-xs font-bold text-center transition-colors shadow-2xs"
              >
                Guardar las {targetList.length - savedWords.length} restantes
              </button>
            )}
          </PastelCard>
        </div>
      </div>
    </div>
  )
}
