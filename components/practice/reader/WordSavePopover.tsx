'use client'

import { useEffect, useRef, useState } from 'react'
import { previewWord, quickAddWord } from '@/lib/word-bank/queries'
import { speakWord } from '@/lib/word-bank/speech'
import { X } from '@/components/icons'
import { cn } from '@/lib/cn'
import type { WordPreview } from '@/lib/word-bank/types'

interface WordSavePopoverProps {
  word: string
  lookup: string
  context: string
  online: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WordSavePopover({ word, lookup, context, online, open, onOpenChange }: WordSavePopoverProps) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [preview, setPreview] = useState<WordPreview | null>(null)
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const triggerRef = useRef<HTMLButtonElement>(null)

  function close() {
    onOpenChange(false)
    triggerRef.current?.focus()
  }

  useEffect(() => {
    if (!open || preview) return
    let active = true
    setPreviewStatus('loading')
    void previewWord(lookup)
      .then((result) => { if (active) setPreview(result) })
      .catch(() => { if (active) setPreviewStatus('error') })
      .finally(() => { if (active) setPreviewStatus((value) => value === 'error' ? value : 'idle') })
    return () => { active = false }
  }, [context, lookup, open, preview])

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
        className={cn( 'rounded px-0.5 text-inherit focus-ring', open ? 'bg-primary-soft' : 'hover:bg-primary-soft', )}
        aria-label={`Opciones para ${word}`}
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
      >
        {word}
      </button>
      {open ? (
        <span role="dialog" aria-label={`Guardar ${word}`} className="fixed inset-x-3 bottom-20 z-20 flex max-h-[calc(100dvh-6rem)] flex-col gap-3 overflow-y-auto rounded-lg border border-border-default bg-surface-raised p-4 text-body-sm text-fg shadow-lg sm:absolute sm:left-0 sm:top-full sm:bottom-auto sm:mt-2 sm:w-72 sm:max-h-none">
          <span className="flex items-start justify-between gap-3">
            <strong>{word}</strong>
            <button type="button" className="-mr-2 -mt-2 flex size-11 items-center justify-center rounded-md text-fg-muted hover:bg-surface-sunken hover:text-fg" onClick={close} aria-label="Cerrar"><X className="size-4" /></button>
          </span>
          {previewStatus === 'loading' ? <span role="status" className="text-fg-muted">Buscando significado…</span> : null}
          {previewStatus === 'error' ? <span role="alert" className="text-error">No se pudo cargar el significado. Inténtalo de nuevo.</span> : null}
          {preview ? <span className="flex flex-col gap-1"><span className="text-base font-semibold leading-6 text-fg">{preview.enrichment.translation}</span><span className="leading-6 text-fg-muted">{preview.enrichment.meaning}</span>{preview.alreadySaved ? <span className="pt-1 text-caption font-medium text-fg-subtle">En Mis palabras</span> : null}</span> : null}
          <span className="flex flex-wrap gap-2">
            <button type="button" className="min-h-11 rounded-md bg-cta-bg px-3 py-1.5 font-semibold text-cta-fg disabled:cursor-not-allowed disabled:opacity-50" disabled={!online || !preview || preview.alreadySaved || status === 'saving' || status === 'saved'} onClick={() => void save()}>
              {status === 'saving' ? 'Guardando…' : status === 'saved' || preview?.alreadySaved ? 'Ya guardada' : 'Guardar'}
            </button>
            <button type="button" className="min-h-11 rounded-md border border-border-default px-3 py-1.5" onClick={() => speakWord(word)}>Escuchar</button>
          </span>
          {!online ? <span role="status" className="text-fg-muted">Guardar requiere conexión. Puedes seguir escuchando.</span> : null}
          {status === 'error' ? <span role="alert" className="text-error">No se pudo guardar. Inténtalo de nuevo.</span> : null}
        </span>
      ) : null}
    </span>
  )
}
