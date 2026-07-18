import { JournalEditor } from '@/components/journal/JournalEditor'
import { journalPromptForDate } from '@/lib/journal/prompts'
import { getTodayLocalDateKey } from '@/lib/date/local-date'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
export default async function JournalPage() {
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect('/login')
  const entryDate = getTodayLocalDateKey(); const prompt = journalPromptForDate(entryDate)
  return <main className="mx-auto max-w-2xl space-y-5 px-4 py-8"><header><h1 className="text-h2 font-bold text-fg">Journal</h1><p className="text-fg-muted">{prompt}</p></header><JournalEditor entry={{ id: crypto.randomUUID(), userId: user.id, entryDate, prompt, content: '', status: 'draft', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }} /></main>
}
