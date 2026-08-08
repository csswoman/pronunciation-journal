'use client'

import { useEffect, useRef } from 'react'

const CONTROL_SELECTOR = 'button, a, input, textarea, select, [contenteditable="true"]'

/** Continue the current exercise only after its answer feedback is visible. */
export function useEnterToContinue(enabled: boolean, onContinue?: () => void) {
  const onContinueRef = useRef(onContinue)

  useEffect(() => {
    onContinueRef.current = onContinue
  }, [onContinue])

  useEffect(() => {
    if (!enabled || !onContinue) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.isComposing || event.defaultPrevented) return

      const target = event.target instanceof HTMLElement
        ? event.target.closest(CONTROL_SELECTOR)
        : null
      const isDisabledControl = target instanceof HTMLButtonElement
        || target instanceof HTMLInputElement
        || target instanceof HTMLTextAreaElement
        || target instanceof HTMLSelectElement
        ? target.disabled
        : false

      // Keep native Enter behavior for active controls. Answer controls are
      // disabled after grading, so focus can remain there while continuing.
      if (target && !isDisabledControl) return

      event.preventDefault()
      onContinueRef.current?.()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, onContinue])
}
