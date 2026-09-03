'use client'

// Planned structure:
// <JournalPronunciationModal>
//   <ModalBackdrop />
//   <ModalContainer:
//     <ModalHeader: title, subtitle, close button />
//     <WordInputSection: input + analyze button + IPA badge + speech button />
//     <ReasonSelector: radio pills for difficulty reason />
//     <NotesInput: optional note />
//     <AddedWordsList: list of words added in current modal session />
//     <ModalFooter: cancel + save buttons />
//   />
// </JournalPronunciationModal>

import { useState, useEffect } from 'react'
import { X, Sparkles, Volume2, Plus, Trash2 } from '@/components/icons'
import Button from '@/components/ui/Button'
import {
  analyzePronunciationWord,
  type PronunciationAnalysisResult,
} from '@/lib/journal/pronunciation-assistant'
import type {
  PronunciationDifficultyReason,
} from '@/lib/journal/types'

interface JournalPronunciationModalProps {
  isOpen: boolean
  onClose: () => void
  onSaveWords: (newWords: string[]) => void
  existingWords?: string[]
}

const REASON_LABELS: Record<PronunciationDifficultyReason, { label: string; desc: string }> = {
  difficult_sound: { label: 'Sonido / Fonema difícil', desc: 'Tiene un sonido que me cuesta pronunciar' },
  syllable_stress: { label: 'Acento silábico', desc: 'Acentué la sílaba equivocada' },
  tricky_spelling: { label: 'Ortografía engañosa', desc: 'La escritura me confundió' },
  new_word: { label: 'Palabra nueva', desc: 'No sabía cómo pronunciarla' },
  other: { label: 'Otro motivo', desc: 'Nota personal' },
}

const REASON_KEYS: PronunciationDifficultyReason[] = [
  'difficult_sound',
  'syllable_stress',
  'tricky_spelling',
  'new_word',
  'other',
]

export function JournalPronunciationModal({
  isOpen,
  onClose,
  onSaveWords,
  existingWords = [],
}: JournalPronunciationModalProps) {
  const [wordInput, setWordInput] = useState('')
  const [reason, setReason] = useState<PronunciationDifficultyReason>('difficult_sound')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<PronunciationAnalysisResult | null>(null)
  const [addedWords, setAddedWords] = useState<string[]>(existingWords)

  useEffect(() => {
    setAddedWords(existingWords)
  }, [existingWords])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  async function handleAnalyze() {
    if (!wordInput.trim()) return
    setAnalyzing(true)
    try {
      const res = await analyzePronunciationWord(wordInput.trim())
      setAnalysis(res)
      setReason(res.suggestedReason)
    } catch {
      // Fallback
    } finally {
      setAnalyzing(false)
    }
  }

  function handleAddWord() {
    const trimmed = wordInput.trim().toLowerCase()
    if (!trimmed) return
    if (!addedWords.includes(trimmed)) {
      setAddedWords((prev) => [...prev, trimmed])
    }
    setWordInput('')
    setAnalysis(null)
    setReason('difficult_sound')
  }

  function handleRemoveWord(wordToRemove: string) {
    setAddedWords((prev) => prev.filter((w) => w !== wordToRemove))
  }

  function handleSpeak(text: string) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      window.speechSynthesis.speak(utterance)
    }
  }

  function handleSave() {
    onSaveWords(addedWords)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pronunciation-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-0 duration-200"
    >
      <div className="flex w-full max-w-lg flex-col gap-4 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-6 shadow-xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Encabezado del modal */}
        <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-3">
          <div className="flex flex-col gap-0.5">
            <h2 id="pronunciation-modal-title" className="font-h4 font-medium text-fg">
              Añadir a Diario de pronunciación
            </h2>
            <p className="font-caption text-fg-muted">
              Registra palabras difíciles y fonemas para practicar.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="focus-ring rounded-full p-1.5 text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {/* Input de palabra + botón analizar */}
        <div className="flex flex-col gap-2">
          <label htmlFor="pron-word-input" className="font-body-sm font-medium text-fg">
            Palabra en inglés
          </label>
          <div className="flex items-center gap-2">
            <input
              id="pron-word-input"
              type="text"
              value={wordInput}
              onChange={(e) => setWordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void handleAnalyze()
                }
              }}
              placeholder="Ej. thoroughly, clothes, schedule"
              className="flex-1 rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken px-3.5 py-2 font-mono text-sm text-fg placeholder:font-sans placeholder:text-fg-muted/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button
              variant="secondary"
              size="sm"
              disabled={!wordInput.trim() || analyzing}
              isLoading={analyzing}
              onClick={() => void handleAnalyze()}
            >
              <Sparkles size={14} aria-hidden />
              IPA
            </Button>
          </div>
        </div>

        {/* Resultado IPA y pronunciación */}
        {analysis && (
          <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken p-3 animate-in fade-in-0 duration-150">
            <div className="flex items-center gap-2">
              <span className="font-ipa text-base font-semibold text-primary">
                {analysis.ipa}
              </span>
              <span className="font-caption text-fg-muted">
                {analysis.explanationEs}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleSpeak(wordInput.trim())}
              aria-label="Escuchar pronunciación"
              className="focus-ring rounded-full p-1.5 text-primary hover:bg-surface-raised"
            >
              <Volume2 size={16} aria-hidden />
            </button>
          </div>
        )}

        {/* Selector de motivo de dificultad */}
        <div className="flex flex-col gap-1.5">
          <span className="font-caption font-medium text-fg-muted">
            Motivo de dificultad
          </span>
          <div className="flex flex-wrap gap-1.5">
            {REASON_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setReason(key)}
                className={`focus-ring rounded-full px-3 py-1 font-caption font-medium transition-colors ${
                  reason === key
                    ? 'bg-primary-soft text-primary'
                    : 'border border-border-subtle bg-surface-sunken text-fg-muted hover:border-border-strong hover:text-fg'
                }`}
              >
                {REASON_LABELS[key].label}
              </button>
            ))}
          </div>
        </div>

        {/* Botón para añadir palabra a la lista temporal del modal */}
        <div className="flex justify-end pt-1">
          <Button
            variant="secondary"
            size="sm"
            disabled={!wordInput.trim()}
            onClick={handleAddWord}
          >
            <Plus size={14} aria-hidden />
            Añadir a la lista
          </Button>
        </div>

        {/* Lista de palabras en el modal */}
        {addedWords.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-border-subtle pt-3">
            <span className="font-caption font-medium text-fg-muted">
              Palabras guardadas ({addedWords.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {addedWords.map((word) => (
                <span
                  key={word}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-sunken px-3 py-1 font-mono text-xs text-fg"
                >
                  {word}
                  <button
                    type="button"
                    onClick={() => handleRemoveWord(word)}
                    aria-label={`Eliminar ${word}`}
                    className="text-fg-muted hover:text-error"
                  >
                    <Trash2 size={12} aria-hidden />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer del modal */}
        <div className="flex items-center justify-end gap-2 border-t border-border-subtle pt-4">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="md" onClick={handleSave}>
            Guardar palabras
          </Button>
        </div>
      </div>
    </div>
  )
}
