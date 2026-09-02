'use client'

// Planned structure:
// <NotebookTodayCard>
//   <MetaRow: date + Monospace Primary Badge ("PÁGINA DE HOY") />
//   <PromptHeader: english serif + spanish + compact icon button ("Cambiar tema") />
//   <TopicSelector: collapsible pills when toggled />
//   <UnderlineTabs: tabs ("Con estructura" / "Página en blanco") + right-aligned caption text />
//   <SentenceStarters: topic-specific chips ("Toca una frase para empezar") when "Con estructura" />
//   <NotebookSheet: paper sheet container + lined paper (notebook-ruled-paper) + watermark illustration + serif textarea />
//   <WritingFooter: word count + switch ("Teclado en inglés") + "Revisar mi inglés" button />
//   <AIFeedbackArea: inline feedback when reviewed />
// </NotebookTodayCard>

import { useState } from 'react'
import { Sparkles } from '@/components/icons'
import Button from '@/components/ui/Button'
import { getIllustration } from '@/lib/illustrations/registry'
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
import { NotebookPromptHeader } from './NotebookPromptHeader'
import { NotebookStarterChips } from './NotebookStarterChips'

const PhraseBookIllustration = getIllustration('journalPhraseBook')
const BlankBoardIllustration = getIllustration('journalBlankBoard')

const ALL_FLAT_PROMPTS: Array<{ prompt: PromptDefinition; topic: NotebookTopic }> = ALL_TOPICS.flatMap(
  (topicKey) => (TOPIC_PROMPTS[topicKey] || []).map((prompt) => ({ prompt, topic: topicKey }))
)

interface NotebookTodayCardProps {
  today: NotebookHome['today']
  onSelectMode?: (mode: 'guided' | 'blank' | 'pronunciation') => void
  onTopicChange?: (topic: NotebookTopic) => void
  onShufflePrompt?: () => void
}

