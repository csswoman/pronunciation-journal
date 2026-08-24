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
  canResumeDraft: boolean
  updateContent: (next: string) => void
  submit: () => Promise<void>
  requestCorrection: () => Promise<void>
  resumeDraft: () => Promise<void>
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
  // Always true on first render (both server and client) so hydration never
  // mismatches; the real navigator.onLine value syncs in immediately after mount.
  const [isOnline, setIsOnline] = useState(true)

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
      setIsOnline(navigator.onLine)
    }
    sync()
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
      if (hasLocalEdits.current) return
      if (!existing) {
        if (initial.content) {
          void saveJournalEntry(initial)
        }
        return
      }
      // If DB has an empty draft but initial has guided starter content, prefer initial
      if (!existing.content.trim() && initial.content.trim()) {
        const withInitial = { ...existing, content: initial.content }
        setEntry(withInitial)
        setContent(initial.content)
        contentRef.current = initial.content
        void saveJournalEntry(withInitial)
        return
      }
      setEntry(existing)
      setContent(existing.content)
      contentRef.current = existing.content
    })
  }, [initial.entryDate, initial.userId, initial.content])

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
        feedback: {
          errors: result.errors,
          newWords: result.newWords,
          scheduledTopics: result.scheduled?.topics ?? [],
        },
      })
    } catch (err) {
      setCorrectionError(
        err instanceof JournalCorrectionError
          ? err.message
          : 'No se pudo revisar. Inténtalo de nuevo.',
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

  // Lets a user back out of a submitted-but-uncorrected entry, or reopen an
  // already-corrected one, without losing text. Feedback from a prior
  // correction is kept on the record (not cleared) so it's still visible in
  // history after the user resumes writing — only the in-progress editor
  // hides it while status is 'draft'.
  const resumeDraft = useCallback(async () => {
    const status = entryRef.current.status
    if ((status !== 'submitted' && status !== 'corrected') || correctingRef.current) return
    setCorrectionError(null)
    await persist({ status: 'draft' })
  }, [persist])

  const feedback = parseJournalFeedback(entry.feedback)
  const canSubmit = entry.status === 'draft' && content.trim().length > 0
  const canCorrect = entry.status === 'submitted' && isOnline
  const canResumeDraft =
    (entry.status === 'submitted' || entry.status === 'corrected') && !correcting

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
    canResumeDraft,
    updateContent,
    submit,
    requestCorrection,
    resumeDraft,
  }
}
