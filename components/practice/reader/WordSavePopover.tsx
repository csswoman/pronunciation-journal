'use client'

// Planned structure:
// <WordSavePopover>
//   <WordTriggerButton /> (highlighted key words: lilac fill + underline; other words stay plain)
//   <PopoverDialog> (dark card)
//     <HeaderRow> word title + audio button </HeaderRow>
//     <PhoneticsAndPos /> (/ipa/)
//     <SpanishTranslation /> + <DefinitionText /> (from the dictionary, never fixed copy)
//     <LookupStateText /> (loading / not found)
//     <ActionButtonsRow> Guardar en mi banco · Ver en el diccionario </ActionButtonsRow>
//     <AlreadySavedText /> · <OfflineNoticeText />
//   </PopoverDialog>
// </WordSavePopover>

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { previewWord, quickAddWord } from '@/lib/word-bank/queries'
import { speakWord } from '@/lib/word-bank/speech'
import { Volume2 } from '@/components/icons'
import { cn } from '@/lib/cn'
import type { WordPreview } from '@/lib/word-bank/types'

interface WordSavePopoverProps {
  word: string
  lookup: string
  context: string
  online: boolean
  open: boolean
  highlighted?: boolean
  onOpenChange: (open: boolean) => void
}

export function WordSavePopover({
  word,
  lookup,
  context,
  online,
  open,
  highlighted = false,
  onOpenChange,
}: WordSavePopoverProps) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [preview, setPreview] = useState<WordPreview | null>(null)
  const [lookupFailed, setLookupFailed] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLSpanElement>(null)

  function close() {
    onOpenChange(false)
    triggerRef.current?.focus()
  }

  useEffect(() => {
    if (!open || preview) return
    let active = true
    setLookupFailed(false)

    void previewWord(lookup)
      .then((result) => {
        if (active) setPreview(result)
      })
      .catch(() => {
        if (active) setLookupFailed(true)
      })
    return () => {
      active = false
    }
  }, [lookup, open, preview])

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
    if (!online || !preview || status === 'saving' || preview.alreadySaved) return
    setStatus('saving')
    try {
      await quickAddWord({
        text: lookup,
        context,
        source: 'reader',
        enrichment: preview.enrichment,
      })
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }

  const enrichment = preview?.enrichment
  const isSaved = status === 'saved' || preview?.alreadySaved
  const lookupLabel = lookupFailed ? 'No encontramos este significado todavía.' : 'Buscando significado…'

  return (
    <span className="relative inline">
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          'cursor-pointer rounded-md px-1 transition-colors',
          highlighted
            ? 'bg-lilac-soft font-semibold text-fg underline decoration-lilac-deep decoration-2 underline-offset-4 hover:bg-lilac/60'
            : 'hover:bg-surface-sunken',
          open && 'ring-2 ring-lilac-deep/60',
          open && !highlighted && 'bg-surface-sunken',
        )}
        aria-label={`Opciones para ${word}`}
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
      >
        {word}
      </button>

      {open && (
        <span
          ref={popoverRef}
          role="dialog"
          aria-label={`Guardar ${word}`}
          className="fixed inset-x-4 bottom-20 z-40 flex flex-col gap-2.5 rounded-3xl border border-paper/10 bg-ink p-5 text-base font-normal text-paper shadow-2xl sm:absolute sm:inset-x-auto sm:left-1/2 sm:bottom-auto sm:top-full sm:mt-2 sm:w-80 sm:-translate-x-1/2"
        >
          <span className="flex items-center justify-between gap-3">
            <span className="font-display text-xl font-bold tracking-tight text-paper">{word}</span>
            <button
              type="button"
              onClick={() => speakWord(word)}
              aria-label={`Escuchar ${word}`}
              className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-lilac text-ink transition-transform hover:bg-lilac-deep active:scale-90"
            >
              <Volume2 className="size-4" />
            </button>
          </span>

          {enrichment ? (
            <>
              {enrichment.ipa && (
                <span className="font-mono text-xs text-paper/70">{enrichment.ipa}</span>
              )}
              {enrichment.translation && (
                <span className="text-sm font-bold text-paper">{enrichment.translation}</span>
              )}
              {enrichment.meaning && (
                <span className="text-xs leading-relaxed text-paper/80">{enrichment.meaning}</span>
              )}
            </>
          ) : (
            <span role="status" className="text-xs text-paper/70">{lookupLabel}</span>
          )}

          {preview?.alreadySaved && (
            <span className="text-xs font-semibold text-lilac">En Mis palabras</span>
          )}

          <span className="mt-1 flex items-center gap-2">
            <button
              type="button"
              disabled={!online || !preview || status === 'saving' || !!isSaved}
              onClick={() => void save()}
              className="flex-1 cursor-pointer rounded-full bg-paper px-3 py-2 text-center text-xs font-bold text-ink transition-all hover:bg-paper/90 active:scale-95 disabled:cursor-default disabled:opacity-60"
            >
              {status === 'saving' ? 'Guardando…' : isSaved ? 'Ya guardada' : 'Guardar en mi banco'}
            </button>
            <Link
              href="/words"
              className="flex-1 rounded-full bg-paper/10 px-3 py-2 text-center text-xs font-semibold text-paper transition-colors hover:bg-paper/20"
            >
              Ver en el diccionario
            </Link>
          </span>

          {!online && (
            <span role="status" className="text-xs text-paper/60">
              Guardar requiere conexión. Puedes seguir escuchando.
            </span>
          )}

          {status === 'error' && (
            <span role="alert" className="text-xs font-medium text-error">
              No se pudo guardar. Inténtalo de nuevo.
            </span>
          )}
        </span>
      )}
    </span>
  )
}
