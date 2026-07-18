import { db } from '@/lib/db'
import { enqueue } from '@/lib/sync/sync-manager'
import type { JournalEntryRecord } from './types'

export async function saveJournalEntry(entry: JournalEntryRecord) {
  await db.transaction('rw', [db.journalEntries, db.syncOutbox], async () => {
    await db.journalEntries.put(entry)
    await enqueue('journal_entries', 'upsert', { id: entry.id, user_id: entry.userId, entry_date: entry.entryDate, prompt: entry.prompt, prompt_topic: entry.promptTopic ?? null, content: entry.content, status: entry.status, corrected_content: entry.correctedContent ?? null, feedback: entry.feedback ?? null, updated_at: entry.updatedAt }, undefined, 'id')
  })
}

export async function getLocalJournalEntry(userId: string, entryDate: string): Promise<JournalEntryRecord | undefined> {
  return db.journalEntries.where('[userId+entryDate]').equals([userId, entryDate]).first()
}

/** Local journal history for the user, newest entry first. Offline-first read. */
export async function listLocalJournalEntries(userId: string, limit = 30): Promise<JournalEntryRecord[]> {
  const rows = await db.journalEntries.where('userId').equals(userId).toArray()
  return rows.sort((a, b) => b.entryDate.localeCompare(a.entryDate)).slice(0, limit)
}
