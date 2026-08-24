'use client'

// Planned structure:
// <LearningFocusStrip>
//   "Tu nivel" + CEFR code + optional pin badge + "Cambiar" link
// </LearningFocusStrip>
//
// Compact single-line variant of LearningFocusCard, sized to sit inside a
// sidebar card header instead of owning a full section.

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { getEffectiveFocus } from '@/lib/learning-focus/effective-focus'
import { loadLearningFocus, refreshSuggestedFocus, releaseFocusPin } from '@/lib/learning-focus/queries'
import type { FocusLevel, LearningFocus } from '@/lib/learning-focus/types'

const LEVEL_LABELS: Record<FocusLevel, string> = {
  a1: 'A1',
  a2: 'A2',
  b1: 'B1',
  b2: 'B2',
  c1: 'C1',
}

interface LearningFocusStripProps {
  profileLevel: string | null
}

export default function LearningFocusStrip({ profileLevel }: LearningFocusStripProps) {
  const { user } = useAuth()

  const [focus, setFocus] = useState<LearningFocus | null>(null)
  const [busy, setBusy] = useState(false)

  const deriveInput = useMemo(
    () => ({
      profileLevel,
      routeLevel: null,
      recentTheoryLessonSlug: null,
      weakSoundKey: null,
    }),
    [profileLevel],
  )

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false

    async function load() {
      try {
        const loaded = await loadLearningFocus(user!.id)
        const refreshed = await refreshSuggestedFocus(user!.id, deriveInput)
        if (cancelled) return
        setFocus(refreshed ?? loaded)
      } catch {
        // IndexedDB may still be recovering from Chrome UnknownError on open.
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [user?.id, deriveInput])

  const effective = useMemo(() => (focus ? getEffectiveFocus(focus) : null), [focus])

  const handleRelease = useCallback(async () => {
    if (!user?.id || busy) return
    setBusy(true)
    try {
      const next = await releaseFocusPin(user.id, deriveInput)
      setFocus(next)
    } finally {
      setBusy(false)
    }
  }, [busy, deriveInput, user?.id])

  if (!user?.id || !effective) return null

  const activeLevel = effective.level

  return (
    <div
      aria-label="Tu nivel de aprendizaje"
      className="mb-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-border-subtle pb-2"
    >
      <div className="flex items-center gap-1.5">
        <span className="font-caption text-fg-muted">Tu nivel</span>
        <span className="font-caption font-semibold text-fg">
          {LEVEL_LABELS[activeLevel]}
        </span>
        {effective.pinned ? (
          <span className="rounded-sm bg-primary-soft px-1.5 py-0.5 text-[11px] font-medium text-primary">
            Fijado
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        {effective.pinned ? (
          <button
            type="button"
            onClick={() => void handleRelease()}
            disabled={busy}
            className="focus-ring text-caption text-fg-muted underline-offset-2 transition-colors hover:text-fg hover:underline disabled:opacity-60"
          >
            Usar sugerido
          </button>
        ) : null}

        <Link
          href="/profile"
          className="focus-ring text-caption text-fg-muted underline-offset-2 transition-colors hover:text-fg hover:underline"
          aria-label="Cambiar el nivel en tu perfil"
        >
          Cambiar
        </Link>
      </div>
    </div>
  )
}
