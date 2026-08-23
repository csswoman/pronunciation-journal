'use client'

import { useCallback, useRef } from 'react'

/**
 * Imperatively re-triggers a CSS animation class on an element.
 *
 * A CSS animation does not restart if its class is already applied — the
 * documented cause of "the second click doesn't animate." `trigger()`
 * removes the class, forces a synchronous reflow (`void el.offsetWidth`),
 * then re-adds the class so the browser recomputes and restarts it.
 */
export function useRetrigger<T extends HTMLElement>(animationClass: string) {
  const ref = useRef<T | null>(null)

  const trigger = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.classList.remove(animationClass)
    void el.offsetWidth
    el.classList.add(animationClass)
  }, [animationClass])

  return { ref, trigger }
}
