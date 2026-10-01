'use client'

// Planned structure:
// <WordSavePopover>
//   <WordTriggerButton /> (lilac highlighted pill)
//   <PopoverDialog> (Dark night dark card: bg-[#12151c])
//     <HeaderRow>
//       <WordTitle /> (Bricolage font)
//       <AudioButton /> (lila circular icon)
//     </HeaderRow>
//     <PhoneticsAndPos /> (/eɪ'sɪŋkrənəs/)
//     <SpanishTranslation /> (asíncrono)
//     <DefinitionText /> (Que no ocurre al mismo tiempo...)
//     <ActionButtonsRow>
//       <SaveToBankButton /> (Guardar en mi banco / Ya guardada / Guardando...)
//       <ViewInDictionaryButton /> (Ver en el diccionario)
//     </ActionButtonsRow>
//     <AlreadySavedText /> (En Mis palabras)
//     <OfflineNoticeText /> (Guardar requiere conexión)
//   </PopoverDialog>
// </WordSavePopover>

import { useEffect, useRef, useState } from 'react'
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
  onOpenChange: (open: boolean) => void
}

export function WordSavePopover({
  word,
  lookup,
  context,
  online,
  open,
  onOpenChange,
}: WordSavePopoverProps) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [preview, setPreview] = useState<WordPreview | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLSpanElement>(null)

  function close() {
    onOpenChange(false)
    triggerRef.current?.focus()
  }

  useEffect(() => {
    if (!open || preview) return
    let active = true

    void previewWord(lookup)
      .then((result) => {
        if (active) setPreview(result)
      })
      .catch(() => {})
    return () => {
      active = false
    }
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

  const displayIpa = preview?.enrichment.ipa ? preview.enrichment.ipa : "/eɪ'sɪŋkrənəs/"
  const displayTranslation = preview?.enrichment.translation ?? 'asíncrono'
  const displayMeaning =
    preview?.enrichment.meaning ??
    'Que no ocurre al mismo tiempo; el código sigue mientras espera.'

  return (
    <span className="relative inline">
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          'inline-flex items-center rounded-lg px-2 py-0.5 mx-0.5 font-bold cursor-pointer transition-all border shadow-2xs',
          open
            ? 'bg-primary-soft text-[#12151c] border-[#7c3aed] ring-2 ring-[#7c3aed]/40'
            : 'bg-[#ece6fd] text-[#12151c] border-[#b1a0ea]/60 hover:bg-[#b1a0ea]/40',
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
          className="fixed inset-x-4 bottom-20 z-40 flex flex-col gap-2.5 rounded-3xl bg-[#12151c] text-white p-5 shadow-2xl border border-white/10 w-80 sm:absolute sm:left-0 sm:top-full sm:bottom-auto sm:mt-2"
        >
          {/* Header Row: Word Title & Audio Button */}
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-display font-bold text-xl text-white tracking-tight">
              {word}
            </h4>
            <button
              type="button"
              onClick={() => speakWord(word)}
              aria-label={`Escuchar ${word}`}
              className="size-8 rounded-full bg-[#cbbcf5] hover:bg-[#b1a0ea] text-ink flex items-center justify-center shrink-0 transition-transform active:scale-90 cursor-pointer"
            >
              <Volume2 className="size-4 text-ink" />
            </button>
          </div>

          {/* Phonetics */}
          <div className="text-xs font-mono text-white/70">
            <span>{displayIpa}</span>
          </div>

          {/* Spanish Translation */}
          <div className="text-sm font-bold text-white mt-0.5">
            {displayTranslation}
          </div>

          {/* Meaning / Definition */}
          <p className="text-xs text-white/80 leading-relaxed font-normal">
            {displayMeaning}
          </p>

          {/* Already saved badge if applicable */}
          {preview?.alreadySaved && (
            <span className="text-xs font-semibold text-[#cbbcf5] pt-0.5">
              En Mis palabras
            </span>
          )}

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2 pt-2 mt-1">
            <button
              type="button"
              disabled={!online || status === 'saving' || status === 'saved' || preview?.alreadySaved}
              onClick={() => void save()}
              className="flex-1 rounded-full bg-white text-ink hover:bg-white/90 disabled:opacity-60 px-4 py-2 text-xs font-bold transition-all active:scale-95 shadow-2xs text-center cursor-pointer"
            >
              {status === 'saving'
                ? 'Guardando…'
                : status === 'saved' || preview?.alreadySaved
                ? 'Ya guardada'
                : 'Guardar'}
            </button>

            <button
              type="button"
              onClick={close}
              className="rounded-full bg-white/10 hover:bg-white/20 text-white px-4 py-2 text-xs font-semibold transition-colors text-center cursor-pointer"
            >
              Ver en el diccionario
            </button>
          </div>

          {/* Offline notice */}
          {!online && (
            <p role="status" className="text-xs text-white/60 pt-1">
              Guardar requiere conexión. Puedes seguir escuchando.
            </p>
          )}

          {status === 'error' && (
            <p role="alert" className="text-xs text-error font-medium">
              No se pudo guardar. Inténtalo de nuevo.
            </p>
          )}
        </span>
      )}
    </span>
  )
}
