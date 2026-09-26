'use client'

// Planned structure:
// <ReorderWordsExercise>
//   <OrderRule />       — the English word-order pattern, in Spanish
//   <AnswerSlots />     — drop zone where placed chips appear, reorderable
//     <ReorderWordChip />  — word chip, draggable / clickable
//   <WordBank />        — tray of available word chips, a drop zone too
//   <CheckButton />     — full-width primary CTA
// </ReorderWordsExercise>

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import Button from '@/components/ui/Button'
import type { ReorderWordsExercise as ReorderWordsExerciseType } from '@/lib/exercises/types'
import { useUISounds } from '@/hooks/useUISounds'
import { gradeReorder } from '@/lib/exercises/grade-reorder'
import { buildPedagogicalFeedback } from '@/lib/exercises/feedback'
import { useChipDrag, type DropTarget } from '@/hooks/useChipDrag'
import { ReorderWordChip } from './ReorderWordChip'
import {
  answerText,
  createBoard,
  isComplete,
  moveChip,
  toggleChip,
  type BoardChip,
  type BoardState,
  type BoardZone,
} from '@/lib/exercises/reorder-board'

interface Props {
  exercise: ReorderWordsExerciseType
  onResult: (
    isCorrect: boolean,
    userAnswer: string,
    timeMs: number,
    extras?: { feedback?: ReturnType<typeof buildPedagogicalFeedback> },
  ) => void
  focusUi?: boolean
}

