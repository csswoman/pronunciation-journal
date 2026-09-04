'use client'

import { useEffect, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { Sparkles, X } from '@/components/icons'
import type { CEFRLevel } from '@/lib/exercises/cefr'
import type { ScriptedMission } from '@/lib/ai-practice/missions/types'
import { saveGeneratedScript } from '@/lib/ai-practice/missions/scripted/generated-store'

// Planned structure:
// <CreateMissionModal>
//   <ModalBackdrop />
//   <ModalContainer>
//     <ModalHeader />
//     <ModalForm>
//       <TopicInput />
//       <CefrSelector />
//       <ModalActions />
//     </ModalForm>
//   </ModalContainer>
// </CreateMissionModal>

const CEFR_OPTIONS: Array<{ value: CEFRLevel; label: string; desc: string }> = [
  { value: 'A1', label: 'A1', desc: 'Básico / Inicial' },
  { value: 'A2', label: 'A2', desc: 'Elemental' },
  { value: 'B1', label: 'B1', desc: 'Intermedio' },
  { value: 'B2', label: 'B2', desc: 'Intermedio alto' },
  { value: 'C1', label: 'C1', desc: 'Avanzado' },
]

interface CreateMissionModalProps {
  userId: string
  isOpen: boolean
  onClose: () => void
  onCreated: (mission: ScriptedMission) => void
}

export function CreateMissionModal({
  userId,
  isOpen,
  onClose,
  onCreated,
}: CreateMissionModalProps) {
  const [topic, setTopic] = useState('')
  const [cefr, setCefr] = useState<CEFRLevel>('B1')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const modalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTopic('')
      setError(null)
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedTopic = topic.trim()
    if (!trimmedTopic) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/gemini/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: trimmedTopic,
          cefr,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'No se pudo generar el diálogo')
      }

      const data = await res.json()
      if (!data.script || !Array.isArray(data.script)) {
        throw new Error('Formato de diálogo no válido')
      }

      const mission = await saveGeneratedScript(userId, trimmedTopic, cefr, data.script)
      onCreated(mission)
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const titleId = 'create-mission-modal-title'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose()
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-xl space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Sparkles size={18} aria-hidden />
            </span>
            <h2 id={titleId} className="m-0 text-body-lg font-bold text-fg">
              Crear diálogo con IA
            </h2>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            disabled={isLoading}
            aria-label="Cerrar"
            className="text-fg-subtle hover:text-fg-muted"
            icon={<X size={18} />}
          />
        </div>

        <p className="m-0 text-pretty text-body-sm text-fg-muted">
          Genera un diálogo a medida para practicar tu pronunciación y fluidez turno a turno.
        </p>

        {error && (
          <div className="rounded-lg border border-danger/30 bg-danger-soft p-3 text-caption text-danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="mission-topic" className="block text-caption font-medium text-fg-muted mb-1.5">
              Tema o situación
            </label>
            <input
              id="mission-topic"
              ref={inputRef}
              type="text"
              required
              maxLength={100}
              disabled={isLoading}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ej: Pedir un café en Londres, entrevista técnica, saludar a un vecino..."
              className="w-full rounded-lg border border-border-subtle bg-surface-sunken px-3 py-2 text-body-sm text-fg placeholder:text-fg-placeholder focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-caption font-medium text-fg-muted mb-1.5">
              Nivel de dificultad (CEFR)
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {CEFR_OPTIONS.map((opt) => {
                const isSelected = cefr === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setCefr(opt.value)}
                    title={opt.desc}
                    className={`flex flex-col items-center justify-center rounded-lg border py-2 text-label transition-colors cursor-pointer focus-ring ${
                      isSelected
                        ? 'border-primary bg-primary-soft font-semibold text-primary'
                        : 'border-border-subtle bg-surface-sunken/60 text-fg-muted hover:text-fg hover:bg-surface-sunken'
                    }`}
                  >
                    <span>{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isLoading}
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
              disabled={isLoading || !topic.trim()}
              icon={<Sparkles size={16} />}
            >
              Generar diálogo
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
