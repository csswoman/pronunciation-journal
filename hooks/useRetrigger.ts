'use client'

import { useCallback, useEffect, useRef } from 'react'

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

/**
 * Re-triggers a CSS animation class whenever `value` strictly increases
 * compared to its previous render — never on first mount, never on a
 * decrease or no-op change. Use for counters where only "went up" should
 * celebrate (e.g. a streak count).
 */
export function useRetriggerOnIncrease<T extends HTMLElement>(
  value: number,
  animationClass: string,
) {
  const ref = useRef<T | null>(null)
  const prevValue = useRef<number | null>(null)

  useEffect(() => {
    const el = ref.current
    const previous = prevValue.current
    prevValue.current = value

    if (!el) return
    if (previous === null) return
    if (value <= previous) return

    el.classList.remove(animationClass)
    void el.offsetWidth
    el.classList.add(animationClass)
  }, [value, animationClass])

  return ref
}
