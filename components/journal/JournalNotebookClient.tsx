'use client'

// Planned structure:
// <JournalNotebookClient>
//   <NotebookHomeView data={computedDataFromDexie} />
// </JournalNotebookClient>

import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import PageLayout from '@/components/layout/PageLayout'
import { listLocalJournalEntries, saveJournalEntry } from '@/lib/journal/queries'
import { journalPromptForDate } from '@/lib/journal/prompts'
import type { JournalFeedback } from '@/lib/journal/correction'
import type { JournalEntryRecord, PronunciationJournalPayload } from '@/lib/journal/types'
import {
  type NotebookHome,
  type NotebookTopic,
} from '@/lib/journal/notebook-types'
import { NotebookHomeView } from './NotebookHomeView'

interface JournalNotebookClientProps {
  userId: string
  todayDate: string
}

export function JournalNotebookClient({ userId, todayDate }: JournalNotebookClientProps) {
  const rawEntries = useLiveQuery(() => listLocalJournalEntries(userId, 60), [userId])

  async function handleSavePronunciationWords(words: string[]) {
    const items = words.map((w) => ({
      id: crypto.randomUUID(),
      wordOrPhrase: w,
      difficultyReason: 'difficult_sound' as const,
      practiceCount: 1,
    }))
    const payload: PronunciationJournalPayload = { items }
    const now = new Date().toISOString()
    const pronRecord: JournalEntryRecord = {
      id: crypto.randomUUID(),
      userId,
      entryDate: todayDate,
      entryMode: 'pronunciation',
      prompt: 'Pronunciation journal words',
      content: JSON.stringify(payload),
      status: 'submitted',
      createdAt: now,
      updatedAt: now,
    }
    await saveJournalEntry(pronRecord)
  }

  const { notebook, learnings, savedPronunciationWords } = useMemo(() => {
    const entries = rawEntries ?? []
    const todayEntry = entries.find((e) => e.entryDate === todayDate)
    const prompt = journalPromptForDate(todayDate)

    const validEntries = entries.filter((e) => e.content.trim().length > 0)

    let todayStatus: NotebookHome['today']['status'] = 'empty'
    let todayPreview: string | undefined
    let todaySentences: number | undefined
    let todayNewWords: number | undefined

    if (todayEntry && todayEntry.content.trim().length > 0) {
      todayPreview = todayEntry.content.trim().split('\n')[0]
      if (todayEntry.status === 'corrected' || todayEntry.status === 'submitted') {
        todayStatus = 'done'
        todaySentences = countSentences(todayEntry.content)
        const fb = todayEntry.feedback as JournalFeedback | undefined
        todayNewWords = fb?.newWords?.length ?? 0
      } else {
        todayStatus = 'in_progress'
      }
    }

    const pastPages = validEntries.map((e) => {
      const fb = e.feedback as JournalFeedback | undefined
      const isReviewed = e.status === 'corrected' || Boolean(fb?.errors)
      return {
        id: e.id,
        date: e.entryDate,
        entryDate: e.entryDate,
        displayDate: formatShortDate(e.entryDate, todayDate),
        firstLine: e.content.trim().split('\n')[0] || e.prompt,
        sentences: countSentences(e.content),
        newWords: fb?.newWords?.length ?? 0,
        status: isReviewed ? ('reviewed' as const) : ('unreviewed' as const),
        errorCount: fb?.errors?.length ?? 0,
      }
    })

    const totalSentences = pastPages.reduce((acc, p) => acc + p.sentences, 0)
    const totalPages = pastPages.length

    const recentErrors: Array<{ quote: string; correction: string; type: string; explanationEs: string }> = []
    const recentWords: string[] = []
    const savedPronunciationWords: string[] = []

    for (const entry of entries) {
      if (entry.entryMode === 'pronunciation' && entry.content) {
        try {
          const parsed = JSON.parse(entry.content) as { items?: Array<{ word?: string }> }
          if (Array.isArray(parsed.items)) {
            for (const item of parsed.items) {
              if (item.word && !savedPronunciationWords.includes(item.word)) {
                savedPronunciationWords.push(item.word)
              }
            }
          }
        } catch {}
      }
    }

    for (const entry of validEntries) {
      const fb = entry.feedback as JournalFeedback | undefined
      if (fb?.errors) {
        for (const err of fb.errors) {
          if (recentErrors.length < 5 && !recentErrors.some((e) => e.quote === err.quote)) {
            recentErrors.push(err)
          }
        }
      }
      if (fb?.newWords) {
        for (const w of fb.newWords) {
          if (recentWords.length < 12 && !recentWords.includes(w)) {
            recentWords.push(w)
          }
        }
      }
    }

    return {
      notebook: {
        totals: {
          pages: totalPages,
          sentences: totalSentences,
        },
        today: {
          date: todayDate,
          status: todayStatus,
          topic: (todayEntry?.promptTopic as NotebookTopic) || 'daily',
          entryMode: todayEntry?.entryMode ?? 'blank',
          prompt: {
            id: prompt.id,
            en: prompt.text,
            es: getPromptSpanish(prompt.id),
          },
          preview: todayPreview,
          sentences: todaySentences,
          newWords: todayNewWords,
        },
        pastPages,
      },
      learnings: {
        recentErrors,
        recentWords,
      },
      savedPronunciationWords,
    }
  }, [rawEntries, todayDate])

  return (
    <PageLayout archetype="session">
      <NotebookHomeView
        initialData={notebook}
        learnings={learnings}
        savedPronunciationWords={savedPronunciationWords}
        onSavePronunciationWords={(words) => void handleSavePronunciationWords(words)}
      />
    </PageLayout>
  )
}

function countSentences(text: string): number {
  if (!text || !text.trim()) return 0
  const matches = text.trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g)
  return matches ? matches.filter((s) => s.trim().length > 0).length : 0
}

function formatShortDate(entryDate: string, todayKey?: string): string {
  if (todayKey && entryDate === todayKey) {
    return 'Hoy'
  }

  const date = new Date(`${entryDate}T12:00:00`)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  if (entryDate === yesterday.toISOString().split('T')[0]) {
    return 'Ayer'
  }

  return new Intl.DateTimeFormat('es-PE', {
    day: 'numeric',
    month: 'short',
  }).format(date)
}

function getPromptSpanish(promptId: string): string {
  switch (promptId) {
    case 'small-win':
      return '¿Cuál fue un pequeño logro de tu día?'
    case 'learn-this-week':
      return 'Describe algo que te gustaría aprender esta semana.'
    case 'relaxing-place':
      return 'Escribe sobre un lugar que te ayude a relajarte.'
    case 'remembered-conversation':
    default:
      return '¿Qué conversación recuerdas de hoy?'
  }
}
