'use client'

import Button from "@/components/ui/Button";
import type { ReactNode } from 'react'

interface Props {
  current: number
  total: number
  exerciseType: string
  children: ReactNode
  feedback?: { isCorrect: boolean; message?: string } | null
  onNext?: () => void
  finishLabel?: boolean
}

const TYPE_LABELS: Record<string, string> = {
  pick_word: 'Pick the Word',
  pick_sound: 'Pick the Sound',
  minimal_pair: 'Minimal Pair',
  dictation: 'Dictation',
}

export function ExerciseCard({ current, total, exerciseType, children, feedback, onNext, finishLabel }: Props) {
  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-fg-subtle">
          <span>{TYPE_LABELS[exerciseType] ?? exerciseType}</span>
          <span>{current} / {total}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden bg-surface-sunken">
          <div
            className="h-full transition-all duration-300 rounded-full bg-primary"
            style={{ width: `${(current / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Exercise content */}
      <div className="rounded-2xl shadow-sm border border-border-subtle p-6 bg-surface-raised">
        {children}
      </div>

      {/* Feedback + Next */}
      {feedback && (
        <div
          className="rounded-xl p-4 flex items-center justify-between border"
          style={{
            backgroundColor: feedback.isCorrect ? 'oklch(.9 .06 180)' : 'oklch(.93 .06 25)',
            borderColor: feedback.isCorrect ? 'var(--admonitions-color-tip)' : 'var(--admonitions-color-caution)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{feedback.isCorrect ? '✓' : '✗'}</span>
            <span className={`font-semibold text-sm ${feedback.isCorrect ? 'text-success' : 'text-error'}`}>
              {feedback.isCorrect ? 'Correct!' : 'Incorrect'}
            </span>
            {feedback.message && (
              <span className="text-xs ml-1 text-fg-muted">{feedback.message}</span>
            )}
          </div>
          {onNext && (
            <Button
              onClick={onNext}
              className="btn-primary px-4 py-1.5 rounded-lg text-sm font-semibold"
            >
              {finishLabel ? 'Finish ✓' : 'Next →'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

