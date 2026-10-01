'use client'

// Planned structure:
// <CreateStoryModal>
//   <ModalBackdrop />
//   <ModalDialogCard>
//     <ModalHeader> (Sparkles circle, Bricolage Title "Nueva historia", Close X) </ModalHeader>
//     <StoryForm>
//       <CefrLevelGrid /> (A1, A2, B1, B2 cards)
//       <TopicSection>
//         <TopicInput />
//         <TopicChipsList /> (Vida cotidiana, Viajes, Trabajo, Tecnología, etc.)
//       </TopicSection>
//       <LengthAndVoiceGrid>
//         <LengthPills /> (~1 min, ~3 min, ~5 min)
//         <VoiceHdToggleCard /> (Generar voz HD al crear)
//       </LengthAndVoiceGrid>
//       <TargetWordsCard> (Lilac pastel card with target word pills + "+ Añadir") </TargetWordsCard>
//       <ModalFooter>
//         <EstimatedTimeNotice /> (Tarda unos 15 segundos.)
//         <ActionButtonsGroup>
//           <CancelButton />
//           <SubmitButton /> (✨ Crear historia)
//         </ActionButtonsGroup>
//       </ModalFooter>
//     </StoryForm>
//   </ModalDialogCard>
// </CreateStoryModal>

import { useEffect, useRef, useState } from 'react'
import { Sparkles, X } from '@/components/icons'
import type { CEFRLevel } from '@/lib/exercises/cefr'

const CEFR_LEVELS: Array<{ value: CEFRLevel; label: string; desc: string }> = [
  { value: 'A1', label: 'A1', desc: 'Principiante' },
  { value: 'A2', label: 'A2', desc: 'Básico' },
  { value: 'B1', label: 'B1', desc: 'Intermedio' },
  { value: 'B2', label: 'B2', desc: 'Intermedio alto' },
]

const SUGGESTED_TOPICS = [
  { label: 'Vida cotidiana', prompt: 'Una situación de la vida diaria en la ciudad' },
  { label: 'Viajes', prompt: 'Un viaje emocionante y descubrimiento de lugares' },
  { label: 'Trabajo', prompt: 'Una conversación o entrevista en el trabajo' },
  { label: 'Tecnología', prompt: 'Innovación tecnológica y el futuro' },
  { label: 'Misterio', prompt: 'Un misterio intrigante por resolver' },
  { label: 'Cocina', prompt: 'Preparar una cena especial y anécdotas de cocina' },
  { label: 'Naturaleza', prompt: 'Una caminata en la naturaleza y animales' },
  { label: 'Cultura y arte', prompt: 'Una visita cultural a un museo o concierto' },
]

interface CreateStoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (params: { topic?: string; level: CEFRLevel }) => Promise<void>
  isGenerating: boolean
  initialLevel?: CEFRLevel
  targetWordsPreview?: string[]
}

