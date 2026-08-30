'use client'

// Planned structure:
// <JournalPronunciationWrite>
//   <PronunciationHeader: title, date, navigation button />
//   <PronunciationForm: input word, analyze button, IPA badge, reason radio group, user notes, add button />
//   <PronunciationItemsList: list of added words for today's entry />
//   <PronunciationFooter: save journal entry button />
// </JournalPronunciationWrite>

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Plus, Trash2, Volume2, CheckCircle2 } from '@/components/icons'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { analyzePronunciationWord, type PronunciationAnalysisResult } from '@/lib/journal/pronunciation-assistant'
import { saveJournalEntry } from '@/lib/journal/queries'
import type {
  JournalEntryRecord,
  PronunciationItem,
  PronunciationDifficultyReason,
  PronunciationJournalPayload,
} from '@/lib/journal/types'

interface JournalPronunciationWriteProps {
  entry: JournalEntryRecord
  promptEn?: string
  promptEs?: string
}

const REASON_LABELS: Record<PronunciationDifficultyReason, { label: string; desc: string }> = {
  difficult_sound: { label: 'Sonido / Fonema difícil', desc: 'Tiene un sonido que me cuesta pronunciar' },
  syllable_stress: { label: 'Acento silábico (Stress)', desc: 'Acentué la sílaba equivocada' },
  tricky_spelling: { label: 'Ortografía engañosa', desc: 'La escritura me confundió con el sonido' },
  new_word: { label: 'Palabra nueva', desc: 'No sabía cómo pronunciarla al inicio' },
  other: { label: 'Otro motivo', desc: 'Nota personal de dificultad' },
}

