'use client'

import { useMemo, useState } from 'react'
import { Volume2 } from "@/components/icons"
import { cn } from '@/lib/cn'
import Button from '@/components/ui/Button'
import type { ReaderPassage } from '@/lib/practice/reader/types'
import { recordReaderExposure } from '@/lib/practice/reader/exposure'
import { tokenizePassage } from './passage-tokens'
import { WordSavePopover } from './WordSavePopover'

// Planned structure:
// <ReaderExercise>
//   <passage text + listen button>
//   <comprehension options>

interface ReaderExerciseProps {
  passage: ReaderPassage
  online: boolean
  onComplete: (correct: boolean) => Promise<void>
}

export function ReaderExercise({ passage, online, onComplete }: ReaderExerciseProps) {
  const [answered, setAnswered] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [openToken, setOpenToken] = useState<number | null>(null)
  const question = passage.questions[0]
  const tokens = useMemo(() => tokenizePassage(passage.passage), [passage.passage])

  function speak() {
    const u = new SpeechSynthesisUtterance(passage.passage)
    u.lang = 'en-US'
    window.speechSynthesis.speak(u) // on-demand, never saved
  }

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
    <div className={cn('flex flex-col gap-6', openToken === null ? '' : 'pb-64')}>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-fg-muted">Toca cualquier palabra para ver su significado.</p>
        <div className="text-lg leading-relaxed text-fg">
          {tokens.map((token, index) => {
            if (token.kind !== 'word') return <span key={index}>{token.value}</span>

            const popover = (
              <WordSavePopover
                word={token.value}
                lookup={token.lookup}
                context={token.context}
                online={online}
                open={openToken === index}
                onOpenChange={(open) => setOpenToken(open ? index : null)}
              />
            )

            return token.emphasized
              ? <strong key={`${token.value}-${index}`}>{popover}</strong>
              : <span key={`${token.value}-${index}`}>{popover}</span>
          })}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={speak}
          disabled={!online}
          aria-label="Escuchar"
          className="self-start"
        >
          <Volume2 className="size-4" /> Escuchar
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <p className="font-medium text-fg">{question.prompt}</p>
        <div className="grid gap-2">
          {question.options.map((opt, i) => (
            <button
              key={opt}
              type="button"
              onClick={() => void choose(i)}
              disabled={answered || saving}
              className={cn(
                'rounded-md border border-border-default px-4 py-3 text-left',
                answered &&
                  i === question.correctIndex &&
                  'border-success bg-success-soft',
                answered &&
                  i === selectedIndex &&
                  i !== question.correctIndex &&
                  'border-error bg-error-soft',
              )}
            >
              {opt}
            </button>
          ))}
        </div>
        {answered && (
          <p role="status" className={cn('text-sm font-medium', selectedIndex === question.correctIndex ? 'text-success' : 'text-error')}>
            {saving
              ? 'Saving progress…'
              : selectedIndex === question.correctIndex
              ? 'Correcto. Esta lectura cuenta en tu progreso.'
              : 'No exactamente. Revisa el texto y compara con la respuesta marcada.'}
          </p>
        )}
        {saveError && (
          <p role="alert" className="text-sm text-warning">
            Your answer is shown here, but progress could not be saved. Try again when the connection recovers.
          </p>
        )}
      </div>
    </div>
  )
}
