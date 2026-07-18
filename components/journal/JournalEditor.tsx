'use client'
import { useEffect, useState } from 'react'
import { getLocalJournalEntry, saveJournalEntry } from '@/lib/journal/queries'
import type { JournalEntryRecord } from '@/lib/journal/types'
export function JournalEditor({ entry }: { entry: JournalEntryRecord }) {
  const [activeEntry, setActiveEntry] = useState(entry); const [content, setContent] = useState(entry.content); const [saved, setSaved] = useState(true)
  useEffect(() => { void getLocalJournalEntry(entry.userId, entry.entryDate).then((existing) => { if (existing) { setActiveEntry(existing); setContent(existing.content) } }) }, [entry.entryDate, entry.userId])
  const save = async () => { setSaved(false); await saveJournalEntry({ ...activeEntry, content, updatedAt: new Date().toISOString() }); setSaved(true) }
  return <div className="flex flex-col gap-3"><textarea value={content} onChange={(e) => { setContent(e.target.value); setSaved(false) }} onBlur={() => void save()} rows={12} className="rounded-xl border border-border-default bg-surface-raised p-4 text-fg" aria-label="Journal entry" /><p className="text-xs text-fg-muted">{saved ? 'Guardado localmente' : 'Cambios sin guardar'}</p></div>
}
