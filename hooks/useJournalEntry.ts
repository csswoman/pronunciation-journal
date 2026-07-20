'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  correctJournalEntry,
  JournalCorrectionError,
} from '@/lib/journal/correct-client'
import { parseJournalFeedback, type JournalFeedback } from '@/lib/journal/correction'
import { getLocalJournalEntry, saveJournalEntry } from '@/lib/journal/queries'
import type { JournalEntryRecord, JournalStatus } from '@/lib/journal/types'

const AUTOSAVE_DEBOUNCE_MS = 600

export type SaveState = 'saved' | 'pending' | 'error'

export interface UseJournalEntry {
  content: string
  status: JournalStatus
  saveState: SaveState
  isOnline: boolean
  correcting: boolean
  correctionError: string | null
  feedback: JournalFeedback | null
  correctedContent: string | null
  canSubmit: boolean
  canCorrect: boolean
  updateContent: (next: string) => void
  submit: () => Promise<void>
  requestCorrection: () => Promise<void>
}

/**
 * Owns the full Journal lifecycle for a single daily entry:
 * autosave (draft) → submit → online correction, offline-first throughout.
 * Drafts persist to Dexie (synced via the outbox); correction is the only
 * online-only step, so offline submits stay `submitted` and offer a manual
 * "correct on reconnect" action rather than promising remote sync.
 */
export function useJournalEntry(initial: JournalEntryRecord): UseJournalEntry {
  const [entry, setEntry] = useState(initial)
  const [content, setContent] = useState(initial.content)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [correcting, setCorrecting] = useState(false)
  const [correctionError, setCorrectionError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator === 'undefined' || navigator.onLine,
  )

  const entryRef = useRef(entry)
  const contentRef = useRef(content)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasLocalEdits = useRef(false)
  const correctingRef = useRef(false)

  useEffect(() => {
    entryRef.current = entry
  }, [entry])

  useEffect(() => {
    function sync() {
      setIsOnline(typeof navigator === 'undefined' || navigator.onLine)
    }
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
    return () => {
      window.removeEventListener('online', sync)
      window.removeEventListener('offline', sync)
    }
  }, [])

  // Hydrate from the local (possibly newer) copy so reload never loses a draft.
  useEffect(() => {
    void getLocalJournalEntry(initial.userId, initial.entryDate).then((existing) => {
      if (!existing || hasLocalEdits.current) return
      setEntry(existing)
      setContent(existing.content)
      contentRef.current = existing.content
    })
  }, [initial.entryDate, initial.userId])

  const persist = useCallback(async (patch: Partial<JournalEntryRecord>) => {
    const next: JournalEntryRecord = {
      ...entryRef.current,
      ...patch,
      updatedAt: new Date().toISOString(),
    }
    entryRef.current = next
    setEntry(next)
    setSaveState('pending')
    try {
      await saveJournalEntry(next)
      setSaveState('saved')
    } catch {
      setSaveState('error')
      throw new Error('save-failed')
    }
  }, [])

  // Flush a pending debounce on unmount so an in-flight edit is not dropped.
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current)
        void persist({ content: contentRef.current })
      }
    },
    [persist],
  )

  const updateContent = useCallback(
    (next: string) => {
      contentRef.current = next
      setContent(next)
      hasLocalEdits.current = true
      if (entryRef.current.status !== 'draft') return
      setSaveState('pending')
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        timer.current = null
        void persist({ content: next }).catch(() => {})
      }, AUTOSAVE_DEBOUNCE_MS)
    },
    [persist],
  )

  const requestCorrection = useCallback(async () => {
    const current = entryRef.current
    if (current.status !== 'submitted' || !isOnline || correctingRef.current) return
    correctingRef.current = true
    setCorrecting(true)
    setCorrectionError(null)
    try {
      const result = await correctJournalEntry({ entryId: current.id, content: current.content })
      await persist({
        status: 'corrected',
        correctedContent: result.correctedContent,
        feedback: { errors: result.errors, newWords: result.newWords },
      })
    } catch (err) {
      setCorrectionError(
        err instanceof JournalCorrectionError
          ? err.message
          : 'No se pudo corregir. Inténtalo de nuevo.',
      )
    } finally {
      correctingRef.current = false
      setCorrecting(false)
    }
  }, [isOnline, persist])

  const submit = useCallback(async () => {
    if (entryRef.current.status !== 'draft') return
    if (!contentRef.current.trim()) return
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    try {
      await persist({ content: contentRef.current, status: 'submitted' })
    } catch {
      return
    }
    if (isOnline) await requestCorrection()
  }, [isOnline, persist, requestCorrection])

  const feedback = parseJournalFeedback(entry.feedback)
  const canSubmit = entry.status === 'draft' && content.trim().length > 0
  const canCorrect = entry.status === 'submitted' && isOnline

  return {
    content,
    status: entry.status,
    saveState,
    isOnline,
    correcting,
    correctionError,
    feedback,
    correctedContent: entry.correctedContent ?? null,
    canSubmit,
    canCorrect,
    updateContent,
    submit,
    requestCorrection,
  }
}