export function CreateStoryModal({
  isOpen,
  onClose,
  onSubmit,
  isGenerating,
  initialLevel = 'A1',
  targetWordsPreview = ['would', 'about', 'which', 'there', 'know'],
}: CreateStoryModalProps) {
  const [level, setLevel] = useState<CEFRLevel>(initialLevel)
  const [customTopic, setCustomTopic] = useState('')
  const [selectedDuration, setSelectedDuration] = useState('~1 min')
  const [generateHdVoice, setGenerateHdVoice] = useState(true)
  const [words, setWords] = useState<string[]>(targetWordsPreview)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const activeWords = words.length > 0 ? words : ['would', 'about', 'which', 'there', 'know']

  useEffect(() => {
    if (isOpen) {
      setLevel(initialLevel)
      setCustomTopic('')
      setError(null)
      if (targetWordsPreview.length > 0) setWords(targetWordsPreview)
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [isOpen, initialLevel, targetWordsPreview])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isGenerating) {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isGenerating, onClose])

  if (!isOpen) return null

  const handleRemoveWord = (wordToRemove: string) => {
    setWords((prev) => prev.filter((w) => w !== wordToRemove))
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await onSubmit({
        topic: customTopic.trim() || undefined,
        level,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo generar la historia'
      setError(msg)
    }
  }

  const titleId = 'create-story-modal-title'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isGenerating) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-xl rounded-[32px] sm:rounded-[36px] border border-border bg-surface p-6 sm:p-8 shadow-2xl space-y-6 relative"
      >
        {/* Header Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="size-12 rounded-full bg-[var(--lilac-soft)] text-fg flex items-center justify-center shrink-0 border border-black/10 shadow-2xs">
              <Sparkles className="size-6 text-fg" aria-hidden />
            </div>
            <div>
              <h2 id={titleId} className="font-display font-black text-2xl sm:text-3xl text-fg tracking-tight">
                Nueva historia
              </h2>
              <p className="text-body-sm text-fg-muted mt-0.5">Escrita con IA a tu nivel, con voz nativa.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            aria-label="Cerrar modal"
            className="size-9 rounded-full bg-surface-sunken hover:bg-surface-raised border border-border/60 text-fg-muted hover:text-fg flex items-center justify-center cursor-pointer transition-colors shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-danger/30 bg-danger-soft p-3.5 text-xs font-bold text-danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-5">
          {/* CEFR Level Selection Grid */}
          <div>
            <label className="block text-sm font-bold text-fg mb-2">Nivel</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {CEFR_LEVELS.map((lvl) => {
                const isSelected = level === lvl.value
                return (
                  <button
                    key={lvl.value}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setLevel(lvl.value)}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#2563eb] bg-[#2563eb] text-white shadow-xs'
                        : 'border-border/60 bg-surface hover:border-black/20 text-fg'
                    }`}
                  >
                    <span className="font-display font-black text-lg sm:text-xl leading-tight">{lvl.label}</span>
                    <span className={`text-xs mt-0.5 ${isSelected ? 'text-white/85 font-medium' : 'text-fg-muted font-normal'}`}>
                      {lvl.desc}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Topic Input & Suggested Preset Chips */}
          <div>
            <label htmlFor="story-topic" className="block text-sm font-bold text-fg mb-2">
              Tema
            </label>
            <input
              id="story-topic"
              ref={inputRef}
              type="text"
              maxLength={120}
              aria-label="¿De qué tema quieres la historia?"
              disabled={isGenerating}
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Ej.: un misterio en la biblioteca, comida callejera en Tokio..."
              className="w-full rounded-2xl border border-[#2563eb] ring-2 ring-[#2563eb]/20 bg-surface px-4 py-3 text-sm text-fg placeholder:text-fg-muted focus-ring shadow-2xs transition-all"
            />

            <div className="flex flex-wrap gap-2 mt-3">
              {SUGGESTED_TOPICS.map((item) => {
                const isActive = customTopic === item.prompt || customTopic === item.label
                return (
                  <button
                    key={item.label}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setCustomTopic(item.prompt)}
                    className={`rounded-full px-4 py-1.5 text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-ink text-paper font-bold shadow-2xs'
                        : 'bg-surface-sunken border border-border/50 text-fg hover:bg-surface-raised font-semibold'
                    }`}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Length & Voice Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-fg mb-2">Largo</label>
              <div className="flex items-center gap-1.5">
                {['~1 min', '~3 min', '~5 min'].map((dur) => {
                  const isSelected = selectedDuration === dur
                  return (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setSelectedDuration(dur)}
                      className={`flex-1 rounded-full px-3 py-2 text-xs transition-all text-center cursor-pointer ${
                        isSelected
                          ? 'bg-[#2563eb] text-white font-bold shadow-2xs'
                          : 'bg-surface-sunken border border-border/50 text-fg hover:bg-surface-raised font-semibold'
                      }`}
                    >
                      {dur}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-fg mb-2">Voz</label>
              <label className="flex items-center justify-between rounded-2xl border border-border/60 bg-surface-sunken px-4 py-2 cursor-pointer select-none">
                <span className="text-xs font-bold text-fg">Generar voz HD al crear</span>
                <input
                  type="checkbox"
                  checked={generateHdVoice}
                  onChange={(e) => setGenerateHdVoice(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-border rounded-full peer peer-checked:bg-[#2563eb] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all relative shrink-0" />
              </label>
            </div>
          </div>

          {/* Target Words Lilac Card */}
          <div className="rounded-3xl bg-[var(--lilac-soft)]/70 border border-[var(--lilac-deep)]/40 p-4 sm:p-5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-fg">Palabras que entrarán en la historia</span>
              <span className="text-xs font-mono text-fg/75">de tu repaso de hoy</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {activeWords.map((word) => (
                <span
                  key={word}
                  className="inline-flex items-center gap-1.5 rounded-full bg-paper px-3.5 py-1 text-xs font-mono font-medium text-fg border border-black/10 shadow-2xs"
                >
                  <span>{word}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveWord(word)}
                    aria-label={`Quitar ${word}`}
                    className="text-fg-muted hover:text-fg text-xs font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}

              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full bg-paper/80 hover:bg-paper border border-black/20 text-fg px-3.5 py-1 text-xs font-mono font-bold transition-colors cursor-pointer shadow-2xs"
              >
                + Añadir
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-xs font-mono text-fg-muted">Tarda unos 15 segundos.</span>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                disabled={isGenerating}
                onClick={onClose}
                className="rounded-full bg-surface-raised border border-border hover:bg-surface-sunken px-5 py-2.5 text-xs font-bold text-fg transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isGenerating}
                className="rounded-full bg-ink text-paper hover:bg-ink-secondary disabled:opacity-50 px-6 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-sm cursor-pointer"
              >
                <Sparkles className="size-4 text-paper" />
                <span>{isGenerating ? 'Generando historia...' : 'Crear historia'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
