'use client'

import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'
import { useCallback, useRef, useState } from 'react'
import type { BoardZone } from '@/lib/exercises/reorder-board'

/** Pixels the pointer must travel before a press counts as a drag, not a tap. */
const DRAG_THRESHOLD_PX = 6

export interface DropTarget {
  zone: BoardZone
  index: number
}

interface DragState {
  key: string
  /** Where the chip would land if released now. */
  target: DropTarget | null
  /** Pointer delta (x, y) relative to pointer-down origin. */
  dx: number
  dy: number
}

interface Params {
  /** Called on release when the pointer moved far enough to count as a drag. */
  onDrop: (key: string, target: DropTarget) => void
  /** Called on release when the pointer never passed the drag threshold. */
  onTap: (key: string) => void
  disabled?: boolean
}

/**
 * Forgiving, pointer-driven dragging for the reorder board.
 *
 * Handles pointer capture, forgiving proximity hit-testing, and prevents
 * synthesized click events from toggling dropped chips back to the bank.
 */
export function useChipDrag({ onDrop, onTap, disabled }: Params) {
  const [drag, setDrag] = useState<DragState | null>(null)
  const origin = useRef<{ x: number; y: number } | null>(null)
  const moved = useRef(false)
  const wasDraggedRef = useRef(false)

  const resolveTarget = useCallback(
    (clientX: number, clientY: number, activeKey: string | null): DropTarget | null => {
      if (typeof document === 'undefined') return null

      const answerZone = document.querySelector<HTMLElement>('[data-drop-zone="answer"]')
      const bankZone = document.querySelector<HTMLElement>('[data-drop-zone="bank"]')
      if (!answerZone || !bankZone) return null

      const answerRect = answerZone.getBoundingClientRect()
      const bankRect = bankZone.getBoundingClientRect()

      const ANSWER_PADDING = 45
      const isNearAnswer =
        clientY >= answerRect.top - ANSWER_PADDING &&
        clientY <= answerRect.bottom + ANSWER_PADDING

      const isNearBank =
        clientY >= bankRect.top - ANSWER_PADDING &&
        clientY <= bankRect.bottom + ANSWER_PADDING

      let targetZoneEl: HTMLElement
      let zone: BoardZone

      if (isNearAnswer) {
        targetZoneEl = answerZone
        zone = 'answer'
      } else if (isNearBank) {
        targetZoneEl = bankZone
        zone = 'bank'
      } else {
        const distToAnswer = Math.abs(clientY - (answerRect.top + answerRect.height / 2))
        const distToBank = Math.abs(clientY - (bankRect.top + bankRect.height / 2))
        if (distToAnswer < distToBank) {
          targetZoneEl = answerZone
          zone = 'answer'
        } else {
          targetZoneEl = bankZone
          zone = 'bank'
        }
      }

      // Ignore the active dragged chip so target indices align with the array post-removal
      const chips = Array.from(
        targetZoneEl.querySelectorAll<HTMLElement>('[data-chip-index]'),
      ).filter((el) => el.dataset.chipKey !== activeKey)

      if (chips.length === 0) {
        return { zone, index: 0 }
      }

      for (let i = 0; i < chips.length; i++) {
        const chipRect = chips[i].getBoundingClientRect()
        const midX = chipRect.left + chipRect.width / 2

        if (clientX < midX) {
          return { zone, index: i }
        }
      }

      return { zone, index: chips.length }
    },
    [],
  )

  const onPointerDown = useCallback(
    (key: string, event: ReactPointerEvent<HTMLElement>) => {
      if (disabled || event.button !== 0) return
      event.currentTarget.setPointerCapture(event.pointerId)
      origin.current = { x: event.clientX, y: event.clientY }
      moved.current = false
      wasDraggedRef.current = false
      setDrag({ key, target: null, dx: 0, dy: 0 })
    },
    [disabled],
  )

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!drag || !origin.current) return
      const dx = event.clientX - origin.current.x
      const dy = event.clientY - origin.current.y
      if (!moved.current && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return

      moved.current = true
      wasDraggedRef.current = true
      setDrag({
        key: drag.key,
        target: resolveTarget(event.clientX, event.clientY, drag.key),
        dx,
        dy,
      })
    },
    [drag, resolveTarget],
  )

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!drag) return
      const { key } = drag

      if (moved.current) {
        const target = resolveTarget(event.clientX, event.clientY, key)
        onDrop(key, target ?? { zone: 'bank', index: Number.MAX_SAFE_INTEGER })
      }

      origin.current = null
      moved.current = false
      setDrag(null)
    },
    [drag, onDrop, resolveTarget],
  )

  const onPointerCancel = useCallback(() => {
    origin.current = null
    moved.current = false
    wasDraggedRef.current = false
    setDrag(null)
  }, [])

  const handleClick = useCallback(
    (key: string, event: ReactMouseEvent) => {
      if (wasDraggedRef.current) {
        event.preventDefault()
        event.stopPropagation()
        wasDraggedRef.current = false
        return
      }
      onTap(key)
    },
    [onTap],
  )

  return {
    draggingKey: moved.current ? (drag?.key ?? null) : null,
    dropTarget: drag?.target ?? null,
    dragOffset: moved.current && drag ? { dx: drag.dx, dy: drag.dy } : null,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    handleClick,
  }
}
