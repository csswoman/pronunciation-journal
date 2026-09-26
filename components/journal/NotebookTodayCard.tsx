'use client'

// Planned structure:
// <NotebookTodayCard>
//   <PastelCard tone="mint">
//     <NotebookTodayPromptHeader date promptEn promptEs onShufflePrompt />
//     <ModePillsRow: "TOCA UNA FRASE PARA EMPEZAR" kicker + Mode toggle pills (high contrast) />
//     <StarterChipsRow: chips (when "Con estructura") />
//     <NotebookWritingPaper: paper card + 3 holes + margin + ruled lines + textarea />
//     <FooterToolbar: word count + switch ("Sonido del teclado") + CTA button ("Revisar mi inglés") />
//   </PastelCard>
//   {feedback && correctedContent && <JournalFeedbackView />}
// </NotebookTodayCard>

import { useState, useEffect } from 'react'
import { Sparkles } from '@/components/icons'
import PastelCard from '@/components/layout/PastelCard'
import Button from '@/components/ui/Button'
import { correctJournalEntry } from '@/lib/journal/correct-client'
import type { JournalFeedback } from '@/lib/journal/correction'
import { playUiCue } from '@/lib/ui-sounds/cues'
import {
  TOPIC_PROMPTS,
  ALL_TOPICS,
  TOPIC_STARTER_CHIPS,
  type NotebookHome,
  type NotebookTopic,
  type PromptDefinition,
} from '@/lib/journal/notebook-types'
import { JournalFeedbackView } from './JournalFeedbackView'
import { NotebookStarterChips } from './NotebookStarterChips'
import { NotebookWritingPaper } from './NotebookWritingPaper'
import { NotebookTodayPromptHeader } from './NotebookTodayPromptHeader'

const ALL_FLAT_PROMPTS: Array<{ prompt: PromptDefinition; topic: NotebookTopic }> = ALL_TOPICS.flatMap(
  (topicKey) => (TOPIC_PROMPTS[topicKey] || []).map((prompt) => ({ prompt, topic: topicKey }))
)

interface NotebookTodayCardProps {
  today: NotebookHome['today']
  onSelectMode?: (mode: 'guided' | 'blank' | 'pronunciation') => void
  onTopicChange?: (topic: NotebookTopic) => void
  onShufflePrompt?: () => void
  insertedPhrase?: string
}