export function JournalPronunciationWrite({
  entry,
  promptEn,
  promptEs,
}: JournalPronunciationWriteProps) {
  const router = useRouter()
  const initialItems: PronunciationItem[] = (() => {
    try {
      if (entry.content) {
        const parsed = JSON.parse(entry.content) as PronunciationJournalPayload
        if (Array.isArray(parsed.items)) return parsed.items
      }
    } catch {
      // Content was empty or non-JSON
    }
    return []
  })()

  const [items, setItems] = useState<PronunciationItem[]>(initialItems)
  const [wordInput, setWordInput] = useState('')
  const [reason, setReason] = useState<PronunciationDifficultyReason>('difficult_sound')
  const [notes, setNotes] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<PronunciationAnalysisResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleAnalyze() {
    if (!wordInput.trim()) return
    setAnalyzing(true)
    setErrorMsg(null)
    try {
      const res = await analyzePronunciationWord(wordInput.trim())
      setAnalysis(res)
      setReason(res.suggestedReason)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo analizar la palabra')
    } finally {
      setAnalyzing(false)
    }
  }

  function handleAddItem() {
    if (!wordInput.trim()) return
    const newItem: PronunciationItem = {
      id: crypto.randomUUID(),
      wordOrPhrase: wordInput.trim(),
      ipa: analysis?.ipa,
      syllableStress: analysis?.syllableStress,
      difficultyReason: reason,
      userNotes: notes.trim() || analysis?.explanationEs,
      practiceCount: 1,
    }
    setItems((prev) => [...prev, newItem])
    setWordInput('')
    setNotes('')
    setAnalysis(null)
    setReason('difficult_sound')
  }

  function handleRemoveItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  function handleSpeak(text: string) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      window.speechSynthesis.speak(utterance)
    }
  }

  async function handleSave() {
    setSaving(true)
    const payload: PronunciationJournalPayload = { items }
    const now = new Date().toISOString()
    const updatedRecord: JournalEntryRecord = {
      ...entry,
      entryMode: 'pronunciation',
      content: JSON.stringify(payload),
      status: 'submitted',
      updatedAt: now,
    }
    try {
      await saveJournalEntry(updatedRecord)
      router.push('/journal')
    } catch {
      setErrorMsg('No se pudo guardar la entrada en el diario.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-4">
      {/* Encabezado */}
      <header className="flex items-center justify-between gap-4">
        <Link href="/journal" className="focus-ring flex items-center gap-2 font-body-sm font-medium text-fg-muted hover:text-fg">
          <ArrowLeft size={16} aria-hidden />
          Volver al cuaderno
        </Link>
        <Badge label="Diario de pronunciación" variant="info" size="sm" />
      </header>

      {promptEn && (
        <div className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken p-4">
          <p className="font-caption text-fg-muted">Reflexión de hoy:</p>
          <p className="font-serif font-body-sm text-fg">{promptEn}</p>
          {promptEs && <p className="font-caption text-fg-muted">{promptEs}</p>}
        </div>
      )}

      {/* Formulario de registro de palabra */}
      <section aria-labelledby="add-word-heading" className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-5">
        <h2 id="add-word-heading" className="font-body-sm font-semibold text-fg">
          Registrar palabra o frase que te costó hoy
        </h2>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={wordInput}
            onChange={(e) => setWordInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAnalyze(); } }}
            placeholder="Ej: recipe, protect, thank you"
            className="focus-ring flex-1 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-sunken px-3.5 py-2 font-body-sm text-fg placeholder:text-fg-muted"
          />
          <Button variant="secondary" size="sm" onClick={handleAnalyze} disabled={analyzing || !wordInput.trim()}>
            <Sparkles size={16} aria-hidden />
            {analyzing ? 'Analizando...' : 'Obtener IPA'}
          </Button>
        </div>

        {errorMsg && <p className="font-caption text-error">{errorMsg}</p>}

        {/* Resultado de Análisis IPA */}
        {analysis && (
          <div className="flex flex-col gap-2 rounded-[var(--radius-md)] bg-surface-sunken p-3.5 border border-border-subtle">
            <div className="flex items-center justify-between gap-2">
              <span className="font-phoneme text-body-lg font-medium text-accent-1">
                {analysis.ipa}
              </span>
              <button
                type="button"
                onClick={() => handleSpeak(analysis.wordOrPhrase || wordInput)}
                className="focus-ring flex items-center gap-1.5 font-caption text-fg-muted hover:text-fg"
                aria-label="Escuchar pronunciación"
              >
                <Volume2 size={16} aria-hidden />
                <span>Escuchar</span>
              </button>
            </div>
            {analysis.syllableStress && (
              <p className="font-caption text-fg-muted">Acento: <span className="font-medium text-fg">{analysis.syllableStress}</span></p>
            )}
            {analysis.explanationEs && (
              <p className="font-caption text-fg-muted">{analysis.explanationEs}</p>
            )}
          </div>
        )}

        {/* Selección de motivo */}
        <div className="flex flex-col gap-2 pt-1">
          <label className="font-caption font-medium text-fg">¿Por qué te causó problema?</label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(Object.keys(REASON_LABELS) as PronunciationDifficultyReason[]).map((rKey) => (
              <button
                key={rKey}
                type="button"
                onClick={() => setReason(rKey)}
                className={`focus-ring text-left rounded-[var(--radius-sm)] border p-2.5 transition-colors ${
                  reason === rKey ? 'border-primary bg-surface-sunken text-fg' : 'border-border-subtle bg-surface-raised text-fg-muted hover:text-fg'
                }`}
              >
                <div className="font-caption font-medium text-fg">{REASON_LABELS[rKey].label}</div>
                <div className="font-caption text-fg-muted">{REASON_LABELS[rKey].desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Notas adicionales */}
        <div className="flex flex-col gap-1">
          <label className="font-caption font-medium text-fg">Notas o recordatorio personal (opcional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: Acordarme de acentuar la 2da sílaba"
            className="focus-ring rounded-[var(--radius-sm)] border border-border-subtle bg-surface-sunken px-3.5 py-2 font-caption text-fg placeholder:text-fg-muted"
          />
        </div>

        <Button variant="secondary" size="sm" onClick={handleAddItem} disabled={!wordInput.trim()}>
          <Plus size={16} aria-hidden />
          Añadir a la página de hoy
        </Button>
      </section>

      {/* Lista de palabras registradas */}
      {items.length > 0 && (
        <section aria-labelledby="items-heading" className="flex flex-col gap-3">
          <h3 id="items-heading" className="font-body-sm font-semibold text-fg">
            Palabras registradas para hoy ({items.length})
          </h3>
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised p-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-body-sm font-semibold text-fg">{item.wordOrPhrase}</span>
                    {item.ipa && <span className="font-phoneme font-caption text-accent-1">{item.ipa}</span>}
                    <button
                      type="button"
                      onClick={() => handleSpeak(item.wordOrPhrase)}
                      className="focus-ring p-1 text-fg-muted hover:text-fg"
                      title="Escuchar"
                    >
                      <Volume2 size={15} aria-hidden />
                    </button>
                  </div>
                  <p className="font-caption text-fg-muted">
                    {REASON_LABELS[item.difficultyReason]?.label}
                    {item.userNotes ? ` · ${item.userNotes}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="focus-ring p-1 text-fg-muted hover:text-error"
                  title="Eliminar"
                >
                  <Trash2 size={16} aria-hidden />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Guardar diario */}
      <footer className="flex items-center justify-end gap-3 pt-2">
        <Button variant="primary" size="md" onClick={handleSave} disabled={saving || items.length === 0}>
          <CheckCircle2 size={18} aria-hidden />
          {saving ? 'Guardando...' : 'Guardar en el cuaderno'}
        </Button>
      </footer>
    </div>
  )
}
