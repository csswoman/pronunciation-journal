import { JournalPageClient } from '@/components/journal/JournalPageClient'
import { journalPromptForDate } from '@/lib/journal/prompts'
import { writingScaffoldFor } from '@/lib/journal/writing-scaffold'
import { resolveSeedVocabulary, selectGrammarNote } from '@/lib/journal/scaffold-resolver'
import { getTodayLocalDateKey } from '@/lib/date/local-date'
import { getSupabaseServerUserId } from '@/lib/supabase/session'
import { redirect } from 'next/navigation'

export default async function JournalPage() {
  const userId = await getSupabaseServerUserId()
  // Guest bootstrap may still be establishing the session; avoid a hard login wall.
  if (!userId) redirect('/login?intent=explore')

  const entryDate = getTodayLocalDateKey()
  const prompt = journalPromptForDate(entryDate)
  const scaffold = writingScaffoldFor(prompt.id, prompt.cefr_min)
  const [resolvedVocabulary, grammarNote] = await Promise.all([
    resolveSeedVocabulary(scaffold.seed_vocabulary, userId),
    selectGrammarNote(scaffold.relevant_topics, scaffold.grammar_notes, userId),
  ])
  const now = new Date().toISOString()

  return (
    <JournalPageClient
      promptId={prompt.id}
      promptText={prompt.text}
      cefrLevel={prompt.cefr_min}
      targetLength={prompt.target_length}
      subtitle={new Intl.DateTimeFormat('es-PE', {
        dateStyle: 'full',
        timeZone: 'America/Lima',
      }).format(new Date())}
      resolvedVocabulary={resolvedVocabulary}
      selectedGrammarNote={grammarNote}
      entry={{
        id: crypto.randomUUID(),
        userId,
        entryDate,
        prompt: prompt.text,
        content: '',
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      }}
    />
  )
}
