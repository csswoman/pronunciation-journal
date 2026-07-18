'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getLocalJournalEntry, saveJournalEntry } from '@/lib/journal/queries'
import type { JournalEntryRecord } from '@/lib/journal/types'
export function JournalEditor({ entry }: { entry: JournalEntryRecord }) {
  const [activeEntry, setActiveEntry] = useState(entry); const [content, setContent] = useState(entry.content); const [saved, setSaved] = useState(true); const timer = useRef<ReturnType<typeof setTimeout> | null>(null); const contentRef = useRef(entry.content)
  useEffect(() => { void getLocalJournalEntry(entry.userId, entry.entryDate).then((existing) => { if (existing) { setActiveEntry(existing); setContent(existing.content) } }) }, [entry.entryDate, entry.userId])
  const save = useCallback(async (nextContent: string) => { setSaved(false); await saveJournalEntry({ ...activeEntry, content: nextContent, updatedAt: new Date().toISOString() }); setSaved(true) }, [activeEntry])
  useEffect(() => () => { if (timer.current) { clearTimeout(timer.current); void save(contentRef.current) } }, [save])
  return <div className="flex flex-col gap-3"><textarea value={content} onChange={(e) => { const next = e.target.value; contentRef.current = next; setContent(next); setSaved(false); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => void save(next), 600) }} onBlur={() => void save(content)} rows={12} className="rounded-xl border border-border-default bg-surface-raised p-4 text-fg" aria-label="Journal entry" /><p className="text-xs text-fg-muted">{saved ? 'Guardado localmente' : 'Cambios sin guardar'}</p></div>
}
