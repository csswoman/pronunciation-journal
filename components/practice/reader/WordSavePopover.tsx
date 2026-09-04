'use client'

import { useEffect, useRef, useState } from 'react'
import { previewWord, quickAddWord } from '@/lib/word-bank/queries'
import { speakWord } from '@/lib/word-bank/speech'
import { X } from '@/components/icons'
import { cn } from '@/lib/cn'
import type { WordPreview } from '@/lib/word-bank/types'

// Planned structure:
// <WordSavePopover>
//   trigger button
//   dialog popover
//     header (word + close button)
//     content (preview enrichment / chrome instant translation fallback)
//     actions (save button + listen button)
// </WordSavePopover>

interface WordSavePopoverProps {
  word: string
  lookup: string
  context: string
  online: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

let cachedTranslator: { translate: (text: string) => Promise<string> } | null = null

async function translateWithChrome(text: string): Promise<string | null> {
  if (typeof window === 'undefined') return null
  const aiTranslation = (window as unknown as {
    translation?: {
      canTranslate?: (opts: { sourceLanguage: string; targetLanguage: string }) => Promise<string>
      createTranslator?: (opts: { sourceLanguage: string; targetLanguage: string }) => Promise<{
        translate: (t: string) => Promise<string>
      }>
    }
  }).translation

  if (!aiTranslation?.canTranslate || !aiTranslation?.createTranslator) return null

  try {
    const status = await aiTranslation.canTranslate({ sourceLanguage: 'en', targetLanguage: 'es' })
    if (status === 'no') return null
    if (!cachedTranslator) {
      cachedTranslator = await aiTranslation.createTranslator({ sourceLanguage: 'en', targetLanguage: 'es' })
    }
    return await cachedTranslator.translate(text)
  } catch {
    return null
  }
}

export function WordSavePopover({ word, lookup, context, online, open, onOpenChange }: WordSavePopoverProps) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [preview, setPreview] = useState<WordPreview | null>(null)
  const [chromeTranslation, setChromeTranslation] = useState<string | null>(null)
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const triggerRef = useRef<HTMLButtonElement>(null)

  const popoverRef = useRef<HTMLSpanElement>(null)

  function close() {
    onOpenChange(false)
    triggerRef.current?.focus()
  }

  useEffect(() => {
    if (!open || preview) return
    let active = true
    setPreviewStatus('loading')

    // Intento optimista con Chrome Translator API si está disponible en el navegador
    void translateWithChrome(lookup).then((tr) => {
      if (active && tr) setChromeTranslation(tr)
    })

    void previewWord(lookup)
      .then((result) => { if (active) setPreview(result) })
      .catch(() => { if (active) setPreviewStatus('error') })
      .finally(() => { if (active) setPreviewStatus((value) => value === 'error' ? value : 'idle') })
    return () => { active = false }
  }, [context, lookup, open, preview])

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onOpenChange(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, onOpenChange])

  async function save() {
    if (!online || status === 'saving' || preview?.alreadySaved) return
    setStatus('saving')
    try {
      if (!preview) return
      await quickAddWord({ text: lookup, context, source: 'reader', enrichment: preview.enrichment })
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }

  return (
    <span className="relative inline">
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          'rounded px-0.5 text-inherit focus-ring cursor-pointer transition-colors',
          open ? 'bg-primary-soft text-primary font-medium ring-1 ring-primary/40' : 'hover:bg-primary-soft',
        )}
        aria-label={`Opciones para ${word}`}
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
      >
        {word}
      </button>
      {open ? (
        <span
          ref={popoverRef}
          role="dialog"
          aria-label={`Guardar ${word}`}
          className="fixed inset-x-3 bottom-20 z-40 flex max-h-[calc(100dvh-6rem)] flex-col gap-3.5 overflow-y-auto rounded-2xl border border-border-default bg-surface-raised/95 backdrop-blur-xl p-4 text-body-sm text-fg shadow-xl ring-1 ring-black/5 dark:ring-white/10 sm:absolute sm:left-0 sm:top-full sm:bottom-auto sm:mt-2 sm:w-80 sm:max-h-none sm:rounded-card sm:shadow-lg"
        >
          {/* Mobile Sheet Grabber indicator (visible on small screens) */}
          <span aria-hidden="true" className="mx-auto -mt-1 h-1 w-9 rounded-full bg-border-default sm:hidden" />

          <span className="flex items-start justify-between gap-3 border-b border-border-default/50 pb-2">
            <div className="flex flex-col">
              <strong className="text-base font-semibold text-fg tracking-tight">{word}</strong>
              {context && <span className="text-tiny text-fg-muted/80 truncate max-w-[200px]">{context}</span>}
            </div>
            <button
              type="button"
              className="-mr-1.5 -mt-1.5 flex size-11 items-center justify-center rounded-full text-fg-muted hover:bg-surface-sunken hover:text-fg focus-ring transition-colors cursor-pointer"
              onClick={close}
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </button>
          </span>
          {previewStatus === 'loading' && chromeTranslation ? (
            <span className="flex flex-col gap-0.5">
              <span className="text-base font-semibold text-fg">{chromeTranslation}</span>
              <span className="text-tiny text-fg-muted">Traducción instantánea (Chrome AI) · cargando ficha…</span>
            </span>
          ) : previewStatus === 'loading' ? (
            <span role="status" className="text-fg-muted animate-pulse py-1">Buscando significado…</span>
          ) : null}
          {previewStatus === 'error' ? <span role="alert" className="text-error">No se pudo cargar el significado. Inténtalo de nuevo.</span> : null}
          {preview ? (
            <span className="flex flex-col gap-1">
              <span className="text-base font-semibold leading-snug text-fg">{preview.enrichment.translation}</span>
              <span className="text-body-sm leading-relaxed text-fg-muted">{preview.enrichment.meaning}</span>
              {preview.alreadySaved ? <span className="pt-1 text-caption font-medium text-fg-subtle">En Mis palabras</span> : null}
            </span>
          ) : null}
          <span className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              className="min-h-11 min-w-[100px] inline-flex items-center justify-center rounded-full bg-cta-bg px-4 py-2 font-semibold text-caption text-cta-fg shadow-xs hover:bg-cta-bg-hover active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              disabled={!online || !preview || preview.alreadySaved || status === 'saving' || status === 'saved'}
              onClick={() => void save()}
            >
              {status === 'saving' ? 'Guardando…' : status === 'saved' || preview?.alreadySaved ? 'Ya guardada' : 'Guardar'}
            </button>
            <button
              type="button"
              className="min-h-11 inline-flex items-center gap-1.5 rounded-full border border-border-default bg-surface-base px-3.5 py-2 font-medium text-caption text-fg hover:bg-surface-sunken active:scale-95 transition-all cursor-pointer"
              onClick={() => speakWord(word)}
            >
              Escuchar
            </button>
          </span>
          {!online ? <span role="status" className="text-tiny text-fg-muted">Guardar requiere conexión. Puedes seguir escuchando.</span> : null}
          {status === 'error' ? <span role="alert" className="text-tiny text-error">No se pudo guardar. Inténtalo de nuevo.</span> : null}
        </span>
      ) : null}
    </span>
  )
}
