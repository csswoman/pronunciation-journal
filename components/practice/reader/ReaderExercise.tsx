'use client'

import { useState } from 'react'
import { Volume2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import Button from '@/components/ui/Button'
import type { ReaderPassage } from '@/lib/practice/reader/types'
import { recordReaderExposure } from '@/lib/practice/reader/exposure'

// Planned structure:
// <ReaderExercise>
//   <passage text + listen button>
//   <comprehension options>

interface ReaderExerciseProps {
  passage: ReaderPassage
  online: boolean
  onComplete: (correct: boolean) => void
}

export function ReaderExercise({ passage, online, onComplete }: ReaderExerciseProps) {
  const [answered, setAnswered] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const question = passage.questions[0]

  function speak() {
    const u = new SpeechSynthesisUtterance(passage.passage)
    u.lang = 'en-US'
    window.speechSynthesis.speak(u) // on-demand, never saved
  }

  function choose(index: number) {
    if (answered) return
    setAnswered(true)
    setSelectedIndex(index)
    const correct = index === question.correctIndex
    // Exposure for every recycled target — never an SM-2 grade.
    passage.targetSrsIds.forEach((srsId, i) =>
      void recordReaderExposure(srsId, passage.targetItems[i] ?? srsId),
    )
    onComplete(correct)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-lg leading-relaxed text-fg">{passage.passage}</p>
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
              onClick={() => choose(i)}
              disabled={answered}
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
            {selectedIndex === question.correctIndex
              ? 'Correcto. Esta lectura cuenta en tu progreso.'
              : 'No exactamente. Revisa el texto y compara con la respuesta marcada.'}
          </p>
        )}
      </div>
    </div>
  )
}