export function NotebookTodayCard({
  today,
  onTopicChange,
  onShufflePrompt,
  insertedPhrase,
}: NotebookTodayCardProps) {
  const [promptIndex, setPromptIndex] = useState<number | null>(null)
  const [scaffoldMode, setScaffoldMode] = useState<'guided' | 'blank'>('guided')
  const [content, setContent] = useState(today.preview ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [correctedContent, setCorrectedContent] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<JournalFeedback | null>(null)

  useEffect(() => {
    if (insertedPhrase) {
      setContent((prev) => (prev.trim() ? `${prev.trim()}\n${insertedPhrase}` : insertedPhrase))
    }
  }, [insertedPhrase])

  const activeItem = promptIndex !== null ? ALL_FLAT_PROMPTS[promptIndex % ALL_FLAT_PROMPTS.length] : null

  const currentPrompt = activeItem ? activeItem.prompt : today.prompt
  const currentTopic = activeItem ? activeItem.topic : (today.topic || 'daily')
  const starterChips = TOPIC_STARTER_CHIPS[currentTopic] ?? TOPIC_STARTER_CHIPS.daily

  function handleShuffle() {
    setPromptIndex((prev) => {
      let nextIndex = 0
      if (prev === null) {
        const foundIndex = ALL_FLAT_PROMPTS.findIndex(
          (item) => (today.prompt.id && item.prompt.id === today.prompt.id) || item.prompt.en === today.prompt.en
        )
        nextIndex = foundIndex >= 0 ? (foundIndex + 1) % ALL_FLAT_PROMPTS.length : 1
      } else {
        nextIndex = (prev + 1) % ALL_FLAT_PROMPTS.length
      }

      const nextItem = ALL_FLAT_PROMPTS[nextIndex]
      if (nextItem) onTopicChange?.(nextItem.topic)
      return nextIndex
    })
    onShufflePrompt?.()
  }

  function handleInsertStarter(starterText: string) {
    const cleanStarter = starterText.replace(/\.\.\.$/, ' ')
    if (soundEnabled) playUiCue('mech-space')
    setContent((prev) => (prev.trim() ? `${prev.trim()}\n${cleanStarter}` : cleanStarter))
  }

  async function handleReview() {
    if (!content.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      const res = await correctJournalEntry({
        entryId: '00000000-0000-0000-0000-000000000000',
        content: content.trim(),
      })
      setCorrectedContent(res.correctedContent)
      setFeedback({
        errors: res.errors,
        newWords: res.newWords,
        scheduledTopics: res.scheduled?.topics,
      })
    } catch {
      setCorrectedContent(content.trim())
      setFeedback({ errors: [], newWords: [] })
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      void handleReview()
      return
    }

    if (soundEnabled && e.key !== 'Shift' && e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Meta') {
      if (e.key === ' ' || e.key === 'Enter') playUiCue('mech-space')
      else playUiCue('mech-key')
    }
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

  return (
    <div className="flex flex-col gap-5">
      <PastelCard
        tone="mint"
        className="relative flex flex-col gap-5 p-5 sm:p-6 overflow-hidden motion-reduce:shadow-none"
        aria-labelledby="today-page-heading"
      >
        <NotebookTodayPromptHeader
          date={today.date}
          formattedDate={formatLongDate(today.date)}
          promptEn={currentPrompt.en}
          promptEs={currentPrompt.es}
          onShufflePrompt={handleShuffle}
        />

        {/* ── Fila de Kicker y Selector de Modo (Control Segmentado) ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <span className="font-kicker text-ink select-none">TOCA UNA FRASE PARA EMPEZAR</span>

          <div
            className="inline-flex items-center gap-1 rounded-full bg-ink/10 p-1 select-none"
            role="tablist"
            aria-label="Modo de redacción"
          >
            <button
              type="button"
              role="tab"
              aria-selected={scaffoldMode === 'guided'}
              onClick={() => setScaffoldMode('guided')}
              className={`focus-ring inline-flex items-center rounded-full px-4 py-1.5 font-label text-body-sm transition-all duration-150 cursor-pointer ${
                scaffoldMode === 'guided'
                  ? 'bg-ink text-paper font-bold shadow-xs'
                  : 'bg-transparent text-ink font-semibold hover:bg-ink/5'
              }`}
            >
              Con estructura
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={scaffoldMode === 'blank'}
              onClick={() => setScaffoldMode('blank')}
              className={`focus-ring inline-flex items-center rounded-full px-4 py-1.5 font-label text-body-sm transition-all duration-150 cursor-pointer ${
                scaffoldMode === 'blank'
                  ? 'bg-ink text-paper font-bold shadow-xs'
                  : 'bg-transparent text-ink font-semibold hover:bg-ink/5'
              }`}
            >
              Página en blanco
            </button>
          </div>
        </div>

        {/* ── Chips de arranque ── */}
        {scaffoldMode === 'guided' && (
          <NotebookStarterChips chips={starterChips} onInsert={handleInsertStarter} />
        )}

        {/* ── Hoja de cuaderno rayada ── */}
        <NotebookWritingPaper
          content={content}
          onChange={setContent}
          onKeyDown={handleKeyDown}
        />

        {/* ── Pie de hoja: Contador + Switch ("Sonido del teclado") + Botón de revisión ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-sans text-caption text-ink-secondary select-none">
              {wordCount} {wordCount === 1 ? 'palabra' : 'palabras'} · {content.trim() ? 'borrador' : 'sin guardar'}
            </span>

            <label className="inline-flex items-center gap-2 cursor-pointer select-none py-1">
              <button
                type="button"
                role="switch"
                aria-label="Efectos de sonido de teclado"
                aria-checked={soundEnabled}
                onClick={() => setSoundEnabled((prev) => !prev)}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus-ring ${
                  soundEnabled ? 'bg-ink' : 'bg-ink/20'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-paper shadow-xs transition duration-200 ease-in-out ${
                    soundEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="font-sans text-caption text-ink font-medium">
                Sonido del teclado
              </span>
            </label>
          </div>

          <Button
            type="button"
            variant="ej-ink"
            size="md"
            disabled={!content.trim() || isSubmitting}
            isLoading={isSubmitting}
            onClick={() => void handleReview()}
            title="Presiona Cmd+Enter o Ctrl+Enter para enviar a revisión"
            icon={!isSubmitting ? <Sparkles size={16} aria-hidden /> : undefined}
          >
            <span>Revisar mi inglés</span>
            <span className="ml-0.5 rounded bg-paper/20 px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-none tracking-tight select-none">
              ⌘↵
            </span>
          </Button>
        </div>
      </PastelCard>

      {/* ── Panel de revisión ── */}
      {feedback && correctedContent && (
        <div className="rounded-2xl border border-border-subtle bg-surface-raised p-5 animate-in fade-in-0 duration-300">
          <JournalFeedbackView
            originalContent={content}
            correctedContent={correctedContent}
            feedback={feedback}
          />
        </div>
      )}
    </div>
  )
}

function formatLongDate(d: string): string {
  try {
    const formatted = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${d}T12:00:00`))
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  } catch {
    return d
  }
}