export function NotebookTodayCard({
  today,
  onTopicChange,
  onShufflePrompt,
}: NotebookTodayCardProps) {
  const [promptIndex, setPromptIndex] = useState(0)
  const [scaffoldMode, setScaffoldMode] = useState<'guided' | 'blank'>('guided')
  const [content, setContent] = useState(today.preview ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [correctedContent, setCorrectedContent] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<JournalFeedback | null>(null)

  const currentItem = ALL_FLAT_PROMPTS[promptIndex % ALL_FLAT_PROMPTS.length] ?? {
    prompt: {
      id: today.prompt.id || 'remembered-conversation',
      en: today.prompt.en,
      es: today.prompt.es,
    },
    topic: today.topic || 'daily',
  }

  const currentPrompt = currentItem.prompt
  const currentTopic = currentItem.topic
  const starterChips = TOPIC_STARTER_CHIPS[currentTopic] ?? TOPIC_STARTER_CHIPS.daily

  function handleShuffle() {
    setPromptIndex((prev) => {
      const nextIndex = prev + 1
      const nextItem = ALL_FLAT_PROMPTS[nextIndex % ALL_FLAT_PROMPTS.length]
      if (nextItem) {
        onTopicChange?.(nextItem.topic)
      }
      return nextIndex
    })
    onShufflePrompt?.()
  }

  function handleInsertStarter(starterText: string) {
    const cleanStarter = starterText.replace(/\.\.\.$/, ' ')
    if (soundEnabled) {
      playUiCue('mech-space')
    }
    setContent((prev) => {
      if (!prev.trim()) return cleanStarter
      return `${prev.trim()}\n${cleanStarter}`
    })
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
      setFeedback({
        errors: [],
        newWords: [],
      })
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
      if (e.key === ' ' || e.key === 'Enter') {
        playUiCue('mech-space')
      } else {
        playUiCue('mech-key')
      }
    }
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

  return (
    <article
      aria-labelledby="today-page-heading"
      className="flex flex-col gap-5 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised layout-card-pad transition-all duration-200"
    >
      {/* ── Fila Meta: Texto limpio de PÁGINA DE HOY + fecha ── */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs font-semibold tracking-wider text-primary uppercase">
          PÁGINA DE HOY
        </span>
        <span className="font-caption text-fg-muted">·</span>
        <time dateTime={today.date} className="font-caption text-fg-muted">
          {formatLongDate(today.date)}
        </time>
      </div>

      {/* ── Pregunta en inglés (serif) + traducción + Botón de cambio de tema al lado ── */}
      <NotebookPromptHeader
        currentPrompt={currentPrompt}
        onShuffle={handleShuffle}
      />

      {/* ── Pestañas (Underline tabs): "Con estructura" vs "Página en blanco" ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-0">
        <div className="flex items-center gap-6" role="tablist" aria-label="Modo de redacción">
          <button
            type="button"
            role="tab"
            aria-selected={scaffoldMode === 'guided'}
            onClick={() => setScaffoldMode('guided')}
            className={`pb-2.5 font-body-sm font-semibold transition-all duration-150 focus-ring ${
              scaffoldMode === 'guided'
                ? 'text-primary border-b-2 border-primary -mb-px'
                : 'text-fg-muted hover:text-fg'
            }`}
          >
            Con estructura
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scaffoldMode === 'blank'}
            onClick={() => setScaffoldMode('blank')}
            className={`pb-2.5 font-body-sm font-semibold transition-all duration-150 focus-ring ${
              scaffoldMode === 'blank'
                ? 'text-primary border-b-2 border-primary -mb-px'
                : 'text-fg-muted hover:text-fg'
            }`}
          >
            Página en blanco
          </button>
        </div>

        <p className="pb-2.5 font-caption text-fg-muted transition-opacity duration-150">
          {scaffoldMode === 'guided'
            ? 'Termina la frase a tu manera.'
            : 'Redacta a tu propio ritmo sin restricciones.'}
        </p>
      </div>

      {/* ── Chips de arranque de frase adaptados al tema (cuando scaffoldMode === 'guided') ── */}
      {scaffoldMode === 'guided' && (
        <NotebookStarterChips chips={starterChips} onInsert={handleInsertStarter} />
      )}

      {/* ── Hoja de cuaderno rayada (ruled paper) con Ilustración de marca de agua al fondo ── */}
      <div className="relative w-full rounded-[var(--radius-lg)] border border-border-subtle bg-surface-sunken p-4 sm:p-5 shadow-xs overflow-hidden transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/40">
        {/* Marca de agua de ilustración al fondo a la derecha */}
        <div
          className="pointer-events-none absolute bottom-2 right-2 h-40 w-36 shrink-0 text-primary opacity-15 transition-opacity duration-300 [&>svg]:h-full [&>svg]:w-auto select-none"
          aria-hidden="true"
        >
          {scaffoldMode === 'guided' ? <PhraseBookIllustration /> : <BlankBoardIllustration />}
        </div>

        {/* Textarea con renglones de cuaderno alineados (ruled paper) */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={6}
          placeholder="Escribe en inglés. No importa si te equivocas: para eso está la revisión."
          className="notebook-ruled-paper relative z-10 w-full resize-y bg-transparent p-0 font-serif text-base italic text-fg placeholder:font-serif placeholder:not-italic placeholder:text-fg-muted/70 focus:outline-none"
        />
      </div>

      {/* ── Pie de hoja: Contador + Switch + Botón de revisión ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-4">
          <span className="font-caption text-fg-muted">
            {wordCount} {wordCount === 1 ? 'palabra' : 'palabras'} · {content.trim() ? 'borrador' : 'sin guardar'}
          </span>

          {/* Switch de sonido de teclado en inglés */}
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <button
              type="button"
              role="switch"
              aria-checked={soundEnabled}
              onClick={() => setSoundEnabled((prev) => !prev)}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus-ring ${
                soundEnabled ? 'bg-primary' : 'bg-surface-sunken border border-border-subtle'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                  soundEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="font-caption text-fg font-medium">
              Teclado en inglés
            </span>
          </label>
        </div>

        <Button
          variant="primary"
          size="md"
          disabled={!content.trim() || isSubmitting}
          isLoading={isSubmitting}
          onClick={() => void handleReview()}
          title="Presiona Cmd+Enter o Ctrl+Enter para enviar a revisión"
        >
          <Sparkles size={16} aria-hidden />
          Revisar mi inglés
        </Button>
      </div>

      {/* ── Panel de revisión de IA en pantalla ── */}
      {feedback && correctedContent && (
        <div className="border-t border-border-subtle pt-4 animate-in fade-in-0 duration-300">
          <JournalFeedbackView
            originalContent={content}
            correctedContent={correctedContent}
            feedback={feedback}
          />
        </div>
      )}
    </article>
  )
}

function formatLongDate(d: string): string {
  try {
    return new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${d}T12:00:00`))
  } catch { return d }
}
