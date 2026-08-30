import PageLayout from '@/components/layout/PageLayout'
import { JournalGuidedWrite } from '@/components/journal/JournalGuidedWrite'
import { JournalPronunciationWrite } from '@/components/journal/JournalPronunciationWrite'
import { JournalPageClient } from '@/components/journal/JournalPageClient'
import { journalPromptForDate, journalPromptById } from '@/lib/journal/prompts'
import { writingScaffoldFor } from '@/lib/journal/writing-scaffold'
import { resolveSeedVocabulary, selectGrammarNote } from '@/lib/journal/scaffold-resolver'
import { getTodayLocalDateKey } from '@/lib/date/local-date'
import { getSupabaseServerUserId } from '@/lib/supabase/session'
import { TOPIC_PROMPTS, type NotebookTopic } from '@/lib/journal/notebook-types'
import { redirect } from 'next/navigation'

export default async function JournalWritePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; promptId?: string; topic?: string }>
}) {
  const userId = await getSupabaseServerUserId()
  if (!userId) redirect('/login?intent=explore')

  const { mode, promptId, topic } = await searchParams
  const entryDate = getTodayLocalDateKey()
  const prompt = (promptId ? journalPromptById(promptId) : null) ?? journalPromptForDate(entryDate)
  const scaffold = writingScaffoldFor(prompt.id, prompt.cefr_min)
  const [resolvedVocabulary, grammarNote] = await Promise.all([
    resolveSeedVocabulary(scaffold.seed_vocabulary, userId),
    selectGrammarNote(scaffold.relevant_topics, scaffold.grammar_notes, userId),
  ])
  const now = new Date().toISOString()

  const entryMode =
    mode === 'pronunciation'
      ? ('pronunciation' as const)
      : mode === 'guided'
        ? ('guided' as const)
        : ('blank' as const)

  const entry = {
    id: crypto.randomUUID(),
    userId,
    entryDate,
    prompt: prompt.text,
    promptTopic: topic || 'daily',
    entryMode,
    content: '',
    status: 'draft' as const,
    createdAt: now,
    updatedAt: now,
  }

  // ── Modo Pronunciación ("Diario de Pronunciación") ──
  if (mode === 'pronunciation') {
    const topicKey = (topic as NotebookTopic) || 'daily'
    const foundPrompt = TOPIC_PROMPTS[topicKey]?.find((p) => p.id === prompt.id)
    const promptEs = foundPrompt?.es || prompt.text

    return (
      <PageLayout archetype="session">
        <JournalPronunciationWrite
          entry={entry}
          promptEn={prompt.text}
          promptEs={promptEs}
        />
      </PageLayout>
    )
  }

  // ── Modo Guiado ("Completar frases") ──
  if (mode === 'guided') {
    const starterPrefix =
      scaffold.sentence_starters[0]?.en.replace(/\.\.\.\s*$/, '') || 'Today I want to'

    // Buscar traducción en el catálogo de prompts
    const topicKey = (topic as NotebookTopic) || 'daily'
    const foundPrompt = TOPIC_PROMPTS[topicKey]?.find((p) => p.id === prompt.id)
    const promptEs = foundPrompt?.es || prompt.text

    return (
      <PageLayout archetype="session">
        <JournalGuidedWrite
          entry={entry}
          promptEn={prompt.text}
          promptEs={promptEs}
          starterPrefix={starterPrefix}
          options={
            scaffold.seed_vocabulary.length > 0
              ? scaffold.seed_vocabulary.slice(0, 3).map((w) => w.text)
              : ['my day', 'my work', 'a new project']
          }
        />
      </PageLayout>
    )
  }


  // ── Modo Página en Blanco (Editor completo con Guía de Escritura) ──
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
      entry={entry}
    />
  )
}
