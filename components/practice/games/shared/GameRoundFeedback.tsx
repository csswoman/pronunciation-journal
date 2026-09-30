'use client'

// Planned structure:
// <GameRoundFeedback>
//   <Feedback state title explanation action={<ContinueButton />}>
//     {children /* listen buttons, extra detail */}
//   </Feedback>
// </GameRoundFeedback>

import { useEffect, useRef, type ReactNode } from 'react'
import Feedback, { type FeedbackState } from '@/components/ui/Feedback'
import Button from '@/components/ui/Button'
import { CornerDownLeft } from '@/components/icons'

interface GameRoundFeedbackProps {
  state: FeedbackState
  title: string
  explanation?: string
  continueLabel: string
  onContinue: () => void
  children?: ReactNode
}

/**
 * Inline, non-modal verdict shown between rounds. Keeps the board visible so
 * the learner can compare what they chose with what was right. The continue
 * button takes focus on mount, so Enter advances.
 */
export default function GameRoundFeedback({
  state,
  title,
  explanation,
  continueLabel,
  onContinue,
  children,
}: GameRoundFeedbackProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    containerRef.current?.scrollIntoView({
      block: 'nearest',
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }, [])

  return (
    <div ref={containerRef}>
      <Feedback
        state={state}
        title={title}
        explanation={explanation}
        className="animate-state-in"
        action={
          <Button
            autoFocus
            variant="ej-ink"
            size="md"
            onClick={onContinue}
            icon={<CornerDownLeft size={16} aria-hidden />}
            iconPosition="right"
            className="shrink-0"
          >
            {continueLabel}
          </Button>
        }
      >
        {children}
      </Feedback>
    </div>
  )
}
