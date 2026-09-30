'use client'

// Planned structure:
// <WeakFormInput>
//   <Form onSubmit={handleSubmit}>
//     <InputField value={value} onChange={setValue} placeholder="Escribe la forma completa..." />
//     <SubmitButton />
//   </Form>
//   {rejectedReason && <RejectionNotice reason={rejectedReason} />}
// </WeakFormInput>

import { useState } from 'react'

interface WeakFormInputProps {
  rejectedReason: string | null
  onSubmit: (text: string) => void
}

export default function WeakFormInput({
  rejectedReason,
  onSubmit,
}: WeakFormInputProps) {
  const [value, setValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    onSubmit(value.trim())
    setValue('')
  }

  return (
    <div className="w-full space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Escribe la forma completa en inglés..."
          autoFocus
          className="flex-1 px-4 py-3.5 rounded-2xl bg-surface-card border border-border text-fg font-sans text-body placeholder:text-fg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="px-6 py-3.5 rounded-2xl bg-ink text-surface-base font-sans text-body-sm font-bold hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer shrink-0"
        >
          Enviar ↵
        </button>
      </form>

      {rejectedReason && (
        <div className="p-3 rounded-xl bg-accent-amber/10 border border-accent-amber/30 text-accent-amber font-sans text-caption font-bold animate-in fade-in">
          ⚠️ {rejectedReason}
        </div>
      )}
    </div>
  )
}
