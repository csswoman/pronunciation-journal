'use client'

// Planned structure:
// <JournalGuidedWrite>
//   <Header: "Pregunta de hoy" + "Meta: 1 frase" badge + promptEn + promptEs />
//   <TemplateArea: starterPrefix + inline editable/fill blank + "." />
//   <ChipOptions: suggested options + "otra" custom input />
//   <HelpTip: bracket help for unknown words />
//   <Footer: "Solo tú lees esto" + "Guardar frase" button />
// </JournalGuidedWrite>

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, RefreshCw } from '@/components/icons'
import Button from '@/components/ui/Button'
import { useJournalEntry } from '@/hooks/useJournalEntry'
import { dedupePrefixLines } from '@/lib/journal/dedupe-prefix-lines'
import { GUIDED_TEMPLATES } from '@/lib/journal/guided-templates'
import type { JournalEntryRecord } from '@/lib/journal/types'
import { JournalGuidedTemplateArea } from './JournalGuidedTemplateArea'

interface JournalGuidedWriteProps {
  entry: JournalEntryRecord
  promptEn: string
  promptEs: string
  starterPrefix?: string
  options?: string[]
}

export function JournalGuidedWrite({
  entry,
  promptEn: initialPromptEn,
  promptEs: initialPromptEs,
  starterPrefix: initialStarterPrefix = 'Yesterday I talked to',
  options: initialOptions = ['my brother', 'my partner', 'a friend'],
}: JournalGuidedWriteProps) {
  const router = useRouter()
  const journal = useJournalEntry(entry)

  const [templateIdx, setTemplateIdx] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [customText, setCustomText] = useState<string>('')
  const [isCustom, setIsCustom] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [accumulated, setAccumulated] = useState<string[]>(() =>
    entry.content.trim() ? dedupePrefixLines(entry.content.trim().split('\n')) : []
  )
  const hydratedFromJournal = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // `entry` llega siempre en blanco desde el server (ver write/page.tsx); el
  // contenido real (si venimos de "Editar"/"Seguir escribiendo") se hidrata
  // de forma async desde Dexie dentro de useJournalEntry. Sincronizamos
  // `accumulated` una sola vez cuando esa hidratación llega — y solo antes de
  // que el usuario empiece a escribir, para no confundir su propia primera
  // tecla (que ya vuelve `journal.content` no-vacío vía el efecto de abajo)
  // con una hidratación real, lo que duplicaría la frase en curso.
  useEffect(() => {
    if (hydratedFromJournal.current) return
    if (customText.trim() || selectedOption.trim()) return
    if (!journal.content.trim()) return
    hydratedFromJournal.current = true
    setAccumulated(dedupePrefixLines(journal.content.trim().split('\n')))
  }, [journal.content, customText, selectedOption])

  const activeTemplate = GUIDED_TEMPLATES[templateIdx % GUIDED_TEMPLATES.length] ?? {
    promptEn: initialPromptEn,
    promptEs: initialPromptEs,
    starterPrefix: initialStarterPrefix,
    options: initialOptions,
  }

  const promptEn = templateIdx === 0 && initialPromptEn ? initialPromptEn : activeTemplate.promptEn
  const promptEs = templateIdx === 0 && initialPromptEs ? initialPromptEs : activeTemplate.promptEs
  const starterPrefix = templateIdx === 0 && initialStarterPrefix ? initialStarterPrefix : activeTemplate.starterPrefix
  const options = templateIdx === 0 && initialOptions.length ? initialOptions : activeTemplate.options

  // Determina el valor actual que llena el espacio
  const fillValue = isCustom ? customText : selectedOption

  useEffect(() => {
    if (isCustom && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isCustom])

  // Cada vez que cambia el relleno o lo acumulado, actualiza el contenido en el journal
  useEffect(() => {
    const currentSentence = fillValue.trim() ? `${starterPrefix} ${fillValue.trim()}.` : ''
    const all = [...accumulated, currentSentence].filter(Boolean).join('\n')
    if (all.trim()) {
      journal.updateContent(all.trim())
    }
  }, [fillValue, starterPrefix, accumulated])

  function handleSelectOption(opt: string) {
    setIsCustom(false)
    setSelectedOption(opt)
  }

  function handleEnableCustom() {
    setIsCustom(true)
    setSelectedOption('')
  }

  function handleNextTemplate() {
    if (fillValue.trim()) {
      const sentence = `${starterPrefix} ${fillValue.trim()}.`
      setAccumulated((prev) => [...prev, sentence])
    }
    setSelectedOption('')
    setCustomText('')
    setIsCustom(false)
    setTemplateIdx((prev) => (prev + 1) % GUIDED_TEMPLATES.length)
  }

  async function handleSave() {
    const currentSentence = fillValue.trim() ? `${starterPrefix} ${fillValue.trim()}.` : ''
    const all = [...accumulated, currentSentence].filter(Boolean).join('\n')
    if (!all.trim() || isSaving) return
    setIsSaving(true)
    try {
      // Reabrir una entrada ya enviada/corregida como draft antes de volver a
      // guardar — de lo contrario journal.submit() es un no-op silencioso.
      if (journal.status !== 'draft' && journal.canResumeDraft) {
        await journal.resumeDraft()
      }
      journal.updateContent(all.trim())
      await journal.submit()
      setIsSaved(true)
      router.push('/journal')
    } catch {
      router.push('/journal')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex w-full flex-col layout-section-gap">
      <Link
        href="/journal"
        className="focus-ring inline-flex min-h-11 w-fit items-center gap-2 font-body-sm font-medium text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft size={16} aria-hidden />
        Volver al cuaderno
      </Link>

      <article
        aria-labelledby="guided-prompt-heading"
        className="flex w-full flex-col gap-6 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised layout-card-pad"
      >
      {/* ── Encabezado de la pregunta ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-caption font-medium text-fg-muted">
            Pregunta de hoy
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNextTemplate}
              className="focus-ring inline-flex items-center gap-1 rounded-full border border-border-subtle bg-surface-sunken px-2.5 py-0.5 font-caption text-fg-muted hover:border-border-strong hover:text-fg"
            >
              <RefreshCw size={12} aria-hidden />
              Cambiar frase
            </button>
            <span className="inline-flex items-center rounded-full bg-primary-soft px-3 py-1 font-caption font-semibold text-primary">
              {accumulated.length > 0 ? `${accumulated.length + 1} frases` : 'Meta: 1 frase'}
            </span>
          </div>
        </div>

        <h1
          id="guided-prompt-heading"
          className="font-serif font-h3 font-semibold leading-snug text-fg text-balance"
        >
          {promptEn}
        </h1>
        <p className="font-body-sm text-fg-muted">
          {promptEs}
        </p>
      </div>

      {accumulated.length > 0 && (
        <div className="flex flex-col gap-1 rounded-[var(--radius-md)] bg-surface-sunken p-3 font-serif font-body-sm">
          {accumulated.map((sentence, idx) => (
            <p key={idx} className="italic text-fg-muted">
              {sentence}
            </p>
          ))}
        </div>
      )}

      <hr className="border-border-subtle" />

      {/* ── Área de plantilla interactiva ── */}
      <JournalGuidedTemplateArea
        starterPrefix={starterPrefix}
        options={options}
        selectedOption={selectedOption}
        customText={customText}
        isCustom={isCustom}
        inputRef={inputRef}
        onSelectOption={handleSelectOption}
        onEnableCustom={handleEnableCustom}
        onCustomTextChange={setCustomText}
      />

      <hr className="border-border-subtle" />

      {/* ── Footer: privacidad + botones guardar / agregar otra ── */}
      <footer className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <span className="font-caption text-fg-subtle">
          Solo tú lees esto
        </span>

        <div className="flex flex-wrap items-center gap-2">
          {fillValue.trim() && (
            <Button
              variant="secondary"
              size="md"
              disabled={isSaving || isSaved}
              onClick={handleNextTemplate}
            >
              + Otra frase
            </Button>
          )}
          <Button
            variant={isSaved ? 'primary' : 'secondary'}
            size="md"
            disabled={(!fillValue.trim() && accumulated.length === 0) || isSaving || isSaved}
            isLoading={isSaving && !isSaved}
            onClick={() => void handleSave()}
          >
            {isSaved ? (
              <span className="flex items-center gap-1.5 text-success">
                <Check size={16} strokeWidth={2.5} aria-hidden />
                ¡Frase guardada!
              </span>
            ) : isSaving ? (
              'Guardando…'
            ) : (
              'Guardar frase'
            )}
          </Button>
        </div>
      </footer>
      </article>
    </div>
  )
}
