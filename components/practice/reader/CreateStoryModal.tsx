'use client'

// Planned structure:
// <CreateStoryModal>
//   <ModalBackdrop />
//   <ModalContainer>
//     <ModalHeader />
//     <StoryForm>
//       <CefrLevelSelector />
//       <TopicSuggestions />
//       <TopicCustomInput />
//       <TargetWordsPreview />
//       <ErrorBanner />
//       <ModalActions />
//     </StoryForm>
//   </ModalContainer>
// </CreateStoryModal>

import { useEffect, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { Sparkles, X } from '@/components/icons'
import type { CEFRLevel } from '@/lib/exercises/cefr'

const CEFR_LEVELS: Array<{ value: CEFRLevel; label: string; desc: string }> = [
  { value: 'A1', label: 'A1', desc: 'Básico' },
  { value: 'A2', label: 'A2', desc: 'Elemental' },
  { value: 'B1', label: 'B1', desc: 'Intermedio' },
  { value: 'B2', label: 'B2', desc: 'Intermedio Alto' },
]

const SUGGESTED_TOPICS = [
  { label: '☕ Vida cotidiana', prompt: 'Una situación de la vida diaria en la ciudad' },
  { label: '✈️ Viajes', prompt: 'Un viaje emocionante y descubrimiento de lugares' },
  { label: '💼 Trabajo', prompt: 'Una conversación o entrevista en el trabajo' },
  { label: '🚀 Tecnología', prompt: 'Innovación tecnológica y el futuro' },
  { label: '🕵️ Misterio', prompt: 'Un misterio intrigante por resolver' },
  { label: '🍳 Cocina', prompt: 'Preparar una cena especial y anécdotas de cocina' },
  { label: '🌱 Naturaleza', prompt: 'Una caminata en la naturaleza y animales' },
  { label: '🎨 Cultura y arte', prompt: 'Una visita cultural a un museo o concierto' },
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
  initialLevel = 'B1',
  targetWordsPreview = [],
}: CreateStoryModalProps) {
  const [level, setLevel] = useState<CEFRLevel>(initialLevel)
  const [customTopic, setCustomTopic] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setLevel(initialLevel)
      setCustomTopic('')
      setError(null)
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [isOpen, initialLevel])

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isGenerating) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg rounded-2xl border border-border-default bg-surface-raised p-6 shadow-xl space-y-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary shadow-xs">
              <Sparkles className="size-5" aria-hidden />
            </span>
            <div>
              <h2 id={titleId} className="text-body-lg font-bold text-fg">
                Crear nueva historia
              </h2>
              <p className="text-caption text-fg-muted">Lectura adaptada con IA y audio nativo</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            disabled={isGenerating}
            aria-label="Cerrar modal"
            className="text-fg-muted hover:text-fg"
            icon={<X className="size-5" />}
          />
        </div>

        {error && (
          <div className="rounded-xl border border-danger/30 bg-danger-soft p-3 text-caption text-danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-caption font-medium text-fg-muted mb-1.5">
              Nivel de dificultad (MCER)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {CEFR_LEVELS.map((lvl) => {
                const isSelected = level === lvl.value
                return (
                  <button
                    key={lvl.value}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setLevel(lvl.value)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-fg font-semibold shadow-xs'
                        : 'border-border-default bg-surface-sunken text-fg hover:bg-surface-raised'
                    }`}
                  >
                    <span className="text-body-sm">{lvl.label}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-primary-fg/80' : 'text-fg-muted'}`}>
                      {lvl.desc}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label htmlFor="story-topic" className="block text-caption font-medium text-fg-muted mb-1.5">
              ¿De qué tema quieres la historia?
            </label>
            <input
              id="story-topic"
              ref={inputRef}
              type="text"
              maxLength={120}
              disabled={isGenerating}
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Ej: Un misterio en la biblioteca, comida callejera en Tokio..."
              className="w-full rounded-xl border border-border-default bg-surface-sunken px-3.5 py-2 text-body-sm text-fg placeholder:text-fg-muted focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
          </div>

          <div>
            <span className="block text-[11px] font-medium uppercase tracking-wider text-fg-muted mb-1.5">
              O elige un tema sugerido:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_TOPICS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => setCustomTopic(item.prompt)}
                  className={`rounded-full px-2.5 py-1 text-caption transition-all ${
                    customTopic === item.prompt
                      ? 'bg-primary-soft text-primary border border-primary/40 font-medium'
                      : 'bg-surface-sunken text-fg-muted hover:text-fg hover:bg-surface-raised border border-border-subtle'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {targetWordsPreview.length > 0 && (
            <div className="rounded-xl border border-border-subtle bg-surface-sunken/60 p-3">
              <span className="block text-[11px] font-medium text-fg-muted mb-1.5">
                Palabras clave que se integrarán en la lectura:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {targetWordsPreview.map((word) => (
                  <span
                    key={word}
                    className="inline-flex items-center rounded-md bg-surface-raised px-2 py-0.5 text-caption font-mono text-primary border border-border-subtle"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border-default">
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={isGenerating}
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isGenerating}
              className="font-medium"
            >
              <Sparkles className="size-4" />
              <span>{isGenerating ? 'Generando historia...' : 'Crear historia'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
