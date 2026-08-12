'use client'

// Planned structure:
// <LearningFocusCard>
//   <header /> — title + status badge
//   <level chips />
//   <actions /> — release, topics sheet trigger
//   <profile hint />
//   <LearningFocusTopicsSheet />
// </LearningFocusCard>

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import LearningFocusTopicsSheet from '@/components/home/LearningFocusTopicsSheet'
import { cn } from '@/lib/cn'
import { toFocusLevel } from '@/lib/learning-focus/cefr'
import { getEffectiveFocus } from '@/lib/learning-focus/effective-focus'
import {
  claimTheoryTopics,
  listClaimedTheoryTopics,
  loadLearningFocus,
  pinFocus,
  refreshSuggestedFocus,
  releaseFocusPin,
} from '@/lib/learning-focus/queries'
import type { FocusLevel, LearningFocus } from '@/lib/learning-focus/types'

const FOCUS_LEVELS: FocusLevel[] = ['a1', 'a2', 'b1', 'b2', 'c1']

const LEVEL_LABELS: Record<FocusLevel, string> = {
  a1: 'A1',
  a2: 'A2',
  b1: 'B1',
  b2: 'B2',
  c1: 'C1',
}

type LearningFocusCardProps = {
  profileLevel: string | null
  routeLevel: string | null
  recentTheoryLessonSlug: string | null
  weakSoundKey: string | null
}

export default function LearningFocusCard({
  profileLevel,
  routeLevel,
  recentTheoryLessonSlug,
  weakSoundKey,
}: LearningFocusCardProps) {
  const { user } = useAuth()

  const [focus, setFocus] = useState<LearningFocus | null>(null)
  const [claimedSlugs, setClaimedSlugs] = useState<Set<string>>(new Set())
  const [sheetOpen, setSheetOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const deriveInput = useMemo(
    () => ({
      profileLevel,
      routeLevel,
      recentTheoryLessonSlug,
      weakSoundKey,
    }),
    [profileLevel, routeLevel, recentTheoryLessonSlug, weakSoundKey],
  )

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false

    async function load() {
      const [loaded, claimed] = await Promise.all([
        loadLearningFocus(user!.id),
        listClaimedTheoryTopics(user!.id),
      ])
      const refreshed = await refreshSuggestedFocus(user!.id, deriveInput)
      if (cancelled) return
      setFocus(refreshed ?? loaded)
      setClaimedSlugs(new Set(claimed.map((item) => item.lessonSlug)))
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [user?.id, deriveInput])

  const effective = useMemo(
    () => (focus ? getEffectiveFocus(focus) : null),
    [focus],
  )

  const profileFocusLevel = toFocusLevel(profileLevel)
  const showProfileHint =
    effective != null && profileFocusLevel != null && profileFocusLevel !== effective.level

  const handlePinLevel = useCallback(
    async (level: FocusLevel) => {
      if (!user?.id || busy) return
      setBusy(true)
      try {
        const next = await pinFocus(user.id, { level, thread: null })
        setFocus(next)
      } finally {
        setBusy(false)
      }
    },
    [busy, user?.id],
  )

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

  const handleClaim = useCallback(
    async (concepts: Parameters<typeof claimTheoryTopics>[1]) => {
      if (!user?.id) return
      await claimTheoryTopics(user.id, concepts)
      const claimed = await listClaimedTheoryTopics(user.id)
      setClaimedSlugs(new Set(claimed.map((item) => item.lessonSlug)))
    },
    [user?.id],
  )

  if (!user?.id || !effective) return null

  const statusLabel = effective.pinned ? 'Fijado' : 'Sugerido'
  const activeLevel = effective.level

  return (
    <section
      aria-label="Tu foco de aprendizaje"
      className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-raised px-4 py-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-label text-fg">Tu foco</h2>
          <span
            className={cn(
              'rounded-sm px-2 py-0.5 text-tiny font-medium',
              effective.pinned
                ? 'bg-primary-soft text-primary'
                : 'bg-surface-sunken text-fg-muted',
            )}
          >
            {statusLabel}
          </span>
        </div>
        {effective.pinned ? (
          <button
            type="button"
            onClick={() => void handleRelease()}
            disabled={busy}
            className="focus-ring text-body-sm text-fg-muted underline-offset-2 transition-colors hover:text-fg hover:underline disabled:opacity-60"
          >
            Soltar
          </button>
        ) : null}
      </div>

      <p className="text-body-sm text-fg-muted">
        Priorizamos contenido de{' '}
        <span className="font-semibold text-fg">{LEVEL_LABELS[activeLevel]}</span>
      </p>

      <div className="grid grid-cols-5 gap-1" role="group" aria-label="Nivel de foco">
        {FOCUS_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            aria-pressed={activeLevel === level}
            aria-label={LEVEL_LABELS[level]}
            disabled={busy}
            onClick={() => void handlePinLevel(level)}
            className={cn(
              'focus-ring min-h-9 rounded-sm font-label transition-colors disabled:opacity-60',
              activeLevel === level
                ? 'bg-primary text-on-primary'
                : 'bg-surface-sunken text-fg-muted hover:text-fg',
            )}
          >
            {LEVEL_LABELS[level]}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="focus-ring self-start text-body-sm text-fg-muted underline-offset-2 transition-colors hover:text-fg hover:underline"
      >
        Temas que ya sé
      </button>

      {showProfileHint ? (
        <p className="text-caption text-fg-muted">
          Tu nivel en perfil es {LEVEL_LABELS[profileFocusLevel!]}.{' '}
          <Link href="/profile" className="text-fg underline-offset-2 hover:underline">
            Ajustar en perfil
          </Link>
        </p>
      ) : null}

      <LearningFocusTopicsSheet
        open={sheetOpen}
        level={activeLevel}
        claimedSlugs={claimedSlugs}
        onClose={() => setSheetOpen(false)}
        onClaim={handleClaim}
      />
    </section>
  )
}