type AnswerState = 'idle' | 'correct' | 'wrong'

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/** Smooth FLIP layout animation when chips change position or zone. */
function useFLIPLayout(deps: unknown[]) {
  const prevRectsRef = useRef<Map<string, DOMRect>>(new Map())

  useIsoLayoutEffect(() => {
    if (typeof document === 'undefined') return

    const chipEls = Array.from(document.querySelectorAll<HTMLElement>('[data-chip-key]'))
    const nextRects = new Map<string, DOMRect>()

    chipEls.forEach((el) => {
      const key = el.dataset.chipKey
      if (!key) return

      const currentRect = el.getBoundingClientRect()
      nextRects.set(key, currentRect)

      const prevRect = prevRectsRef.current.get(key)
      if (prevRect) {
        const dx = prevRect.left - currentRect.left
        const dy = prevRect.top - currentRect.top

        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`
          el.style.transition = 'none'

          const onTransitionEnd = (e: TransitionEvent) => {
            if (e.propertyName === 'transform') {
              el.style.transform = ''
              el.style.transition = ''
              el.removeEventListener('transitionend', onTransitionEnd)
            }
          }
          el.addEventListener('transitionend', onTransitionEnd)

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              el.style.transition = 'transform 240ms cubic-bezier(0.2, 0, 0, 1)'
              el.style.transform = 'translate3d(0, 0, 0)'
            })
          })
        }
      }
    })

    prevRectsRef.current = nextRects
  }, deps)
}

export function ReorderWordsExercise({ exercise, onResult }: Props) {
  const [board, setBoard] = useState<BoardState>(() => createBoard(exercise.tokens))
  const [state, setState] = useState<AnswerState>('idle')
  const [startMs, setStartMs] = useState(() => Date.now())
  const { playTap, playCorrect, playWrong } = useUISounds()

  useFLIPLayout([board])

  useEffect(() => {
    setBoard(createBoard(exercise.tokens))
    setState('idle')
    setStartMs(Date.now())
  }, [exercise.id, exercise.tokens])

  const locked = state !== 'idle'

  function handleTap(key: string) {
    if (locked) return
    playTap()
    setBoard((b) => toggleChip(b, key))
  }

  function handleDrop(key: string, target: DropTarget) {
    if (locked) return
    playTap()
    setBoard((b) => moveChip(b, key, target.zone, target.index))
  }

  const drag = useChipDrag({ onDrop: handleDrop, onTap: handleTap, disabled: locked })

  function handleCheck() {
    if (locked || !isComplete(board)) return
    const userAnswer = answerText(board)
    const isCorrect = gradeReorder(userAnswer, exercise.sentence, exercise.answerSpec)
    setState(isCorrect ? 'correct' : 'wrong')
    if (isCorrect) playCorrect()
    else playWrong()
    onResult(isCorrect, userAnswer, Date.now() - startMs, {
      feedback: buildPedagogicalFeedback(exercise, isCorrect, userAnswer),
    })
  }

  const canCheck = state === 'idle' && isComplete(board)

  return (
    <div className="flex w-full flex-col gap-6">
      <p className="text-body-sm leading-relaxed text-fg-muted">
        En inglés el orden casi siempre es:{' '}
        <strong className="font-semibold text-fg">
          quién hace la acción → qué hace → el resto de la idea
        </strong>
        .
      </p>

      <DropZone
        zone="answer"
        chips={board.answer}
        empty="Toca o arrastra las palabras de abajo para colocarlas aquí en orden"
        variant="placed"
        locked={locked}
        drag={drag}
      />

      <DropZone
        zone="bank"
        chips={board.bank}
        empty=""
        variant="bank"
        locked={locked}
        drag={drag}
      />

      {state === 'idle' && (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleCheck}
          disabled={!canCheck}
        >
          Comprobar
        </Button>
      )}

      {state !== 'idle' && (
        <div className="rounded-xl border border-border-default bg-surface-sunken p-4 text-center text-body-md text-fg-muted">
          Orden correcto: <strong className="font-semibold text-fg">{exercise.sentence}</strong>
        </div>
      )}
    </div>
  )
}

interface DropZoneProps {
  zone: BoardZone
  chips: BoardChip[]
  empty: string
  variant: 'bank' | 'placed'
  locked: boolean
  drag: ReturnType<typeof useChipDrag>
}

function DropZone({ zone, chips, empty, variant, locked, drag }: DropZoneProps) {
  const isAnswer = zone === 'answer'
  const isDropZoneActive = drag.dropTarget?.zone === zone
  const targetIndex = isDropZoneActive ? drag.dropTarget?.index ?? -1 : -1

  return (
    <div
      data-drop-zone={zone}
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
      onPointerCancel={drag.onPointerCancel}
      className={cn(
        'flex flex-wrap items-center gap-2.5 rounded-2xl p-4 transition-all duration-200',
        isAnswer && 'min-h-20 border-2 border-dashed',
        isAnswer && chips.length === 0 && 'border-border-default bg-surface-sunken/30 justify-center',
        isAnswer && chips.length > 0 && 'border-primary bg-primary-soft/20',
        !isAnswer && 'justify-center py-2',
        isDropZoneActive && 'ring-2 ring-primary/50',
        'select-none touch-none',
      )}
      aria-label={isAnswer ? 'Tu respuesta' : 'Palabras disponibles'}
    >
      {isAnswer && chips.length === 0 && targetIndex < 0 && (
        <span className="text-body-sm text-fg-subtle">{empty}</span>
      )}
      {chips.map((chip, index) => (
        <Fragment key={chip.key}>
          {targetIndex === index && (
            <div className="h-10 w-12 rounded-xl border-2 border-dashed border-primary bg-primary-soft/40 animate-pulse transition-all shrink-0" />
          )}
          <ReorderWordChip
            chip={chip}
            index={index}
            variant={variant}
            locked={locked}
            isDragging={drag.draggingKey === chip.key}
            dragOffset={drag.draggingKey === chip.key ? drag.dragOffset : null}
            onPointerDown={(e) => drag.onPointerDown(chip.key, e)}
            onClick={(e) => drag.handleClick(chip.key, e)}
          />
        </Fragment>
      ))}
      {targetIndex >= chips.length && (
        <div className="h-10 w-12 rounded-xl border-2 border-dashed border-primary bg-primary-soft/40 animate-pulse transition-all shrink-0" />
      )}
    </div>
  )
}
