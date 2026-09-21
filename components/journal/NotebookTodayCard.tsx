'use client'

// Planned structure:
// <NotebookTodayCard>
//   <PastelCard tone="mint">
//     <HeaderMetaRow: "PÁGINA DE HOY" + date tag + (Shuffle button + Audio speaker button) />
//     <QuestionTitleAndSubtitle />
//     <ModePillsRow: "Con estructura" / "Página en blanco" + right hint />
//     <StarterChipsRow: "TOCA UNA FRASE PARA EMPEZAR" + starter chips (when "Con estructura") />
//     <WritingSheet: white paper card + ruled lines + watermark illustration + textarea />
//     <FooterToolbar: word count + switch ("Teclado en inglés") + hint + CTA button ("Revisar mi inglés") />
//   </PastelCard>
//   {feedback && correctedContent && <JournalFeedbackView />}
// </NotebookTodayCard>

import { useState } from 'react'
import { RefreshCw, Sparkles, Volume2 } from '@/components/icons'
import PastelCard from '@/components/layout/PastelCard'
import { getIllustration } from '@/lib/illustrations/registry'
import { correctJournalEntry } from '@/lib/journal/correct-client'
import type { JournalFeedback } from '@/lib/journal/correction'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { speakText } from '@/lib/speech/synthesis'
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
    <div className="flex flex-col gap-5">
      <PastelCard
        tone="mint"
        className="relative flex flex-col gap-5 p-5 sm:p-6 overflow-hidden motion-reduce:shadow-none"
        aria-labelledby="today-page-heading"
      >
        {/* ── Fila Meta: Badge PÁGINA DE HOY + fecha + Botones superiores ── */}
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-ink px-3.5 py-1 font-sans text-caption font-bold text-paper select-none">
              PÁGINA DE HOY
            </span>
            <span className="inline-flex items-center rounded-full bg-ink/10 px-3 py-1 font-sans text-caption font-medium text-ink select-none">
              <time dateTime={today.date}>{formatLongDate(today.date)}</time>
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleShuffle}
              aria-label="Cambiar tema"
              title="Cambiar tema"
              className="focus-ring rounded-full bg-ink/10 hover:bg-ink/20 text-ink p-2.5 transition-colors cursor-pointer select-none"
            >
              <RefreshCw size={18} aria-hidden />
            </button>

            <button
              type="button"
              onClick={() => speakText(currentPrompt.en)}
              aria-label={`Escuchar pronunciación de ${currentPrompt.en}`}
              title="Escuchar tema"
              className="focus-ring rounded-full bg-ink text-paper hover:bg-ink-secondary p-2.5 transition-colors cursor-pointer select-none shadow-xs"
            >
              <Volume2 size={18} aria-hidden />
            </button>
          </div>
        </div>

        {/* ── Pregunta del día en inglés + traducción en español ── */}
        <div className="flex flex-col gap-1">
          <h2
            id="today-page-heading"
            className="font-heading text-h2 sm:text-h1 font-extrabold text-ink leading-tight text-balance"
          >
            {currentPrompt.en}
          </h2>
          <p className="font-sans text-body-sm text-ink-secondary">
            {currentPrompt.es}
          </p>
        </div>

        {/* ── Selector de Modo: Pills ("Con estructura" vs "Página en blanco") ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2" role="tablist" aria-label="Modo de redacción">
            <button
              type="button"
              role="tab"
              aria-selected={scaffoldMode === 'guided'}
              onClick={() => setScaffoldMode('guided')}
              className={`focus-ring inline-flex items-center rounded-full px-4 py-1.5 font-label text-body-sm transition-all duration-150 select-none cursor-pointer ${
                scaffoldMode === 'guided'
                  ? 'bg-ink text-paper font-bold shadow-xs'
                  : 'bg-ink/10 text-ink font-medium hover:bg-ink/20'
              }`}
            >
              Con estructura
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={scaffoldMode === 'blank'}
              onClick={() => setScaffoldMode('blank')}
              className={`focus-ring inline-flex items-center rounded-full px-4 py-1.5 font-label text-body-sm transition-all duration-150 select-none cursor-pointer ${
                scaffoldMode === 'blank'
                  ? 'bg-ink text-paper font-bold shadow-xs'
                  : 'bg-ink/10 text-ink font-medium hover:bg-ink/20'
              }`}
            >
              Página en blanco
            </button>
          </div>

          <p className="font-sans text-caption text-ink-secondary text-right hidden sm:block select-none">
            {scaffoldMode === 'guided'
              ? 'Termina la frase a tu manera.'
              : 'Redacta a tu propio ritmo sin restricciones.'}
          </p>
        </div>

        {/* ── Chips de arranque de frase (cuando scaffoldMode === 'guided') ── */}
        {scaffoldMode === 'guided' && (
          <NotebookStarterChips chips={starterChips} onInsert={handleInsertStarter} />
        )}

        {/* ── Hoja de cuaderno rayada (ruled paper) con Ilustración al fondo ── */}
        <div className="relative w-full rounded-2xl border border-ink/15 bg-paper p-5 shadow-xs overflow-hidden transition-all focus-within:border-ink/40">
          {/* Marca de agua de ilustración al fondo a la derecha */}
          <div
            className="pointer-events-none absolute bottom-2 right-2 h-36 w-32 shrink-0 text-ink opacity-10 transition-opacity duration-300 [&>svg]:h-full [&>svg]:w-auto select-none"
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
            className="notebook-ruled-paper relative z-10 w-full resize-y bg-transparent p-0 font-sans text-base text-ink placeholder:font-sans placeholder:text-ink-muted/70 focus:outline-none"
          />
        </div>

        {/* ── Pie de hoja: Contador + Switch + Botón de revisión ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-sans text-caption text-ink-secondary select-none">
              {wordCount} {wordCount === 1 ? 'palabra' : 'palabras'} · {content.trim() ? 'borrador' : 'sin guardar'}
            </span>

            {/* Switch de sonido de teclado en inglés */}
            <label className="inline-flex items-center gap-2 cursor-pointer select-none py-1">
              <button
                type="button"
                role="switch"
                aria-label="Efectos de sonido de teclado en inglés"
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
                Teclado en inglés
              </span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            {!content.trim() ? (
              <span className="font-sans text-caption text-ink-secondary hidden sm:inline select-none">
                Escribe algo para revisar
              </span>
            ) : null}

            <button
              type="button"
              disabled={!content.trim() || isSubmitting}
              onClick={() => void handleReview()}
              className="press-feedback focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-mint-deep px-6 py-2.5 font-label text-body-sm font-bold text-ink hover:bg-mint-deep/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs select-none transition-all cursor-pointer"
              title="Presiona Cmd+Enter o Ctrl+Enter para enviar a revisión"
            >
              {isSubmitting ? (
                <span
                  className="shrink-0 w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Sparkles size={16} aria-hidden />
              )}
              <span>Revisar mi inglés</span>
              <span className="ml-0.5 rounded bg-ink/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-none tracking-tight select-none opacity-85">
                ⌘↵
              </span>
            </button>
          </div>
        </div>
      </PastelCard>

      {/* ── Panel de revisión de IA en pantalla ── */}
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
    return new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${d}T12:00:00`))
  } catch { return d }
}
