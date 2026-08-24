import { db, ensureDbReady } from '@/lib/db'
import { enqueue } from '@/lib/sync/sync-manager'
import type { JournalEntryRecord } from './types'

export async function saveJournalEntry(entry: JournalEntryRecord) {
  await db.transaction('rw', [db.journalEntries, db.syncOutbox], async () => {
    await db.journalEntries.put(entry)
    await enqueue(entry.userId, 'journal_entries', 'upsert', { id: entry.id, user_id: entry.userId, entry_date: entry.entryDate, prompt: entry.prompt, prompt_topic: entry.promptTopic ?? null, entry_mode: entry.entryMode ?? 'blank', content: entry.content, status: entry.status, corrected_content: entry.correctedContent ?? null, feedback: entry.feedback ?? null, updated_at: entry.updatedAt }, undefined, 'id')
  })
}

/** Deletes a journal entry locally and enqueues the matching Supabase delete. */
export async function deleteJournalEntry(entry: JournalEntryRecord): Promise<void> {
  await db.transaction('rw', [db.journalEntries, db.syncOutbox], async () => {
    await db.journalEntries.delete(entry.id)
    await enqueue(entry.userId, 'journal_entries', 'delete', {}, { id: entry.id })
  })
}

export async function getLocalJournalEntry(userId: string, entryDate: string): Promise<JournalEntryRecord | undefined> {
  return db.journalEntries.where('[userId+entryDate]').equals([userId, entryDate]).first()
}

/** Local journal history for the user, newest entry first. Offline-first read. */
export async function listLocalJournalEntries(userId: string, limit = 30): Promise<JournalEntryRecord[]> {
  try {
    await ensureDbReady()
    const rows = await db.journalEntries.where('userId').equals(userId).toArray()
    return rows.sort((a, b) => b.entryDate.localeCompare(a.entryDate)).slice(0, limit)
  } catch {
    return []
  }
}
