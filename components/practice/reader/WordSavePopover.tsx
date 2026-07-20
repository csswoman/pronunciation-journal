'use client'

import { useRef, useState } from 'react'
import { isWordInBank, quickAddWord } from '@/lib/word-bank/queries'
import { speakWord } from '@/lib/word-bank/speech'

interface WordSavePopoverProps {
  word: string
  lookup: string
  context: string
  online: boolean
}

export function WordSavePopover({ word, lookup, context, online }: WordSavePopoverProps) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'checking' | 'saved' | 'exists' | 'error'>('idle')
  const triggerRef = useRef<HTMLButtonElement>(null)

  function close() {
    setOpen(false)
    triggerRef.current?.focus()
  }

  async function save() {
    if (!online || status === 'checking') return
    setStatus('checking')
    try {
      if (await isWordInBank(lookup)) {
        setStatus('exists')
        return
      }
      await quickAddWord({ text: lookup, context, source: 'reader' })
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
        className="rounded px-0.5 text-inherit underline decoration-dotted underline-offset-4 hover:bg-primary-soft focus-ring"
        aria-label={`Opciones para ${word}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {word}
      </button>
      {open ? (
        <span role="dialog" aria-label={`Guardar ${word}`} className="absolute left-0 top-full z-10 mt-2 flex min-w-52 flex-col gap-2 rounded-md border border-border-default bg-surface-raised p-3 text-sm text-fg shadow-lg">
          <strong>{word}</strong>
          <span className="text-fg-muted">{context}</span>
          <span className="flex gap-2">
            <button type="button" className="rounded bg-cta-bg px-3 py-1.5 font-semibold text-cta-fg disabled:cursor-not-allowed disabled:opacity-50" disabled={!online || status === 'checking' || status === 'saved' || status === 'exists'} onClick={() => void save()}>
              {status === 'checking' ? 'Comprobando…' : status === 'saved' ? 'Guardada' : status === 'exists' ? 'Ya guardada' : 'Guardar'}
            </button>
            <button type="button" className="rounded border border-border-default px-3 py-1.5" onClick={() => speakWord(word)}>Escuchar</button>
            <button type="button" className="rounded px-2 py-1.5" onClick={close} aria-label="Cerrar">×</button>
          </span>
          {!online ? <span role="status" className="text-fg-muted">Guardar requiere conexión. Puedes seguir escuchando.</span> : null}
          {status === 'error' ? <span role="alert" className="text-error">No se pudo guardar. Inténtalo de nuevo.</span> : null}
        </span>
      ) : null}
    </span>
  )
}
