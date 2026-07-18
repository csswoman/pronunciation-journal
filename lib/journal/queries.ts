import { db } from '@/lib/db'
import { enqueue } from '@/lib/sync/sync-manager'
import type { JournalEntryRecord } from './types'

export async function saveJournalEntry(entry: JournalEntryRecord) {
  await db.transaction('rw', [db.journalEntries, db.syncOutbox], async () => {
    await db.journalEntries.put(entry)
    await enqueue('journal_entries', 'upsert', { id: entry.id, user_id: entry.userId, entry_date: entry.entryDate, prompt: entry.prompt, prompt_topic: entry.promptTopic ?? null, content: entry.content, status: entry.status, corrected_content: entry.correctedContent ?? null, feedback: entry.feedback ?? null, updated_at: entry.updatedAt }, undefined, 'id')
  })
}
